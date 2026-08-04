const express = require("express");
const { createSession, getHistory } = require("../controllers/sessionController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/create", requireAuth, createSession);
router.get("/:sessionId/history", requireAuth, getHistory);

module.exports = router;
