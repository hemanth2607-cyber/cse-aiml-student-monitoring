const { createServer } = require("http");
const { PORT, NODE_ENV, DATABASE_URL } = require("./config/env");
const prisma = require("./lib/prisma");
const app = require("./app");

// We'll test DB connectivity and start HTTP server
const server = createServer(app);

let isShuttingDown = false;

const shutdownGracefully = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${signal} received – shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected. Goodbye 👋");
    process.exit(0);
  });

  // Force-exit after 10s if connections kept alive
  setTimeout(() => {
    console.error("Forced exit after timeout.");
    process.exit(1);
  }, 10_000).unref();
};

const start = async () => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`📚 API base: http://localhost:${PORT}/api/v1`);
  });

  try {
    // Verify DB connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("⚠️ Database connection failed (check your Supabase project status or DATABASE_URL):", err.message || err);
  }
};

// Handle shutdown signals
process.on("SIGINT", () => shutdownGracefully("SIGINT"));
process.on("SIGTERM", () => shutdownGracefully("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdownGracefully("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// Make `server` available for tests (optional)
if (process.env.NODE_ENV !== "test") {
  start();
}

module.exports = { app, server, start, prisma };