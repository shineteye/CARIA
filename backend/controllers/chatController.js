const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const Session = require("../models/Session");
const Message = require("../models/Message");

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
let SYSTEM_PROMPT = null;

function buildSystemPrompt() {
  if (SYSTEM_PROMPT) return SYSTEM_PROMPT;

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

  SYSTEM_PROMPT = `You are Caria, an AI career guidance advisor for Ghanaian students aged 13–22.

Your job: help students understand exactly what they need to study — from JHS through BECE, SHS, WASSCE, and into university — to reach their chosen career.

RESPONSE RULES:
- If career goal is mentioned, walk through: BECE target → SHS stream + electives → WASSCE aggregate → specific university programmes
- If region not mentioned, ask: Greater Accra or Central Region? (affects school recommendations)
- Use bullet points. Be encouraging and clear. Max 300 words per reply.
- Only answer Ghana education and career questions.
- Cutoff aggregates are totals of 6 subjects (lower = better).

══ CAREER PATHWAYS (format: Career: BECE target | SHS stream | School category | WASSCE agg | Required electives | University options) ══
${careerTable}

══ SHS SCHOOLS (sample — recommend by category match and region) ══
${schoolList}

══ UNIVERSITY CUTOFF POINTS 2026 (aggregate = sum of best 6 WASSCE grades; lower is better) ══
${uccList}

${ugList}

KNUST general requirement: aggregate ≤24; science programmes typically ≤12, engineering ≤14, pharmacy ≤9, medicine ≤6.
UEW, UDS, UMaT, UHAS also accept students — mention these for students who miss top-tier cutoffs.`;

  return SYSTEM_PROMPT;
}

/* ── Helpers ── */
function parseRoadmapUpdate(text) {
  const lower = text.toLowerCase();
  if (lower.includes("general science"))
    return { stage: "SHS", detail: "General Science" };
  if (lower.includes("general arts"))
    return { stage: "SHS", detail: "General Arts" };
  if (
    lower.includes("business program") ||
    lower.includes("financial accounting")
  )
    return { stage: "SHS", detail: "Business" };
  if (lower.includes("tvet") || lower.includes("technical"))
    return { stage: "SHS", detail: "TVET" };
  if (lower.includes("bece") && lower.includes("aggregate"))
    return { stage: "BECE", detail: "Check aggregate guidance" };
  if (lower.includes("wassce"))
    return { stage: "WASSCE", detail: "Credit grades required" };
  if (
    lower.includes("university of ghana") ||
    lower.includes("university of cape coast") ||
    lower.includes("knust")
  )
    return { stage: "University", detail: "See recommendations above" };
  return null;
}

function toGroqRole(role) {
  return role === "agent" ? "assistant" : "user";
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

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const history = await Message.find({ sessionId }).sort({ timestamp: 1 });

    const userMessage = await Message.create({
      sessionId,
      role: "user",
      content: message.trim(),
    });

    session.messages.push(userMessage._id);
    await session.save();

    // Cap history at last 6 messages to stay within token limits
    const recentHistory = history.slice(-6).map((m) => ({
      role: toGroqRole(m.role),
      content: m.content,
    }));

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...recentHistory,
        { role: "user", content: message.trim() },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const reply = completion.choices[0].message.content;
    const roadmapUpdate = parseRoadmapUpdate(reply);

    const agentMessage = await Message.create({
      sessionId,
      role: "agent",
      content: reply,
      roadmapStage: roadmapUpdate?.stage || null,
    });

    session.messages.push(agentMessage._id);
    await session.save();

    res.json({ reply, roadmapUpdate });
  } catch (error) {
    console.error("Chat error:", error);
    next(error);
  }
};
