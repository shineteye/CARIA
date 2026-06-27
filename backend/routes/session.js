const express = require('express');
const { createSession, getHistory } = require('../controllers/sessionController');

const router = express.Router();

router.post('/create', createSession);
router.get('/:sessionId/history', getHistory);

module.exports = router;
