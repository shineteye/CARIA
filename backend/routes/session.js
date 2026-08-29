const express = require("express");
const { createSession, getHistory } = require("../controllers/sessionController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Guests get an anonymous session (userId: null) they can claim by signing up.
router.post("/create", optionalAuth, createSession);
router.get("/:sessionId/history", optionalAuth, getHistory);

module.exports = router;
