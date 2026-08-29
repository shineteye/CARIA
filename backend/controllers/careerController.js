const {
  getRecommendations,
  compareCareers,
  scoreCareers,
} = require("../services/matchingService");

function publicProfile(profile) {
  if (!profile) return {};
  return profile.toObject ? profile.toObject() : { ...profile };
}

exports.getRecommendations = async (req, res, next) => {
  try {
    const profile = publicProfile(req.user.profile);
    // The Explore page is a browsable directory, not a top-10 list — return the
    // whole catalogue ranked, and let the client page through it.
    const recommendations = getRecommendations(profile, Number(req.query.limit) || 0);
    res.json({ profile, recommendations, total: recommendations.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Every career, ranked neutrally. Lets a logged-out visitor browse the real
 * catalogue instead of a hardcoded sample.
 */
exports.listCareers = async (req, res, next) => {
  try {
    const careers = scoreCareers({});
    res.json({ careers, total: careers.length, personalized: false });
  } catch (error) {
    next(error);
  }
};

exports.compareCareers = async (req, res, next) => {
  try {
    const { careerIds } = req.body;
    if (!Array.isArray(careerIds) || !careerIds.length) {
      return res.status(400).json({ error: "careerIds array is required" });
    }
    const profile = publicProfile(req.user.profile);
    const comparison = compareCareers(careerIds, profile);
    res.json({ profile, comparison });
  } catch (error) {
    next(error);
  }
};
