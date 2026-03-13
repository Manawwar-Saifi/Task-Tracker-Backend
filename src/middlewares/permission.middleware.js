import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

/**
 * Permission Middleware (RBAC)
 * Checks if user has required permission from role or direct assignments
 *
 * @param {String|String[]} requiredPermission - Permission code(s) required
 * @param {Object} options - Additional options
 * @param {Boolean} options.requireAll - If true, user must have ALL permissions (default: false = any)
 */
const permissionMiddleware = (requiredPermission, options = {}) => {
  const { requireAll = false } = options;

  return (req, res, next) => {
    const user = req.user;

    // Debug logging with console.log for visibility
    console.log(`\n[PERMISSION] ===== CHECK =====`);
    console.log(`[PERMISSION] Route: ${req.method} ${req.path}`);
    console.log(`[PERMISSION] Required: ${JSON.stringify(requiredPermission)}`);
    console.log(`[PERMISSION] User: ${user?.email || 'none'}`);
    console.log(`[PERMISSION] isOwner: ${user?.isOwner} (type: ${typeof user?.isOwner})`);
    console.log(`[PERMISSION] isSuperAdmin: ${user?.isSuperAdmin}`);
    console.log(`[PERMISSION] roleLevel: ${user?.roleLevel}`);

    // Check if user context exists
    if (!user) {
      console.log(`[PERMISSION] ❌ DENIED - No user context\n`);
      return next(new AppError("Authentication required", 401));
    }

    // 1️⃣ Super Admin bypass - has all permissions
    if (user.isSuperAdmin === true) {
      console.log(`[PERMISSION] ✅ ALLOWED - Super Admin bypass\n`);
      return next();
    }

    // 2️⃣ Owner bypass for most operations (except super admin actions)
    if (user.isOwner === true) {
      console.log(`[PERMISSION] ✅ ALLOWED - Owner bypass\n`);
      return next();
    }

    // 3️⃣ CEO role bypass (level 1) - has all permissions
    if (user.roleLevel === 1) {
      console.log(`[PERMISSION] ✅ ALLOWED - CEO role bypass (level 1)\n`);
      return next();
    }

    // Get all user permissions (role + direct)
    const userPermissions = new Set([
      ...(user.permissions || []),
      ...(user.directPermissions || []),
    ]);

    // 4️⃣ Check permissions
    const requiredPerms = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    let hasPermission;

    if (requireAll) {
      // User must have ALL permissions
      hasPermission = requiredPerms.every((perm) =>
        userPermissions.has(perm)
      );
    } else {
      // User must have ANY of the permissions
      hasPermission = requiredPerms.some((perm) =>
        userPermissions.has(perm)
      );
    }

    if (!hasPermission) {
      console.log(`[PERMISSION] ❌ DENIED - Missing permissions`);
      console.log(`[PERMISSION] User has ${userPermissions.size} permissions\n`);
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    console.log(`[PERMISSION] ✅ ALLOWED - Has required permission\n`);
    next();
  };
};

/**
 * Check if user can access resource belonging to another user
 * Based on hierarchy level
 *
 * @param {Object} options
 * @param {String} options.targetUserIdParam - Request param name for target user ID
 * @param {Boolean} options.allowSameUser - Allow user to access their own resource
 */
export const hierarchyMiddleware = (options = {}) => {
  const { targetUserIdParam = "userId", allowSameUser = true } = options;

  return async (req, res, next) => {
    const user = req.user;
    const targetUserId = req.params[targetUserIdParam] || req.body[targetUserIdParam];

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    // Super admin, owner, or CEO can access anyone
    if (user.isSuperAdmin || user.isOwner || user.roleLevel === 1) {
      return next();
    }

    // Allow access to own resource
    if (allowSameUser && targetUserId === user.userId.toString()) {
      return next();
    }

    // For now, pass through - implement full hierarchy check when needed
    next();
  };
};

/**
 * Middleware to check if user belongs to same organization as target resource
 */
export const sameOrgMiddleware = (req, res, next) => {
  const user = req.user;
  const resourceOrgId = req.body.organizationId || req.params.organizationId;

  if (!user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin can access any organization
  if (user.isSuperAdmin) {
    return next();
  }

  // Check if user belongs to the same organization
  if (resourceOrgId && resourceOrgId !== user.organizationId.toString()) {
    return next(new AppError("Access denied to this organization", 403));
  }

  next();
};

/**
 * Combine multiple permission checks (AND logic)
 */
export const requireAllPermissions = (...permissions) => {
  return permissionMiddleware(permissions, { requireAll: true });
};

/**
 * Combine multiple permission checks (OR logic)
 */
export const requireAnyPermission = (...permissions) => {
  return permissionMiddleware(permissions, { requireAll: false });
};

export default permissionMiddleware;
