const express = require("express");
const {
  listSchools,
  getPlacementNotes,
  getFilters,
} = require("../controllers/schoolController");

const router = express.Router();

// Public — school data is reference information, not personal to a user.
router.get("/", listSchools);
router.get("/filters", getFilters);
router.get("/placement-notes", getPlacementNotes);

module.exports = router;
