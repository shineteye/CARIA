require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

let chatRoutes, sessionRoutes, errorHandler;
try { chatRoutes = require("./routes/chat"); } catch(e) { console.error("LOAD ERROR chat routes:", e); }
try { sessionRoutes = require("./routes/session"); } catch(e) { console.error("LOAD ERROR session routes:", e); }
try { errorHandler = require("./middleware/errorHandler"); } catch(e) { console.error("LOAD ERROR errorHandler:", e); }

const app = express();
const PORT = process.env.PORT || 5000;

// Connect before each request in serverless; cached after first connect
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.use(
  cors({
    origin: true, // This allows requests from any origin dynamically
  }),
);
app.use(express.json());

if (chatRoutes) app.use("/api/chat", chatRoutes);
if (sessionRoutes) app.use("/api/session", sessionRoutes);

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
