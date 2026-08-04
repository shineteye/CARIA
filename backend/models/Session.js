const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    educationLevel: { type: String, default: null },
    region: { type: String, default: null },
    strengths: { type: [String], default: [] },
    challenges: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    careerDirection: { type: String, default: null },
    influences: { type: String, default: null },
    familyExpectations: { type: String, default: null },
    financialSituation: { type: String, default: null },
    mobility: { type: String, default: null },
    timeline: { type: String, default: null },
    motivation: { type: String, default: null },
    freeNotes: { type: Map, of: String, default: {} },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
  /** onboarding → chat (after personal guide is generated) */
  phase: {
    type: String,
    enum: ["onboarding", "chat"],
    default: "onboarding",
  },
  onboardingStep: { type: Number, default: 0 },
  profile: { type: profileSchema, default: () => ({}) },
  region: { type: String, default: null },
  careerGoal: { type: String, default: null },
  guideGenerated: { type: Boolean, default: false },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
});

module.exports = mongoose.model("Session", sessionSchema);
