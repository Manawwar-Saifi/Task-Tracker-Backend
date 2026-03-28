/**
 * Users Controller
 * Handles HTTP requests for user management
 */
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as usersService from "./users.service.js";

/**
 * @desc    Get current logged-in user (from token)
 * @route   GET /api/v1/users/me
 * @access  Protected
 */
export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const user = await usersService.getUser(req.user.userId, req.user.organizationId);

  return successResponse(res, 200, "Current user fetched successfully", { user });
});

/**
 * @desc    Get all users of current organization
 * @route   GET /api/v1/users
 * @access  Protected + USER_VIEW_ALL
 */
export const getUsers = asyncHandler(async (req, res) => {
  const data = await usersService.getUsers(req.user.organizationId, req.query);

  return successResponse(res, 200, "Users fetched successfully", data);
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/v1/users/:id
 * @access  Protected + USER_READ
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getUser(req.params.id, req.user.organizationId);

  return successResponse(res, 200, "User fetched successfully", { user });
});

/**
 * @desc    Create a new user (direct add)
 * @route   POST /api/v1/users
 * @access  Protected + USER_CREATE
 */
export const createUser = asyncHandler(async (req, res) => {
  const user = await usersService.createUser(
    req.user.organizationId,
    req.user.userId,
    req.body
  );

  return successResponse(res, 201, "User created successfully", { user });
});

/**
 * @desc    Update user details
 * @route   PUT /api/v1/users/:id
 * @access  Protected + USER_UPDATE
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await usersService.updateUser(
    req.params.id,
    req.user.organizationId,
    req.body
  );

  return successResponse(res, 200, "User updated successfully", { user });
});

/**
 * @desc    Change user status (activate/deactivate)
 * @route   PUT /api/v1/users/:id/status
 * @access  Protected + USER_UPDATE
 */
export const changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const user = await usersService.changeStatus(
    req.params.id,
    req.user.organizationId,
    status
  );

  return successResponse(res, 200, `User ${status} successfully`, { user });
});

/**
 * @desc    Assign role to user
 * @route   PUT /api/v1/users/:id/role
 * @access  Protected + USER_ASSIGN_ROLE
 */
export const assignRole = asyncHandler(async (req, res) => {
  const { roleId } = req.body;

  const user = await usersService.assignRole(
    req.params.id,
    req.user.organizationId,
    roleId
  );

  return successResponse(res, 200, "Role assigned successfully", { user });
});

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/v1/users/:id
 * @access  Protected + USER_DELETE
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await usersService.deleteUser(
    req.params.id,
    req.user.organizationId
  );

  return successResponse(res, 200, result.message);
});

/**
 * @desc    Get users available for team assignment
 * @route   GET /api/v1/users/available-for-team/:teamId
 * @access  Protected + TEAM_ADD_MEMBER
 */
export const getAvailableUsersForTeam = asyncHandler(async (req, res) => {
  const users = await usersService.getAvailableUsersForTeam(
    req.user.organizationId,
    req.params.teamId
  );

  return successResponse(res, 200, "Available users fetched", { users });
});

/**
 * @desc    Assign direct permissions to a user
 * @route   PUT /api/v1/users/:id/permissions
 * @access  Protected + USER_MANAGE
 */
export const assignUserPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  const user = await usersService.assignUserPermissions(
    req.params.id,
    req.user.organizationId,
    permissions
  );

  return successResponse(res, 200, "User permissions updated successfully", { user });
});

/**
 * @desc    Get a user's permissions (direct + role)
 * @route   GET /api/v1/users/:id/permissions
 * @access  Protected + USER_READ
 */
export const getUserPermissions = asyncHandler(async (req, res) => {
  const data = await usersService.getUserPermissions(
    req.params.id,
    req.user.organizationId
  );

  return successResponse(res, 200, "User permissions fetched", data);
});

// Legacy exports for backward compatibility
export const getUserById = getUser;
export const updateUserStatus = changeStatus;

export default {
  getMe,
  getUsers,
  getUser,
  getUserById,
  createUser,
  updateUser,
  changeStatus,
  updateUserStatus,
  assignRole,
  deleteUser,
  getAvailableUsersForTeam,
};
