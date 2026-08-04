const {
  getQuestion,
  getTotalQuestions,
  formatQuestionForClient,
} = require("../data/onboardingQuestions");

function emptyProfile() {
  return {
    educationLevel: null,
    region: null,
    strengths: [],
    challenges: [],
    interests: [],
    careerDirection: null,
    influences: null,
    familyExpectations: null,
    financialSituation: null,
    mobility: null,
    timeline: null,
    motivation: null,
    freeNotes: {},
  };
}

function applyAnswer(profile, question, answerText) {
  const next = {
    ...profile,
    strengths: [...(profile.strengths || [])],
    challenges: [...(profile.challenges || [])],
    interests: [...(profile.interests || [])],
    freeNotes: { ...(profile.freeNotes || {}) },
  };

  const cleaned = (answerText || "").trim();
  if (!cleaned) return next;

  const key = question.profileKey;

  if (question.multi) {
    const parts = cleaned
      .split(/[,;|]/)
      .map((p) => p.trim())
      .filter(Boolean);
    next[key] = parts.length ? parts : [cleaned];
  } else {
    next[key] = cleaned;
  }

  // Keep top-level session mirrors for legacy fields
  return next;
}

function profileSummaryLines(profile) {
  const lines = [];
  if (profile.educationLevel)
    lines.push(`• School stage: ${profile.educationLevel}`);
  if (profile.region) lines.push(`• Region: ${profile.region}`);
  if (profile.strengths?.length)
    lines.push(`• Strengths: ${profile.strengths.join(", ")}`);
  if (profile.challenges?.length)
    lines.push(`• Challenges: ${profile.challenges.join(", ")}`);
  if (profile.interests?.length)
    lines.push(`• Interests: ${profile.interests.join(", ")}`);
  if (profile.careerDirection)
    lines.push(`• Direction: ${profile.careerDirection}`);
  if (profile.influences) lines.push(`• Influences: ${profile.influences}`);
  if (profile.familyExpectations)
    lines.push(`• Family: ${profile.familyExpectations}`);
  if (profile.financialSituation)
    lines.push(`• Finances: ${profile.financialSituation}`);
  if (profile.mobility) lines.push(`• Mobility: ${profile.mobility}`);
  if (profile.timeline) lines.push(`• Timeline: ${profile.timeline}`);
  if (profile.motivation) lines.push(`• Motivation: ${profile.motivation}`);
  return lines.join("\n");
}

function buildProfileContext(profile) {
  if (!profile) return "No student profile yet.";
  const body = profileSummaryLines(profile);
  return body
    ? `STUDENT PROFILE (use this for all advice):\n${body}`
    : "No student profile details yet.";
}

function deriveCareerGoal(profile) {
  const raw = (profile.careerDirection || "").toLowerCase();
  if (!raw || raw.includes("not sure") || raw.includes("explore")) {
    // Infer from interests
    const interests = (profile.interests || []).join(" ").toLowerCase();
    if (interests.includes("health")) return "Healthcare (exploring)";
    if (interests.includes("tech") || interests.includes("computer"))
      return "Technology (exploring)";
    if (interests.includes("building")) return "Engineering (exploring)";
    if (interests.includes("business")) return "Business (exploring)";
    if (interests.includes("teaching")) return "Education (exploring)";
    if (interests.includes("law") || interests.includes("justice"))
      return "Law / Public service (exploring)";
    return "Exploring careers";
  }
  if (raw.includes("doctor") || raw.includes("medic")) return "Medical Doctor";
  if (raw.includes("nurs")) return "Nurse / Midwife";
  if (raw.includes("engineer")) return "Engineer";
  if (raw.includes("software") || raw.includes("it"))
    return "Software Developer";
  if (raw.includes("teach")) return "Teacher";
  if (raw.includes("law")) return "Lawyer";
  if (raw.includes("business") || raw.includes("financ"))
    return "Business / Finance";
  return profile.careerDirection;
}

function deriveRoadmapFromProfile(profile) {
  const level = (profile.educationLevel || "").toLowerCase();
  const career = deriveCareerGoal(profile);
  const streamHints = inferStreamHint(profile);

  if (level.includes("jhs") || level.includes("bece") || level.includes("exploring early")) {
    return {
      stage: "JHS",
      detail: streamHints || "Build foundations",
      careerGoal: career,
    };
  }
  if (level.includes("shs form 1") || level.includes("form 1–2") || level.includes("form 1-2")) {
    return {
      stage: "SHS",
      detail: streamHints || "SHS pathway",
      careerGoal: career,
    };
  }
  if (level.includes("wassce") || level.includes("form 3")) {
    return {
      stage: "WASSCE",
      detail: "Target grades & electives",
      careerGoal: career,
    };
  }
  if (level.includes("finished")) {
    return {
      stage: "University",
      detail: "Programme & cutoff fit",
      careerGoal: career,
    };
  }
  return {
    stage: "BECE",
    detail: streamHints || "Next milestone",
    careerGoal: career,
  };
}

function inferStreamHint(profile) {
  const blob = [
    profile.careerDirection,
    ...(profile.interests || []),
    ...(profile.strengths || []),
  ]
    .join(" ")
    .toLowerCase();

  if (
    blob.includes("doctor") ||
    blob.includes("nurs") ||
    blob.includes("medic") ||
    blob.includes("health") ||
    blob.includes("engineer") ||
    blob.includes("science") ||
    blob.includes("software") ||
    blob.includes("tech")
  ) {
    return "Lean General Science";
  }
  if (
    blob.includes("business") ||
    blob.includes("financ") ||
    blob.includes("account")
  ) {
    return "Lean Business";
  }
  if (blob.includes("law") || blob.includes("teach") || blob.includes("justice")) {
    return "Lean General Arts";
  }
  return null;
}

function getOnboardingPayload(step) {
  const total = getTotalQuestions();
  const question = getQuestion(step);
  return {
    step: step + 1,
    total,
    progress: Math.round((step / total) * 100),
    completed: step >= total,
    question: formatQuestionForClient(question, step, total),
  };
}

function firstQuestionMessage() {
  const q = getQuestion(0);
  return q?.prompt || "Let's get to know you. Where are you in school?";
}

module.exports = {
  emptyProfile,
  applyAnswer,
  profileSummaryLines,
  buildProfileContext,
  deriveCareerGoal,
  deriveRoadmapFromProfile,
  getOnboardingPayload,
  firstQuestionMessage,
  getQuestion,
  getTotalQuestions,
};
