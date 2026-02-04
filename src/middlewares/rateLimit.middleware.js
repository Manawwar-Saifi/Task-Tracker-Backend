// src/middlewares/rateLimit.middleware.js

import rateLimit from "express-rate-limit";
import AppError from "../utils/AppError.js";

/**
 * Global rate limiter
 * Protects APIs from abuse & brute-force attacks
 */
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per IP per window
  standardHeaders: true, // return rate limit info in headers
  legacyHeaders: false,

  /**
   * Custom handler for rate limit exceeded
   */
  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many requests from this IP. Please try again later.",
        429
      )
    );
  },
});

export default rateLimitMiddleware;
