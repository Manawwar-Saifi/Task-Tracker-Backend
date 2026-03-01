// src/config/db.js

import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Connect to MongoDB
 * This function is called once from server.js
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,          // good for development (disable in heavy prod if needed)
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(
      `MongoDB Connected: ${conn.connection.host}`
    );
  } catch (error) {
    logger.error("MongoDB connection failed", error);
    // Throw error so server.js can handle shutdown
    throw error;
  }
};

export default connectDB;
