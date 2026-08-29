const mongoose = require("mongoose");
const profileSchema = require("./profileSchema");

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
  /** onboarding → awaiting_signup (guests only) → chat (after personal guide) */
  phase: {
    type: String,
    enum: ["onboarding", "awaiting_signup", "chat"],
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
