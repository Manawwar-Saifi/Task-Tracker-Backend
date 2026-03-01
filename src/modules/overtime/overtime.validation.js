/**
 * Overtime Validation Schemas
 *
 * Zod schemas for overtime API request validation.
 */
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * Request Overtime Schema
 */
export const requestOvertimeSchema = z.object({
  body: z.object({
    date: z.coerce.date(),
    hours: z
      .number()
      .min(0.5, "Minimum overtime is 0.5 hours")
      .max(12, "Maximum overtime is 12 hours"),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason cannot exceed 1000 characters")
      .trim(),
    attendanceId: objectIdSchema.optional().nullable(),
  }),
});

/**
 * Update Overtime Schema
 */
export const updateOvertimeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    date: z.coerce.date().optional(),
    hours: z
      .number()
      .min(0.5, "Minimum overtime is 0.5 hours")
      .max(12, "Maximum overtime is 12 hours")
      .optional(),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason cannot exceed 1000 characters")
      .trim()
      .optional(),
  }),
});

/**
 * Get Overtime Schema
 */
export const getOvertimeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Get Overtime Query Schema
 */
export const getOvertimeQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
    userId: objectIdSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z
      .enum(["date", "hours", "createdAt", "status"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

/**
 * Approve Overtime Schema
 */
export const approveOvertimeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      notes: z.string().max(500).trim().optional().nullable(),
    })
    .optional(),
});

/**
 * Reject Overtime Schema
 */
export const rejectOvertimeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    reason: z
      .string()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(500, "Rejection reason cannot exceed 500 characters")
      .trim(),
  }),
});

/**
 * Get Stats Query Schema
 */
export const getStatsQuerySchema = z.object({
  query: z.object({
    userId: objectIdSchema.optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

/**
 * Get Report Query Schema
 */
export const getReportQuerySchema = z.object({
  query: z.object({
    userId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

/**
 * Get My Overtime Query Schema
 */
export const getMyOvertimeQuerySchema = z.object({
  query: z.object({
    status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

export default {
  requestOvertimeSchema,
  updateOvertimeSchema,
  getOvertimeSchema,
  getOvertimeQuerySchema,
  approveOvertimeSchema,
  rejectOvertimeSchema,
  getStatsQuerySchema,
  getReportQuerySchema,
  getMyOvertimeQuerySchema,
};
