/**
 * Application Constants
 * Centralized constants for status codes, limits, default values
 *
 * Usage: import { PLAN_LIMITS, USER_STATUS } from './config/constants.js'
 */

// ============================================
// SUBSCRIPTION PLAN LIMITS
// ============================================
export const PLAN_LIMITS = {
  FREE: { maxUsers: 3, maxTeams: 1, price: 0 }, // Downgrade tier after trial expires
  STARTER: { maxUsers: 10, maxTeams: 3, price: 999 },
  PROFESSIONAL: { maxUsers: 50, maxTeams: 15, price: 2999 },
  ENTERPRISE: { maxUsers: -1, maxTeams: -1, price: 9999 }, // -1 = unlimited
};

// ============================================
// STATUS ENUMS
// ============================================

// Subscription status
export const SUBSCRIPTION_STATUS = {
  TRIAL: "trial",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  PAST_DUE: "past_due",
};

// User account status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  INVITED: "invited",
  SUSPENDED: "suspended",
};

// Leave request status
export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

// Task status workflow
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  BLOCKED: "blocked",
};

// Task priority levels
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// Daily attendance status
export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half_day",
  LEAVE: "leave",
  HOLIDAY: "holiday",
};

// Overtime request status
export const OVERTIME_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// ============================================
// PAGINATION DEFAULTS
// ============================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// ============================================
// TOKEN EXPIRY (in seconds)
// ============================================
export const TOKEN_EXPIRY = {
  ACCESS: 15 * 60, // 15 minutes
  REFRESH: 7 * 24 * 60 * 60, // 7 days
  RESET_PASSWORD: 60 * 60, // 1 hour
  INVITE: 7 * 24 * 60 * 60, // 7 days
};

// ============================================
// ROLE HIERARCHY LEVELS
// Lower number = higher authority
// ============================================
export const ROLE_LEVELS = {
  CEO: 1,
  MANAGER: 2,
  TEAM_LEAD: 3,
  EMPLOYEE: 4,
};

// ============================================
// HTTP STATUS CODES
// ============================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

// ============================================
// TRIAL PERIOD
// ============================================
export const TRIAL_DAYS = 14;

// ============================================
// FILE UPLOAD LIMITS
// ============================================
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOC_TYPES: ["application/pdf"],
};

// Export all as default object for convenience
export default {
  PLAN_LIMITS,
  SUBSCRIPTION_STATUS,
  USER_STATUS,
  LEAVE_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  ATTENDANCE_STATUS,
  OVERTIME_STATUS,
  PAGINATION,
  TOKEN_EXPIRY,
  ROLE_LEVELS,
  HTTP_STATUS,
  TRIAL_DAYS,
  UPLOAD_LIMITS,
};
