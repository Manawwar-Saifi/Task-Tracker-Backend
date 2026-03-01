/**
 * Overtime Routes
 *
 * API endpoints for overtime management.
 */
import express from "express";
import * as controller from "./overtime.controller.js";
import * as validation from "./overtime.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  OVERTIME_REQUEST,
  OVERTIME_READ,
  OVERTIME_UPDATE,
  OVERTIME_DELETE,
  OVERTIME_APPROVE,
  OVERTIME_REJECT,
  OVERTIME_VIEW_OWN,
  OVERTIME_VIEW_TEAM,
  OVERTIME_VIEW_ALL,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// ===================== READ ROUTES =====================

// Get user's own overtime requests
router.get(
  "/my",
  permissionMiddleware(OVERTIME_VIEW_OWN),
  validate(validation.getMyOvertimeQuerySchema),
  controller.getMyOvertime
);

// Get pending overtime approvals
router.get(
  "/pending",
  permissionMiddleware([OVERTIME_APPROVE, OVERTIME_VIEW_ALL, OVERTIME_VIEW_TEAM]),
  controller.getPendingApprovals
);

// Get overtime statistics
router.get(
  "/stats",
  permissionMiddleware([OVERTIME_VIEW_ALL, OVERTIME_VIEW_TEAM, OVERTIME_VIEW_OWN]),
  validate(validation.getStatsQuerySchema),
  controller.getStats
);

// Get overtime report
router.get(
  "/report",
  permissionMiddleware([OVERTIME_VIEW_ALL, OVERTIME_VIEW_TEAM]),
  validate(validation.getReportQuerySchema),
  controller.getReport
);

// Get all overtime requests (paginated)
router.get(
  "/",
  permissionMiddleware([OVERTIME_VIEW_ALL, OVERTIME_VIEW_TEAM]),
  validate(validation.getOvertimeQuerySchema),
  controller.getOvertime
);

// Get single overtime request
router.get(
  "/:id",
  permissionMiddleware([OVERTIME_READ, OVERTIME_VIEW_OWN]),
  validate(validation.getOvertimeSchema),
  controller.getOvertimeById
);

// ===================== WRITE ROUTES =====================

// Request overtime
router.post(
  "/",
  permissionMiddleware(OVERTIME_REQUEST),
  validate(validation.requestOvertimeSchema),
  controller.requestOvertime
);

// Update overtime request (only pending, own request)
router.put(
  "/:id",
  permissionMiddleware(OVERTIME_UPDATE),
  validate(validation.updateOvertimeSchema),
  controller.updateOvertime
);

// Approve overtime request
router.put(
  "/:id/approve",
  permissionMiddleware(OVERTIME_APPROVE),
  validate(validation.approveOvertimeSchema),
  controller.approveOvertime
);

// Reject overtime request
router.put(
  "/:id/reject",
  permissionMiddleware(OVERTIME_REJECT),
  validate(validation.rejectOvertimeSchema),
  controller.rejectOvertime
);

// Cancel overtime request (own pending request)
router.put(
  "/:id/cancel",
  permissionMiddleware(OVERTIME_REQUEST),
  validate(validation.getOvertimeSchema),
  controller.cancelOvertime
);

// Delete overtime request
router.delete(
  "/:id",
  permissionMiddleware(OVERTIME_DELETE),
  validate(validation.getOvertimeSchema),
  controller.deleteOvertime
);

export default router;
