const mongoose = require("mongoose");
const profileSchema = require("./profileSchema");

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
