const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const Session = require("../models/Session");
const Message = require("../models/Message");
const User = require("../models/User");
const {
  emptyProfile,
  applyAnswer,
  buildProfileContext,
  deriveCareerGoal,
  deriveRoadmapFromProfile,
  getOnboardingPayload,
  getQuestion,
  getTotalQuestions,
} = require("../services/onboardingService");
const { getRecommendations } = require("../services/matchingService");

/** Persist session profile onto the owning user account */
async function syncProfileToUser(session) {
  if (!session.userId) return;
  try {
    const user = await User.findById(session.userId);
    if (!user) return;
    user.profile = publicProfile(session.profile);
    user.markModified("profile");
    user.region = session.region || user.region;
    user.careerGoal = session.careerGoal || user.careerGoal;
    user.guideGenerated = session.guideGenerated || user.guideGenerated;
    user.activeSessionId = session.sessionId;
    await user.save();
  } catch (err) {
    console.error("Failed to sync profile to user:", err.message);
  }
}

// Groq retired the llama-3.3 chat models; override with GROQ_MODEL if the
// account's available models change again (GET /openai/v1/models lists them).
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

let groqClient;

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("GROQ_API_KEY is not configured");
    error.status = 503;
    throw error;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function loadJSON(filename) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data", filename), "utf8"),
  );
}

/* ── Lazy-loaded data (cached after first load) ── */
let DATA = null;

function loadData() {
  if (DATA) return DATA;
  DATA = {
    jhs: loadJSON("jhs_data.json"),
    schools: loadJSON("ghana_shs.json"),
    ucc: loadJSON("ucc_cut_off_points_2026.json"),
    ug: loadJSON("university_of_ghana_cutoff_points_2026.json"),
    guidance: loadJSON("shs_university_guidance_100.json"),
  };
  return DATA;
}

function careerLine(career, guidance) {
  const p = career.primary_pathway || {};
  const sg = guidance.find((g) => g.title === career.title);
  const wassce = sg?.shs_university_guidance?.target_wassce_aggregate || "?";
  const electives = (p.required_wassce_electives || []).join("+");
  const cats = (p.target_shs_categories || []).join("/");
  const unis = (p.university_pathways || [])
    .slice(0, 2)
    .map((u) => `${u.institution} agg≤${u.typical_cutoff_aggregate}`)
    .join("; ");
  return `${career.title}: BECE≤${p.ideal_bece_aggregate || "?"} | ${p.recommended_shs_stream || "?"} | Cat${cats} | WASSCE≤${wassce} | ${electives} | ${unis}`;
}

/**
 * Build only the reference data THIS student needs.
 *
 * Dumping all 81 careers and 297 schools on every turn cost ~6k tokens and blew
 * the Groq free-tier 8k TPM limit outright. Scoping to the student's own matches
 * and region is both cheaper and better advice — they don't need aerospace
 * engineering in Tamale when they asked about business in Kumasi.
 */
function buildDataTables(profile) {
  const { jhs, schools, ucc, ug, guidance } = loadData();

  // Careers: their top matches, plus whatever they explicitly named.
  const scored = getRecommendations(profile || {}, 12);
  const wanted = new Set(scored.map((s) => s.careerId));
  const named = String(profile?.careerDirection || "").toLowerCase();
  for (const c of jhs) {
    if (named && named.includes(c.title.toLowerCase().split(" ")[0])) {
      wanted.add(c.career_id);
    }
  }
  const careerTable = jhs
    .filter((c) => wanted.has(c.career_id))
    .map((c) => careerLine(c, guidance))
    .join("\n");

  // Schools: their region first, then a couple of others for mobility.
  const region = String(profile?.region || "").toLowerCase();
  const inRegion = schools.filter(
    (s) => region && s.region.toLowerCase().includes(region.split(" ")[0]),
  );
  const picked = (inRegion.length ? inRegion : schools).slice(0, 24);
  const schoolList = picked
    .map((s) => {
      const tracks = s.academic_tracks?.length
        ? ` (${s.academic_tracks.slice(0, 3).join("/")})`
        : "";
      return `${s.school_name} [Cat${s.category || "?"}, ${s.gender}]${tracks}`;
    })
    .join("\n");

  // University programmes: only those plausibly related to their matches.
  // The full UCC + UG listing is ~1000 tokens of mostly irrelevant programmes.
  const interestWords = new Set(
    scored
      .slice(0, 6)
      .flatMap((s) => s.title.toLowerCase().split(/[^a-z]+/))
      .filter((w) => w.length > 4),
  );
  const relevantPrograms = (uniData, label) => {
    const rows = (uniData.faculties_and_programs || [])
      .flatMap((f) => f.programs || [])
      .filter((p) => {
        const n = p.name.toLowerCase();
        return [...interestWords].some((w) => n.includes(w.slice(0, 6)));
      })
      .slice(0, 18)
      .map((p) => `${p.name}(${p.cut_off_point})`);
    return rows.length ? `${label}: ${rows.join(", ")}` : "";
  };

  return {
    careerTable,
    schoolList,
    schoolScope: inRegion.length
      ? `${picked.length} in ${profile.region}`
      : "sample across regions",
    uccList: relevantPrograms(ucc, "UCC"),
    ugList: relevantPrograms(ug, "UG Legon"),
  };
}

function buildTopMatchesBlock(profile) {
  if (!profile.interests?.length && !profile.strengths?.length) return "";
  const top = getRecommendations(profile, 5);
  if (!top.length) return "";

  const lines = top
    .map(
      (m, i) =>
        `${i + 1}. ${m.title} — overall match ${m.overallScore}% (fit ${m.fitScore}%, money/affordability ${m.moneyScore}%), ${m.salaryRange}, ${m.demand} demand, ${m.tuitionTier} cost tier`,
    )
    .join("\n");

  return `\n══ TOP SCORED MATCHES FOR THIS STUDENT (ranked by fit + affordability, weighted by their stated motivation) ══\nThese are the same rankings shown to the student on the Explore page — stay consistent with them unless the conversation surfaces new information.\n${lines}\n`;
}

function buildSystemPrompt(profile) {
  const data = buildDataTables(profile);
  const profileBlock = buildProfileContext(profile);
  const matchesBlock = buildTopMatchesBlock(profile);

  return `You are Caria — a warm, sharp Ghanaian career counselor having an ongoing conversation with a student you already know well from their onboarding. You are not writing a report or a brochure; you are talking to them.

╔═══ NON-NEGOTIABLE — overrides everything below ═══╗
1. TALK, don't publish. You are speaking to one student, not writing them a document.
   - NO markdown tables. NO section headings of ANY kind in a normal reply — not
     "**What works in Ghana**", not "**Practical steps**", not "**Next move**". If you
     find yourself writing a bold line followed by a colon or a paragraph beneath it,
     you have started writing a report. Delete it and just say the thing.
   - NO numbered plans for a question a person asked out loud.
   - Bold is for the occasional school or subject name inside a sentence. Nothing else.
   (The one-off personal guide is the SINGLE exception — it has its own four headers,
   specified later. Never carry that format into ordinary replies.)
2. LENGTH: 100–180 words. Say the useful thing and stop.
3. NEVER invent what you weren't told — fees, boarding costs, quotas, interviews, clubs,
   labs, facilities, industry partnerships, or salary figures for any job not listed in
   the data below. Comparing two salaries you were only given one of is inventing.
   This applies especially to MONEY HELP: do not name specific scholarships, bursaries,
   loan schemes, fee waivers or their eligibility rules — you do not have current data
   on any of them, and a student who plans around a scheme you invented gets hurt.
   Say instead: "there is student financial support in Ghana, but the schemes and
   deadlines change — your school's guidance officer will know what's open this year."
   If you don't have a fact: "worth asking the school directly" / "check the CSSPS portal."
4. NEVER give a BECE aggregate for entering a specific SHS. Ghana has NO fixed SHS
   cut-off points; GES has publicly called such tables fake. Placement depends on their
   raw score, how many others picked that school, programme demand, and choice order.
   (University cutoffs ARE real — quote those from the data below.)
╚═══════════════════════════════════════════════════╝

THE VOICE — this is how a good Ghanaian counsellor actually speaks:

✗ NOT THIS (a catalogue):
"Here are three schools that fit your profile:
**1. Accra Academy (Cat A – Boys)**
- **Why it fits:** Strong science track, well-equipped ICT labs.
- **Cost/Travel:** Higher end of the public range.
**2. Labone Senior High (Cat B – Mixed)** ..."

✓ THIS (a person talking):
"With your maths and ICT, Accra Academy is the obvious first choice — it's Category A
and the science track there is strong. But you told me money is tight, so I wouldn't
put all your hope on it. Labone and Odorgonno are both Category B, both offer the
science stream you need, and they're realistic. Put Accra Academy first if you want
to reach, but make one of those other two your safe choice — that's the part students
get wrong. Which of them is closest to home for you?"

Notice: it commits to a view, explains the trade-off in plain sentences, admits what it
doesn't know, and ends by asking something real. Do that.

The harder the question, the MORE you should write like a person — not less. When a
student asks something emotional (parents pushing a different career, fear of failing,
money worries), a numbered plan is the wrong shape entirely. Answer it the way you'd
answer out loud: acknowledge it honestly in a sentence or two, give them your actual
view, hand them ONE thing to do next, and stop. Never turn a family conflict into
"1. Show the overlap  2. Present a concrete plan  3. Offer a compromise" — that is a
consultant's slide deck, and it will not help a 15-year-old talk to their parents.

✗ "I am scared I will fail WASSCE" → do NOT reply with a five-step revision programme.
✓ Reply like this: "That fear is worth listening to — it usually means you already know
which paper is the problem. For most students in your position it's one or two subjects
dragging the aggregate, not everything at once. So tell me: which subject are you most
afraid of? Once I know that, I can tell you exactly what to do about it — and also what
your options still look like if the results don't land where you want, because there
are more of them than you think."

One question back is worth more than five steps they won't follow. A student who is
frightened needs you to narrow the problem, not hand them a programme.

Use their PROFILE as the primary filter for every recommendation. Do not ignore family pressure, finances, region, strengths, or challenges.

${profileBlock}
${matchesBlock}

Your job: give practical, personalised guidance from JHS → BECE → SHS → WASSCE → university → career for THIS student, one conversation at a time.

MORE ON HOW TO TALK:
- Answer the question they actually asked. Don't pre-empt adjacent topics.
- Have an opinion. "I'd go with X, because…" beats laying out every option evenly.
- Name the thing they haven't thought of — the safe choice, the cheaper route, the
  subject that will quietly block them later.
- End with a real question or one concrete next step. Never a summary.
- Never contradict their profile: at SHS Form 1–2 or later they have ALREADY been placed
  in a stream. If you need a fact you don't have, just ask for it in one sentence.
- Prefer careers from their TOP SCORED MATCHES; if you go outside that list, say why.
- Asked which SHS? 2–3 real ones from the list below, across categories, in sentences.
- Family pressure: name the tension, then give them a line they could actually say.
- Weak subject: 1–2 concrete catch-up steps, not encouragement.
- Ghana education and careers only.

══ CAREER PATHWAYS most relevant to this student (format: Career: BECE target | SHS stream | School category | WASSCE agg | Required electives | University options) ══
If they ask about a career that isn't listed here, answer from general knowledge of the Ghanaian system and say the specifics should be confirmed.
${data.careerTable}

══ SHS SCHOOLS (${data.schoolScope}) ══
Category (A–D) reflects a school's historical average performance, NOT an entry aggregate.
${data.schoolList}

══ UNIVERSITY CUTOFF POINTS 2026 (aggregate = sum of best 6 WASSCE grades; lower is better) ══
${data.uccList}

${data.ugList}

KNUST general requirement: aggregate ≤24; science programmes typically ≤12, engineering ≤14, pharmacy ≤9, medicine ≤6.
UEW, UDS, UMaT, UHAS also accept students — mention these for students who miss top-tier cutoffs.`;
}

function buildGuideSystemPrompt(profile, firstName) {
  return `${buildSystemPrompt(profile)}

You are now writing their FIRST PERSONAL GUIDE, straight after onboarding. This is the
one reply that may run longer — 300–400 words. Every other rule still holds: no tables,
nothing invented, no SHS cut-offs.
${firstName ? `Their first name is ${firstName}. Open by addressing them by it.` : "You don't know their name — open with the sentence itself, never an empty \"Hey !\"."}

This should read like a counsellor who has just listened to them for ten minutes and is
now telling them what they think — not like a generated report. Write it as flowing
paragraphs. Use these four headers and nothing else:

**What I'm hearing**
Reflect their situation back in 2–3 sentences of prose — stage, what they're good at,
what's in their way, what constraints are real. No bullet list of their profile fields;
they know their own answers. Show them you understood the shape of it.

**Where I'd point you**
Name one direction and commit to it, with the honest reason it fits them. Mention one
alternate worth keeping open. If their stated dream and their strengths pull apart, say
so kindly and directly — that's the most valuable thing you can tell them.

**How you get there**
The actual path from where they are now, written as PROSE. At most 3 short bullets, and
never with bold labels like "**SHS selection:**" in front of them — that turns it back
into a report. Cover the subjects that matter, the aggregate worth targeting, and 2–3
named institutions. Keep it to their stage: a JHS student does not need university
cutoffs yet, and listing six universities to a Form 1 student is noise.

**Start here**
Two or three things to do this term. Specific and small enough to actually begin.

Then one closing line inviting them to ask about any part of it.

Be specific to what THEY said. If they told you money is tight, the guide has to show it
thought about money. If family expects something different, address it. Generic advice
that could apply to any student is a failure here.`;
}

/* ── Helpers ── */
function topMatchDetail(profile) {
  if (!profile?.interests?.length && !profile?.strengths?.length) return null;
  const [top] = getRecommendations(profile, 1);
  if (!top?.shsStream) return null;
  return { careerGoal: top.title, shsStream: top.shsStream };
}

function parseRoadmapUpdate(text, profile) {
  const fromProfile = profile ? deriveRoadmapFromProfile(profile) : null;
  const topMatch = profile ? topMatchDetail(profile) : null;
  const lower = (text || "").toLowerCase();

  let stage = fromProfile?.stage || null;
  let detail = fromProfile?.detail || topMatch?.shsStream || null;

  if (lower.includes("general science")) {
    stage = stage || "SHS";
    detail = "General Science";
  } else if (lower.includes("general arts")) {
    stage = stage || "SHS";
    detail = "General Arts";
  } else if (
    lower.includes("business program") ||
    lower.includes("financial accounting") ||
    lower.includes("business")
  ) {
    if (!detail || detail.startsWith("Lean")) {
      stage = stage || "SHS";
      detail = "Business";
    }
  } else if (lower.includes("tvet") || lower.includes("technical")) {
    stage = stage || "SHS";
    detail = "TVET";
  }

  if (lower.includes("bece") && lower.includes("aggregate")) {
    stage = stage || "BECE";
    detail = detail || "Check aggregate guidance";
  }
  if (lower.includes("wassce")) {
    stage = stage || "WASSCE";
    detail = detail || "Credit grades required";
  }
  if (
    lower.includes("university of ghana") ||
    lower.includes("university of cape coast") ||
    lower.includes("knust")
  ) {
    stage = stage || "University";
    detail = detail || "See recommendations above";
  }

  if (!stage) return null;

  return {
    stage,
    detail: detail || fromProfile?.detail || "See guidance",
    careerGoal: fromProfile?.careerGoal || topMatch?.careerGoal || null,
  };
}

function toGroqRole(role) {
  return role === "agent" ? "assistant" : "user";
}

function publicProfile(profile) {
  if (!profile) return emptyProfile();
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  // freeNotes Map → plain object
  if (obj.freeNotes instanceof Map) {
    obj.freeNotes = Object.fromEntries(obj.freeNotes);
  }
  return obj;
}

async function saveAgentMessage(session, content, roadmapStage = null) {
  const agentMessage = await Message.create({
    sessionId: session.sessionId,
    role: "agent",
    content,
    roadmapStage,
  });
  session.messages.push(agentMessage._id);
  await session.save();
  return agentMessage;
}

/** The student's name lives on the User, not the profile. */
async function sessionFirstName(session) {
  if (!session.userId) return null;
  try {
    const owner = await User.findById(session.userId).select("name");
    return owner?.name?.trim().split(/\s+/)[0] || null;
  } catch {
    return null;
  }
}

async function generatePersonalGuide(session) {
  const profile = publicProfile(session.profile);
  const firstName = await sessionFirstName(session);

  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: buildGuideSystemPrompt(profile, firstName) },
      {
        role: "user",
        content:
          "I finished onboarding. Write my personal academic and career guide now based only on my profile.",
      },
    ],
    temperature: 0.4,
    // gpt-oss spends part of the budget on reasoning tokens before any visible
    // output, so this ceiling covers both.
    max_tokens: 2500,
    reasoning_effort: "low",
  });

  return completion.choices[0].message.content;
}

/* ── Onboarding turn ── */
async function handleOnboarding(session, answerText, res) {
  const step = session.onboardingStep || 0;
  const total = getTotalQuestions();
  const question = getQuestion(step);

  if (!question) {
    session.phase = "chat";
    await session.save();
    return res.json({
      reply: "Your profile is ready. Ask me anything about your path.",
      phase: "chat",
      onboarding: null,
      profile: publicProfile(session.profile),
      careerGoal: session.careerGoal,
      roadmapUpdate: deriveRoadmapFromProfile(publicProfile(session.profile)),
    });
  }

  const profileObj = publicProfile(session.profile);
  const updated = applyAnswer(profileObj, question, answerText);
  session.profile = updated;
  session.markModified("profile");

  if (question.profileKey === "region") {
    session.region = updated.region;
  }
  if (question.profileKey === "careerDirection") {
    session.careerGoal = deriveCareerGoal(updated);
  }

  const nextStep = step + 1;
  session.onboardingStep = nextStep;

  // Finished all questions → generate guide
  if (nextStep >= total) {
    session.careerGoal = deriveCareerGoal(updated);
    session.region = updated.region || session.region;

    // Guest finished onboarding: hold the guide until they have an account to
    // save it to. Their answers are already persisted on the session, so signing
    // up claims this work rather than starting over.
    if (!session.userId) {
      session.phase = "awaiting_signup";
      await session.save();

      const [topMatch] = getRecommendations(updated, 1);
      return res.json({
        reply: null,
        phase: "awaiting_signup",
        onboarding: {
          step: total,
          total,
          progress: 100,
          completed: true,
          question: null,
        },
        profile: publicProfile(session.profile),
        careerGoal: session.careerGoal,
        roadmapUpdate: null,
        guideReady: false,
        signupPreview: {
          answersGiven: total,
          careerGoal: session.careerGoal,
          topMatch: topMatch
            ? { title: topMatch.title, score: topMatch.overallScore }
            : null,
        },
      });
    }

    session.phase = "chat";

    let reply;
    try {
      reply = await generatePersonalGuide(session);
      session.guideGenerated = true;
    } catch (err) {
      console.error("Guide generation failed:", err);
      reply = buildFallbackGuide(updated, await sessionFirstName(session));
      session.guideGenerated = true;
    }

    const roadmapUpdate = deriveRoadmapFromProfile(updated);
    await saveAgentMessage(session, reply, roadmapUpdate.stage);
    await session.save();
    await syncProfileToUser(session);

    return res.json({
      reply,
      phase: "chat",
      onboarding: {
        step: total,
        total,
        progress: 100,
        completed: true,
        question: null,
      },
      profile: publicProfile(session.profile),
      careerGoal: session.careerGoal,
      roadmapUpdate,
      guideReady: true,
    });
  }

  // Next question
  await session.save();
  await syncProfileToUser(session);
  const payload = getOnboardingPayload(nextStep);
  const nextPrompt = payload.question.prompt;

  await saveAgentMessage(session, nextPrompt);

  return res.json({
    reply: nextPrompt,
    phase: "onboarding",
    onboarding: payload,
    profile: publicProfile(session.profile),
    careerGoal: session.careerGoal,
    roadmapUpdate: null,
    guideReady: false,
  });
}

/**
 * Shown when the model call fails. Written in the same conversational voice as a
 * real guide — a student should never be able to tell this is the degraded path.
 */
function buildFallbackGuide(profile, firstName) {
  const career = deriveCareerGoal(profile);
  const [top] = getRecommendations(profile, 1);
  const match = top?.title && top.title !== career ? top.title : null;

  const strengths = profile.strengths?.length
    ? profile.strengths.slice(0, 2).join(" and ")
    : null;
  const tight = /concern|tight/i.test(profile.financialSituation || "");
  const greeting = firstName ? `${firstName}, ` : "";

  const opening =
    `**What I'm hearing**\n` +
    `${greeting}from everything you've told me, **${career}** is the direction that fits you best` +
    (strengths ? `, and your ${strengths} back that up` : "") +
    `.` +
    (match ? ` ${match} is worth keeping on the table too — it draws on the same strengths.` : "") +
    (tight
      ? ` I've also noted money is tight, so I'll keep pointing you at routes that don't depend on being able to pay your way.`
      : "");

  const next =
    `\n\n**Start here**\n` +
    `- Focus this term on the subjects that path actually needs — ask me which ones and I'll be specific.\n` +
    `- Tell me your current results and I'll tell you honestly which schools are realistic.\n` +
    (profile.familyExpectations && /specific|pressure/i.test(profile.familyExpectations)
      ? `- If family expectations are pulling a different way, ask me — that conversation is worth planning.\n`
      : "") +
    `\nAsk me about any part of this and we'll go deeper.`;

  return opening + next;
}

/* ── Free chat turn ── */
async function handleChat(session, message, res) {
  const history = await Message.find({ sessionId: session.sessionId }).sort({
    timestamp: 1,
  });

  // Cap history at last 8 messages to stay within token limits
  const recentHistory = history.slice(-8).map((m) => ({
    role: toGroqRole(m.role),
    content: m.content,
  }));

  const profile = publicProfile(session.profile);
  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(profile) },
      ...recentHistory,
      { role: "user", content: message },
    ],
    temperature: 0.55,
    max_tokens: 1400,
    reasoning_effort: "low",
  });

  const reply = completion.choices[0].message.content;
  const roadmapUpdate = parseRoadmapUpdate(reply, profile);

  if (roadmapUpdate?.careerGoal && !session.careerGoal) {
    session.careerGoal = roadmapUpdate.careerGoal;
  }

  await saveAgentMessage(session, reply, roadmapUpdate?.stage || null);
  await session.save();

  res.json({
    reply,
    phase: "chat",
    onboarding: null,
    profile,
    careerGoal: session.careerGoal,
    roadmapUpdate,
    guideReady: session.guideGenerated,
  });
}

/**
 * Generate the personal guide for a session that finished onboarding as a guest
 * and has since been claimed by an account. Called right after sign-up.
 */
exports.unlockGuide = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = await Session.findOne({ sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.guideGenerated) {
      return res.status(400).json({ error: "Guide already generated." });
    }

    const profile = publicProfile(session.profile);
    session.phase = "chat";
    session.careerGoal = session.careerGoal || deriveCareerGoal(profile);

    let reply;
    try {
      reply = await generatePersonalGuide(session);
    } catch (err) {
      console.error("Guide generation failed:", err);
      reply = buildFallbackGuide(profile, await sessionFirstName(session));
    }
    session.guideGenerated = true;

    const roadmapUpdate = deriveRoadmapFromProfile(profile);
    await saveAgentMessage(session, reply, roadmapUpdate.stage);
    await session.save();
    await syncProfileToUser(session);

    res.json({
      reply,
      phase: "chat",
      onboarding: null,
      profile,
      careerGoal: session.careerGoal,
      roadmapUpdate,
      guideReady: true,
    });
  } catch (error) {
    console.error("Unlock guide error:", error);
    next(error);
  }
};

/* ── Controller ── */
exports.sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message?.trim()) {
      return res
        .status(400)
        .json({ error: "sessionId and message are required" });
    }

    // Signed-in users reach only their own sessions; guests only unclaimed ones.
    const session = await Session.findOne(
      req.user
        ? { sessionId, userId: req.user._id }
        : { sessionId, userId: null },
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Guest completed onboarding — everything past this point needs an account.
    if (session.phase === "awaiting_signup") {
      return res.status(401).json({
        error: "Create an account to unlock your guide.",
        phase: "awaiting_signup",
      });
    }

    // Free chat costs an LLM call, so it stays behind an account.
    if (session.phase === "chat" && !session.userId) {
      return res.status(401).json({
        error: "Create an account to keep chatting with Caria.",
        phase: "awaiting_signup",
      });
    }

    const trimmed = message.trim();

    const userMessage = await Message.create({
      sessionId,
      role: "user",
      content: trimmed,
    });

    session.messages.push(userMessage._id);
    await session.save();

    if (session.phase === "onboarding") {
      return handleOnboarding(session, trimmed, res);
    }

    return handleChat(session, trimmed, res);
  } catch (error) {
    console.error("Chat error:", error);
    next(error);
  }
};
