const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'agent'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  roadmapStage: { type: String, default: null },
  // "guide" marks the personal guidance plan, which the client lays out as a
  // document rather than a chat reply.
  kind: { type: String, enum: ['message', 'guide'], default: 'message' },
});

module.exports = mongoose.model('Message', messageSchema);
