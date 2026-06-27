require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chat");
const sessionRoutes = require("./routes/session");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow any localhost origin (Vite picks the next free port)
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin))
        return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());

app.use("/api/chat", chatRoutes);
app.use("/api/session", sessionRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
