/**
 * Leave Service
 *
 * Business logic for leave management.
 */
import { Leave, LeaveBalance } from "./leaves.model.js";
import LeaveType from "./leaveType.model.js";
import Team from "../teams/teams.model.js";
import User from "../users/model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

// ===================== Leave Type Operations =====================

/**
 * Get all leave types for an organization
 */
export const getLeaveTypes = async (organizationId) => {
  const leaveTypes = await LeaveType.find({ organizationId, isActive: true })
    .sort({ name: 1 })
    .lean();

  return leaveTypes;
};

/**
 * Get a single leave type
 */
export const getLeaveType = async (organizationId, leaveTypeId) => {
  const leaveType = await LeaveType.findOne({
    _id: leaveTypeId,
    organizationId,
  }).lean();

  if (!leaveType) {
    throw new AppError("Leave type not found", 404);
  }

  return leaveType;
};

/**
 * Create a new leave type
 */
export const createLeaveType = async (organizationId, userId, data) => {
  // Check for duplicate code
  const existing = await LeaveType.findOne({
    organizationId,
    code: data.code,
  });

  if (existing) {
    throw new AppError(`Leave type with code '${data.code}' already exists`, 409);
  }

  const leaveType = await LeaveType.create({
    ...data,
    organizationId,
    createdBy: userId,
    updatedBy: userId,
  });

  logger.info(`Leave type created: ${leaveType.name} in org: ${organizationId}`);
  return leaveType;
};

/**
 * Update a leave type
 */
export const updateLeaveType = async (organizationId, leaveTypeId, userId, data) => {
  const leaveType = await LeaveType.findOne({
    _id: leaveTypeId,
    organizationId,
  });

  if (!leaveType) {
    throw new AppError("Leave type not found", 404);
  }

  // Cannot change code of system leave types
  if (leaveType.isSystem && data.code && data.code !== leaveType.code) {
    throw new AppError("Cannot change code of system leave type", 400);
  }

  Object.assign(leaveType, data);
  leaveType.updatedBy = userId;
  await leaveType.save();

  logger.info(`Leave type updated: ${leaveType.name}`);
  return leaveType;
};

/**
 * Delete a leave type (soft delete by deactivating)
 */
export const deleteLeaveType = async (organizationId, leaveTypeId) => {
  const leaveType = await LeaveType.findOne({
    _id: leaveTypeId,
    organizationId,
  });

  if (!leaveType) {
    throw new AppError("Leave type not found", 404);
  }

  if (leaveType.isSystem) {
    throw new AppError("Cannot delete system leave type", 400);
  }

  // Check if there are any leaves using this type
  const leavesCount = await Leave.countDocuments({
    leaveTypeId,
    status: { $in: ["pending", "approved"] },
  });

  if (leavesCount > 0) {
    throw new AppError(
      "Cannot delete leave type with active leaves. Deactivate it instead.",
      400
    );
  }

  leaveType.isActive = false;
  await leaveType.save();

  logger.info(`Leave type deactivated: ${leaveType.name}`);
  return { message: "Leave type deleted successfully" };
};

// ===================== Leave Request Operations =====================

/**
 * Calculate total days for a leave request
 */
const calculateLeaveDays = (startDate, endDate, isHalfDay) => {
  if (isHalfDay) return 0.5;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Exclude weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }

  return days || 1; // Minimum 1 day if same date
};

/**
 * Request a new leave
 */
export const requestLeave = async (organizationId, userId, data) => {
  // Validate leave type
  const leaveType = await LeaveType.findOne({
    _id: data.leaveTypeId,
    organizationId,
    isActive: true,
  });

  if (!leaveType) {
    throw new AppError("Invalid or inactive leave type", 400);
  }

  // Check for overlapping leaves
  const hasOverlap = await Leave.hasOverlap(userId, data.startDate, data.endDate);
  if (hasOverlap) {
    throw new AppError("Leave dates overlap with an existing leave request", 400);
  }

  // Calculate total days
  const totalDays = calculateLeaveDays(data.startDate, data.endDate, data.isHalfDay);

  // Check minimum notice period
  if (leaveType.minDaysNotice > 0 && !data.isEmergency) {
    const today = new Date();
    const startDate = new Date(data.startDate);
    const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < leaveType.minDaysNotice) {
      throw new AppError(
        `This leave type requires ${leaveType.minDaysNotice} days notice`,
        400
      );
    }
  }

  // Check max consecutive days
  if (leaveType.maxConsecutiveDays > 0 && totalDays > leaveType.maxConsecutiveDays) {
    throw new AppError(
      `Maximum ${leaveType.maxConsecutiveDays} consecutive days allowed for this leave type`,
      400
    );
  }

  // Check leave balance (for paid leaves with limits)
  if (leaveType.isPaid && leaveType.allowedDays > 0) {
    const balance = await LeaveBalance.getOrCreate(
      organizationId,
      userId,
      data.leaveTypeId
    );
    const available = balance.allocated + balance.carriedForward + balance.adjusted - balance.used - balance.pending;

    if (totalDays > available) {
      throw new AppError(
        `Insufficient leave balance. Available: ${available} days`,
        400
      );
    }
  }

  // Create leave request
  const leave = await Leave.create({
    organizationId,
    userId,
    leaveTypeId: data.leaveTypeId,
    startDate: data.startDate,
    endDate: data.endDate,
    totalDays,
    isHalfDay: data.isHalfDay || false,
    halfDayPeriod: data.isHalfDay ? data.halfDayPeriod : null,
    reason: data.reason,
    isEmergency: data.isEmergency || false,
    contactNumber: data.contactNumber || null,
    notes: data.notes || null,
    status: leaveType.requiresApproval ? "pending" : "approved",
    appliedAt: new Date(),
  });

  // Update balance (add to pending)
  if (leaveType.isPaid && leaveType.allowedDays > 0) {
    await LeaveBalance.addPending(organizationId, userId, data.leaveTypeId, totalDays);
  }

  // Auto-approve if no approval required
  if (!leaveType.requiresApproval) {
    leave.approvedAt = new Date();
    await leave.save();

    // Move from pending to used
    if (leaveType.isPaid && leaveType.allowedDays > 0) {
      await LeaveBalance.deductLeave(organizationId, userId, data.leaveTypeId, totalDays);
    }
  }

  logger.info(`Leave requested by user ${userId}: ${totalDays} days`);

  // Populate and return
  return await Leave.findById(leave._id)
    .populate("leaveTypeId", "name code color")
    .lean();
};

/**
 * Get all leaves (admin/manager view)
 */
export const getLeaves = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    leaveTypeId,
    userId,
    startDate,
    endDate,
    sortBy = "appliedAt",
    sortOrder = "desc",
  } = options;

  const query = { organizationId };

  if (status) query.status = status;
  if (leaveTypeId) query.leaveTypeId = leaveTypeId;
  if (userId) query.userId = userId;
  if (startDate) query.startDate = { $gte: new Date(startDate) };
  if (endDate) query.endDate = { $lte: new Date(endDate) };

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [leaves, total] = await Promise.all([
    Leave.find(query)
      .populate("userId", "firstName lastName email avatar")
      .populate("leaveTypeId", "name code color")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Leave.countDocuments(query),
  ]);

  return {
    leaves,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get my leaves
 */
export const getMyLeaves = async (organizationId, userId, options = {}) => {
  const { page = 1, limit = 10, status, leaveTypeId, year } = options;

  const query = { organizationId, userId };

  if (status) query.status = status;
  if (leaveTypeId) query.leaveTypeId = leaveTypeId;
  if (year) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    query.startDate = { $gte: yearStart, $lte: yearEnd };
  }

  const [leaves, total] = await Promise.all([
    Leave.find(query)
      .populate("leaveTypeId", "name code color")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Leave.countDocuments(query),
  ]);

  return {
    leaves,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single leave request
 */
export const getLeave = async (organizationId, leaveId) => {
  const leave = await Leave.findOne({ _id: leaveId, organizationId })
    .populate("userId", "firstName lastName email avatar")
    .populate("leaveTypeId", "name code color isPaid")
    .populate("approvedBy", "firstName lastName")
    .populate("rejectedBy", "firstName lastName")
    .populate("cancelledBy", "firstName lastName")
    .lean();

  if (!leave) {
    throw new AppError("Leave request not found", 404);
  }

  return leave;
};

/**
 * Get pending approvals for a manager/team lead
 */
export const getPendingApprovals = async (organizationId, userId, options = {}) => {
  const { page = 1, limit = 10, teamId } = options;

  // Get teams where user is leader
  let teamMemberIds = [];

  if (teamId) {
    // Specific team
    const team = await Team.findOne({ _id: teamId, organizationId, leaderId: userId });
    if (team) {
      teamMemberIds = team.getMemberIds();
    }
  } else {
    // All teams led by user
    const teams = await Team.find({ organizationId, leaderId: userId });
    for (const team of teams) {
      teamMemberIds.push(...team.getMemberIds());
    }
  }

  // Remove duplicates and self
  teamMemberIds = [...new Set(teamMemberIds.map(id => id.toString()))];
  teamMemberIds = teamMemberIds.filter(id => id !== userId.toString());

  if (teamMemberIds.length === 0) {
    return { leaves: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  const query = {
    organizationId,
    userId: { $in: teamMemberIds },
    status: "pending",
  };

  const [leaves, total] = await Promise.all([
    Leave.find(query)
      .populate("userId", "firstName lastName email avatar")
      .populate("leaveTypeId", "name code color")
      .sort({ appliedAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Leave.countDocuments(query),
  ]);

  return {
    leaves,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Approve a leave request
 */
export const approveLeave = async (organizationId, leaveId, approverId, notes) => {
  const leave = await Leave.findOne({ _id: leaveId, organizationId });

  if (!leave) {
    throw new AppError("Leave request not found", 404);
  }

  if (leave.status !== "pending") {
    throw new AppError(`Cannot approve a ${leave.status} leave request`, 400);
  }

  // Approve
  leave.status = "approved";
  leave.approvedBy = approverId;
  leave.approvedAt = new Date();
  if (notes) leave.notes = notes;
  await leave.save();

  // Update balance (move from pending to used)
  const leaveType = await LeaveType.findById(leave.leaveTypeId);
  if (leaveType && leaveType.isPaid && leaveType.allowedDays > 0) {
    await LeaveBalance.deductLeave(
      organizationId,
      leave.userId,
      leave.leaveTypeId,
      leave.totalDays
    );
  }

  logger.info(`Leave ${leaveId} approved by ${approverId}`);

  return await Leave.findById(leave._id)
    .populate("userId", "firstName lastName email")
    .populate("leaveTypeId", "name code color")
    .populate("approvedBy", "firstName lastName")
    .lean();
};

/**
 * Reject a leave request
 */
export const rejectLeave = async (organizationId, leaveId, rejectorId, reason) => {
  const leave = await Leave.findOne({ _id: leaveId, organizationId });

  if (!leave) {
    throw new AppError("Leave request not found", 404);
  }

  if (leave.status !== "pending") {
    throw new AppError(`Cannot reject a ${leave.status} leave request`, 400);
  }

  // Reject
  leave.status = "rejected";
  leave.rejectedBy = rejectorId;
  leave.rejectedAt = new Date();
  leave.rejectionReason = reason;
  await leave.save();

  // Remove from pending balance
  const leaveType = await LeaveType.findById(leave.leaveTypeId);
  if (leaveType && leaveType.isPaid && leaveType.allowedDays > 0) {
    await LeaveBalance.removePending(
      organizationId,
      leave.userId,
      leave.leaveTypeId,
      leave.totalDays
    );
  }

  logger.info(`Leave ${leaveId} rejected by ${rejectorId}`);

  return await Leave.findById(leave._id)
    .populate("userId", "firstName lastName email")
    .populate("leaveTypeId", "name code color")
    .populate("rejectedBy", "firstName lastName")
    .lean();
};

/**
 * Cancel a leave request
 */
export const cancelLeave = async (organizationId, leaveId, userId, reason) => {
  const leave = await Leave.findOne({ _id: leaveId, organizationId });

  if (!leave) {
    throw new AppError("Leave request not found", 404);
  }

  // Only the requester or admin can cancel
  if (leave.userId.toString() !== userId.toString()) {
    // Check if admin - for now allow, later add proper check
    // throw new AppError("Only the leave requester can cancel", 403);
  }

  if (leave.status === "cancelled") {
    throw new AppError("Leave is already cancelled", 400);
  }

  if (leave.status === "rejected") {
    throw new AppError("Cannot cancel a rejected leave", 400);
  }

  const previousStatus = leave.status;

  // Cancel
  leave.status = "cancelled";
  leave.cancelledBy = userId;
  leave.cancelledAt = new Date();
  leave.cancellationReason = reason || null;
  await leave.save();

  // Update balance
  const leaveType = await LeaveType.findById(leave.leaveTypeId);
  if (leaveType && leaveType.isPaid && leaveType.allowedDays > 0) {
    if (previousStatus === "pending") {
      await LeaveBalance.removePending(
        organizationId,
        leave.userId,
        leave.leaveTypeId,
        leave.totalDays
      );
    } else if (previousStatus === "approved") {
      await LeaveBalance.restoreLeave(
        organizationId,
        leave.userId,
        leave.leaveTypeId,
        leave.totalDays
      );
    }
  }

  logger.info(`Leave ${leaveId} cancelled by ${userId}`);

  return await Leave.findById(leave._id)
    .populate("leaveTypeId", "name code color")
    .populate("cancelledBy", "firstName lastName")
    .lean();
};

// ===================== Leave Balance Operations =====================

/**
 * Get leave balance for a user
 */
export const getLeaveBalance = async (organizationId, userId, year = new Date().getFullYear()) => {
  // Get all active leave types
  const leaveTypes = await LeaveType.find({ organizationId, isActive: true }).lean();

  const balances = [];

  for (const leaveType of leaveTypes) {
    const balance = await LeaveBalance.getOrCreate(
      organizationId,
      userId,
      leaveType._id,
      year
    );

    balances.push({
      leaveType: {
        _id: leaveType._id,
        name: leaveType.name,
        code: leaveType.code,
        color: leaveType.color,
        isPaid: leaveType.isPaid,
      },
      year,
      allocated: balance.allocated,
      used: balance.used,
      pending: balance.pending,
      carriedForward: balance.carriedForward,
      adjusted: balance.adjusted,
      available: balance.allocated + balance.carriedForward + balance.adjusted - balance.used - balance.pending,
    });
  }

  return balances;
};

/**
 * Adjust leave balance (admin only)
 */
export const adjustLeaveBalance = async (organizationId, targetUserId, adminId, data) => {
  const { leaveTypeId, adjustment, reason, year = new Date().getFullYear() } = data;

  // Validate leave type
  const leaveType = await LeaveType.findOne({ _id: leaveTypeId, organizationId });
  if (!leaveType) {
    throw new AppError("Leave type not found", 404);
  }

  // Validate user
  const user = await User.findOne({ _id: targetUserId, organizationId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Get or create balance
  const balance = await LeaveBalance.getOrCreate(organizationId, targetUserId, leaveTypeId, year);
  balance.adjusted += adjustment;
  balance.lastUpdated = new Date();
  await balance.save();

  logger.info(
    `Leave balance adjusted for user ${targetUserId}: ${adjustment} days of ${leaveType.name} by admin ${adminId}. Reason: ${reason}`
  );

  return {
    leaveType: {
      _id: leaveType._id,
      name: leaveType.name,
      code: leaveType.code,
    },
    year,
    allocated: balance.allocated,
    used: balance.used,
    pending: balance.pending,
    carriedForward: balance.carriedForward,
    adjusted: balance.adjusted,
    available: balance.allocated + balance.carriedForward + balance.adjusted - balance.used - balance.pending,
  };
};

/**
 * Get leave statistics
 */
export const getLeaveStats = async (organizationId, userId, year = new Date().getFullYear()) => {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const [totalRequests, approved, rejected, pending, byType] = await Promise.all([
    Leave.countDocuments({
      organizationId,
      userId,
      startDate: { $gte: yearStart, $lte: yearEnd },
    }),
    Leave.countDocuments({
      organizationId,
      userId,
      status: "approved",
      startDate: { $gte: yearStart, $lte: yearEnd },
    }),
    Leave.countDocuments({
      organizationId,
      userId,
      status: "rejected",
      startDate: { $gte: yearStart, $lte: yearEnd },
    }),
    Leave.countDocuments({
      organizationId,
      userId,
      status: "pending",
    }),
    Leave.aggregate([
      {
        $match: {
          organizationId: new (await import("mongoose")).default.Types.ObjectId(organizationId),
          userId: new (await import("mongoose")).default.Types.ObjectId(userId),
          status: "approved",
          startDate: { $gte: yearStart, $lte: yearEnd },
        },
      },
      {
        $group: {
          _id: "$leaveTypeId",
          totalDays: { $sum: "$totalDays" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "leavetypes",
          localField: "_id",
          foreignField: "_id",
          as: "leaveType",
        },
      },
      {
        $unwind: "$leaveType",
      },
      {
        $project: {
          leaveType: {
            _id: "$leaveType._id",
            name: "$leaveType.name",
            code: "$leaveType.code",
            color: "$leaveType.color",
          },
          totalDays: 1,
          count: 1,
        },
      },
    ]),
  ]);

  return {
    year,
    summary: {
      totalRequests,
      approved,
      rejected,
      pending,
    },
    byType,
  };
};

/**
 * Seed default leave types for a new organization
 */
export const seedDefaultLeaveTypes = async (organizationId, userId) => {
  const existingTypes = await LeaveType.countDocuments({ organizationId });
  if (existingTypes > 0) {
    return;
  }

  await LeaveType.seedDefaults(organizationId, userId);
  logger.info(`Default leave types seeded for organization: ${organizationId}`);
};
