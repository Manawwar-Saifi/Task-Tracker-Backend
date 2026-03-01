/**
 * Leave Model
 *
 * Manages leave requests with approval workflow.
 * Tracks leave balances and history for each user.
 */
import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    totalDays: {
      type: Number,
      required: true,
      min: [0.5, "Minimum leave is half day"],
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayPeriod: {
      type: String,
      enum: ["first_half", "second_half", null],
      default: null,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    documents: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Approval workflow
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      default: null,
    },
    // Metadata
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
leaveSchema.index({ organizationId: 1, userId: 1, status: 1 });
leaveSchema.index({ organizationId: 1, status: 1, startDate: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

/**
 * Calculate total days between dates (excluding weekends optionally)
 */
leaveSchema.methods.calculateDays = function (excludeWeekends = false) {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  if (this.isHalfDay) {
    return 0.5;
  }

  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    if (excludeWeekends) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
    } else {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
};

/**
 * Approve the leave request
 */
leaveSchema.methods.approve = function (approverId) {
  this.status = "approved";
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  return this.save();
};

/**
 * Reject the leave request
 */
leaveSchema.methods.reject = function (rejectorId, reason) {
  this.status = "rejected";
  this.rejectedBy = rejectorId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason || null;
  return this.save();
};

/**
 * Cancel the leave request
 */
leaveSchema.methods.cancel = function (userId, reason) {
  this.status = "cancelled";
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason || null;
  return this.save();
};

/**
 * Check if leave dates overlap with existing leaves
 */
leaveSchema.statics.hasOverlap = async function (userId, startDate, endDate, excludeId = null) {
  const query = {
    userId,
    status: { $in: ["pending", "approved"] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const overlap = await this.findOne(query);
  return !!overlap;
};

/**
 * Get pending approvals for a manager
 */
leaveSchema.statics.getPendingForApproval = function (organizationId, teamMemberIds) {
  return this.find({
    organizationId,
    userId: { $in: teamMemberIds },
    status: "pending",
  })
    .populate("userId", "firstName lastName email avatar")
    .populate("leaveTypeId", "name code color")
    .sort({ appliedAt: 1 });
};

// ===================== Leave Balance Schema =====================

const leaveBalanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    allocated: {
      type: Number,
      default: 0,
      min: 0,
    },
    used: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending: {
      type: Number,
      default: 0,
      min: 0,
    },
    carriedForward: {
      type: Number,
      default: 0,
      min: 0,
    },
    adjusted: {
      type: Number,
      default: 0, // Can be positive or negative for manual adjustments
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique balance per user, leave type, and year
leaveBalanceSchema.index(
  { organizationId: 1, userId: 1, leaveTypeId: 1, year: 1 },
  { unique: true }
);

/**
 * Calculate available balance
 */
leaveBalanceSchema.virtual("available").get(function () {
  return this.allocated + this.carriedForward + this.adjusted - this.used - this.pending;
});

/**
 * Get or create balance for a user
 */
leaveBalanceSchema.statics.getOrCreate = async function (
  organizationId,
  userId,
  leaveTypeId,
  year = new Date().getFullYear()
) {
  let balance = await this.findOne({ organizationId, userId, leaveTypeId, year });

  if (!balance) {
    // Get the leave type to set initial allocation
    const LeaveType = mongoose.model("LeaveType");
    const leaveType = await LeaveType.findById(leaveTypeId);

    balance = await this.create({
      organizationId,
      userId,
      leaveTypeId,
      year,
      allocated: leaveType ? leaveType.allowedDays : 0,
      used: 0,
      pending: 0,
      carriedForward: 0,
      adjusted: 0,
    });
  }

  return balance;
};

/**
 * Update balance when leave is approved
 */
leaveBalanceSchema.statics.deductLeave = async function (
  organizationId,
  userId,
  leaveTypeId,
  days
) {
  const year = new Date().getFullYear();
  const balance = await this.findOneAndUpdate(
    { organizationId, userId, leaveTypeId, year },
    {
      $inc: { used: days, pending: -days },
      $set: { lastUpdated: new Date() },
    },
    { new: true }
  );
  return balance;
};

/**
 * Add pending leave (when applied)
 */
leaveBalanceSchema.statics.addPending = async function (
  organizationId,
  userId,
  leaveTypeId,
  days
) {
  const year = new Date().getFullYear();
  const balance = await this.getOrCreate(organizationId, userId, leaveTypeId, year);
  balance.pending += days;
  balance.lastUpdated = new Date();
  return balance.save();
};

/**
 * Remove pending leave (when rejected or cancelled)
 */
leaveBalanceSchema.statics.removePending = async function (
  organizationId,
  userId,
  leaveTypeId,
  days
) {
  const year = new Date().getFullYear();
  await this.findOneAndUpdate(
    { organizationId, userId, leaveTypeId, year },
    {
      $inc: { pending: -days },
      $set: { lastUpdated: new Date() },
    }
  );
};

/**
 * Restore balance (when approved leave is cancelled)
 */
leaveBalanceSchema.statics.restoreLeave = async function (
  organizationId,
  userId,
  leaveTypeId,
  days
) {
  const year = new Date().getFullYear();
  await this.findOneAndUpdate(
    { organizationId, userId, leaveTypeId, year },
    {
      $inc: { used: -days },
      $set: { lastUpdated: new Date() },
    }
  );
};

leaveBalanceSchema.set("toJSON", { virtuals: true });
leaveBalanceSchema.set("toObject", { virtuals: true });

const Leave = mongoose.model("Leave", leaveSchema);
const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

export { Leave, LeaveBalance };
export default Leave;
