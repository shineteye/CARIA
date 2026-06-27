const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  region: { type: String, default: null },
  careerGoal: { type: String, default: null },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
});

module.exports = mongoose.model('Session', sessionSchema);
