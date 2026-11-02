require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

let chatRoutes,
  sessionRoutes,
  onboardingRoutes,
  authRoutes,
  profileRoutes,
  careerRoutes,
  schoolRoutes,
  errorHandler;
try {
  chatRoutes = require("./routes/chat");
} catch (e) {
  console.error("LOAD ERROR chat routes:", e);
}
try {
  onboardingRoutes = require("./routes/onboarding");
} catch (e) {
  console.error("LOAD ERROR onboarding routes:", e);
}
try {
  sessionRoutes = require("./routes/session");
} catch (e) {
  console.error("LOAD ERROR session routes:", e);
}
try {
  authRoutes = require("./routes/auth");
} catch (e) {
  console.error("LOAD ERROR auth routes:", e);
}
try {
  profileRoutes = require("./routes/profile");
} catch (e) {
  console.error("LOAD ERROR profile routes:", e);
}
try {
  careerRoutes = require("./routes/career");
} catch (e) {
  console.error("LOAD ERROR career routes:", e);
}
try {
  schoolRoutes = require("./routes/school");
} catch (e) {
  console.error("LOAD ERROR school routes:", e);
}
try {
  errorHandler = require("./middleware/errorHandler");
} catch (e) {
  console.error("LOAD ERROR errorHandler:", e);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect before each request in serverless; cached after first connect
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB middleware error:", err.name, "|", err.message);
    res.status(503).json({
      error: "Database unavailable",
      // Surfaced outside production so connection problems are diagnosable.
      ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
    });
  }
});

app.use(
  cors({
    origin: true,
  }),
);
app.use(express.json());

if (authRoutes) app.use("/api/auth", authRoutes);
if (profileRoutes) app.use("/api/profile", profileRoutes);
if (chatRoutes) app.use("/api/chat", chatRoutes);
if (sessionRoutes) app.use("/api/session", sessionRoutes);
if (onboardingRoutes) app.use("/api/onboarding", onboardingRoutes);
if (careerRoutes) app.use("/api/careers", careerRoutes);
if (schoolRoutes) app.use("/api/schools", schoolRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

if (errorHandler) app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
