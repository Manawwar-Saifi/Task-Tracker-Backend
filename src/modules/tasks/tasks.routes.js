/**
 * Task Routes
 *
 * API endpoints for task management.
 */
import express from "express";
import * as controller from "./tasks.controller.js";
import * as validation from "./tasks.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  TASK_CREATE,
  TASK_READ,
  TASK_UPDATE,
  TASK_DELETE,
  TASK_ASSIGN,
  TASK_VIEW_OWN,
  TASK_VIEW_TEAM,
  TASK_VIEW_ALL,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// ===================== READ ROUTES =====================

// Get task filters
router.get("/filters", controller.getFilters);

// Get task statistics
router.get(
  "/stats",
  permissionMiddleware([TASK_VIEW_ALL, TASK_VIEW_TEAM, TASK_VIEW_OWN]),
  validate(validation.getStatsQuerySchema),
  controller.getStats
);

// Get tasks by status (Kanban view)
router.get(
  "/kanban",
  permissionMiddleware([TASK_VIEW_ALL, TASK_VIEW_TEAM, TASK_VIEW_OWN]),
  controller.getTasksByStatus
);

// Get user's own tasks
router.get(
  "/my",
  permissionMiddleware(TASK_VIEW_OWN),
  validate(validation.getMyTasksQuerySchema),
  controller.getMyTasks
);

// Get team tasks
router.get(
  "/team/:teamId",
  permissionMiddleware([TASK_VIEW_ALL, TASK_VIEW_TEAM]),
  validate(validation.getTeamTasksQuerySchema),
  controller.getTeamTasks
);

// Get all tasks (paginated)
router.get(
  "/",
  permissionMiddleware([TASK_VIEW_ALL, TASK_VIEW_TEAM]),
  validate(validation.getTasksQuerySchema),
  controller.getTasks
);

// Get single task
router.get(
  "/:id",
  permissionMiddleware([TASK_READ, TASK_VIEW_OWN]),
  validate(validation.getTaskSchema),
  controller.getTask
);

// ===================== WRITE ROUTES =====================

// Create task
router.post(
  "/",
  permissionMiddleware(TASK_CREATE),
  validate(validation.createTaskSchema),
  controller.createTask
);

// Update task
router.put(
  "/:id",
  permissionMiddleware(TASK_UPDATE),
  validate(validation.updateTaskSchema),
  controller.updateTask
);

// Update task progress
router.put(
  "/:id/progress",
  permissionMiddleware([TASK_UPDATE, TASK_VIEW_OWN]),
  validate(validation.updateProgressSchema),
  controller.updateProgress
);

// Assign task to user
router.put(
  "/:id/assign",
  permissionMiddleware(TASK_ASSIGN),
  validate(validation.assignTaskSchema),
  controller.assignTask
);

// Delete task
router.delete(
  "/:id",
  permissionMiddleware(TASK_DELETE),
  validate(validation.getTaskSchema),
  controller.deleteTask
);

// ===================== DEPENDENCY ROUTES =====================

// Add dependency
router.post(
  "/:id/dependencies",
  permissionMiddleware(TASK_UPDATE),
  validate(validation.addDependencySchema),
  controller.addDependency
);

// Remove dependency
router.delete(
  "/:id/dependencies/:dependentTaskId",
  permissionMiddleware(TASK_UPDATE),
  validate(validation.removeDependencySchema),
  controller.removeDependency
);

// Update dependency status
router.put(
  "/:id/dependencies/:dependentTaskId",
  permissionMiddleware([TASK_UPDATE, TASK_VIEW_OWN]),
  validate(validation.updateDependencyStatusSchema),
  controller.updateDependencyStatus
);

export default router;
