import AppError from "../utils/AppError.js";

/**
 * Global Error Handling Middleware
 * This must be the LAST middleware
 */
const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Default values
  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal Server Error";

  /* -------------------- MONGOOSE ERRORS -------------------- */

  // Invalid MongoDB ObjectId
  if (error.name === "CastError") {
    error = new AppError("Invalid ID format", 400);
  }

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    error = new AppError(
      `Duplicate value for field: ${field}`,
      409
    );
  }

  // Validation errors
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map(
      (err) => err.message
    );
    error = new AppError(messages.join(", "), 400);
  }

  /* -------------------- JWT ERRORS -------------------- */

  if (error.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please login again.", 401);
  }

  if (error.name === "TokenExpiredError") {
    error = new AppError("Token expired. Please login again.", 401);
  }

  /* -------------------- FINAL RESPONSE -------------------- */

  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message,
  });
};

export default errorMiddleware;
