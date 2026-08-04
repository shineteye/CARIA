const express = require("express");
const { sendMessage } = require("../controllers/chatController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/message", requireAuth, sendMessage);

module.exports = router;
