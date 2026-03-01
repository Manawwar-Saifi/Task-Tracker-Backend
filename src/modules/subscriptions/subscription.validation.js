/**
 * Subscription Validation Schemas
 *
 * Zod schemas for subscription API request validation.
 */
import { z } from "zod";

/**
 * Get Subscription Schema
 */
export const getSubscriptionSchema = z.object({
  query: z.object({}).optional(),
});

/**
 * Upgrade Plan Schema
 */
export const upgradePlanSchema = z.object({
  body: z.object({
    plan: z.enum(["basic", "premium", "enterprise"]),
    billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
  }),
});

/**
 * Update Subscription Schema
 */
export const updateSubscriptionSchema = z.object({
  body: z.object({
    autoRenew: z.boolean().optional(),
    billingCycle: z.enum(["monthly", "yearly"]).optional(),
    paymentMethod: z.enum(["card", "upi", "net_banking", "wallet"]).optional(),
  }),
});

/**
 * Cancel Subscription Schema
 */
export const cancelSubscriptionSchema = z.object({
  body: z.object({
    reason: z.string().max(500).trim().optional().nullable(),
  }).optional(),
});

/**
 * Get Plans Query Schema
 */
export const getPlansQuerySchema = z.object({
  query: z.object({
    billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
  }),
});

/**
 * Get All Subscriptions Query Schema (Admin)
 */
export const getAllSubscriptionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    plan: z.enum(["trial", "basic", "premium", "enterprise"]).optional(),
    status: z.enum(["active", "inactive", "cancelled", "expired", "past_due"]).optional(),
  }),
});

/**
 * Update Usage Schema
 */
export const updateUsageSchema = z.object({
  body: z.object({
    users: z.number().int().min(0).optional(),
    storage: z.number().min(0).optional(),
    projects: z.number().int().min(0).optional(),
  }),
});

export default {
  getSubscriptionSchema,
  upgradePlanSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
  getPlansQuerySchema,
  getAllSubscriptionsQuerySchema,
  updateUsageSchema,
};
