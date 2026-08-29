const fs = require("fs");
const path = require("path");

let SCHOOLS = null;
let PLACEMENT_NOTES = null;

function loadJSON(filename) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data", filename), "utf8"),
  );
}

function getSchools() {
  if (!SCHOOLS) SCHOOLS = loadJSON("ghana_shs.json");
  return SCHOOLS;
}

function getNotes() {
  if (!PLACEMENT_NOTES) PLACEMENT_NOTES = loadJSON("shs_placement_notes.json");
  return PLACEMENT_NOTES;
}

const norm = (v) => String(v || "").toLowerCase().trim();

exports.listSchools = async (req, res, next) => {
  try {
    const { region, category, track, gender, q, limit } = req.query;
    let results = getSchools();

    if (region) {
      const r = norm(region);
      results = results.filter((s) => norm(s.region).includes(r));
    }
    if (category) {
      const cats = String(category).toUpperCase().split(",").map((c) => c.trim());
      results = results.filter((s) => cats.includes(s.category));
    }
    if (track) {
      const t = norm(track);
      results = results.filter((s) =>
        (s.academic_tracks || []).some((x) => norm(x).includes(t)),
      );
    }
    if (gender) {
      const g = norm(gender);
      results = results.filter((s) => norm(s.gender) === g);
    }
    if (q) {
      const term = norm(q);
      results = results.filter(
        (s) => norm(s.school_name).includes(term) || norm(s.location).includes(term),
      );
    }

    const capped = results.slice(0, Math.min(Number(limit) || 100, 300));

    res.json({
      total: results.length,
      returned: capped.length,
      schools: capped,
      // Always travels with the data so no caller can present categories as cut-offs.
      placementNote: getNotes().headline,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlacementNotes = async (req, res, next) => {
  try {
    res.json(getNotes());
  } catch (error) {
    next(error);
  }
};

exports.getFilters = async (req, res, next) => {
  try {
    const schools = getSchools();
    const uniq = (fn) => [...new Set(schools.flatMap(fn).filter(Boolean))].sort();
    res.json({
      regions: uniq((s) => [s.region]),
      categories: uniq((s) => [s.category]),
      tracks: uniq((s) => s.academic_tracks || []),
      genders: uniq((s) => [s.gender]),
      total: schools.length,
    });
  } catch (error) {
    next(error);
  }
};
