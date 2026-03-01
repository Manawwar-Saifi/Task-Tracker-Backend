/**
 * Holiday Validation Schemas
 *
 * Zod schemas for validating holiday-related requests.
 */
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const createHolidaySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .trim(),
    date: z.coerce.date(),
    type: z.enum(["national", "regional", "optional", "custom"]).default("custom"),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    isRecurring: z.boolean().default(false),
    recurringPattern: z.enum(["yearly", "monthly"]).optional().nullable(),
    applicableTo: z.enum(["all", "specific_teams", "specific_departments"]).default("all"),
    teams: z.array(objectIdSchema).optional(),
    departments: z.array(z.string().trim()).optional(),
  }),
});

export const updateHolidaySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    date: z.coerce.date().optional(),
    type: z.enum(["national", "regional", "optional", "custom"]).optional(),
    description: z.string().max(500).optional(),
    isRecurring: z.boolean().optional(),
    recurringPattern: z.enum(["yearly", "monthly"]).optional().nullable(),
    applicableTo: z.enum(["all", "specific_teams", "specific_departments"]).optional(),
    teams: z.array(objectIdSchema).optional(),
    departments: z.array(z.string().trim()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getHolidaySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getHolidaysQuerySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    month: z.coerce.number().int().min(0).max(11).optional(),
    type: z.enum(["national", "regional", "optional", "custom"]).optional(),
    upcoming: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
});

export const checkHolidaySchema = z.object({
  query: z.object({
    date: z.coerce.date(),
  }),
});
