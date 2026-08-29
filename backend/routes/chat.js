const express = require("express");
const { sendMessage, unlockGuide } = require("../controllers/chatController");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const router = express.Router();

// Guests may onboard without an account; the controller requires sign-up
// before the personal guide is generated.
router.post("/message", optionalAuth, sendMessage);

// Called right after sign-up to generate the guide for a claimed guest session.
router.post("/unlock-guide", requireAuth, unlockGuide);

module.exports = router;
