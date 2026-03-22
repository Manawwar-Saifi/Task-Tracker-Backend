/**
 * Environment Configuration
 * Centralized env validation and export
 *
 * Flow: dotenv loads .env → validate required vars → export config object
 */
import dotenv from "dotenv";
dotenv.config();

// Required environment variables (critical — server cannot work without these)
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

// Validate required vars — warn loudly but don't throw at module level
// (throwing here crashes Vercel serverless before the handler can catch it)
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0 && process.env.NODE_ENV !== "test") {
  console.error(
    `[ENV] FATAL: Missing required env variables: ${missingVars.join(", ")}. ` +
    `Set these in your Vercel Dashboard → Settings → Environment Variables.`
  );
}

/**
 * Centralized environment configuration
 * Import this instead of accessing process.env directly
 */
export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // JWT Configuration
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",

  // Cloudinary (File Storage)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Razorpay (Payments)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@tasktracker.com",

  // Redis (optional - for caching/sessions)
  REDIS_URL: process.env.REDIS_URL,

  // Helper flags
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
};

export default env;
