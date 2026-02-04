/**
 * Custom Application Error Class
 * Used for all expected (operational) errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Removes constructor from stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
