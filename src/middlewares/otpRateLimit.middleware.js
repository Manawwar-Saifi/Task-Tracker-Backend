/**
 * OTP Rate Limiting Middleware
 * Stricter rate limits for OTP-related endpoints
 */

import rateLimit from "express-rate-limit";
import AppError from "../utils/AppError.js";

/**
 * Rate limiter for sending OTP
 * 5 requests per IP per 15 minutes
 */
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP send requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination for more granular control
    const email = req.body?.email?.toLowerCase() || "unknown";
    return `${req.ip}-${email}`;
  },
  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many OTP requests. Please try again in 15 minutes.",
        429
      )
    );
  },
});

/**
 * Rate limiter for verifying OTP
 * 10 verification attempts per IP per 15 minutes
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many verification attempts. Please try again later.",
        429
      )
    );
  },
});

export default {
  otpSendLimiter,
  otpVerifyLimiter,
};
