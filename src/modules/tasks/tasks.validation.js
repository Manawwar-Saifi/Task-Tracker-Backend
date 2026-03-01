/**
 * Task Validation Schemas
 *
 * Zod schemas for task API request validation.
 */
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * Create Task Schema
 */
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters")
      .trim(),
    description: z
      .string()
      .max(5000, "Description cannot exceed 5000 characters")
      .trim()
      .optional()
      .default(""),
    userId: objectIdSchema.optional(), // If not provided, assign to self
    teamId: objectIdSchema.optional().nullable(),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    dueDate: z.coerce.date().optional().nullable(),
    tags: z.array(z.string().max(50)).max(10).optional().default([]),
  }),
});

/**
 * Update Task Schema
 */
export const updateTaskSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters")
      .trim()
      .optional(),
    description: z
      .string()
      .max(5000, "Description cannot exceed 5000 characters")
      .trim()
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    status: z
      .enum(["todo", "in_progress", "completed", "blocked", "cancelled"])
      .optional(),
    dueDate: z.coerce.date().optional().nullable(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    isVisible: z.boolean().optional(),
  }),
});

/**
 * Get Task Schema
 */
export const getTaskSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Get Tasks Query Schema
 */
export const getTasksQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    search: z.string().optional(),
    status: z
      .enum(["todo", "in_progress", "completed", "blocked", "cancelled"])
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    userId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
    sortBy: z
      .enum(["createdAt", "dueDate", "priority", "status", "title"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    overdue: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    dueToday: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    includeHidden: z
      .union([z.string().transform((val) => val === "true"), z.boolean()])
      .optional()
      .default(false),
  }),
});

/**
 * Update Progress Schema
 */
export const updateProgressSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    progress: z
      .number()
      .min(0, "Progress cannot be negative")
      .max(100, "Progress cannot exceed 100"),
  }),
});

/**
 * Assign Task Schema
 */
export const assignTaskSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    userId: objectIdSchema,
  }),
});

/**
 * Add Dependency Schema
 */
export const addDependencySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    dependentTaskId: objectIdSchema,
  }),
});

/**
 * Remove Dependency Schema
 */
export const removeDependencySchema = z.object({
  params: z.object({
    id: objectIdSchema,
    dependentTaskId: objectIdSchema,
  }),
});

/**
 * Update Dependency Status Schema
 */
export const updateDependencyStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    dependentTaskId: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(["pending", "acknowledged", "completed", "cancelled"]),
  }),
});

/**
 * Get My Tasks Query Schema
 */
export const getMyTasksQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(["todo", "in_progress", "completed", "blocked", "cancelled"])
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    includeHidden: z
      .union([z.string().transform((val) => val === "true"), z.boolean()])
      .optional()
      .default(false),
  }),
});

/**
 * Get Team Tasks Query Schema
 */
export const getTeamTasksQuerySchema = z.object({
  params: z.object({
    teamId: objectIdSchema,
  }),
  query: z.object({
    status: z
      .enum(["todo", "in_progress", "completed", "blocked", "cancelled"])
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    includeHidden: z
      .union([z.string().transform((val) => val === "true"), z.boolean()])
      .optional()
      .default(false),
  }),
});

/**
 * Get Stats Query Schema
 */
export const getStatsQuerySchema = z.object({
  query: z.object({
    userId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
  }),
});

export default {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  getTasksQuerySchema,
  updateProgressSchema,
  assignTaskSchema,
  addDependencySchema,
  removeDependencySchema,
  updateDependencyStatusSchema,
  getMyTasksQuerySchema,
  getTeamTasksQuerySchema,
  getStatsQuerySchema,
};
