import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import User from "../modules/users/model.js";

/**
 * Authentication Middleware
 * - Verifies JWT
 * - Attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("Authentication token missing", 401)
      );
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Fetch user
    const user = await User.findOne({
      _id: decoded.userId,
      isDeleted: false,
    });

    if (!user) {
      return next(
        new AppError("User no longer exists", 401)
      );
    }

    // 4️⃣ Check user status
    if (user.status !== "active") {
      return next(
        new AppError("User account is inactive", 403)
      );
    }

    // 5️⃣ Attach context to request
    req.user = user;
    req.organizationId = user.organizationId;

    next();
  } catch (error) {
    return next(error);
  }
};

export default authMiddleware;
