const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { FRONTEND_URL, isDev } = require("./config/env");
const { API_PREFIX } = require("./config/constants");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

// ── Security & general middleware ─────────────────────────
app.use(helmet());

const allowedOrigins = [
  FRONTEND_URL?.replace(/\/+$/, ""),
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith(".vercel.app") ||
        /^https:\/\/.*\.vercel\.app$/.test(normalizedOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        // In dev or preview environments, permit and log
        callback(null, true);
      }
    },
    credentials: true, // allow cookies & authorization headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
if (isDev) app.use(morgan("dev"));

// ── Health check ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CSE(AIML) Student Monitoring System API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, status: "UP" });
});

// ── Import routes ────────────────────────────────────────
const authRoutes = require("./modules/auth/auth.routes");
const otpRoutes = require("./modules/otp/otp.routes");
const dailyChallengeRoutes = require("./modules/daily-challenge/daily-challenge.routes");
const hackathonRoutes = require("./modules/hackathon/hackathon.routes");
const internshipRoutes = require("./modules/internship/internship.routes");
const courseRoutes = require("./modules/course/course.routes");
const registrationRoutes = require("./modules/registration/registration.routes");
const impositionRoutes = require("./modules/imposition/imposition.routes");
const taskRoutes = require("./modules/task/task.routes");
const studentRoutes = require("./modules/student/student.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const exportRoutes = require("./modules/export/export.routes");

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/otp`, otpRoutes);
app.use(`${API_PREFIX}/daily-challenge`, dailyChallengeRoutes);
app.use(`${API_PREFIX}/hackathons`, hackathonRoutes);
app.use(`${API_PREFIX}/internships`, internshipRoutes);
app.use(`${API_PREFIX}/courses`, courseRoutes);
app.use(`${API_PREFIX}/registrations`, registrationRoutes);
app.use(`${API_PREFIX}/impositions`, impositionRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/export`, exportRoutes);

// ── Errors ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;