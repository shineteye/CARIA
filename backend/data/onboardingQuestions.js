/**
 * Hybrid onboarding quiz for Caria.
 * Chat-style questions with tap-to-answer chips + optional free text.
 */
const ONBOARDING_QUESTIONS = [
  {
    id: "education_level",
    profileKey: "educationLevel",
    prompt:
      "Welcome — I'm **Caria**, your academic path advisor for Ghana.\n\nBefore I build your personal guide, I need to understand *you* — not just a career name. This takes a few minutes.\n\n**Where are you in school right now?**",
    helper: "Tap a choice, or type your own if none fit.",
    multi: false,
    options: [
      { id: "jhs_early", label: "JHS (Form 1–2)" },
      { id: "jhs_bece", label: "JHS Form 3 / BECE soon" },
      { id: "shs_early", label: "SHS Form 1–2" },
      { id: "shs_wassce", label: "SHS Form 3 / WASSCE soon" },
      { id: "post_wassce", label: "Finished WASSCE" },
      { id: "exploring", label: "Just exploring early" },
    ],
    placeholder: "Or describe your school stage…",
  },
  {
    id: "region",
    profileKey: "region",
    prompt:
      "Got it. **Which region are you in** (or where would you prefer to study)?\n\nThis helps me recommend realistic SHS and university options.",
    helper: "Region affects school placement and cut-offs.",
    multi: false,
    options: [
      { id: "greater_accra", label: "Greater Accra" },
      { id: "central", label: "Central" },
      { id: "ashanti", label: "Ashanti" },
      { id: "eastern", label: "Eastern" },
      { id: "western", label: "Western" },
      { id: "northern", label: "Northern" },
      { id: "volta", label: "Volta" },
      { id: "other_region", label: "Other region" },
    ],
    placeholder: "Or type your town / region…",
  },
  {
    id: "strengths",
    profileKey: "strengths",
    prompt:
      "Nice. **Which subjects or skills do you feel strongest in?**\n\nYou can pick more than one, then tap **Continue**.",
    helper: "Select all that apply.",
    multi: true,
    options: [
      { id: "math", label: "Mathematics" },
      { id: "science", label: "Science" },
      { id: "english", label: "English" },
      { id: "social", label: "Social Studies" },
      { id: "ict", label: "ICT / Computers" },
      { id: "languages", label: "Languages" },
      { id: "creative", label: "Creative / Arts" },
      { id: "practical", label: "Hands-on / Practical" },
    ],
    placeholder: "Add anything else you're good at…",
  },
  {
    id: "challenges",
    profileKey: "challenges",
    prompt:
      "Honest answers help more than perfect ones. **Where do you struggle most?**\n\nPick one or more, then **Continue**.",
    helper: "No judgment — this shapes realistic targets.",
    multi: true,
    options: [
      { id: "math_hard", label: "Mathematics" },
      { id: "science_hard", label: "Science" },
      { id: "english_hard", label: "English / Writing" },
      { id: "focus", label: "Focus / study habits" },
      { id: "exams", label: "Exam pressure" },
      { id: "resources", label: "Limited books / tuition" },
      { id: "ok_overall", label: "I'm doing okay overall" },
    ],
    placeholder: "Or describe what feels hardest…",
  },
  {
    id: "interests",
    profileKey: "interests",
    prompt:
      "What kinds of work **pull your interest** — even if you're not sure about a job title yet?\n\nPick all that fit, then **Continue**.",
    helper: "Think energy, not prestige.",
    multi: true,
    options: [
      { id: "health", label: "Helping people / health" },
      { id: "building", label: "Building / making things" },
      { id: "tech", label: "Computers / tech" },
      { id: "business", label: "Business / money" },
      { id: "teaching", label: "Teaching / mentoring" },
      { id: "justice", label: "Law / justice / rights" },
      { id: "creative_work", label: "Art / media / design" },
      { id: "unsure_interest", label: "Still figuring it out" },
    ],
    placeholder: "Or describe what you enjoy…",
  },
  {
    id: "career_direction",
    profileKey: "careerDirection",
    prompt:
      "If you had to name a **dream direction** today, what would it be?\n\nIt's okay if you're unsure — I'll still build a useful guide.",
    helper: "One main direction is enough for now.",
    multi: false,
    options: [
      { id: "doctor", label: "Doctor / medicine" },
      { id: "nurse", label: "Nursing / midwifery" },
      { id: "engineer", label: "Engineering" },
      { id: "software", label: "Software / IT" },
      { id: "teacher", label: "Teaching" },
      { id: "lawyer", label: "Law" },
      { id: "business", label: "Business / finance" },
      { id: "not_sure", label: "Not sure — help me explore" },
    ],
    placeholder: "Or type a specific career…",
  },
  {
    id: "influences",
    profileKey: "influences",
    prompt:
      "Career choices in Ghana are rarely solo. **Who has the biggest voice in your path right now?**",
    helper: "This helps me navigate family vs personal goals.",
    multi: false,
    options: [
      { id: "self", label: "Mostly me" },
      { id: "parents", label: "My parents / guardians" },
      { id: "teachers", label: "Teachers / school" },
      { id: "relatives", label: "Siblings / relatives" },
      { id: "mixed", label: "Mix of family and me" },
      { id: "friends", label: "Friends / peers" },
    ],
    placeholder: "Or explain who influences you…",
  },
  {
    id: "family_expectations",
    profileKey: "familyExpectations",
    prompt:
      "How would you describe **family expectations** around your future?",
    helper: "Be honest — it changes the advice I give.",
    multi: false,
    options: [
      { id: "supportive", label: "They support whatever I choose" },
      { id: "specific", label: "They have a specific career in mind" },
      { id: "pressure", label: "There's pressure / disagreement" },
      { id: "not_discussed", label: "We haven't really talked about it" },
      { id: "proud_any", label: "They just want me to succeed" },
    ],
    placeholder: "Or share more about family expectations…",
  },
  {
    id: "financial",
    profileKey: "financialSituation",
    prompt:
      "Money shapes real options. **Which best describes your family's situation for school costs?**\n\n(You can skip detail — a rough picture is enough.)",
    helper: "Used only to suggest realistic schools & paths.",
    multi: false,
    options: [
      { id: "public_day", label: "Public day school is realistic" },
      { id: "public_boarding", label: "Public boarding SHS is possible" },
      { id: "can_private", label: "Private / boarding is possible" },
      { id: "tight", label: "Money is a real concern" },
      { id: "prefer_not", label: "Prefer not to say" },
    ],
    placeholder: "Optional: add context about costs…",
  },
  {
    id: "mobility",
    profileKey: "mobility",
    prompt:
      "Would you be willing to **leave your home region** for a stronger school or programme?",
    helper: "Affects SHS category and university choices.",
    multi: false,
    options: [
      { id: "yes_good_school", label: "Yes, for a good school" },
      { id: "prefer_home", label: "Prefer to stay close to home" },
      { id: "if_necessary", label: "Only if necessary" },
      { id: "not_sure_move", label: "Not sure yet" },
    ],
    placeholder: "Or explain your preference…",
  },
  {
    id: "timeline",
    profileKey: "timeline",
    prompt: "What's your **next big academic step**?",
    helper: "I'll prioritise what matters soonest.",
    multi: false,
    options: [
      { id: "bece_soon", label: "BECE this year or next" },
      { id: "choose_shs", label: "Choosing SHS programme / stream" },
      { id: "wassce_soon", label: "WASSCE this year or next" },
      { id: "choose_uni", label: "Choosing university programme" },
      { id: "long_horizon", label: "Still early — long horizon" },
    ],
    placeholder: "Or describe your timeline…",
  },
  {
    id: "motivation",
    profileKey: "motivation",
    prompt:
      "Last one. **What matters most to you in a future career?**\n\nAfter this, I'll build your personal guide.",
    helper: "Pick the one that feels truest.",
    multi: false,
    options: [
      { id: "impact", label: "Helping people / impact" },
      { id: "salary", label: "Good pay / stability" },
      { id: "prestige", label: "Respect / prestige" },
      { id: "passion", label: "Passion / enjoyment" },
      { id: "skills", label: "Using my skills well" },
      { id: "balance", label: "Balance of all the above" },
    ],
    placeholder: "Or say what success means to you…",
  },
];

function getQuestion(index) {
  if (index < 0 || index >= ONBOARDING_QUESTIONS.length) return null;
  return ONBOARDING_QUESTIONS[index];
}

function getTotalQuestions() {
  return ONBOARDING_QUESTIONS.length;
}

function formatQuestionForClient(question, step, total) {
  if (!question) return null;
  return {
    id: question.id,
    prompt: question.prompt,
    helper: question.helper || null,
    multi: !!question.multi,
    options: question.options.map((o) => ({ id: o.id, label: o.label })),
    placeholder: question.placeholder || "Type your answer…",
    step: step + 1,
    total,
    progress: Math.round((step / total) * 100),
  };
}

module.exports = {
  ONBOARDING_QUESTIONS,
  getQuestion,
  getTotalQuestions,
  formatQuestionForClient,
};
