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
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    // Console logs
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),

    // Error logs
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    // Combined logs
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
    }),
  ],
});

/**
 * Handle unhandled promise rejections logging
 */
logger.rejections.handle(
  new winston.transports.File({
    filename: "logs/rejections.log",
  })
);

export default logger;
