/**
 * Attendance Validation Schemas
 *
 * Zod schemas for attendance operations.
 */
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const timeStringSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)");

/**
 * Clock in schema
 */
export const clockInSchema = z.object({
  body: z
    .object({
      notes: z.string().max(500).optional(),
      location: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          address: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Clock out schema
 */
export const clockOutSchema = z.object({
  body: z
    .object({
      notes: z.string().max(500).optional(),
    })
    .optional(),
});

/**
 * Start break schema
 */
export const startBreakSchema = z.object({
  body: z
    .object({
      type: z.enum(["lunch", "tea", "personal", "other"]).optional(),
    })
    .optional(),
});

/**
 * Get attendance records query schema
 */
export const getAttendanceQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    userId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
    status: z
      .enum(["present", "absent", "half_day", "on_leave", "holiday", "weekend"])
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isLate: z.coerce.boolean().optional(),
  }),
});

/**
 * Get attendance by date schema
 */
export const getAttendanceByDateSchema = z.object({
  query: z.object({
    date: z.string().optional(), // YYYY-MM-DD format
  }),
});

/**
 * Update attendance record schema (admin)
 */
export const updateAttendanceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    clockIn: z.string().datetime().optional(),
    clockOut: z.string().datetime().optional(),
    status: z
      .enum(["present", "absent", "half_day", "on_leave", "holiday", "weekend"])
      .optional(),
    notes: z.string().max(500).optional(),
  }),
});

/**
 * Update attendance settings schema
 */
export const updateSettingsSchema = z.object({
  body: z.object({
    workStartTime: timeStringSchema.optional(),
    workEndTime: timeStringSchema.optional(),
    graceMinutes: z.number().int().min(0).max(60).optional(),
    breakDuration: z.number().int().min(0).max(180).optional(),
    maxBreaks: z.number().int().min(1).max(10).optional(),
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .optional(),
    overtimeEnabled: z.boolean().optional(),
    minOvertimeMinutes: z.number().int().min(0).optional(),
    maxOvertimeMinutes: z.number().int().min(0).optional(),
    overtimeNeedsApproval: z.boolean().optional(),
    halfDayMinutes: z.number().int().min(0).optional(),
    geoFencingEnabled: z.boolean().optional(),
    officeLocations: z
      .array(
        z.object({
          name: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          radiusMeters: z.number().optional(),
        })
      )
      .optional(),
    autoClockOutEnabled: z.boolean().optional(),
    autoClockOutTime: timeStringSchema.optional(),
    weekStartDay: z.number().int().min(0).max(6).optional(),
    timezone: z.string().optional(),
  }),
});

/**
 * Get team attendance schema
 */
export const getTeamAttendanceSchema = z.object({
  params: z.object({
    teamId: objectIdSchema,
  }),
  query: z.object({
    date: z.string().optional(), // YYYY-MM-DD format
  }),
});

/**
 * Get summary schema
 */
export const getSummarySchema = z.object({
  query: z.object({
    period: z.enum(["today", "week", "month", "year"]).optional().default("today"),
    userId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
  }),
});

/**
 * Manual attendance entry schema
 */
export const manualEntrySchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    date: z.string(), // YYYY-MM-DD
    clockIn: z.string().datetime(),
    clockOut: z.string().datetime().optional(),
    status: z
      .enum(["present", "absent", "half_day", "on_leave", "holiday", "weekend"])
      .optional()
      .default("present"),
    notes: z.string().max(500).optional(),
  }),
});

export default {
  clockInSchema,
  clockOutSchema,
  startBreakSchema,
  getAttendanceQuerySchema,
  getAttendanceByDateSchema,
  updateAttendanceSchema,
  updateSettingsSchema,
  getTeamAttendanceSchema,
  getSummarySchema,
  manualEntrySchema,
};
