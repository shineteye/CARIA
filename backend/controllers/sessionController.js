const { randomUUID } = require('crypto');
const Session = require('../models/Session');
const Message = require('../models/Message');

exports.createSession = async (req, res, next) => {
  try {
    const sessionId = randomUUID();
    await Session.create({ sessionId });
    res.status(201).json({ sessionId });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .select('role content timestamp -_id');

    res.json(messages);
  } catch (error) {
    next(error);
  }
};
