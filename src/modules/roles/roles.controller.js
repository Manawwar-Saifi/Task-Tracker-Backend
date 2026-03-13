/**
 * Roles Controller
 * Handles role management operations
 */

import Role from "./roles.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";

/**
 * Get all roles for organization
 * GET /api/v1/roles
 */
export const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find({
    organizationId: req.user.organizationId,
    isDeleted: false,
    isActive: true,
  }).sort({ level: 1 });

  return successResponse(res, 200, "Roles retrieved successfully", { roles });
});

/**
 * Get single role by ID
 * GET /api/v1/roles/:id
 */
export const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
    isDeleted: false,
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  return successResponse(res, 200, "Role retrieved successfully", { role });
});

/**
 * Create new role
 * POST /api/v1/roles
 */
export const createRole = asyncHandler(async (req, res) => {
  const { name, description, level, permissionCodes } = req.body;

  // Check if role with same name exists
  const existingRole = await Role.findOne({
    organizationId: req.user.organizationId,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    isDeleted: false,
  });

  if (existingRole) {
    throw new AppError("A role with this name already exists", 400);
  }

  const role = await Role.create({
    name,
    description,
    level: level || 50,
    permissionCodes: permissionCodes || [],
    organizationId: req.user.organizationId,
    createdBy: req.user.userId,
  });

  return successResponse(res, 201, "Role created successfully", { role });
});

/**
 * Update role
 * PUT /api/v1/roles/:id
 */
export const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
    isDeleted: false,
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  // Don't allow editing system roles (except permissions)
  if (role.isSystemRole && (req.body.name || req.body.level)) {
    throw new AppError("Cannot modify system role name or level", 400);
  }

  const { name, description, level, permissionCodes, isActive } = req.body;

  if (name) role.name = name;
  if (description !== undefined) role.description = description;
  if (level && !role.isSystemRole) role.level = level;
  if (permissionCodes) role.permissionCodes = permissionCodes;
  if (isActive !== undefined) role.isActive = isActive;
  role.updatedBy = req.user.userId;

  await role.save();

  return successResponse(res, 200, "Role updated successfully", { role });
});

/**
 * Delete role (soft delete)
 * DELETE /api/v1/roles/:id
 */
export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
    isDeleted: false,
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  if (role.isSystemRole) {
    throw new AppError("Cannot delete system role", 400);
  }

  role.isDeleted = true;
  role.updatedBy = req.user.userId;
  await role.save();

  return successResponse(res, 200, "Role deleted successfully");
});

export default {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
