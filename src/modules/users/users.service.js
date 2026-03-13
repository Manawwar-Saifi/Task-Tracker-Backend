/**
 * Users Service
 * Handles all user-related business logic with subscription enforcement
 */
import User from "./model.js";
import Team from "../teams/teams.model.js";
import Role from "../roles/roles.model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";
import {
  checkUserLimit,
  incrementUserCount,
  decrementUserCount,
} from "../billing/subscription.service.js";

/**
 * Create user directly (owner/admin sets password)
 * @param {string} organizationId - Organization ID
 * @param {string} createdBy - User ID of creator
 * @param {Object} data - User data
 */
export const createUser = async (organizationId, createdBy, data) => {
  // 1. Check subscription user limit
  const limitCheck = await checkUserLimit(organizationId);
  if (!limitCheck.canAdd) {
    throw new AppError(limitCheck.message, 403);
  }

  // 2. Check duplicate email in organization
  const existing = await User.findOne({
    email: data.email.toLowerCase(),
    organizationId,
    isDeleted: false,
  });

  if (existing) {
    throw new AppError("User with this email already exists in organization", 409);
  }

  // 3. Validate role if provided
  if (data.roleId) {
    const role = await Role.findOne({
      _id: data.roleId,
      organizationId,
      isDeleted: false,
    });
    if (!role) {
      throw new AppError("Invalid role", 400);
    }
  }

  // 4. Validate teams if provided
  if (data.teamIds && data.teamIds.length > 0) {
    const teams = await Team.find({
      _id: { $in: data.teamIds },
      organizationId,
      isDeleted: false,
    });
    if (teams.length !== data.teamIds.length) {
      throw new AppError("One or more teams are invalid", 400);
    }
  }

  // 5. Create user
  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    password: data.password,
    phone: data.phone || null,
    organizationId,
    roleId: data.roleId || null,
    teamIds: data.teamIds || [],
    department: data.department || null,
    designation: data.designation || null,
    status: "active",
    dateOfJoining: new Date(),
  });

  // 6. Increment user count in subscription
  await incrementUserCount(organizationId);

  // 7. Add user to teams if specified
  if (data.teamIds && data.teamIds.length > 0) {
    await Team.updateMany(
      { _id: { $in: data.teamIds }, organizationId },
      {
        $addToSet: {
          members: {
            userId: user._id,
            addedBy: createdBy,
            joinedAt: new Date(),
          },
        },
      }
    );
  }

  logger.info(`User created directly: ${user.email} in org: ${organizationId}`);

  return sanitizeUser(user);
};

/**
 * Get all users in organization with pagination
 * @param {string} organizationId - Organization ID
 * @param {Object} options - Query options
 */
export const getUsers = async (organizationId, options = {}) => {
  const { page = 1, limit = 20, search, status, roleId, teamId } = options;

  const query = {
    organizationId,
    isDeleted: false,
    // Exclude Super Admins from user list - they should not be visible to anyone
    isSuperAdmin: { $ne: true },
  };

  // Apply filters
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
    ];
  }

  if (status) query.status = status;
  if (roleId) query.roleId = roleId;
  if (teamId) query.teamIds = teamId;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .populate("roleId", "name slug level")
      .populate("teamIds", "name")
      .populate("organizationId", "name") // Populate organization name
      .select("-password -refreshToken -inviteToken -passwordResetToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Add helper fields for frontend
  const usersWithHelpers = users.map((user) => ({
    ...user,
    roleName: user.roleId?.name || null,
    roleLevel: user.roleId?.level || 999,
    organizationName: user.organizationId?.name || null, // Add organization name as direct field
  }));

  return {
    users: usersWithHelpers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single user by ID
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 */
export const getUser = async (userId, organizationId) => {
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  })
    .populate("roleId", "name slug level permissionCodes")
    .populate("teamIds", "name")
    .populate("reportingTo", "firstName lastName email")
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
};

/**
 * Update user details
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @param {Object} data - Update data
 */
export const updateUser = async (userId, organizationId, data) => {
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Don't allow updating certain fields
  delete data.email;
  delete data.password;
  delete data.organizationId;
  delete data.isOwner;
  delete data.isSuperAdmin;

  Object.assign(user, data);
  await user.save();

  logger.info(`User updated: ${user.email}`);

  return sanitizeUser(user);
};

/**
 * Change user status
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @param {string} status - New status
 */
export const changeStatus = async (userId, organizationId, status) => {
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Protect owner
  if (user.isOwner) {
    throw new AppError("Cannot change status of organization owner", 400);
  }

  const previousStatus = user.status;
  user.status = status;
  await user.save();

  // Update subscription count based on status change
  if (previousStatus === "active" && (status === "inactive" || status === "suspended")) {
    await decrementUserCount(organizationId);
  } else if ((previousStatus === "inactive" || previousStatus === "suspended") && status === "active") {
    // Check limit before reactivating
    const limitCheck = await checkUserLimit(organizationId);
    if (!limitCheck.canAdd) {
      // Rollback
      user.status = previousStatus;
      await user.save();
      throw new AppError(limitCheck.message, 403);
    }
    await incrementUserCount(organizationId);
  }

  logger.info(`User status changed: ${user.email} -> ${status}`);

  return sanitizeUser(user);
};

/**
 * Assign role to user
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @param {string} roleId - Role ID
 */
export const assignRole = async (userId, organizationId, roleId) => {
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Validate role
  const role = await Role.findOne({
    _id: roleId,
    organizationId,
    isDeleted: false,
  });

  if (!role) {
    throw new AppError("Invalid role", 400);
  }

  // Protect owner - cannot change CEO role
  if (user.isOwner && role.slug !== "ceo") {
    throw new AppError("Cannot change role of organization owner", 400);
  }

  user.roleId = roleId;
  await user.save();

  logger.info(`Role assigned to user: ${user.email} -> ${role.name}`);

  return sanitizeUser(user);
};

/**
 * Delete user (soft delete)
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 */
export const deleteUser = async (userId, organizationId) => {
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Protect owner
  if (user.isOwner) {
    throw new AppError("Cannot delete organization owner", 400);
  }

  // Remove from teams
  await Team.updateMany(
    { organizationId, "members.userId": userId },
    { $pull: { members: { userId } } }
  );

  // Clear team leader references
  await Team.updateMany(
    { organizationId, leaderId: userId },
    { $set: { leaderId: null } }
  );

  // Soft delete
  user.isDeleted = true;
  user.status = "inactive";
  user.email = `deleted_${Date.now()}_${user.email}`; // Free up email
  await user.save();

  // Decrement user count
  await decrementUserCount(organizationId);

  logger.info(`User deleted: ${userId}`);

  return { message: "User deleted successfully" };
};

/**
 * Get users available for team assignment (not in specified team)
 * @param {string} organizationId - Organization ID
 * @param {string} teamId - Team ID to exclude members from
 */
export const getAvailableUsersForTeam = async (organizationId, teamId) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  const memberIds = team.getMemberIds();

  const users = await User.find({
    organizationId,
    isDeleted: false,
    status: "active",
    _id: { $nin: memberIds },
    isSuperAdmin: { $ne: true }, // Exclude Super Admins
  })
    .select("firstName lastName email designation")
    .sort({ firstName: 1 })
    .lean();

  return users;
};

/**
 * Sanitize user object (remove sensitive data)
 */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshToken;
  delete obj.refreshTokenExpiry;
  delete obj.inviteToken;
  delete obj.inviteTokenExpiry;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  return obj;
};

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  changeStatus,
  assignRole,
  deleteUser,
  getAvailableUsersForTeam,
};
