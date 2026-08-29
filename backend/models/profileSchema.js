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

module.exports = profileSchema;
