const Session = require("../models/Session");
const { publicUser } = require("../middleware/auth");
const {
  emptyProfile,
  deriveCareerGoal,
} = require("../services/onboardingService");
const { ONBOARDING_QUESTIONS } = require("../data/onboardingQuestions");

const EDITABLE_KEYS = [
  "educationLevel",
  "region",
  "strengths",
  "challenges",
  "interests",
  "careerDirection",
  "influences",
  "familyExpectations",
  "financialSituation",
  "mobility",
  "timeline",
  "motivation",
];

const FIELD_LABELS = {
  educationLevel: "School stage",
  region: "Region",
  strengths: "Strengths",
  challenges: "Challenges",
  interests: "Interests",
  careerDirection: "Career direction",
  influences: "Influences",
  familyExpectations: "Family expectations",
  financialSituation: "Finances",
  mobility: "Mobility",
  timeline: "Timeline",
  motivation: "Motivation",
};

function publicProfile(profile) {
  if (!profile) return emptyProfile();
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  if (obj.freeNotes instanceof Map) {
    obj.freeNotes = Object.fromEntries(obj.freeNotes);
  }
  return obj;
}

function normalizeField(key, value) {
  if (["strengths", "challenges", "interests"].includes(key)) {
    if (Array.isArray(value)) {
      return value.map(String).map((s) => s.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function editorFields() {
  return ONBOARDING_QUESTIONS.map((q) => ({
    id: q.id,
    profileKey: q.profileKey,
    label: FIELD_LABELS[q.profileKey] || q.profileKey,
    multi: !!q.multi,
    options: q.options.map((o) => ({ id: o.id, label: o.label })),
    helper: q.helper || null,
  }));
}

exports.getProfile = async (req, res, next) => {
  try {
    res.json({
      user: publicUser(req.user),
      profile: publicProfile(req.user.profile),
      careerGoal: req.user.careerGoal,
      guideGenerated: !!req.user.guideGenerated,
      fields: editorFields(),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const incoming = req.body.profile || req.body;
    const current = publicProfile(user.profile);
    const merged = { ...current, freeNotes: current.freeNotes || {} };

    for (const key of EDITABLE_KEYS) {
      if (incoming[key] !== undefined) {
        merged[key] = normalizeField(key, incoming[key]);
      }
    }

    user.profile = merged;
    user.markModified("profile");

    if (merged.region) user.region = merged.region;
    if (merged.careerDirection) {
      user.careerGoal = deriveCareerGoal(merged);
    }

    await user.save();

    // Keep active session profile in sync
    if (user.activeSessionId) {
      const session = await Session.findOne({
        sessionId: user.activeSessionId,
        userId: user._id,
      });
      if (session) {
        session.profile = merged;
        session.markModified("profile");
        session.region = merged.region || session.region;
        session.careerGoal = user.careerGoal || session.careerGoal;
        await session.save();
      }
    }

    res.json({
      user: publicUser(user),
      profile: publicProfile(user.profile),
      careerGoal: user.careerGoal,
      message: "Profile updated. Future advice will use your new answers.",
    });
  } catch (error) {
    next(error);
  }
};
