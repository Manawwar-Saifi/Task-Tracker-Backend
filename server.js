// Load environment variables FIRST (before any other imports)
import dotenv from "dotenv";
dotenv.config();
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]);
// Now import modules that depend on env vars
import app from "./app.js";
import connectDB from "./src/config/db.js";
import logger from "./src/utils/logger.js";
import { initSocket } from "./src/socket/index.js";

/* -------------------- DATABASE -------------------- */

connectDB();

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

/* -------------------- SOCKET.IO -------------------- */

// Initialize Socket.io for real-time communication
initSocket(server);

/* -------------------- PROCESS-LEVEL ERROR HANDLING -------------------- */

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION:", err);
  server.close(() => process.exit(1));
});

// Uncaught exceptions (sync errors)
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});
