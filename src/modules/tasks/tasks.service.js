/**
 * Task Service
 *
 * Business logic for task management.
 */
import Task from "./tasks.model.js";
import User from "../users/model.js";
import Team from "../teams/teams.model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Priority order for sorting
 */
const PRIORITY_ORDER = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Get all tasks with pagination and filters
 */
export const getTasks = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    userId,
    teamId,
    sortBy = "createdAt",
    sortOrder = "desc",
    overdue,
    dueToday,
    includeHidden = false,
  } = options;

  const query = {
    organizationId,
    isDeleted: false,
  };

  if (!includeHidden) {
    query.isVisible = true;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (userId) query.userId = userId;
  if (teamId) query.teamId = teamId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (overdue) {
    query.dueDate = { $lt: today };
    query.status = { $nin: ["completed", "cancelled"] };
  }

  if (dueToday) {
    query.dueDate = { $gte: today, $lt: tomorrow };
    query.status = { $nin: ["completed", "cancelled"] };
  }

  // Build sort object
  const sort = {};
  if (sortBy === "priority") {
    // Custom sort for priority
    sort.priority = sortOrder === "asc" ? 1 : -1;
  } else {
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
  }

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate("userId", "firstName lastName email avatar")
      .populate("createdBy", "firstName lastName email")
      .populate("teamId", "name")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(query),
  ]);

  // Add computed fields
  const tasksWithComputed = tasks.map((task) => ({
    ...task,
    isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && !["completed", "cancelled"].includes(task.status),
    daysUntilDue: task.dueDate
      ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  }));

  return {
    tasks: tasksWithComputed,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user's own tasks
 */
export const getMyTasks = async (organizationId, userId, options = {}) => {
  const { status, priority, includeHidden = false } = options;

  const query = {
    organizationId,
    userId,
    isDeleted: false,
  };

  if (!includeHidden) {
    query.isVisible = true;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;

  const tasks = await Task.find(query)
    .populate("createdBy", "firstName lastName email")
    .populate("assignedBy", "firstName lastName email")
    .populate("teamId", "name")
    .populate("dependencies.taskId", "title status userId")
    .sort({ priority: -1, dueDate: 1 })
    .lean();

  // Add computed fields
  return tasks.map((task) => ({
    ...task,
    isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && !["completed", "cancelled"].includes(task.status),
    daysUntilDue: task.dueDate
      ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  }));
};

/**
 * Get team tasks
 */
export const getTeamTasks = async (organizationId, teamId, options = {}) => {
  const { status, priority, includeHidden = false } = options;

  // Verify team exists
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  const query = {
    organizationId,
    teamId,
    isDeleted: false,
  };

  if (!includeHidden) {
    query.isVisible = true;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;

  const tasks = await Task.find(query)
    .populate("userId", "firstName lastName email avatar")
    .populate("createdBy", "firstName lastName email")
    .sort({ priority: -1, dueDate: 1 })
    .lean();

  return tasks.map((task) => ({
    ...task,
    isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && !["completed", "cancelled"].includes(task.status),
  }));
};

/**
 * Get task by ID
 */
export const getTask = async (organizationId, taskId) => {
  const task = await Task.findWithDetails(taskId, organizationId);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return {
    ...task,
    isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && !["completed", "cancelled"].includes(task.status),
    daysUntilDue: task.dueDate
      ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null,
  };
};

/**
 * Create a new task
 */
export const createTask = async (organizationId, creatorId, data) => {
  const { title, description, userId, teamId, priority, dueDate, tags } = data;

  // Assignee defaults to creator if not specified
  const assigneeId = userId || creatorId;

  // Verify assignee exists and belongs to organization
  const assignee = await User.findOne({
    _id: assigneeId,
    organizationId,
    status: "active",
    isDeleted: false,
  });

  if (!assignee) {
    throw new AppError("Assignee not found or not active", 404);
  }

  // Verify team if provided
  if (teamId) {
    const team = await Team.findOne({
      _id: teamId,
      organizationId,
      isDeleted: false,
    });

    if (!team) {
      throw new AppError("Team not found", 404);
    }
  }

  const task = await Task.create({
    organizationId,
    title,
    description: description || "",
    userId: assigneeId,
    createdBy: creatorId,
    assignedBy: userId && userId !== creatorId ? creatorId : null,
    teamId: teamId || null,
    priority: priority || "medium",
    dueDate: dueDate || null,
    tags: tags || [],
  });

  const populated = await Task.findById(task._id)
    .populate("userId", "firstName lastName email avatar")
    .populate("createdBy", "firstName lastName email")
    .populate("teamId", "name")
    .lean();

  logger.info(`Task created: ${task.title} (${task._id}) in org: ${organizationId}`);

  return populated;
};

/**
 * Update task
 */
export const updateTask = async (organizationId, taskId, updatedBy, data) => {
  const task = await Task.findOne({
    _id: taskId,
    organizationId,
    isDeleted: false,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const { title, description, priority, status, dueDate, tags, isVisible } = data;

  // Update fields
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (tags !== undefined) task.tags = tags;
  if (isVisible !== undefined) task.isVisible = isVisible;

  // Handle status change
  if (status !== undefined && status !== task.status) {
    task.status = status;

    if (status === "completed") {
      task.completedAt = new Date();
      task.progress = 100;
    } else if (task.status === "completed" && status !== "completed") {
      // Reopening task
      task.completedAt = null;
      if (task.progress === 100) {
        task.progress = 0;
      }
    }
  }

  task.updatedBy = updatedBy;
  await task.save();

  const updated = await Task.findById(task._id)
    .populate("userId", "firstName lastName email avatar")
    .populate("createdBy", "firstName lastName email")
    .populate("teamId", "name")
    .lean();

  logger.info(`Task updated: ${task._id}`);

  return updated;
};

/**
 * Update task progress
 */
export const updateProgress = async (organizationId, taskId, updatedBy, progress) => {
  const task = await Task.findOne({
    _id: taskId,
    organizationId,
    isDeleted: false,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  task.progress = Math.min(100, Math.max(0, progress));

  // Auto-complete if progress reaches 100
  if (task.progress >= 100 && task.status !== "completed") {
    task.status = "completed";
    task.completedAt = new Date();
  }

  task.updatedBy = updatedBy;
  await task.save();

  logger.info(`Task progress updated: ${task._id} -> ${progress}%`);

  return task;
};

/**
 * Assign task to user
 */
export const assignTask = async (organizationId, taskId, assignerId, assigneeId) => {
  const task = await Task.findOne({
    _id: taskId,
    organizationId,
    isDeleted: false,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Verify assignee
  const assignee = await User.findOne({
    _id: assigneeId,
    organizationId,
    status: "active",
    isDeleted: false,
  });

  if (!assignee) {
    throw new AppError("Assignee not found or not active", 404);
  }

  task.userId = assigneeId;
  task.assignedBy = assignerId;
  task.updatedBy = assignerId;
  await task.save();

  const updated = await Task.findById(task._id)
    .populate("userId", "firstName lastName email avatar")
    .populate("assignedBy", "firstName lastName email")
    .lean();

  logger.info(`Task ${task._id} assigned to ${assigneeId}`);

  return updated;
};

/**
 * Delete task
 */
export const deleteTask = async (organizationId, taskId, deletedBy) => {
  const task = await Task.findOne({
    _id: taskId,
    organizationId,
    isDeleted: false,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Soft delete
  task.isDeleted = true;
  task.updatedBy = deletedBy;
  await task.save();

  logger.info(`Task deleted: ${task._id}`);

  return { message: "Task deleted successfully" };
};

/**
 * Add dependency to task
 */
export const addDependency = async (organizationId, taskId, userId, dependentTaskId) => {
  const task = await Task.findOne({
    _id: taskId,
    organizationId,
    isDeleted: false,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Verify dependent task exists
  const dependentTask = await Task.findOne({
    _id: dependentTaskId,
    organizationId,
    isDeleted: false,
  });

  if (!dependentTask) {
    throw new AppError("Dependent task not found", 404);
  }

  // Check if already a dependency
  const exists = task.dependencies.some(
    (d) => d.taskId.toString() === dependentTaskId
  );

  if (exists) {
    throw new AppError("This dependency already exists", 400);
  }

  // Check for circular dependency
  const isCircular = await Task.hasCircularDependency(taskId, dependentTaskId);
  if (isCircular) {
    throw new AppError("Circular dependency detected", 400);
  }

  task.addDependency(dependentTaskId);
  task.updatedBy = userId;
  await task.save();

  const updated = await Task.findById(task._id)
    .populate("dependencies.taskId", "title status userId")
    .lean();

  logger.info(`Dependency added to task ${taskId}: ${dependentTaskId}`);

  return updated;
};

/**
 * Remove dependency from task
 */
export const removeDependency = async (organizationId, taskId, userId, dependentTaskId) => {
  const task = await Task.findOne({
    _id: taskId,
    organizationId,
    isDeleted: false,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Check if dependency exists
  const exists = task.dependencies.some(
    (d) => d.taskId.toString() === dependentTaskId
  );

  if (!exists) {
    throw new AppError("Dependency not found", 404);
  }

  task.removeDependency(dependentTaskId);
  task.updatedBy = userId;
  await task.save();

  logger.info(`Dependency removed from task ${taskId}: ${dependentTaskId}`);

  return task;
};

/**
 * Update dependency status
 */
export const updateDependencyStatus = async (
  organizationId,
  taskId,
  userId,
  dependentTaskId,
  status
) => {
  const task = await Task.findOne({
    _id: taskId,
    organizationId,
    isDeleted: false,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const dependency = task.dependencies.find(
    (d) => d.taskId.toString() === dependentTaskId
  );

  if (!dependency) {
    throw new AppError("Dependency not found", 404);
  }

  task.updateDependencyStatus(dependentTaskId, status);
  task.updatedBy = userId;
  await task.save();

  logger.info(`Dependency status updated: ${dependentTaskId} -> ${status}`);

  return task;
};

/**
 * Get tasks by status (Kanban view)
 */
export const getTasksByStatus = async (organizationId, options = {}) => {
  return Task.getByStatus(organizationId, options);
};

/**
 * Get task statistics
 */
export const getStats = async (organizationId, options = {}) => {
  return Task.getStats(organizationId, options);
};

/**
 * Get task filter options
 */
export const getFilters = async (organizationId) => {
  // Get unique tags from all tasks
  const tasks = await Task.find(
    { organizationId, isDeleted: false },
    { tags: 1 }
  );

  const allTags = new Set();
  tasks.forEach((task) => {
    task.tags.forEach((tag) => allTags.add(tag));
  });

  return {
    statuses: [
      { value: "todo", label: "To Do" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "blocked", label: "Blocked" },
      { value: "cancelled", label: "Cancelled" },
    ],
    priorities: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "urgent", label: "Urgent" },
    ],
    tags: Array.from(allTags).sort(),
  };
};

export default {
  getTasks,
  getMyTasks,
  getTeamTasks,
  getTask,
  createTask,
  updateTask,
  updateProgress,
  assignTask,
  deleteTask,
  addDependency,
  removeDependency,
  updateDependencyStatus,
  getTasksByStatus,
  getStats,
  getFilters,
};
