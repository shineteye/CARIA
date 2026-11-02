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
const { stageOf } = require("../data/onboardingQuestions");
const {
  getUniversities,
  normaliseProgramme,
  universityFor,
  verifiedCutoff,
} = require("../services/cutoffService");

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
    universities: getUniversities(),
  };
  return DATA;
}

// shs_university_guidance_100.json is deliberately not used: it is generated
// filler (10 careers cycled 10 times, WASSCE bands stepping 6–10, 7–12, 8–14…,
// student stories attached to the wrong careers). Nothing in it is evidence.
function careerLine(career, stage) {
  const p = career.primary_pathway || {};
  const electives = (p.required_wassce_electives || []).join("+");
  const unis = (p.university_pathways || [])
    .slice(0, 3)
    .map((u) => {
      const v = verifiedCutoff(u.institution, u.program);
      return v
        ? `${u.program} @ ${v.uni} cut-off ${v.cutoff}`
        : `${u.program} @ ${u.institution} (no published cut-off in our data)`;
    })
    .join("; ");

  const parts = [career.title];
  // The BECE and SHS-category columns are history for anyone already in SHS.
  if (stage === "jhs" || stage === "exploring" || !stage) {
    const cats = (p.target_shs_categories || []).join("/");
    parts.push(`BECE target ${p.ideal_bece_aggregate || "?"}`, `${p.recommended_shs_stream || "?"} stream`, `SHS Cat ${cats}`);
  } else {
    parts.push(`${p.recommended_shs_stream || "?"} stream`);
  }
  parts.push(`electives ${electives}`, unis);
  return parts.join(" | ");
}

/**
 * Build only the reference data THIS student needs.
 *
 * Dumping all 81 careers and 297 schools on every turn cost ~6k tokens and blew
 * the Groq free-tier 8k TPM limit outright. Scoping to the student's own matches,
 * region and stage is both cheaper and better advice — a student who has
 * finished WASSCE gets no SHS list at all, because none of it applies to them.
 */
function buildDataTables(profile, stage) {
  const { jhs, schools, universities } = loadData();

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
    .map((c) => careerLine(c, stage))
    .join("\n");

  // Schools: only for students who still have an SHS to choose.
  let schoolList = "";
  let schoolScope = "";
  if (stage === "jhs" || stage === "exploring" || !stage) {
    const region = String(profile?.region || "").toLowerCase();
    const inRegion = schools.filter(
      (s) => region && s.region.toLowerCase().includes(region.split(" ")[0]),
    );
    const picked = (inRegion.length ? inRegion : schools).slice(0, 24);
    schoolList = picked
      .map((s) => {
        const tracks = s.academic_tracks?.length
          ? ` (${s.academic_tracks.slice(0, 3).join("/")})`
          : "";
        return `${s.school_name} [Cat${s.category || "?"}, ${s.gender}]${tracks}`;
      })
      .join("\n");
    schoolScope = inRegion.length
      ? `${picked.length} in ${profile.region}`
      : "sample across regions";
  }

  // University programmes: only those plausibly related to their matches.
  const interestWords = new Set(
    scored
      .slice(0, 6)
      .flatMap((s) => s.title.toLowerCase().split(/[^a-z]+/))
      .filter((w) => w.length > 4),
  );
  const universityLists = universities
    .map(({ label, data }) => {
      const rows = (data.faculties_and_programs || [])
        .flatMap((f) => f.programs || [])
        .filter((p) => {
          const n = p.name.toLowerCase();
          return [...interestWords].some((w) => n.includes(w.slice(0, 6)));
        })
        .slice(0, 14)
        .map((p) => `${p.name}(${p.cut_off_point})`);
      return rows.length ? `${label}: ${rows.join(", ")}` : "";
    })
    .filter(Boolean)
    .join("\n");

  return { careerTable, schoolList, schoolScope, universityLists };
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

  return `\n══ TOP SCORED MATCHES FOR THIS STUDENT (ranked by fit + affordability, weighted by their stated motivation) ══\nThese are the same rankings shown to the student on the Explore page — stay consistent with them unless the conversation surfaces new information. The percentages are internal ranking scores: never quote them to the student.\n${lines}\n`;
}

/** What is already behind the student, and what the advice should cover. */
function stageBrief(stage) {
  switch (stage) {
    case "post_wassce":
      return `STAGE: FINISHED WASSCE. BECE, SHS placement, SHS stream and the WASSCE exam itself are all BEHIND them.
Never recommend an SHS, an SHS stream, SHS open days, BECE preparation, or anything "before WASSCE".
Cover what is actually ahead: results, choosing a university or college programme against the cut-offs below, application timing, a resit as a private WASSCE candidate if results fall short, and non-university routes (nursing and midwifery training colleges, colleges of education, technical universities, TVET).
If their finance answer mentions SHS types (day/boarding), read it only as a budget level: they need the lowest-cost public options.
If they ask about SHS or BECE, say plainly that stage is behind them and answer with what applies now.`;
    case "shs_final":
      return `STAGE: FINAL YEAR OF SHS, WASSCE IMMINENT. They are already in a stream — do not suggest choosing one or choosing an SHS.
Cover: the electives and grades that decide their programme options, WASSCE preparation, university and college choices with the cut-offs below, and a backup route.`;
    case "shs":
      return `STAGE: SHS FORM 1–2. They are already placed in a stream — never suggest choosing an SHS. If you need their stream, ask for it.
Cover: whether their stream and electives lead where they want, which grades to build now, and what university programmes require.`;
    case "jhs":
      return `STAGE: JHS. Ahead of them: BECE, SHS selection (CSSPS) and stream choice.
Cover: subjects to strengthen for BECE, which SHS stream fits, and 2–3 real schools from the list below across categories. University cut-offs are background at this stage — mention at most one.`;
    case "exploring":
      return `STAGE: EXPLORING EARLY. Keep the path broad: subjects to build, the SHS stream it points to, and what the career requires later.`;
    default:
      return `STAGE: UNKNOWN. Ask for their school stage in one sentence before giving stage-specific steps.`;
  }
}

function buildSystemPrompt(profile) {
  const stage = stageOf(profile?.educationLevel);
  const data = buildDataTables(profile, stage);
  const profileBlock = buildProfileContext(profile);
  const matchesBlock = buildTopMatchesBlock(profile);

  return `You are Caria, the advisory engine of a guidance system for Ghanaian students. Students come to you for decisions about their academic path. You already hold their profile from onboarding.

╔═══ NON-NEGOTIABLE — overrides everything below ═══╗
1. REGISTER: an advisor giving a professional assessment, not a chatbot making conversation.
   - Open with the answer. No greeting, no use of their name, no "Great question", no
     restating what they just told you.
   - Plain, direct sentences in the second person. No slang or cute phrasing ("a bit of a
     wobble", "keep that spark alive"), no exclamation marks, no emojis.
   - No sign-offs. Never end with "Let me know…", "Feel free to ask…", "Hope this helps",
     or an offer to say more. End on the last piece of substance.
   - Ask a question only when a missing fact blocks the advice — then exactly one, plainly.
2. SHAPE: prose. NO markdown tables, NO section headings in a normal reply, NO numbered
   plans for a question asked out loud. Bold only for a school, programme or subject name.
   (The personal guide is the single exception and has its own format.)
3. LENGTH: 100–180 words. Say the useful thing and stop.
4. NEVER invent what you weren't given — fees, boarding costs, quotas, interviews, clubs,
   labs, facilities, open days, industry partnerships, or salary figures not in the data.
   For money help, do not name scholarships, bursaries, loan schemes or fee waivers; say
   that schemes and deadlines change and the school's guidance officer will know what is
   open this year.
5. NUMBERS: quote a university cut-off ONLY if it appears in the UNIVERSITY CUT-OFF POINTS
   block below, and name the university with it. If a programme's cut-off is not there,
   say it should be confirmed with the university. Never say a university or programme has
   "lower", "easier" or "more accessible" entry requirements unless both figures are in the
   data. Never quote the match percentages.
6. NEVER give a BECE aggregate for entering a specific SHS. Ghana has NO fixed SHS cut-off
   points; GES has publicly called such tables fake. Placement depends on raw score,
   competition for that school, programme demand and choice order.
╚═══════════════════════════════════════════════════╝

${stageBrief(stage)}

✗ NOT THIS (chatbot):
"Great question! With your strong maths, you'd really shine in engineering. KNUST is a
fantastic choice! Let me know if you'd like more details on other schools."

✓ THIS (advisor):
"Engineering is a sound direction for you: your maths and science are strong and the
field pays steadily. At KNUST, Civil Engineering's cut-off is 12, so that is the
aggregate to plan around. Your weak point is English — a fail in Core English blocks
admission regardless of your science grades, so it needs work before anything else."

For a worried or emotional question (family pressure, fear of failing, money), stay
direct but humane: state the situation honestly in a sentence, give your view, give ONE
next step. Do not turn it into a multi-step programme.

Use their PROFILE as the primary filter for every recommendation. Do not ignore family pressure, finances, region, strengths, or challenges.

${profileBlock}
${matchesBlock}

HOW TO ADVISE:
- Answer the question they actually asked. Don't pre-empt adjacent topics.
- Commit to a view. "Choose X, because…" beats laying out every option evenly.
- Name what they haven't thought of — the safe choice, the cheaper route, the subject
  that will quietly block them later.
- Never contradict their profile or their stage.
- Prefer careers from their TOP SCORED MATCHES; if you go outside that list, say why.
- Family pressure: name the tension, then give them a line they could actually say.
- Weak subject: 1–2 concrete catch-up steps, not encouragement.
- Ghana education and careers only.

══ CAREER PATHWAYS relevant to this student ══
If they ask about a career not listed here, answer from general knowledge of the Ghanaian system and say the specifics should be confirmed.
${data.careerTable}
${
  data.schoolList
    ? `
══ SHS SCHOOLS (${data.schoolScope}) ══
Category (A–D) reflects a school's historical average performance, NOT an entry aggregate.
${data.schoolList}
`
    : ""
}
══ UNIVERSITY CUT-OFF POINTS (published figures; aggregate = best 6 WASSCE grades, lower is better) ══
${data.universityLists || "No programmes matching this student's interests in our data."}`;
}

const GUIDE_FORMAT = `Return ONLY a JSON object with exactly these fields:
{
  "standing": "2–3 full sentences in the second person ('You have finished WASSCE…') stating their position plainly: stage, what works for them, what is in their way, the real constraints. Statements, not flattery.",
  "direction": {
    "primary": "One career or programme to aim for",
    "why": "1–2 sentences: why it fits THEM, tied to their profile",
    "alternative": "One backup worth keeping open",
    "alternativeWhy": "1 sentence"
  },
  "tension": "1–2 sentences on the real trade-off they face (dream vs strengths, family vs self, cost vs ambition). Empty string if there is none.",
  "pathway": [
    { "step": "Short label, 2–4 words", "detail": "One sentence on what happens at this step" }
  ],
  "actions": ["Concrete thing to do in the next few weeks", "..."],
  "figures": [
    { "label": "e.g. KNUST BSc. Civil Engineering cut-off", "value": "12" }
  ]
}

Rules for the fields:
- Every text field is written in complete sentences that end with a full stop.
- tension: only a trade-off their answers actually show. A family that "just wants
  them to succeed" or "supports whatever I choose" is NOT pressure — do not invent one.
- pathway: 3–5 steps, STARTING FROM THEIR CURRENT STAGE. Nothing they have already done.
- actions: 2–3 items, each specific enough to start this week.
- figures: every cut-off or aggregate you rely on, copied exactly from the data. Leave the
  array empty rather than include a number that is not in the data. Do not put cut-off
  numbers in the other fields — they belong here.
- No greetings, no names, no sign-off, no questions back to the student.`;

function buildGuideSystemPrompt(profile) {
  return `${buildSystemPrompt(profile)}

You are now producing their PERSONAL GUIDANCE PLAN, straight after onboarding. It is
shown as a structured document, not a chat message. All rules above still hold:
nothing invented, stage respected, no SHS cut-offs, no chatbot register.

Be specific to what THEY said. If money is tight, the plan has to show it. If family
expects something different, address it in "tension". Advice that could apply to any
student is a failure.

${GUIDE_FORMAT}`;
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

async function saveAgentMessage(
  session,
  content,
  roadmapStage = null,
  kind = "message",
) {
  const agentMessage = await Message.create({
    sessionId: session.sessionId,
    role: "agent",
    content,
    roadmapStage,
    kind,
  });
  session.messages.push(agentMessage._id);
  await session.save();
  return agentMessage;
}

/* ── Personal guide ── */

const text = (v) => (typeof v === "string" ? v.trim() : "");
/** Prose fields read as finished sentences even when the model drops the stop. */
const sentence = (v) => {
  const s = text(v);
  return s && !/[.!?]$/.test(s) ? `${s}.` : s;
};

/**
 * A figure survives only if it can be traced to the data: a cut-off must name a
 * university whose published list has that programme at that value, and a
 * target band must appear verbatim in the prompt. Anything else was invented.
 */
function isVerifiedFigure({ label, value }, systemPrompt) {
  if (/target/i.test(label)) {
    const band = value.replace(/\(.*\)/, "").trim().replace(/\s+/g, " ");
    return [...systemPrompt.matchAll(/(?:WASSCE|BECE) target ([\d\s–-]+)/g)].some(
      (m) => m[1].trim().replace(/\s+/g, " ") === band,
    );
  }
  const uni = universityFor(label);
  if (!uni || !/^\d{1,2}$/.test(value)) return false;
  const wanted = normaliseProgramme(label);
  return (uni.data.faculties_and_programs || [])
    .flatMap((f) => f.programs || [])
    .some(
      (p) =>
        String(p.cut_off_point) === value &&
        wanted.includes(normaliseProgramme(p.name)),
    );
}

/** Coerce the model's JSON into the guide shape, or null if it is unusable. */
function normaliseGuide(raw, systemPrompt) {
  if (!raw || typeof raw !== "object") return null;
  const d = raw.direction || {};
  const guide = {
    standing: sentence(raw.standing),
    direction: {
      primary: text(d.primary),
      why: sentence(d.why),
      alternative: text(d.alternative),
      alternativeWhy: sentence(d.alternativeWhy),
    },
    tension: sentence(raw.tension),
    pathway: (Array.isArray(raw.pathway) ? raw.pathway : [])
      .map((s) => ({ step: text(s?.step), detail: sentence(s?.detail) }))
      .filter((s) => s.step && s.detail)
      .slice(0, 5),
    actions: (Array.isArray(raw.actions) ? raw.actions : [])
      .map(sentence)
      .filter(Boolean)
      .slice(0, 3),
    figures: [],
  };

  guide.figures = (Array.isArray(raw.figures) ? raw.figures : [])
    .map((f) => ({ label: text(f?.label), value: text(String(f?.value ?? "")) }))
    .filter((f) => f.label && f.value && isVerifiedFigure(f, systemPrompt))
    .slice(0, 5);

  if (!guide.standing || !guide.direction.primary || guide.pathway.length < 2) {
    return null;
  }
  return guide;
}

/**
 * The layout is the product's, not the model's: the model fills fields and this
 * decides headings and order, so every guide reads as the same document.
 */
function renderGuide(guide) {
  const out = [];
  out.push("### Where you stand", guide.standing, "");

  out.push("### Recommended direction");
  out.push(
    `**${guide.direction.primary}**` +
      (guide.direction.why ? ` — ${guide.direction.why}` : ""),
    "",
  );
  if (guide.direction.alternative) {
    out.push(
      `Alternative: **${guide.direction.alternative}**` +
        (guide.direction.alternativeWhy ? ` — ${guide.direction.alternativeWhy}` : ""),
      "",
    );
  }

  if (guide.tension) out.push("### What to weigh", guide.tension, "");

  out.push("### Your pathway");
  guide.pathway.forEach((s, i) => out.push(`${i + 1}. **${s.step}** — ${s.detail}`));
  out.push("");

  if (guide.actions.length) {
    out.push("### Next few weeks");
    guide.actions.forEach((a) => out.push(`- ${a}`));
    out.push("");
  }

  if (guide.figures.length) {
    out.push("### Figures this plan uses");
    guide.figures.forEach((f) => out.push(`- ${f.label}: **${f.value}**`));
    out.push("");
  }

  return out.join("\n").trim();
}

async function generatePersonalGuide(session) {
  const profile = publicProfile(session.profile);
  const systemPrompt = buildGuideSystemPrompt(profile);

  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "Onboarding is complete. Produce my personal guidance plan as the JSON object described.",
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    // gpt-oss spends part of the budget on reasoning tokens before any visible
    // output, so this ceiling covers both.
    max_tokens: 2500,
    reasoning_effort: "low",
  });

  let raw;
  try {
    raw = JSON.parse(completion.choices[0].message.content);
  } catch {
    raw = null;
  }
  const guide = normaliseGuide(raw, systemPrompt);
  if (!guide) throw new Error("Guide response did not match the expected shape");
  // The model keeps inventing family pressure from a supportive answer, and a
  // student shouldn't be told of a conflict with parents they never described.
  if (
    /just want|support/i.test(profile.familyExpectations || "") &&
    /parent|family|guardian/i.test(guide.tension)
  ) {
    guide.tension = "";
  }
  // Same for entry-grade comparisons: figures live in `figures`, where they are
  // checked, so a reason claiming a route is easier to get into has no source.
  const UNSOURCED_ENTRY_CLAIM = /lower (entry|cut|grade|aggregate)|easier to (get|enter)|more accessible/i;
  if (UNSOURCED_ENTRY_CLAIM.test(guide.direction.why)) guide.direction.why = "";
  if (UNSOURCED_ENTRY_CLAIM.test(guide.direction.alternativeWhy)) {
    guide.direction.alternativeWhy = "";
  }
  return renderGuide(guide);
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
      reply = buildFallbackGuide(updated);
      session.guideGenerated = true;
    }

    const roadmapUpdate = deriveRoadmapFromProfile(updated);
    await saveAgentMessage(session, reply, roadmapUpdate.stage, "guide");
    await session.save();
    await syncProfileToUser(session);

    return res.json({
      reply,
      replyKind: "guide",
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
  const payload = getOnboardingPayload(nextStep, publicProfile(session.profile));
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

const STAGE_LABEL = {
  post_wassce: "You have finished WASSCE",
  shs_final: "You are in your final SHS year with WASSCE ahead",
  shs: "You are in SHS Form 1–2",
  jhs: "You are in JHS with BECE ahead",
  exploring: "You are exploring early",
};

const FALLBACK_PATHWAY = {
  post_wassce: [
    { step: "Results", detail: "Get your WASSCE results and work out your aggregate from your best six subjects." },
    { step: "Programme shortlist", detail: "Compare that aggregate with the published cut-offs for programmes in your direction." },
    { step: "Applications", detail: "Apply with one ambitious choice and at least one programme your aggregate clears comfortably." },
    { step: "Backup route", detail: "If results fall short, plan a private WASSCE resit or a technical university, training college or TVET route." },
  ],
  shs_final: [
    { step: "WASSCE", detail: "Put the most revision time into the electives your target programme requires, and Core English and Maths." },
    { step: "Programme shortlist", detail: "Compare your expected aggregate with the published cut-offs for programmes in your direction." },
    { step: "Applications", detail: "Apply with one ambitious choice and at least one safe one." },
  ],
  shs: [
    { step: "Electives check", detail: "Confirm your stream's electives are the ones your target programme requires." },
    { step: "Build grades", detail: "Raise your weakest required subject now, while there is time before WASSCE." },
    { step: "WASSCE", detail: "Sit WASSCE aiming at the aggregate your target programmes need." },
    { step: "Programme choice", detail: "Choose university or college programmes against the published cut-offs." },
  ],
  jhs: [
    { step: "BECE", detail: "Strengthen the subjects your direction depends on before BECE." },
    { step: "SHS selection", detail: "Choose SHSs on CSSPS across categories, with at least one realistic choice." },
    { step: "SHS stream", detail: "Pick the stream your direction requires." },
  ],
};

/**
 * Built from data alone when the model call fails or returns something unusable.
 * Same structure and layout as a generated plan, so the student never sees a
 * different kind of document.
 */
function buildFallbackGuide(profile) {
  const stage = stageOf(profile.educationLevel);
  const [top, second] = getRecommendations(profile, 2);
  const career = top?.title || deriveCareerGoal(profile);

  const strengths = profile.strengths?.slice(0, 2).join(" and ");
  const challenges = profile.challenges?.slice(0, 2).join(" and ");
  const tight = /concern|tight|scholarship|loan/i.test(profile.financialSituation || "");

  const standing = [
    `${STAGE_LABEL[stage] || "Your school stage is not yet clear"}${profile.region ? `, based in ${profile.region}` : ""}.`,
    strengths ? `Your strongest areas are ${strengths}.` : "",
    challenges && !/okay overall/i.test(challenges) ? `${challenges} need work.` : "",
    tight ? "Cost is a real constraint, so lower-cost public routes come first." : "",
  ]
    .filter(Boolean)
    .join(" ");

  const figures = [];
  const careerData = loadData().jhs.find((c) => c.career_id === top?.careerId);
  for (const u of careerData?.primary_pathway?.university_pathways || []) {
    const v = verifiedCutoff(u.institution, u.program);
    if (v) figures.push({ label: `${v.uni} ${u.program} cut-off`, value: String(v.cutoff) });
  }

  return renderGuide({
    standing,
    direction: {
      primary: career,
      why: strengths
        ? `It draws on your ${strengths} and ranks highest against your profile.`
        : "It ranks highest against your profile.",
      alternative: second?.title || "",
      alternativeWhy: second ? "It uses the same strengths through a different route." : "",
    },
    tension:
      profile.familyExpectations && /specific|pressure/i.test(profile.familyExpectations)
        ? "Your family's expectations may not match this direction. Agree the plan with them early rather than after applications."
        : "",
    pathway: FALLBACK_PATHWAY[stage] || FALLBACK_PATHWAY.jhs,
    actions: [
      challenges && !/okay overall/i.test(challenges)
        ? `Set a weekly block of practice for ${challenges}.`
        : "Set a weekly revision block for the subjects your direction requires.",
      "Ask your school's guidance officer about current admission requirements and any financial support open this year.",
    ],
    figures,
  });
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
 * POST /api/chat/rebuild-plan  { sessionId }
 * A new guidance plan from the session's current profile. The previous plan
 * stays in the history; the client always shows the latest one.
 */
exports.rebuildPlan = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = await Session.findOne({ sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.phase !== "chat") {
      return res.status(409).json({ error: "Finish onboarding before building a plan." });
    }

    const profile = publicProfile(session.profile);
    let reply;
    try {
      reply = await generatePersonalGuide(session);
    } catch (err) {
      console.error("Plan rebuild failed:", err);
      reply = buildFallbackGuide(profile);
    }
    session.guideGenerated = true;
    session.careerGoal = session.careerGoal || deriveCareerGoal(profile);

    const roadmapUpdate = deriveRoadmapFromProfile(profile);
    await saveAgentMessage(session, reply, roadmapUpdate.stage, "guide");
    await session.save();
    await syncProfileToUser(session);

    res.json({
      reply,
      replyKind: "guide",
      phase: "chat",
      onboarding: null,
      profile,
      careerGoal: session.careerGoal,
      roadmapUpdate,
      guideReady: true,
    });
  } catch (error) {
    console.error("Rebuild plan error:", error);
    next(error);
  }
};

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
      reply = buildFallbackGuide(profile);
    }
    session.guideGenerated = true;

    const roadmapUpdate = deriveRoadmapFromProfile(profile);
    await saveAgentMessage(session, reply, roadmapUpdate.stage, "guide");
    await session.save();
    await syncProfileToUser(session);

    res.json({
      reply,
      replyKind: "guide",
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
