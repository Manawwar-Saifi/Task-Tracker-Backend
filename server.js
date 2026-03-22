import dns from "node:dns/promises";
dns.setServers(["0.0.0.0","1.1.1.1","8.8.8.8","1.0.0.0"]);

// Load environment variables FIRST (before any other imports)
import dotenv from "dotenv";
dotenv.config();

// Now import modules that depend on env vars
import app from "./app.js";
import connectDB from "./src/config/db.js";
import logger from "./src/utils/logger.js";
import { initSocket } from "./src/socket/index.js";

/* -------------------- PROCESS-LEVEL ERROR HANDLING -------------------- */

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});

// Uncaught exceptions (sync errors)
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

/* -------------------- START SERVER -------------------- */

const startServer = async () => {
  // Connect to DB first, then start server
  await connectDB();

  const PORT = process.env.PORT || 8000;
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Initialize Socket.io for real-time communication
  initSocket(server);
};

startServer();
