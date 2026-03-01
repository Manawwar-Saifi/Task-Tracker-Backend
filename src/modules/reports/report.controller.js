/**
 * Report Controller
 *
 * HTTP handlers for report generation and analytics.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as reportService from "./report.service.js";

/**
 * Get all reports
 * GET /reports
 */
export const getReports = asyncHandler(async (req, res) => {
  const data = await reportService.getReports(req.user.organizationId, req.query);
  return successResponse(res, 200, "Reports retrieved", data);
});

/**
 * Get report by ID
 * GET /reports/:id
 */
export const getReportById = asyncHandler(async (req, res) => {
  const report = await reportService.getReportById(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, "Report retrieved", { report });
});

/**
 * Generate report
 * POST /reports/generate
 */
export const generateReport = asyncHandler(async (req, res) => {
  const report = await reportService.generateReport(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Report generated", { report });
});

/**
 * Delete report
 * DELETE /reports/:id
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const result = await reportService.deleteReport(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, result.message);
});

/**
 * Get attendance report
 * GET /reports/attendance
 */
export const getAttendanceReport = asyncHandler(async (req, res) => {
  const report = await reportService.getAttendanceReport(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Attendance report generated", report);
});

/**
 * Get leave report
 * GET /reports/leave
 */
export const getLeaveReport = asyncHandler(async (req, res) => {
  const report = await reportService.getLeaveReport(req.user.organizationId, req.query);
  return successResponse(res, 200, "Leave report generated", report);
});

/**
 * Get task report
 * GET /reports/task
 */
export const getTaskReport = asyncHandler(async (req, res) => {
  const report = await reportService.getTaskReport(req.user.organizationId, req.query);
  return successResponse(res, 200, "Task report generated", report);
});

/**
 * Get overtime report
 * GET /reports/overtime
 */
export const getOvertimeReport = asyncHandler(async (req, res) => {
  const report = await reportService.getOvertimeReport(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Overtime report generated", report);
});

/**
 * Get dashboard data
 * GET /reports/dashboard
 */
export const getDashboardData = asyncHandler(async (req, res) => {
  const data = await reportService.getDashboardData(
    req.user.organizationId,
    req.query.period
  );
  return successResponse(res, 200, "Dashboard data retrieved", data);
});

export default {
  getReports,
  getReportById,
  generateReport,
  deleteReport,
  getAttendanceReport,
  getLeaveReport,
  getTaskReport,
  getOvertimeReport,
  getDashboardData,
};
