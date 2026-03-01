/**
 * Overtime Service
 *
 * Business logic for overtime management.
 */
import Overtime from "./overtime.model.js";
import User from "../users/model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Get all overtime requests with pagination and filters
 */
export const getOvertime = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    userId,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const query = {
    organizationId,
    isDeleted: false,
  };

  if (status) query.status = status;
  if (userId) query.userId = userId;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [overtime, total] = await Promise.all([
    Overtime.find(query)
      .populate("userId", "firstName lastName email avatar")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Overtime.countDocuments(query),
  ]);

  return {
    overtime,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user's own overtime requests
 */
export const getMyOvertime = async (organizationId, userId, options = {}) => {
  const { status, year, month } = options;

  const query = {
    organizationId,
    userId,
    isDeleted: false,
  };

  if (status) query.status = status;

  if (year) {
    const startDate = new Date(year, month ? month - 1 : 0, 1);
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59, 999)
      : new Date(year, 11, 31, 23, 59, 59, 999);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const overtime = await Overtime.find(query)
    .populate("approvedBy", "firstName lastName email")
    .populate("rejectedBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();

  return overtime;
};

/**
 * Get pending overtime approvals
 */
export const getPendingApprovals = async (organizationId, options = {}) => {
  const { teamId } = options;

  let query = {
    organizationId,
    status: "pending",
    isDeleted: false,
  };

  let overtime = await Overtime.find(query)
    .populate("userId", "firstName lastName email avatar teamIds")
    .sort({ createdAt: 1 })
    .lean();

  // Filter by team if provided
  if (teamId) {
    overtime = overtime.filter((o) =>
      o.userId?.teamIds?.some((t) => t.toString() === teamId)
    );
  }

  return overtime;
};

/**
 * Get overtime by ID
 */
export const getOvertimeById = async (organizationId, overtimeId) => {
  const overtime = await Overtime.findOne({
    _id: overtimeId,
    organizationId,
    isDeleted: false,
  })
    .populate("userId", "firstName lastName email avatar")
    .populate("approvedBy", "firstName lastName email")
    .populate("rejectedBy", "firstName lastName email")
    .lean();

  if (!overtime) {
    throw new AppError("Overtime request not found", 404);
  }

  return overtime;
};

/**
 * Request overtime
 */
export const requestOvertime = async (organizationId, userId, data) => {
  const { date, hours, reason, attendanceId } = data;

  // Check if overtime already exists for this date
  const hasExisting = await Overtime.hasExistingRequest(
    organizationId,
    userId,
    date
  );

  if (hasExisting) {
    throw new AppError("Overtime already requested for this date", 400);
  }

  const overtime = await Overtime.create({
    organizationId,
    userId,
    date,
    hours,
    reason,
    attendanceId: attendanceId || null,
  });

  const populated = await Overtime.findById(overtime._id)
    .populate("userId", "firstName lastName email avatar")
    .lean();

  logger.info(`Overtime requested: ${overtime._id} by user ${userId}`);

  return populated;
};

/**
 * Update overtime request (only pending)
 */
export const updateOvertime = async (organizationId, overtimeId, userId, data) => {
  const overtime = await Overtime.findOne({
    _id: overtimeId,
    organizationId,
    userId,
    isDeleted: false,
  });

  if (!overtime) {
    throw new AppError("Overtime request not found", 404);
  }

  if (overtime.status !== "pending") {
    throw new AppError("Can only update pending requests", 400);
  }

  const { date, hours, reason } = data;

  // If changing date, check for existing request
  if (date && date.toISOString() !== overtime.date.toISOString()) {
    const hasExisting = await Overtime.hasExistingRequest(
      organizationId,
      userId,
      date,
      overtimeId
    );

    if (hasExisting) {
      throw new AppError("Overtime already requested for this date", 400);
    }
    overtime.date = date;
  }

  if (hours !== undefined) overtime.hours = hours;
  if (reason !== undefined) overtime.reason = reason;

  await overtime.save();

  logger.info(`Overtime updated: ${overtime._id}`);

  return overtime;
};

/**
 * Approve overtime request
 */
export const approveOvertime = async (organizationId, overtimeId, approverId, notes) => {
  const overtime = await Overtime.findOne({
    _id: overtimeId,
    organizationId,
    isDeleted: false,
  });

  if (!overtime) {
    throw new AppError("Overtime request not found", 404);
  }

  if (overtime.status !== "pending") {
    throw new AppError("Overtime request is not pending", 400);
  }

  // Cannot approve own request
  if (overtime.userId.toString() === approverId) {
    throw new AppError("Cannot approve your own overtime request", 400);
  }

  overtime.approve(approverId, notes);
  await overtime.save();

  const populated = await Overtime.findById(overtime._id)
    .populate("userId", "firstName lastName email avatar")
    .populate("approvedBy", "firstName lastName email")
    .lean();

  logger.info(`Overtime approved: ${overtime._id} by ${approverId}`);

  return populated;
};

/**
 * Reject overtime request
 */
export const rejectOvertime = async (organizationId, overtimeId, rejectedBy, reason) => {
  const overtime = await Overtime.findOne({
    _id: overtimeId,
    organizationId,
    isDeleted: false,
  });

  if (!overtime) {
    throw new AppError("Overtime request not found", 404);
  }

  if (overtime.status !== "pending") {
    throw new AppError("Overtime request is not pending", 400);
  }

  // Cannot reject own request
  if (overtime.userId.toString() === rejectedBy) {
    throw new AppError("Cannot reject your own overtime request", 400);
  }

  overtime.reject(rejectedBy, reason);
  await overtime.save();

  const populated = await Overtime.findById(overtime._id)
    .populate("userId", "firstName lastName email avatar")
    .populate("rejectedBy", "firstName lastName email")
    .lean();

  logger.info(`Overtime rejected: ${overtime._id} by ${rejectedBy}`);

  return populated;
};

/**
 * Cancel overtime request (user cancels their own pending request)
 */
export const cancelOvertime = async (organizationId, overtimeId, userId) => {
  const overtime = await Overtime.findOne({
    _id: overtimeId,
    organizationId,
    userId,
    isDeleted: false,
  });

  if (!overtime) {
    throw new AppError("Overtime request not found", 404);
  }

  if (overtime.status !== "pending") {
    throw new AppError("Can only cancel pending requests", 400);
  }

  overtime.cancel();
  await overtime.save();

  logger.info(`Overtime cancelled: ${overtime._id}`);

  return { message: "Overtime request cancelled successfully" };
};

/**
 * Delete overtime request (soft delete)
 */
export const deleteOvertime = async (organizationId, overtimeId, userId) => {
  const overtime = await Overtime.findOne({
    _id: overtimeId,
    organizationId,
    isDeleted: false,
  });

  if (!overtime) {
    throw new AppError("Overtime request not found", 404);
  }

  // Only allow delete if pending or if user is admin/owner
  if (overtime.status !== "pending" && overtime.userId.toString() === userId) {
    throw new AppError("Can only delete pending requests", 400);
  }

  overtime.isDeleted = true;
  await overtime.save();

  logger.info(`Overtime deleted: ${overtime._id}`);

  return { message: "Overtime request deleted successfully" };
};

/**
 * Get overtime statistics
 */
export const getStats = async (organizationId, options = {}) => {
  return Overtime.getStats(organizationId, options);
};

/**
 * Get overtime report
 */
export const getReport = async (organizationId, options = {}) => {
  return Overtime.getReport(organizationId, options);
};

export default {
  getOvertime,
  getMyOvertime,
  getPendingApprovals,
  getOvertimeById,
  requestOvertime,
  updateOvertime,
  approveOvertime,
  rejectOvertime,
  cancelOvertime,
  deleteOvertime,
  getStats,
  getReport,
};
