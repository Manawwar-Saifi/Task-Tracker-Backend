// src/vercel.js - Vercel Serverless Entry Point

// Load environment variables (for local development)
// In Vercel, env vars are injected automatically
import dotenv from "dotenv";
dotenv.config();

import app from "../app.js";
import connectDB from "./config/db.js";

/**
 * Retry DB connection with exponential backoff
 * Handles cold start delay when Vercel serverless spins up
 */
const connectWithRetry = async (retries = 3, delayMs = 500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await connectDB();
      return; // Success
    } catch (error) {
      if (attempt === retries) throw error;

      console.warn(
        `MongoDB connection attempt ${attempt}/${retries} failed. Retrying in ${delayMs}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff: 500ms → 1000ms → 2000ms
    }
  }
};

/**
 * Vercel Serverless Handler
 * Handles database connection and routes requests to Express app
 */
export default async function handler(req, res) {
  try {
    // Connect to MongoDB with retry for cold start
    await connectWithRetry();

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error.message);

    const statusCode = error.message.includes("MONGO_URI") ? 500 : 503;

    return res.status(statusCode).json({
      success: false,
      error: "Server initialization failed",
      message:
        process.env.NODE_ENV === "production"
          ? "Service temporarily unavailable. Please try again."
          : error.message,
    });
  }
}
