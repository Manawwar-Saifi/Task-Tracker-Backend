// src/config/db.js

import mongoose from "mongoose";
import dns from "dns";
import logger from "../utils/logger.js";

// Use Google DNS for SRV record resolution (fixes router DNS issues with MongoDB Atlas)
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

/**
 * Cached connection for serverless environments (Vercel)
 * This prevents creating new connections on every invocation
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Validate MongoDB URI format
 */
const validateMongoURI = (uri) => {
  if (!uri) {
    throw new Error(
      "MONGO_URI environment variable is not set. " +
        "Please add MONGO_URI to your Vercel environment variables."
    );
  }

  if (typeof uri !== "string") {
    throw new Error("MONGO_URI must be a string.");
  }

  const trimmedUri = uri.trim();

  if (!trimmedUri.startsWith("mongodb://") && !trimmedUri.startsWith("mongodb+srv://")) {
    throw new Error(
      `Invalid MONGO_URI format. Expected connection string to start with "mongodb://" or "mongodb+srv://". ` +
        `Received: "${trimmedUri.substring(0, 20)}...". ` +
        `Please check your Vercel environment variables.`
    );
  }

  return trimmedUri;
};

/**
 * Connect to MongoDB with connection caching for serverless
 * This function handles both traditional server and serverless environments
 */
const connectDB = async () => {
  // Validate MONGO_URI
  const mongoUri = validateMongoURI(process.env.MONGO_URI);

  // If already connected, return cached connection
  if (cached.conn) {
    logger.info("Using cached MongoDB connection");
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering for serverless
      maxPoolSize: 10, // Limit connections for serverless
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    logger.info("Creating new MongoDB connection...");

    cached.promise = mongoose
      .connect(mongoUri, opts)
      .then((mongoose) => {
        logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
        return mongoose;
      })
      .catch((error) => {
        // Clear the promise so next invocation can retry
        cached.promise = null;
        logger.error("MongoDB connection failed:", error.message);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

export default connectDB;
