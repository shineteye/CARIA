const express = require("express");
const {
  getState,
  submitAnswer,
  setStep,
} = require("../controllers/onboardingController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Guests onboard without an account, same as the chat route.
router.get("/:sessionId", optionalAuth, getState);
router.post("/answer", optionalAuth, submitAnswer);
router.post("/step", optionalAuth, setStep);

module.exports = router;
