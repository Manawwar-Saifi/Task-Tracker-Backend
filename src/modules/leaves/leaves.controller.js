/**
 * Leave Controller
 *
 * HTTP handlers for leave management.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as leaveService from "./leaves.service.js";

// ===================== Leave Type Controllers =====================

/**
 * Get all leave types
 * GET /leaves/types
 */
export const getLeaveTypes = asyncHandler(async (req, res) => {
  const leaveTypes = await leaveService.getLeaveTypes(req.user.organizationId);
  return successResponse(res, 200, "Leave types retrieved", { leaveTypes });
});

/**
 * Get a single leave type
 * GET /leaves/types/:id
 */
export const getLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.getLeaveType(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, "Leave type retrieved", { leaveType });
});

/**
 * Create a new leave type
 * POST /leaves/types
 */
export const createLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.createLeaveType(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Leave type created", { leaveType });
});

/**
 * Update a leave type
 * PUT /leaves/types/:id
 */
export const updateLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.updateLeaveType(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Leave type updated", { leaveType });
});

/**
 * Delete a leave type
 * DELETE /leaves/types/:id
 */
export const deleteLeaveType = asyncHandler(async (req, res) => {
  const result = await leaveService.deleteLeaveType(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, result.message);
});

// ===================== Leave Request Controllers =====================

/**
 * Request a new leave
 * POST /leaves
 */
export const requestLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.requestLeave(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Leave request submitted", { leave });
});

/**
 * Get all leaves (admin/manager view)
 * GET /leaves
 */
export const getLeaves = asyncHandler(async (req, res) => {
  const data = await leaveService.getLeaves(req.user.organizationId, req.query);
  return successResponse(res, 200, "Leaves retrieved", data);
});

/**
 * Get my leaves
 * GET /leaves/my
 */
export const getMyLeaves = asyncHandler(async (req, res) => {
  const data = await leaveService.getMyLeaves(
    req.user.organizationId,
    req.user.userId,
    req.query
  );
  return successResponse(res, 200, "Your leaves retrieved", data);
});

/**
 * Get a single leave request
 * GET /leaves/:id
 */
export const getLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.getLeave(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, "Leave retrieved", { leave });
});

/**
 * Get pending approvals
 * GET /leaves/pending
 */
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const data = await leaveService.getPendingApprovals(
    req.user.organizationId,
    req.user.userId,
    req.query
  );
  return successResponse(res, 200, "Pending approvals retrieved", data);
});

/**
 * Approve a leave request
 * PUT /leaves/:id/approve
 */
export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.approveLeave(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body.notes
  );
  return successResponse(res, 200, "Leave approved", { leave });
});

/**
 * Reject a leave request
 * PUT /leaves/:id/reject
 */
export const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.rejectLeave(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body.reason
  );
  return successResponse(res, 200, "Leave rejected", { leave });
});

/**
 * Cancel a leave request
 * PUT /leaves/:id/cancel
 */
export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.cancelLeave(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body.reason
  );
  return successResponse(res, 200, "Leave cancelled", { leave });
});

// ===================== Balance Controllers =====================

/**
 * Get my leave balance
 * GET /leaves/balance
 */
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const year = req.query.year
    ? parseInt(req.query.year)
    : new Date().getFullYear();

  const balances = await leaveService.getLeaveBalance(
    req.user.organizationId,
    req.user.userId,
    year
  );
  return successResponse(res, 200, "Leave balance retrieved", { balances, year });
});

/**
 * Adjust leave balance (admin only)
 * POST /leaves/balance/:userId/adjust
 */
export const adjustLeaveBalance = asyncHandler(async (req, res) => {
  const balance = await leaveService.adjustLeaveBalance(
    req.user.organizationId,
    req.params.userId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Balance adjusted", { balance });
});

/**
 * Get leave statistics
 * GET /leaves/stats
 */
export const getLeaveStats = asyncHandler(async (req, res) => {
  const year = req.query.year
    ? parseInt(req.query.year)
    : new Date().getFullYear();

  const stats = await leaveService.getLeaveStats(
    req.user.organizationId,
    req.user.userId,
    year
  );
  return successResponse(res, 200, "Leave statistics retrieved", { stats });
});

export default {
  // Leave Types
  getLeaveTypes,
  getLeaveType,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  // Leave Requests
  requestLeave,
  getLeaves,
  getMyLeaves,
  getLeave,
  getPendingApprovals,
  approveLeave,
  rejectLeave,
  cancelLeave,
  // Balance
  getLeaveBalance,
  adjustLeaveBalance,
  getLeaveStats,
};
