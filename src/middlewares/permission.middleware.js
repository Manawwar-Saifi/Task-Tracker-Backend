import AppError from "../utils/AppError.js";

/**
 * Permission Middleware (RBAC)
 * @param {String} requiredPermission
 */
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(
        new AppError("User context missing", 401)
      );
    }

    // 1️⃣ Super Admin bypass
    if (user.isSuperAdmin) {
      return next();
    }

    // 2️⃣ Check permission array
    const hasPermission =
      Array.isArray(user.permissions) &&
      user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403
        )
      );
    }

    next();
  };
};

export default permissionMiddleware;
