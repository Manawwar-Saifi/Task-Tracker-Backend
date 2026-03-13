// src/utils/logger.js

import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * Check if running in production (Vercel has read-only filesystem)
 */
const isProduction = process.env.NODE_ENV === "production";

/**
 * Base transports - always use console
 */
const transports = [
  new winston.transports.Console({
    format: combine(colorize(), logFormat),
  }),
];

/**
 * Exception handlers
 */
const exceptionHandlers = [
  new winston.transports.Console({
    format: combine(colorize(), logFormat),
  }),
];

/**
 * Add file transports only in development (not on Vercel/serverless)
 */
if (!isProduction) {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    })
  );

  exceptionHandlers.push(
    new winston.transports.File({
      filename: "logs/exceptions.log",
    })
  );
}

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: isProduction ? "warn" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports,
  exceptionHandlers,
});

/**
 * Handle unhandled promise rejections logging
 * Only add file handler in development
 */
if (!isProduction) {
  logger.rejections.handle(
    new winston.transports.File({
      filename: "logs/rejections.log",
    })
  );
} else {
  logger.rejections.handle(
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    })
  );
}

export default logger;
