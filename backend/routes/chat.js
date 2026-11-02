const express = require("express");
const {
  sendMessage,
  unlockGuide,
  rebuildPlan,
} = require("../controllers/chatController");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const router = express.Router();

// Guests may onboard without an account; the controller requires sign-up
// before the personal guide is generated.
router.post("/message", optionalAuth, sendMessage);

// Called right after sign-up to generate the guide for a claimed guest session.
router.post("/unlock-guide", requireAuth, unlockGuide);

// Writes a fresh guidance plan from the current profile — after the student
// edits their answers, or for sessions whose plan predates the plan format.
router.post("/rebuild-plan", requireAuth, rebuildPlan);

module.exports = router;
