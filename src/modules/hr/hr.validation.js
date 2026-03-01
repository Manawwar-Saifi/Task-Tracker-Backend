/**
 * HR Validation Schemas
 *
 * Zod schemas for HR API request validation.
 */
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const allowanceSchema = z.object({
  name: z.string().min(1, "Allowance name is required").max(100).trim(),
  amount: z.number().min(0, "Amount cannot be negative"),
  type: z.enum(["fixed", "percentage"]).optional().default("fixed"),
});

const deductionSchema = z.object({
  name: z.string().min(1, "Deduction name is required").max(100).trim(),
  amount: z.number().min(0, "Amount cannot be negative"),
  type: z.enum(["fixed", "percentage"]).optional().default("fixed"),
});

// ==================== SALARY SCHEMAS ====================

/**
 * Create Salary Schema
 */
export const createSalarySchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: z.object({
    basicSalary: z.number().min(0, "Basic salary cannot be negative"),
    allowances: z.array(allowanceSchema).optional().default([]),
    deductions: z.array(deductionSchema).optional().default([]),
    currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional().default("INR"),
    paymentFrequency: z
      .enum(["monthly", "bi-weekly", "weekly"])
      .optional()
      .default("monthly"),
    bankDetails: z
      .object({
        accountNumber: z.string().max(50).trim().optional().nullable(),
        bankName: z.string().max(100).trim().optional().nullable(),
        ifscCode: z.string().max(20).trim().optional().nullable(),
        accountHolderName: z.string().max(100).trim().optional().nullable(),
      })
      .optional(),
    effectiveFrom: z.coerce.date(),
    notes: z.string().max(500).trim().optional().nullable(),
  }),
});

/**
 * Update Salary Schema
 */
export const updateSalarySchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: z.object({
    basicSalary: z.number().min(0).optional(),
    allowances: z.array(allowanceSchema).optional(),
    deductions: z.array(deductionSchema).optional(),
    currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional(),
    paymentFrequency: z.enum(["monthly", "bi-weekly", "weekly"]).optional(),
    bankDetails: z
      .object({
        accountNumber: z.string().max(50).trim().optional().nullable(),
        bankName: z.string().max(100).trim().optional().nullable(),
        ifscCode: z.string().max(20).trim().optional().nullable(),
        accountHolderName: z.string().max(100).trim().optional().nullable(),
      })
      .optional(),
    effectiveFrom: z.coerce.date().optional(),
    notes: z.string().max(500).trim().optional().nullable(),
  }),
});

/**
 * Get Salary Schema
 */
export const getSalarySchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});

/**
 * Get Salary History Schema
 */
export const getSalaryHistorySchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});

/**
 * Get All Salaries Query Schema
 */
export const getSalariesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    department: z.string().optional(),
  }),
});

// ==================== OFFER LETTER SCHEMAS ====================

/**
 * Create Offer Letter Schema
 */
export const createOfferLetterSchema = z.object({
  body: z.object({
    userId: objectIdSchema.optional(), // Optional if creating for new candidate
    candidateName: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
    candidateEmail: z.string().email("Invalid email format"),
    designation: z.string().min(2).max(100).trim(),
    department: z.string().max(100).trim().optional().nullable(),
    joiningDate: z.coerce.date(),
    reportingTo: objectIdSchema.optional().nullable(),
    salary: z.object({
      basic: z.number().min(0, "Basic salary cannot be negative"),
      allowances: z.array(allowanceSchema).optional().default([]),
      currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional().default("INR"),
    }),
    employmentType: z
      .enum(["full-time", "part-time", "contract", "internship"])
      .optional()
      .default("full-time"),
    probationPeriod: z.number().min(0).max(12).optional().default(3),
    noticePeriod: z.number().min(0).max(6).optional().default(1),
    workLocation: z.string().max(200).trim().optional().nullable(),
    terms: z.string().max(5000).trim().optional().nullable(),
    notes: z.string().max(1000).trim().optional().nullable(),
  }),
});

/**
 * Update Offer Letter Schema
 */
export const updateOfferLetterSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    candidateName: z.string().min(2).max(100).trim().optional(),
    candidateEmail: z.string().email().optional(),
    designation: z.string().min(2).max(100).trim().optional(),
    department: z.string().max(100).trim().optional().nullable(),
    joiningDate: z.coerce.date().optional(),
    reportingTo: objectIdSchema.optional().nullable(),
    salary: z
      .object({
        basic: z.number().min(0).optional(),
        allowances: z.array(allowanceSchema).optional(),
        currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional(),
      })
      .optional(),
    employmentType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
    probationPeriod: z.number().min(0).max(12).optional(),
    noticePeriod: z.number().min(0).max(6).optional(),
    workLocation: z.string().max(200).trim().optional().nullable(),
    terms: z.string().max(5000).trim().optional().nullable(),
    notes: z.string().max(1000).trim().optional().nullable(),
  }),
});

/**
 * Get Offer Letter Schema
 */
export const getOfferLetterSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

/**
 * Get Offer Letters Query Schema
 */
export const getOfferLettersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    status: z
      .enum(["draft", "sent", "accepted", "rejected", "withdrawn", "expired"])
      .optional(),
    userId: objectIdSchema.optional(),
  }),
});

/**
 * Send Offer Letter Schema
 */
export const sendOfferLetterSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      expiryDays: z.number().int().min(1).max(30).optional().default(7),
    })
    .optional(),
});

/**
 * Accept/Reject Offer Letter Schema
 */
export const respondOfferLetterSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      reason: z.string().max(500).trim().optional().nullable(),
    })
    .optional(),
});

export default {
  // Salary
  createSalarySchema,
  updateSalarySchema,
  getSalarySchema,
  getSalaryHistorySchema,
  getSalariesQuerySchema,
  // Offer Letter
  createOfferLetterSchema,
  updateOfferLetterSchema,
  getOfferLetterSchema,
  getOfferLettersQuerySchema,
  sendOfferLetterSchema,
  respondOfferLetterSchema,
};
