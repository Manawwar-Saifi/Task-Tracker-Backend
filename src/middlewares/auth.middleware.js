import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import User from "../modules/users/model.js";

/**
 * Authentication Middleware
 * - Verifies JWT Access Token
 * - Attaches user context to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Authentication token required", 401));
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return next(new AppError("Token expired. Please refresh.", 401));
      }
      if (error.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token", 401));
      }
      throw error;
    }

    // 3️⃣ Fetch user with role populated
    const user = await User.findOne({
      _id: decoded.userId,
      isDeleted: false,
    }).populate("roleId", "name slug level permissionCodes");

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    // 4️⃣ Check user status
    if (user.status !== "active") {
      return next(
        new AppError(`Account is ${user.status}. Contact administrator.`, 403)
      );
    }

    // 5️⃣ Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError("Password recently changed. Please login again.", 401)
      );
    }

    // 6️⃣ Attach user context to request
    req.user = {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      roleId: user.roleId?._id || null,
      roleName: user.roleId?.name || null,
      roleLevel: user.roleId?.level || 999,
      permissions: user.roleId?.permissionCodes || [],
      directPermissions: user.permissions || [],
      isSuperAdmin: user.isSuperAdmin || false,
      isOwner: user.isOwner || false,
    };

    // Shortcut for organization ID
    req.organizationId = user.organizationId;

    next();
  } catch (error) {
    return next(new AppError("Authentication failed", 401));
  }
};

/**
 * Optional authentication middleware
 * - Attaches user if token is valid
 * - Continues without error if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findOne({
      _id: decoded.userId,
      isDeleted: false,
      status: "active",
    }).populate("roleId", "name slug level permissionCodes");

    if (user) {
      req.user = {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        roleId: user.roleId?._id || null,
        roleName: user.roleId?.name || null,
        roleLevel: user.roleId?.level || 999,
        permissions: user.roleId?.permissionCodes || [],
        directPermissions: user.permissions || [],
        isSuperAdmin: user.isSuperAdmin || false,
        isOwner: user.isOwner || false,
      };
      req.organizationId = user.organizationId;
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
};

/**
 * Require owner or super admin
 */
export const requireOwner = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (!req.user.isOwner && !req.user.isSuperAdmin) {
    return next(new AppError("Owner access required", 403));
  }

  next();
};

/**
 * Require super admin
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (!req.user.isSuperAdmin) {
    return next(new AppError("Super admin access required", 403));
  }

  next();
};

export default authMiddleware;
