const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getJwtSecret() {
  return process.env.JWT_SECRET || "caria-dev-secret-change-me";
}

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    getJwtSecret(),
    { expiresIn: "30d" },
  );
}

function publicUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  if (obj.profile?.freeNotes instanceof Map) {
    obj.profile.freeNotes = Object.fromEntries(obj.profile.freeNotes);
  }
  return {
    id: obj._id?.toString?.() || obj.id,
    name: obj.name,
    email: obj.email,
    profile: obj.profile || {},
    careerGoal: obj.careerGoal || null,
    region: obj.region || null,
    guideGenerated: !!obj.guideGenerated,
    activeSessionId: obj.activeSessionId || null,
    createdAt: obj.createdAt,
  };
}

/** Required auth — 401 if missing/invalid */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Please log in to continue." });
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "Account not found. Please log in again." });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    next(err);
  }
}

/** Optional auth — attaches user if token present */
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();

    try {
      const payload = jwt.verify(token, getJwtSecret());
      const user = await User.findById(payload.userId);
      if (user) {
        req.user = user;
        req.userId = user._id.toString();
      }
    } catch {
      /* ignore invalid token for optional */
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signToken,
  publicUser,
  requireAuth,
  optionalAuth,
  getJwtSecret,
};
