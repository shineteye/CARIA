const express = require("express");
const {
  getRecommendations,
  compareCareers,
  listCareers,
} = require("../controllers/careerController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public directory — lets logged-out visitors browse the real catalogue.
router.get("/", listCareers);

router.get("/recommendations", requireAuth, getRecommendations);
router.post("/compare", requireAuth, compareCareers);

module.exports = router;
