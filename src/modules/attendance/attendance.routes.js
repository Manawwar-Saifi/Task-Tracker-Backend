/**
 * Attendance Routes
 *
 * API endpoints for attendance management.
 */
import express from "express";
import * as controller from "./attendance.controller.js";
import * as validation from "./attendance.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  ATTENDANCE_CLOCK_IN,
  ATTENDANCE_CLOCK_OUT,
  ATTENDANCE_VIEW_OWN,
  ATTENDANCE_VIEW_TEAM,
  ATTENDANCE_VIEW_ALL,
  ATTENDANCE_UPDATE,
  ATTENDANCE_MANAGE,
  ATTENDANCE_SET_TIMER,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// ===================== USER ROUTES =====================

// Get today's attendance status (any authenticated user)
router.get("/today", controller.getTodayStatus);

// Clock in
router.post(
  "/clock-in",
  permissionMiddleware(ATTENDANCE_CLOCK_IN),
  validate(validation.clockInSchema),
  controller.clockIn
);

// Clock out
router.post(
  "/clock-out",
  permissionMiddleware(ATTENDANCE_CLOCK_OUT),
  validate(validation.clockOutSchema),
  controller.clockOut
);

// Start break
router.post(
  "/break/start",
  permissionMiddleware(ATTENDANCE_CLOCK_IN),
  validate(validation.startBreakSchema),
  controller.startBreak
);

// End break
router.post(
  "/break/end",
  permissionMiddleware(ATTENDANCE_CLOCK_IN),
  controller.endBreak
);

// Get my attendance history
router.get(
  "/my",
  permissionMiddleware(ATTENDANCE_VIEW_OWN),
  validate(validation.getAttendanceQuerySchema),
  controller.getMyAttendance
);

// ===================== REPORTS =====================

// Get attendance summary/statistics
router.get(
  "/summary",
  permissionMiddleware([ATTENDANCE_VIEW_OWN, ATTENDANCE_VIEW_TEAM, ATTENDANCE_VIEW_ALL]),
  validate(validation.getSummarySchema),
  controller.getSummary
);

// ===================== TEAM/MANAGER ROUTES =====================

// Get team attendance
router.get(
  "/team/:teamId",
  permissionMiddleware(ATTENDANCE_VIEW_TEAM),
  validate(validation.getTeamAttendanceSchema),
  controller.getTeamAttendance
);

// ===================== ADMIN ROUTES =====================

// Get attendance settings
router.get(
  "/settings",
  permissionMiddleware(ATTENDANCE_MANAGE),
  controller.getSettings
);

// Update attendance settings
router.put(
  "/settings",
  permissionMiddleware(ATTENDANCE_SET_TIMER),
  validate(validation.updateSettingsSchema),
  controller.updateSettings
);

// Get all attendance records (admin)
router.get(
  "/",
  permissionMiddleware(ATTENDANCE_VIEW_ALL),
  validate(validation.getAttendanceQuerySchema),
  controller.getAttendance
);

// Create manual attendance entry (admin)
router.post(
  "/manual",
  permissionMiddleware(ATTENDANCE_MANAGE),
  validate(validation.manualEntrySchema),
  controller.createManualEntry
);

// Update attendance record (admin)
router.put(
  "/:id",
  permissionMiddleware(ATTENDANCE_UPDATE),
  validate(validation.updateAttendanceSchema),
  controller.updateAttendanceRecord
);

export default router;
