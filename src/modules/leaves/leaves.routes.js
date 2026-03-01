/**
 * Leave Routes
 *
 * API endpoints for leave management.
 */
import express from "express";
import * as controller from "./leaves.controller.js";
import * as validation from "./leaves.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  LEAVE_REQUEST,
  LEAVE_VIEW_OWN,
  LEAVE_VIEW_TEAM,
  LEAVE_VIEW_ALL,
  LEAVE_APPROVE,
  LEAVE_REJECT,
  LEAVE_MANAGE,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// ===================== LEAVE TYPE ROUTES =====================

// Get all leave types (any authenticated user)
router.get("/types", controller.getLeaveTypes);

// Get single leave type
router.get(
  "/types/:id",
  validate(validation.getLeaveTypeSchema),
  controller.getLeaveType
);

// Create leave type (admin only)
router.post(
  "/types",
  permissionMiddleware(LEAVE_MANAGE),
  validate(validation.createLeaveTypeSchema),
  controller.createLeaveType
);

// Update leave type (admin only)
router.put(
  "/types/:id",
  permissionMiddleware(LEAVE_MANAGE),
  validate(validation.updateLeaveTypeSchema),
  controller.updateLeaveType
);

// Delete leave type (admin only)
router.delete(
  "/types/:id",
  permissionMiddleware(LEAVE_MANAGE),
  validate(validation.getLeaveTypeSchema),
  controller.deleteLeaveType
);

// ===================== USER ROUTES =====================

// Get my leave balance
router.get(
  "/balance",
  permissionMiddleware(LEAVE_VIEW_OWN),
  validate(validation.getBalanceQuerySchema),
  controller.getLeaveBalance
);

// Get my leave statistics
router.get(
  "/stats",
  permissionMiddleware(LEAVE_VIEW_OWN),
  validate(validation.getBalanceQuerySchema),
  controller.getLeaveStats
);

// Get my leaves
router.get(
  "/my",
  permissionMiddleware(LEAVE_VIEW_OWN),
  validate(validation.getMyLeavesQuerySchema),
  controller.getMyLeaves
);

// Request a new leave
router.post(
  "/",
  permissionMiddleware(LEAVE_REQUEST),
  validate(validation.requestLeaveSchema),
  controller.requestLeave
);

// Cancel my leave
router.put(
  "/:id/cancel",
  permissionMiddleware(LEAVE_REQUEST),
  validate(validation.cancelLeaveSchema),
  controller.cancelLeave
);

// ===================== MANAGER/TEAM LEAD ROUTES =====================

// Get pending approvals (for team leads/managers)
router.get(
  "/pending",
  permissionMiddleware(LEAVE_VIEW_TEAM),
  validate(validation.getPendingApprovalsQuerySchema),
  controller.getPendingApprovals
);

// Approve leave
router.put(
  "/:id/approve",
  permissionMiddleware(LEAVE_APPROVE),
  validate(validation.approveLeaveSchema),
  controller.approveLeave
);

// Reject leave
router.put(
  "/:id/reject",
  permissionMiddleware(LEAVE_REJECT),
  validate(validation.rejectLeaveSchema),
  controller.rejectLeave
);

// ===================== ADMIN ROUTES =====================

// Get all leaves (admin view)
router.get(
  "/",
  permissionMiddleware(LEAVE_VIEW_ALL),
  validate(validation.getLeavesQuerySchema),
  controller.getLeaves
);

// Adjust user's leave balance
router.post(
  "/balance/:userId/adjust",
  permissionMiddleware(LEAVE_MANAGE),
  validate(validation.adjustBalanceSchema),
  controller.adjustLeaveBalance
);

// Get single leave (any with appropriate permission)
router.get(
  "/:id",
  permissionMiddleware([LEAVE_VIEW_OWN, LEAVE_VIEW_TEAM, LEAVE_VIEW_ALL]),
  validate(validation.getLeaveSchema),
  controller.getLeave
);

export default router;
