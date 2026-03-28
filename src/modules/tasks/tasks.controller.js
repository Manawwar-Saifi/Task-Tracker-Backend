/**
 * Task Controller
 *
 * HTTP handlers for task management.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as taskService from "./tasks.service.js";

/**
 * Get all tasks
 * GET /tasks
 */
export const getTasks = asyncHandler(async (req, res) => {
  // Scope query based on user's role level
  const { isOwner, isSuperAdmin, roleLevel, userId, permissions, directPermissions } = req.user;
  const allPerms = new Set([...(permissions || []), ...(directPermissions || [])]);

  let scopedQuery = { ...req.query };

  // CEO/Owner/SuperAdmin see all
  if (!isOwner && !isSuperAdmin && roleLevel !== 1) {
    if (allPerms.has("TASK_VIEW_ALL")) {
      // See all org tasks
    } else if (allPerms.has("TASK_VIEW_TEAM")) {
      // See team tasks + own tasks — handled by adding userId context
      scopedQuery._viewScope = "team";
      scopedQuery._userId = userId;
    } else {
      // VIEW_OWN — only own tasks
      scopedQuery._viewScope = "own";
      scopedQuery._userId = userId;
    }
  }

  const data = await taskService.getTasks(req.user.organizationId, scopedQuery);
  return successResponse(res, 200, "Tasks retrieved", data);
});

/**
 * Get user's own tasks
 * GET /tasks/my
 */
export const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getMyTasks(
    req.user.organizationId,
    req.user.userId,
    req.query
  );
  return successResponse(res, 200, "Your tasks retrieved", { tasks });
});

/**
 * Get team tasks
 * GET /tasks/team/:teamId
 */
export const getTeamTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTeamTasks(
    req.user.organizationId,
    req.params.teamId,
    req.query
  );
  return successResponse(res, 200, "Team tasks retrieved", { tasks });
});

/**
 * Get task by ID
 * GET /tasks/:id
 */
export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, "Task retrieved", { task });
});

/**
 * Get task filters
 * GET /tasks/filters
 */
export const getFilters = asyncHandler(async (req, res) => {
  const filters = await taskService.getFilters(req.user.organizationId);
  return successResponse(res, 200, "Task filters retrieved", { filters });
});

/**
 * Get task statistics
 * GET /tasks/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const { isOwner, isSuperAdmin, roleLevel, userId, permissions, directPermissions } = req.user;
  const allPerms = new Set([...(permissions || []), ...(directPermissions || [])]);
  let scopedQuery = { ...req.query };

  if (!isOwner && !isSuperAdmin && roleLevel !== 1) {
    if (allPerms.has("TASK_VIEW_ALL")) { /* see all */ }
    else if (allPerms.has("TASK_VIEW_TEAM")) { scopedQuery._viewScope = "team"; scopedQuery._userId = userId; }
    else { scopedQuery._viewScope = "own"; scopedQuery._userId = userId; }
  }

  const stats = await taskService.getStats(req.user.organizationId, scopedQuery);
  return successResponse(res, 200, "Task statistics retrieved", { stats });
});

/**
 * Get tasks by status (Kanban)
 * GET /tasks/kanban
 */
export const getTasksByStatus = asyncHandler(async (req, res) => {
  const { isOwner, isSuperAdmin, roleLevel, userId, permissions, directPermissions } = req.user;
  const allPerms = new Set([...(permissions || []), ...(directPermissions || [])]);
  let scopedQuery = { ...req.query };

  if (!isOwner && !isSuperAdmin && roleLevel !== 1) {
    if (allPerms.has("TASK_VIEW_ALL")) { /* see all */ }
    else if (allPerms.has("TASK_VIEW_TEAM")) { scopedQuery._viewScope = "team"; scopedQuery._userId = userId; }
    else { scopedQuery._viewScope = "own"; scopedQuery._userId = userId; }
  }

  const tasks = await taskService.getTasksByStatus(
    req.user.organizationId,
    scopedQuery
  );
  return successResponse(res, 200, "Tasks by status retrieved", { tasks });
});

/**
 * Create task
 * POST /tasks
 */
export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Task created successfully", { task });
});

/**
 * Update task
 * PUT /tasks/:id
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Task updated successfully", { task });
});

/**
 * Update task progress
 * PUT /tasks/:id/progress
 */
export const updateProgress = asyncHandler(async (req, res) => {
  const task = await taskService.updateProgress(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body.progress
  );
  return successResponse(res, 200, "Task progress updated", { task });
});

/**
 * Assign task to user
 * PUT /tasks/:id/assign
 */
export const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body.userId
  );
  return successResponse(res, 200, "Task assigned successfully", { task });
});

/**
 * Delete task
 * DELETE /tasks/:id
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, result.message);
});

/**
 * Add dependency
 * POST /tasks/:id/dependencies
 */
export const addDependency = asyncHandler(async (req, res) => {
  const task = await taskService.addDependency(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body.dependentTaskId
  );
  return successResponse(res, 200, "Dependency added", { task });
});

/**
 * Remove dependency
 * DELETE /tasks/:id/dependencies/:dependentTaskId
 */
export const removeDependency = asyncHandler(async (req, res) => {
  const task = await taskService.removeDependency(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.params.dependentTaskId
  );
  return successResponse(res, 200, "Dependency removed", { task });
});

/**
 * Update dependency status
 * PUT /tasks/:id/dependencies/:dependentTaskId
 */
export const updateDependencyStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateDependencyStatus(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.params.dependentTaskId,
    req.body.status
  );
  return successResponse(res, 200, "Dependency status updated", { task });
});

export default {
  getTasks,
  getMyTasks,
  getTeamTasks,
  getTask,
  getFilters,
  getStats,
  getTasksByStatus,
  createTask,
  updateTask,
  updateProgress,
  assignTask,
  deleteTask,
  addDependency,
  removeDependency,
  updateDependencyStatus,
};
