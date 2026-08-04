const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, publicUser } = require("../middleware/auth");
const { emptyProfile } = require("../services/onboardingService");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

    const token = signToken(user);
    res.status(201).json({
      token,
      user: publicUser(user),
      message: "Welcome to Caria — let's build your path.",
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

    const token = signToken(user);
    res.json({
      token,
      user: publicUser(user),
      message: `Welcome back, ${user.name.split(" ")[0]}.`,
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
