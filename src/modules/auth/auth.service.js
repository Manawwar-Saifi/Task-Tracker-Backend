import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../../utils/AppError.js";

/**
 * Register new user
 */
export const registerUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // TEMP response (DB will come later)
  return { email };
};

/**
 * Login user
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // TEMP token (replace after DB integration)
  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { token };
};
