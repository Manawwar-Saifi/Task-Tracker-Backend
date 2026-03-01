/**
 * Report Validation Schemas
 *
 * Zod schemas for report API request validation.
 */
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * Generate Report Schema
 */
export const generateReportSchema = z.object({
  body: z.object({
    reportType: z.enum([
      "attendance",
      "leave",
      "task",
      "overtime",
      "team",
      "user",
      "dashboard",
      "custom",
    ]),
    title: z.string().min(1, "Title is required").max(200).trim().optional(),
    description: z.string().max(500).trim().optional().nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    filters: z.record(z.any()).optional(),
    format: z.enum(["json", "csv", "pdf"]).optional().default("json"),
  }),
});

/**
 * Get Reports Query Schema
 */
export const getReportsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    reportType: z
      .enum([
        "attendance",
        "leave",
        "task",
        "overtime",
        "team",
        "user",
        "dashboard",
        "custom",
      ])
      .optional(),
    generatedBy: objectIdSchema.optional(),
  }),
});

/**
 * Get Report Schema
 */
export const getReportSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Delete Report Schema
 */
export const deleteReportSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Get Attendance Report Query Schema
 */
export const getAttendanceReportQuerySchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    userId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
  }),
});

/**
 * Get Leave Report Query Schema
 */
export const getLeaveReportQuerySchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    userId: objectIdSchema.optional(),
    status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  }),
});

/**
 * Get Task Report Query Schema
 */
export const getTaskReportQuerySchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    userId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
    status: z.enum(["todo", "in_progress", "review", "completed", "cancelled"]).optional(),
  }),
});

/**
 * Get Overtime Report Query Schema
 */
export const getOvertimeReportQuerySchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    userId: objectIdSchema.optional(),
    status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  }),
});

/**
 * Get Dashboard Data Query Schema
 */
export const getDashboardDataQuerySchema = z.object({
  query: z.object({
    period: z.enum(["today", "week", "month", "year"]).optional().default("month"),
  }),
});

export default {
  generateReportSchema,
  getReportsQuerySchema,
  getReportSchema,
  deleteReportSchema,
  getAttendanceReportQuerySchema,
  getLeaveReportQuerySchema,
  getTaskReportQuerySchema,
  getOvertimeReportQuerySchema,
  getDashboardDataQuerySchema,
};
