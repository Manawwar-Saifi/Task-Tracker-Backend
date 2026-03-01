/**
 * Notification Validation Schemas
 *
 * Zod schemas for notification API request validation.
 */
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * Create Notification Schema
 */
export const createNotificationSchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    type: z.enum([
      "leave_request",
      "leave_approved",
      "leave_rejected",
      "task_assigned",
      "task_completed",
      "overtime_request",
      "overtime_approved",
      "overtime_rejected",
      "team_added",
      "team_removed",
      "mention",
      "announcement",
      "system",
      "other",
    ]),
    title: z.string().min(1, "Title is required").max(200).trim(),
    message: z.string().min(1, "Message is required").max(1000).trim(),
    data: z.record(z.any()).optional().nullable(),
    link: z.string().max(500).trim().optional().nullable(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
    icon: z.string().max(100).trim().optional().nullable(),
    actionBy: objectIdSchema.optional().nullable(),
    expiresAt: z.coerce.date().optional().nullable(),
  }),
});

/**
 * Get Notifications Query Schema
 */
export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    type: z
      .enum([
        "leave_request",
        "leave_approved",
        "leave_rejected",
        "task_assigned",
        "task_completed",
        "overtime_request",
        "overtime_approved",
        "overtime_rejected",
        "team_added",
        "team_removed",
        "mention",
        "announcement",
        "system",
        "other",
      ])
      .optional(),
    isRead: z
      .union([z.string().transform((val) => val === "true"), z.boolean()])
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

/**
 * Get Notification Schema
 */
export const getNotificationSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Mark as Read Schema
 */
export const markAsReadSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Mark Multiple as Read Schema
 */
export const markMultipleAsReadSchema = z.object({
  body: z.object({
    notificationIds: z.array(objectIdSchema).min(1, "At least one notification ID is required"),
  }),
});

/**
 * Delete Notification Schema
 */
export const deleteNotificationSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Delete Multiple Notifications Schema
 */
export const deleteMultipleSchema = z.object({
  body: z.object({
    notificationIds: z.array(objectIdSchema).min(1, "At least one notification ID is required"),
  }),
});

export default {
  createNotificationSchema,
  getNotificationsQuerySchema,
  getNotificationSchema,
  markAsReadSchema,
  markMultipleAsReadSchema,
  deleteNotificationSchema,
  deleteMultipleSchema,
};
