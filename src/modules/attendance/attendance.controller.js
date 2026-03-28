/**
 * Attendance Controller
 *
 * HTTP handlers for attendance management.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as attendanceService from "./attendance.service.js";

/**
 * Get today's attendance status
 * GET /attendance/today
 */
export const getTodayStatus = asyncHandler(async (req, res) => {
  const status = await attendanceService.getTodayStatus(
    req.user.organizationId,
    req.user.userId
  );
  return successResponse(res, 200, "Today's status retrieved", { status });
});

/**
 * Clock in
 * POST /attendance/clock-in
 */
export const clockIn = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.clockIn(
    req.user.organizationId,
    req.user.userId,
    req.body || {}
  );
  return successResponse(res, 200, "Clocked in successfully", { attendance });
});

/**
 * Clock out
 * POST /attendance/clock-out
 */
export const clockOut = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.clockOut(
    req.user.organizationId,
    req.user.userId,
    req.body || {}
  );
  return successResponse(res, 200, "Clocked out successfully", { attendance });
});

/**
 * Start break
 * POST /attendance/break/start
 */
export const startBreak = asyncHandler(async (req, res) => {
  const type = req.body?.type || "other";
  const attendance = await attendanceService.startBreak(
    req.user.organizationId,
    req.user.userId,
    type
  );
  return successResponse(res, 200, "Break started", { attendance });
});

/**
 * End break
 * POST /attendance/break/end
 */
export const endBreak = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.endBreak(
    req.user.organizationId,
    req.user.userId
  );
  return successResponse(res, 200, "Break ended", { attendance });
});

/**
 * Get attendance records (admin/manager)
 * GET /attendance
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const { isOwner, isSuperAdmin, roleLevel, userId, permissions, directPermissions } = req.user;
  const allPerms = new Set([...(permissions || []), ...(directPermissions || [])]);
  let scopedQuery = { ...req.query };

  // Scope by role: employee sees only own, team lead sees team, admin sees all
  if (!isOwner && !isSuperAdmin && roleLevel !== 1) {
    if (allPerms.has("ATTENDANCE_VIEW_ALL")) { /* see all */ }
    else if (allPerms.has("ATTENDANCE_VIEW_TEAM")) { /* team scope — pass through, filtered by teamId if set */ }
    else { scopedQuery.userId = userId; } // VIEW_OWN — only own records
  }

  const data = await attendanceService.getAttendance(
    req.user.organizationId,
    scopedQuery
  );
  return successResponse(res, 200, "Attendance records retrieved", data);
});

/**
 * Get my attendance history
 * GET /attendance/my
 */
export const getMyAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.getMyAttendance(
    req.user.organizationId,
    req.user.userId,
    req.query
  );
  return successResponse(res, 200, "Your attendance retrieved", data);
});

/**
 * Get team attendance
 * GET /attendance/team/:teamId
 */
export const getTeamAttendance = asyncHandler(async (req, res) => {
  const date = req.query.date || null;
  const data = await attendanceService.getTeamAttendance(
    req.user.organizationId,
    req.params.teamId,
    date
  );
  return successResponse(res, 200, "Team attendance retrieved", data);
});

/**
 * Get attendance summary/statistics
 * GET /attendance/summary
 */
export const getSummary = asyncHandler(async (req, res) => {
  const { isOwner, isSuperAdmin, roleLevel, userId, permissions, directPermissions } = req.user;
  const allPerms = new Set([...(permissions || []), ...(directPermissions || [])]);
  let scopedQuery = { ...req.query };

  if (!isOwner && !isSuperAdmin && roleLevel !== 1) {
    if (allPerms.has("ATTENDANCE_VIEW_ALL")) { /* see all */ }
    else { scopedQuery.userId = userId; } // Own stats only
  }

  const data = await attendanceService.getSummary(
    req.user.organizationId,
    scopedQuery
  );
  return successResponse(res, 200, "Attendance summary retrieved", data);
});

/**
 * Get attendance settings
 * GET /attendance/settings
 */
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await attendanceService.getSettings(req.user.organizationId);
  return successResponse(res, 200, "Settings retrieved", { settings });
});

/**
 * Update attendance settings
 * PUT /attendance/settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await attendanceService.updateSettings(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Settings updated successfully", {
    settings,
  });
});

/**
 * Update attendance record (admin)
 * PUT /attendance/:id
 */
export const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.updateAttendanceRecord(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Attendance record updated", { attendance });
});

/**
 * Create manual attendance entry (admin)
 * POST /attendance/manual
 */
export const createManualEntry = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.createManualEntry(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Manual entry created", { attendance });
});

export default {
  getTodayStatus,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAttendance,
  getMyAttendance,
  getTeamAttendance,
  getSummary,
  getSettings,
  updateSettings,
  updateAttendanceRecord,
  createManualEntry,
};
