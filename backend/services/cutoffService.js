const fs = require("fs");
const path = require("path");

/**
 * The one source of university cut-off figures. Everything the student sees —
 * advisor replies, the guidance plan, the Explore directory — goes through
 * here, so a number is either in a published cut-off file or it is not shown.
 */

function loadJSON(filename) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data", filename), "utf8"),
  );
}

let UNIVERSITIES = null;

function shortUniName(name) {
  const abbr = /\(([A-Z]{2,})\)/.exec(name || "");
  return abbr ? abbr[1] : String(name || "").trim();
}

/** [{ label, data }] for every university we hold published cut-offs for. */
function getUniversities() {
  if (UNIVERSITIES) return UNIVERSITIES;
  const ug = loadJSON("university_of_ghana_cutoff_points_2026.json");
  const ucc = loadJSON("ucc_cut_off_points_2026.json");
  // Holds KNUST, UPSA and UDS too. Its UG rows match the 2026 file, so UG comes
  // from the dedicated file and only the other three are taken from here.
  const others = loadJSON("ghana_universities_cutoff_data.json").filter(
    (u) => !/university of ghana/i.test(u.university_name),
  );
  UNIVERSITIES = [
    { label: "UG Legon", data: ug },
    { label: "UCC", data: ucc },
    ...others.map((u) => ({ label: shortUniName(u.university_name), data: u })),
  ];
  return UNIVERSITIES;
}

function normaliseProgramme(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(bsc|ba|bed|btech|llb)\b\.?/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

/** Maps the loose institution names used in jhs_data onto the cut-off files. */
function universityFor(institution) {
  const n = String(institution || "").toLowerCase();
  const universities = getUniversities();
  const byLabel = (label) => universities.find((u) => u.label === label);
  if (n.includes("knust") || n.includes("kwame")) return byLabel("KNUST");
  if (n.includes("cape coast") || n.includes("ucc")) return byLabel("UCC");
  if (n.includes("ghana") || /\bug\b/.test(n)) return byLabel("UG Legon");
  if (n.includes("upsa") || n.includes("professional studies")) return byLabel("UPSA");
  if (n.includes("uds") || n.includes("development studies")) return byLabel("UDS");
  return null;
}

/**
 * A cut-off only counts if it is in one of the published cut-off files. The
 * "typical_cutoff_aggregate" values in jhs_data are estimates — UG Civil
 * Engineering, for one, is listed there but UG does not offer it.
 */
function verifiedCutoff(institution, programme) {
  const uni = universityFor(institution);
  if (!uni) return null;
  const wanted = normaliseProgramme(programme);
  const hit = (uni.data.faculties_and_programs || [])
    .flatMap((f) => f.programs || [])
    .find((p) => normaliseProgramme(p.name) === wanted);
  return hit ? { uni: uni.label, cutoff: hit.cut_off_point } : null;
}

module.exports = {
  getUniversities,
  normaliseProgramme,
  universityFor,
  verifiedCutoff,
};
