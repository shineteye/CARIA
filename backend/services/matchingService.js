const fs = require("fs");
const path = require("path");

function loadJSON(filename) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data", filename), "utf8"),
  );
}

let CAREER_CATALOG = null;

/** Merge jhs_data.json (pathway detail) with career_outcomes.json (salary/cost/demand/tags) by career_id */
function buildCareerCatalog() {
  if (CAREER_CATALOG) return CAREER_CATALOG;

  const pathways = loadJSON("jhs_data.json");
  const outcomes = loadJSON("career_outcomes.json");
  const outcomeById = new Map(outcomes.map((o) => [o.career_id, o]));

  CAREER_CATALOG = pathways.map((p) => {
    const outcome = outcomeById.get(p.career_id) || {};
    return {
      careerId: p.career_id,
      title: p.title,
      tags: outcome.tags || [],
      salaryEntry: outcome.salary_entry ?? null,
      salaryMid: outcome.salary_mid ?? null,
      tuitionTier: outcome.tuition_tier || "medium",
      demand: outcome.demand || "medium",
      pathway: p.primary_pathway || {},
      alternativePathways: p.alternative_pathways || [],
    };
  });

  return CAREER_CATALOG;
}

const DEMAND_SCORE = { high: 1, medium: 0.6, low: 0.3 };
const TUITION_BURDEN = { low: 0, medium: 0.5, high: 1 };

const FINANCE_TOLERANCE = {
  // higher = more tolerant of high-tuition-tier programmes
  can_private: 1,
  public_boarding: 0.65,
  public_day: 0.5,
  tight: 0.2,
  prefer_not: 0.5,
};

/** Profiles store the option label, not the id — match either. */
function financeTolerance(value) {
  const s = String(value || "").toLowerCase();
  if (!s) return FINANCE_TOLERANCE.prefer_not;
  if (FINANCE_TOLERANCE[s] !== undefined) return FINANCE_TOLERANCE[s];
  if (/private|boarding is possible/.test(s)) return FINANCE_TOLERANCE.can_private;
  if (/public boarding/.test(s)) return FINANCE_TOLERANCE.public_boarding;
  if (/real concern|tight|struggl|difficult|cannot afford/.test(s))
    return FINANCE_TOLERANCE.tight;
  if (/public day/.test(s)) return FINANCE_TOLERANCE.public_day;
  return FINANCE_TOLERANCE.prefer_not;
}

/** Motivation is likewise stored as a label ("Passion / enjoyment"). */
function normalizeMotivation(value) {
  const s = String(value || "").toLowerCase();
  if (MOTIVATION_WEIGHTS[s]) return s;
  if (/passion|enjoy|love/.test(s)) return "passion";
  if (/pay|salary|money|stab/.test(s)) return "salary";
  if (/prestige|respect|status/.test(s)) return "prestige";
  if (/help|impact|people|serve/.test(s)) return "impact";
  if (/skill/.test(s)) return "skills";
  return "balance";
}

const MOTIVATION_WEIGHTS = {
  // { fit weight, money weight } — must sum to 1
  passion: { fit: 0.8, money: 0.2 },
  impact: { fit: 0.75, money: 0.25 },
  skills: { fit: 0.7, money: 0.3 },
  salary: { fit: 0.25, money: 0.75 },
  prestige: { fit: 0.4, money: 0.6 },
  balance: { fit: 0.5, money: 0.5 },
};

function getWeights(motivation) {
  return MOTIVATION_WEIGHTS[normalizeMotivation(motivation)];
}

/**
 * Affordability applies to the COMBINED score, not just the money axis.
 * Without this, a passion/impact-driven student on a tight budget gets an
 * unaffordable path ranked #1 purely on interest fit — the opposite of useful.
 * Kept as a dampener rather than a filter: the path stays visible (scholarships,
 * changed circumstances), it just can't outrank a reachable one on interest alone.
 */
function affordabilityFactor(profile, career) {
  const tolerance = financeTolerance(profile.financialSituation);
  const burden = TUITION_BURDEN[career.tuitionTier] ?? 0.5;
  const strain = burden * (1 - tolerance); // 0 = comfortable, 1 = far out of reach
  return 1 - strain * 0.35;
}

/**
 * Onboarding stores the human-readable option label ("Computers / tech"), not the
 * option id ("tech"), and a student may also type free text. Map whatever we get
 * onto the tag vocabulary used by career_outcomes.json, so fit scoring actually
 * works on real stored profiles.
 */
const TAG_PATTERNS = [
  [/comput|tech|ict|software|program|coding|digital/i, "tech"],
  [/health|medic|nurs|doctor|care|patient|pharm/i, "health"],
  [/build|construct|engineer|making|mechanic|design.*product/i, "building"],
  [/business|money|finance|account|market|entrepreneur|trade|econom/i, "business"],
  [/teach|mentor|train|educat|coach/i, "teaching"],
  [/law|justice|right|advocacy|govern|polic/i, "justice"],
  [/art|media|creative|design|music|film|photo|fashion|writ/i, "creative_work"],
  [/hands|practical|vocational|craft|technical|repair|trade skill/i, "practical"],
  [/science|biology|chemistry|physics|math|research|lab/i, "science"],
];

function toTags(values) {
  const tags = new Set();
  for (const raw of values || []) {
    const s = String(raw);
    for (const [pattern, tag] of TAG_PATTERNS) {
      if (pattern.test(s)) tags.add(tag);
    }
    // An exact tag id (from tests or an API caller) still counts.
    const lower = s.toLowerCase().trim();
    if (TAG_PATTERNS.some(([, t]) => t === lower)) tags.add(lower);
  }
  return tags;
}

/** Fit score 0-1: overlap between student interests/strengths and a career's tags */
function fitScore(profile, career) {
  const studentTags = toTags([
    ...(profile.interests || []),
    ...(profile.strengths || []),
  ]);
  if (!studentTags.size || !career.tags.length) return 0.4; // neutral default, no signal either side

  const matches = career.tags.filter((t) => studentTags.has(t)).length;
  return Math.min(1, matches / career.tags.length + (matches > 0 ? 0.2 : 0));
}

/** Money score 0-1: normalized earning potential, penalized if it needs tuition the family can't sustain */
function moneyScore(profile, career) {
  const maxSalary = 25000; // ceiling seen in career_outcomes.json, for normalization
  const earningPotential = Math.min(1, (career.salaryMid || 0) / maxSalary);
  const demandBoost = DEMAND_SCORE[career.demand] ?? 0.6;

  const tolerance = financeTolerance(profile.financialSituation);
  const burden = TUITION_BURDEN[career.tuitionTier] ?? 0.5;
  // Mismatch: high burden + low tolerance drags the score down
  const affordabilityPenalty = burden * (1 - tolerance);

  const raw = earningPotential * 0.6 + demandBoost * 0.4 - affordabilityPenalty * 0.5;
  return Math.max(0, Math.min(1, raw));
}

function formatSalaryRange(career) {
  if (!career.salaryEntry || !career.salaryMid) return "Not enough data";
  return `GHS ${career.salaryEntry.toLocaleString()} – ${career.salaryMid.toLocaleString()}/month`;
}

/**
 * Score every career in the catalog against a student profile, weighted by
 * the student's stated motivation (passion vs money vs balance).
 */
function scoreCareers(profile) {
  const catalog = buildCareerCatalog();
  const weights = getWeights(profile.motivation);

  return catalog
    .map((career) => {
      const fit = fitScore(profile, career);
      const money = moneyScore(profile, career);
      const overall =
        (fit * weights.fit + money * weights.money) *
        affordabilityFactor(profile, career);

      return {
        careerId: career.careerId,
        title: career.title,
        overallScore: Math.round(overall * 100),
        fitScore: Math.round(fit * 100),
        moneyScore: Math.round(money * 100),
        salaryRange: formatSalaryRange(career),
        demand: career.demand,
        tuitionTier: career.tuitionTier,
        // Drives the Explore page's category filter — deriving a category from
        // the SHS stream text mis-files careers (a teacher whose stream is
        // "any subject" fell into Engineering & Tech).
        tags: career.tags,
        shsStream: career.pathway.recommended_shs_stream || null,
        beceTarget: career.pathway.ideal_bece_aggregate || null,
        shsCategories: career.pathway.target_shs_categories || [],
        electives: career.pathway.required_wassce_electives || [],
        universities: (career.pathway.university_pathways || []).map((u) => ({
          institution: u.institution,
          program: u.program,
          cutoff: u.typical_cutoff_aggregate,
        })),
        alternatives: (career.alternativePathways || []).map((a) => ({
          condition: a.condition,
          stream: a.recommended_shs_stream,
          rationale: a.rationale,
          careers: a.possible_careers || [],
        })),
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore);
}

/** limit = 0 (or falsy) returns the whole ranked catalogue. */
function getRecommendations(profile, limit = 10) {
  const scored = scoreCareers(profile);
  return limit > 0 ? scored.slice(0, limit) : scored;
}

function compareCareers(careerIds, profile) {
  const scored = scoreCareers(profile);
  const byId = new Map(scored.map((c) => [c.careerId, c]));
  return careerIds.map((id) => byId.get(id)).filter(Boolean);
}

module.exports = {
  buildCareerCatalog,
  getRecommendations,
  compareCareers,
  scoreCareers,
};
