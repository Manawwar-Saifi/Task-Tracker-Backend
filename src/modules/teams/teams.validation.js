import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Transform empty string to null
const emptyToNull = (val) => (val === "" ? null : val);

/**
 * Create team schema
 */
export const createTeamSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Team name must be at least 2 characters")
      .max(100, "Team name cannot exceed 100 characters")
      .trim(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .trim()
      .optional()
      .default(""),
    leaderId: objectIdSchema.refine((val) => val && val.length > 0, {
      message: "Team leader is required",
    }),
    parentTeamId: z.preprocess(
      emptyToNull,
      objectIdSchema.optional().nullable()
    ),
    settings: z
      .object({
        taskVisibility: z.enum(["private", "team", "all"]).optional(),
        canApproveLeaves: z.boolean().optional(),
        canApproveOvertime: z.boolean().optional(),
      })
      .optional(),
  }),
});

/**
 * Update team schema
 */
export const updateTeamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).trim().optional(),
    settings: z
      .object({
        taskVisibility: z.enum(["private", "team", "all"]).optional(),
        canApproveLeaves: z.boolean().optional(),
        canApproveOvertime: z.boolean().optional(),
      })
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Get team by ID schema
 */
export const getTeamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Add member schema
 */
export const addMemberSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    userId: objectIdSchema,
  }),
});

/**
 * Remove member schema
 */
export const removeMemberSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    userId: objectIdSchema,
  }),
});

/**
 * Set leader schema
 */
export const setLeaderSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    userId: objectIdSchema,
  }),
});

/**
 * Bulk add members schema
 */
export const bulkAddMembersSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    userIds: z
      .array(objectIdSchema)
      .min(1, "At least one user is required"),
  }),
});

/**
 * Get teams query schema
 */
export const getTeamsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
    parentTeamId: objectIdSchema.optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export default {
  createTeamSchema,
  updateTeamSchema,
  getTeamSchema,
  addMemberSchema,
  removeMemberSchema,
  setLeaderSchema,
  bulkAddMembersSchema,
  getTeamsQuerySchema,
};
