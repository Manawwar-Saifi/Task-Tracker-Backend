/**
 * Overtime Controller
 *
 * HTTP handlers for overtime management.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as overtimeService from "./overtime.service.js";

/**
 * Get all overtime requests
 * GET /overtime
 */
export const getOvertime = asyncHandler(async (req, res) => {
  const data = await overtimeService.getOvertime(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Overtime requests retrieved", data);
});

/**
 * Get user's own overtime requests
 * GET /overtime/my
 */
export const getMyOvertime = asyncHandler(async (req, res) => {
  const overtime = await overtimeService.getMyOvertime(
    req.user.organizationId,
    req.user.userId,
    req.query
  );
  return successResponse(res, 200, "Your overtime requests retrieved", { overtime });
});

/**
 * Get pending overtime approvals
 * GET /overtime/pending
 */
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const overtime = await overtimeService.getPendingApprovals(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Pending overtime approvals retrieved", { overtime });
});

/**
 * Get overtime statistics
 * GET /overtime/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await overtimeService.getStats(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Overtime statistics retrieved", { stats });
});

/**
 * Get overtime report
 * GET /overtime/report
 */
export const getReport = asyncHandler(async (req, res) => {
  const report = await overtimeService.getReport(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Overtime report retrieved", report);
});

/**
 * Get overtime by ID
 * GET /overtime/:id
 */
export const getOvertimeById = asyncHandler(async (req, res) => {
  const overtime = await overtimeService.getOvertimeById(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, "Overtime request retrieved", { overtime });
});

/**
 * Request overtime
 * POST /overtime
 */
export const requestOvertime = asyncHandler(async (req, res) => {
  const overtime = await overtimeService.requestOvertime(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Overtime request submitted", { overtime });
});

/**
 * Update overtime request
 * PUT /overtime/:id
 */
export const updateOvertime = asyncHandler(async (req, res) => {
  const overtime = await overtimeService.updateOvertime(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Overtime request updated", { overtime });
});

/**
 * Approve overtime request
 * PUT /overtime/:id/approve
 */
export const approveOvertime = asyncHandler(async (req, res) => {
  const overtime = await overtimeService.approveOvertime(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body?.notes
  );
  return successResponse(res, 200, "Overtime request approved", { overtime });
});

/**
 * Reject overtime request
 * PUT /overtime/:id/reject
 */
export const rejectOvertime = asyncHandler(async (req, res) => {
  const overtime = await overtimeService.rejectOvertime(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body.reason
  );
  return successResponse(res, 200, "Overtime request rejected", { overtime });
});

/**
 * Cancel overtime request
 * PUT /overtime/:id/cancel
 */
export const cancelOvertime = asyncHandler(async (req, res) => {
  const result = await overtimeService.cancelOvertime(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, result.message);
});

/**
 * Delete overtime request
 * DELETE /overtime/:id
 */
export const deleteOvertime = asyncHandler(async (req, res) => {
  const result = await overtimeService.deleteOvertime(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, result.message);
});

export default {
  getOvertime,
  getMyOvertime,
  getPendingApprovals,
  getStats,
  getReport,
  getOvertimeById,
  requestOvertime,
  updateOvertime,
  approveOvertime,
  rejectOvertime,
  cancelOvertime,
  deleteOvertime,
};
