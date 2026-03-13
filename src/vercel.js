// src/vercel.js - Vercel Serverless Entry Point

// Load environment variables (for local development)
// In Vercel, env vars are injected automatically
import dotenv from "dotenv";
dotenv.config();

import app from "../app.js";
import connectDB from "./config/db.js";

/**
 * Vercel Serverless Handler
 * Handles database connection and routes requests to Express app
 */
export default async function handler(req, res) {
  try {
    // Connect to MongoDB (uses cached connection if available)
    await connectDB();

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error.message);

    // Return appropriate error response
    const statusCode = error.message.includes("MONGO_URI") ? 500 : 503;

    return res.status(statusCode).json({
      success: false,
      error: "Server initialization failed",
      message:
        process.env.NODE_ENV === "production"
          ? "Service temporarily unavailable"
          : error.message,
    });
  }
}
