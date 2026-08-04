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
let SYSTEM_PROMPT_BASE = null;

function buildDataTables() {
  if (SYSTEM_PROMPT_BASE) return SYSTEM_PROMPT_BASE;

  const jhsData = loadJSON("jhs_data.json");
  const shsSchools = loadJSON("ghana_shs_sample_50.json");
  const uccCutoffs = loadJSON("ucc_cut_off_points_2026.json");
  const ugCutoffs = loadJSON("university_of_ghana_cutoff_points_2026.json");
  const shsGuidance = loadJSON("shs_university_guidance_100.json");

  const careerTable = jhsData
    .map((c) => {
      const p = c.primary_pathway || {};
      const sg = shsGuidance.find((g) => g.title === c.title);
      const guide = sg?.shs_university_guidance || {};
      const electives = (p.required_wassce_electives || []).join("+");
      const cats = (p.target_shs_categories || []).join("/");
      const unis = (p.university_pathways || [])
        .slice(0, 2)
        .map((u) => `${u.institution} agg≤${u.typical_cutoff_aggregate}`)
        .join("; ");
      const wassce = guide.target_wassce_aggregate || "?";
      return `${c.title}: BECE≤${p.ideal_bece_aggregate || "?"} | ${p.recommended_shs_stream || "?"} | Cat${cats} | WASSCE≤${wassce} | ${electives} | ${unis}`;
    })
    .join("\n");

  function flattenCutoffs(uniData) {
    const rows = [];
    for (const fac of uniData.faculties_and_programs || []) {
      for (const prog of fac.programs || []) {
        rows.push(`${prog.name}(${prog.cut_off_point})`);
      }
    }
    return rows.join(", ");
  }

  const uccList = `UCC: ${flattenCutoffs(uccCutoffs)}`;
  const ugList = `UG Legon: ${flattenCutoffs(ugCutoffs)}`;

  const schoolList = shsSchools
    .slice(0, 30)
    .map((s) => `${s.school_name} [Cat${s.category}] ${s.region}`)
    .join("\n");

  SYSTEM_PROMPT_BASE = {
    careerTable,
    schoolList,
    uccList,
    ugList,
  };

  return SYSTEM_PROMPT_BASE;
}

function buildSystemPrompt(profile) {
  const data = buildDataTables();
  const profileBlock = buildProfileContext(profile);

  return `You are Caria — a warm, sharp Ghanaian career counselor having an ongoing conversation with a student you already know well from their onboarding. You are not writing a report or a brochure; you are talking to them.

Use their PROFILE as the primary filter for every recommendation. Do not ignore family pressure, finances, region, strengths, or challenges.

${profileBlock}

Your job: give practical, personalised guidance from JHS → BECE → SHS → WASSCE → university → career for THIS student, one conversation at a time.

HOW TO TALK:
- Before answering, check their STUDENT PROFILE "School stage" against what you're about to say. Never give advice that contradicts a fact already in their profile — e.g. if their stage is "SHS Form 1–2" or later, they have ALREADY been placed in an SHS stream (Ghana students choose their stream at SHS admission), so don't recommend a stream as if it's still undecided. If you need a fact that isn't in their profile (like which stream they're currently in), ask them directly in one short sentence instead of guessing or defaulting to a generic recommendation.
- Answer the actual question they just asked. Don't pre-emptively dump every adjacent topic (alternate schools, regional options, how to talk to parents, etc.) unless they asked for it or it's essential to answering well.
- Write in short, natural paragraphs like you're speaking to them directly. Weave their specific details (region, strengths, grades, family situation) into sentences — don't restate their profile as a checklist.
- Only use a bullet list when listing genuinely discrete items (named schools, named steps) — lead with a sentence of context first, never open with a bare header.
- Skip generic closing sections like "Key points to discuss" or "Remember." End with one concrete next step, or a short question back to them to keep the conversation going.
- Be decisive and specific: name actual schools, actual cutoffs, actual subjects — not just categories of options.
- Keep a normal reply to roughly 120–200 words. Only go longer if they explicitly ask for a full breakdown or roadmap.
- If family pressure conflicts with interests, name the tension directly and give them a bridge path plus a line they could actually say to their parents — don't just tell them to "have an open conversation."
- If academics are weak in a required subject, give 1–2 concrete catch-up steps, not a general pep talk.
- Only answer Ghana education and career questions.
- Cutoff aggregates are totals of 6 subjects (lower = better).

══ CAREER PATHWAYS (format: Career: BECE target | SHS stream | School category | WASSCE agg | Required electives | University options) ══
${data.careerTable}

══ SHS SCHOOLS (sample — recommend by category match and region) ══
${data.schoolList}

══ UNIVERSITY CUTOFF POINTS 2026 (aggregate = sum of best 6 WASSCE grades; lower is better) ══
${data.uccList}

${data.ugList}

KNUST general requirement: aggregate ≤24; science programmes typically ≤12, engineering ≤14, pharmacy ≤9, medicine ≤6.
UEW, UDS, UMaT, UHAS also accept students — mention these for students who miss top-tier cutoffs.`;
}

function buildGuideSystemPrompt(profile) {
  return `${buildSystemPrompt(profile)}

You are now writing their FIRST PERSONAL GUIDE after onboarding.
Structure your reply exactly like this (markdown):

**Your personal guide is ready**
One warm sentence reflecting who they are.

**Who you are (my read)**
3–5 bullets summarising stage, strengths, challenges, influences, constraints.

**Best-fit direction**
1 primary path + why it fits them. 1–2 alternates if useful.

**Your roadmap**
Bullets for: now → next exam → SHS stream/electives (or current SHS focus) → WASSCE targets → university options with realistic cutoffs.
Mention category/region/finance constraints.

**Watch-outs**
Family, money, weak subjects, mobility — honest but kind.

**Next 3 actions**
Specific things to do this week/term.

Keep under 450 words. Be specific to THEIR answers — no generic brochure language.`;
}

/* ── Helpers ── */
function parseRoadmapUpdate(text, profile) {
  const fromProfile = profile ? deriveRoadmapFromProfile(profile) : null;
  const lower = (text || "").toLowerCase();

  let stage = fromProfile?.stage || null;
  let detail = fromProfile?.detail || null;

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
    careerGoal: fromProfile?.careerGoal || null,
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

async function generatePersonalGuide(session) {
  const profile = publicProfile(session.profile);
  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: buildGuideSystemPrompt(profile) },
      {
        role: "user",
        content:
          "I finished onboarding. Write my personal academic and career guide now based only on my profile.",
      },
    ],
    temperature: 0.4,
    max_tokens: 1100,
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
    session.phase = "chat";
    session.careerGoal = deriveCareerGoal(updated);
    session.region = updated.region || session.region;

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

function buildFallbackGuide(profile) {
  const career = deriveCareerGoal(profile);
  const lines = [
    "**Your personal guide is ready**",
    `Based on what you shared, I'm treating **${career}** as your working direction.`,
    "",
    "**Who you are (my read)**",
    profile.educationLevel ? `- Stage: ${profile.educationLevel}` : null,
    profile.region ? `- Region: ${profile.region}` : null,
    profile.strengths?.length
      ? `- Strengths: ${profile.strengths.join(", ")}`
      : null,
    profile.challenges?.length
      ? `- Challenges: ${profile.challenges.join(", ")}`
      : null,
    profile.influences ? `- Influences: ${profile.influences}` : null,
    "",
    "**Next steps**",
    "- Focus on the subjects tied to your direction this term.",
    "- Ask me for SHS streams, WASSCE targets, or university cutoffs next.",
    "- We can adjust if family expectations or grades change.",
  ].filter(Boolean);

  return lines.join("\n");
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
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: buildSystemPrompt(profile) },
      ...recentHistory,
      { role: "user", content: message },
    ],
    temperature: 0.55,
    max_tokens: 500,
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

/* ── Controller ── */
exports.sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message?.trim()) {
      return res
        .status(400)
        .json({ error: "sessionId and message are required" });
    }

    const session = await Session.findOne({
      sessionId,
      userId: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
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
