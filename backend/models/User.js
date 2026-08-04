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

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  profile: { type: profileSchema, default: () => ({}) },
  careerGoal: { type: String, default: null },
  region: { type: String, default: null },
  guideGenerated: { type: Boolean, default: false },
  activeSessionId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
