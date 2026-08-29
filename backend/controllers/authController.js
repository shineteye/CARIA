const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Session = require("../models/Session");
const { signToken, publicUser } = require("../middleware/auth");
const { emptyProfile, deriveCareerGoal } = require("../services/onboardingService");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function plainProfile(profile) {
  if (!profile) return null;
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  if (obj.freeNotes instanceof Map) obj.freeNotes = Object.fromEntries(obj.freeNotes);
  return obj;
}

/**
 * Attach an anonymous onboarding session to a newly authenticated user, so the
 * answers they gave before signing up carry over instead of being lost.
 * Returns the claimed session, or null if there was nothing to claim.
 */
async function claimGuestSession(sessionId, user) {
  if (!sessionId) return null;

  const session = await Session.findOne({ sessionId, userId: null });
  if (!session) return null; // already claimed, or never existed

  session.userId = user._id;
  await session.save();

  const profile = plainProfile(session.profile);
  const hasAnswers =
    profile &&
    Object.values(profile).some((v) =>
      Array.isArray(v) ? v.length : v && typeof v !== "object",
    );

  if (hasAnswers) {
    user.profile = profile;
    user.markModified("profile");
    user.region = profile.region || user.region;
    user.careerGoal = session.careerGoal || deriveCareerGoal(profile);
  }
  user.activeSessionId = session.sessionId;
  await user.save();

  return session;
}

exports.register = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Please enter your name (at least 2 characters)." });
    }
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists. Try logging in." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      profile: emptyProfile(),
    });

    const claimed = await claimGuestSession(req.body.sessionId, user);

    const token = signToken(user);
    res.status(201).json({
      token,
      user: publicUser(user),
      sessionId: claimed?.sessionId || null,
      claimedOnboarding: !!claimed,
      message: claimed
        ? "Your answers are saved. Building your guide now…"
        : "Welcome to Caria — let's build your path.",
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    // A guest who turns out to already have an account keeps the answers they
    // just gave — this run is more recent than whatever the account held.
    const claimed = await claimGuestSession(req.body.sessionId, user);

    const token = signToken(user);
    res.json({
      token,
      user: publicUser(user),
      sessionId: claimed?.sessionId || null,
      claimedOnboarding: !!claimed,
      message: claimed
        ? `Welcome back, ${user.name.split(" ")[0]} — your new answers are saved.`
        : `Welcome back, ${user.name.split(" ")[0]}.`,
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  // JWT is client-held; client clears token. Endpoint exists for symmetry / future revoke list.
  res.json({ ok: true, message: "Logged out." });
};
