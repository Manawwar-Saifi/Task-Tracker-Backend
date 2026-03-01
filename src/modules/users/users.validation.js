import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * Create user schema (direct add by owner)
 */
export const createUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name cannot exceed 50 characters")
      .trim(),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name cannot exceed 50 characters")
      .trim(),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().trim().optional().nullable(),
    roleId: objectIdSchema.optional().nullable(),
    teamIds: z.array(objectIdSchema).optional().default([]),
    department: z.string().max(100).trim().optional().nullable(),
    designation: z.string().max(100).trim().optional().nullable(),
  }),
});

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    phone: z.string().trim().optional().nullable(),
    department: z.string().max(100).trim().optional().nullable(),
    designation: z.string().max(100).trim().optional().nullable(),
  }),
});

/**
 * Get user by ID schema
 */
export const getUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Change status schema
 */
export const changeStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(["active", "inactive", "suspended"], {
      errorMap: () => ({ message: "Status must be active, inactive, or suspended" }),
    }),
  }),
});

/**
 * Assign role schema
 */
export const assignRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    roleId: objectIdSchema,
  }),
});

/**
 * Get users query schema
 */
export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
    status: z.enum(["active", "inactive", "invited", "suspended"]).optional(),
    roleId: objectIdSchema.optional(),
    teamId: objectIdSchema.optional(),
  }),
});

export default {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  changeStatusSchema,
  assignRoleSchema,
  getUsersQuerySchema,
};
