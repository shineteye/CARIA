const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'agent'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  roadmapStage: { type: String, default: null },
});

module.exports = mongoose.model('Message', messageSchema);
