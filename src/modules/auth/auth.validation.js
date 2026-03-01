import { z } from "zod";

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

// Email validation
const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

// Name validation
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name cannot exceed 50 characters")
  .trim();

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format")
  .optional();

/**
 * Register organization schema
 */
export const registerSchema = z.object({
  body: z.object({
    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name cannot exceed 100 characters")
      .trim(),
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number cannot exceed 15 digits")
      .optional(),
  }),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
    organizationId: objectIdSchema,
  }),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  }),
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, "Reset token is required"),
    newPassword: passwordSchema,
  }),
});

/**
 * Invite user schema
 */
export const inviteUserSchema = z.object({
  body: z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    roleId: objectIdSchema,
    teamIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    reportingTo: objectIdSchema,
  }),
});

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Invitation token is required"),
  }),
  body: z.object({
    password: passwordSchema,
  }),
});

export default {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  inviteUserSchema,
  acceptInvitationSchema,
};
