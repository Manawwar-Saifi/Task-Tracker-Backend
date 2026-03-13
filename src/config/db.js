// src/config/db.js

import mongoose from "mongoose";
import dns from "dns";
import logger from "../utils/logger.js";

// Use Google DNS for SRV record resolution (fixes router DNS issues with MongoDB Atlas)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

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
