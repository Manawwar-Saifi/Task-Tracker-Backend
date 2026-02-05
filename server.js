import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import logger from "./src/utils/logger.js";

dotenv.config();

/* -------------------- DATABASE -------------------- */

connectDB();

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

/* -------------------- PROCESS-LEVEL ERROR HANDLING -------------------- */

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION 💥", err);
  server.close(() => process.exit(1));
});

// Uncaught exceptions (sync errors)
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION 💥", err);
  process.exit(1);
});
