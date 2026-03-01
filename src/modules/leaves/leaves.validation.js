/**
 * Leave Validation Schemas
 *
 * Zod schemas for validating leave-related requests.
 */
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// ===================== Leave Type Schemas =====================

export const createLeaveTypeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .trim(),
    code: z
      .string()
      .min(2, "Code must be at least 2 characters")
      .max(10, "Code cannot exceed 10 characters")
      .transform((val) => val.toUpperCase()),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    allowedDays: z.coerce.number().min(0, "Allowed days cannot be negative").default(12),
    carryForward: z
      .object({
        enabled: z.boolean().default(false),
        maxDays: z.coerce.number().min(0).default(0),
        expiryMonths: z.coerce.number().min(1).default(3),
      })
      .optional(),
    isPaid: z.boolean().default(true),
    requiresApproval: z.boolean().default(true),
    requiresDocument: z.boolean().default(false),
    minDaysNotice: z.coerce.number().min(0).default(0),
    maxConsecutiveDays: z.coerce.number().min(0).default(0),
    applicableGender: z.enum(["all", "male", "female", "other"]).default("all"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3B82F6"),
  }),
});

export const updateLeaveTypeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).optional(),
    allowedDays: z.coerce.number().min(0).optional(),
    carryForward: z
      .object({
        enabled: z.boolean().optional(),
        maxDays: z.coerce.number().min(0).optional(),
        expiryMonths: z.coerce.number().min(1).optional(),
      })
      .optional(),
    isPaid: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    requiresDocument: z.boolean().optional(),
    minDaysNotice: z.coerce.number().min(0).optional(),
    maxConsecutiveDays: z.coerce.number().min(0).optional(),
    applicableGender: z.enum(["all", "male", "female", "other"]).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getLeaveTypeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// ===================== Leave Request Schemas =====================

export const requestLeaveSchema = z.object({
  body: z
    .object({
      leaveTypeId: objectIdSchema,
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      isHalfDay: z.boolean().default(false),
      halfDayPeriod: z.enum(["first_half", "second_half"]).optional().nullable(),
      reason: z
        .string()
        .min(10, "Reason must be at least 10 characters")
        .max(1000, "Reason cannot exceed 1000 characters")
        .trim(),
      isEmergency: z.boolean().default(false),
      contactNumber: z.string().trim().optional().nullable(),
      notes: z.string().max(500).trim().optional().nullable(),
    })
    .refine(
      (data) => {
        return new Date(data.endDate) >= new Date(data.startDate);
      },
      {
        message: "End date must be on or after start date",
        path: ["endDate"],
      }
    )
    .refine(
      (data) => {
        if (data.isHalfDay && !data.halfDayPeriod) {
          return false;
        }
        return true;
      },
      {
        message: "Half day period is required when applying for half day leave",
        path: ["halfDayPeriod"],
      }
    ),
});

export const updateLeaveSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isHalfDay: z.boolean().optional(),
    halfDayPeriod: z.enum(["first_half", "second_half"]).optional().nullable(),
    reason: z.string().min(10).max(1000).trim().optional(),
    isEmergency: z.boolean().optional(),
    contactNumber: z.string().trim().optional().nullable(),
    notes: z.string().max(500).trim().optional().nullable(),
  }),
});

export const getLeaveSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const approveLeaveSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    notes: z.string().max(500).trim().optional(),
  }),
});

export const rejectLeaveSchema = z.object({
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

export const cancelLeaveSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    reason: z.string().max(500).trim().optional(),
  }),
});

// ===================== Query Schemas =====================

export const getLeavesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
    leaveTypeId: objectIdSchema.optional(),
    userId: objectIdSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    sortBy: z.enum(["startDate", "appliedAt", "status"]).optional().default("appliedAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getMyLeavesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
    leaveTypeId: objectIdSchema.optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
  }),
});

export const getBalanceQuerySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2020).max(2100).optional(),
  }),
});

export const getPendingApprovalsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    teamId: objectIdSchema.optional(),
  }),
});

// ===================== Balance Adjustment Schema =====================

export const adjustBalanceSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: z.object({
    leaveTypeId: objectIdSchema,
    adjustment: z.coerce.number().refine((val) => val !== 0, "Adjustment cannot be zero"),
    reason: z.string().min(5).max(500).trim(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
  }),
});
