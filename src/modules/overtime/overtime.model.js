/**
 * Overtime Model
 *
 * Mongoose schema for overtime request management.
 */
import mongoose from "mongoose";

const overtimeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    hours: {
      type: Number,
      required: [true, "Hours are required"],
      min: [0.5, "Minimum overtime is 0.5 hours"],
      max: [12, "Maximum overtime is 12 hours"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      minlength: [10, "Reason must be at least 10 characters"],
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
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
    cancelledAt: {
      type: Date,
      default: null,
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
overtimeSchema.index({ organizationId: 1, userId: 1, date: 1 });
overtimeSchema.index({ organizationId: 1, status: 1 });
overtimeSchema.index({ organizationId: 1, date: 1 });

/**
 * Static: Get overtime statistics
 */
overtimeSchema.statics.getStats = async function (organizationId, options = {}) {
  const { userId, year, month } = options;

  const query = {
    organizationId,
    isDeleted: false,
  };

  if (userId) {
    query.userId = userId;
  }

  // Build date filter
  if (year) {
    const startDate = new Date(year, month ? month - 1 : 0, 1);
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59, 999)
      : new Date(year, 11, 31, 23, 59, 59, 999);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const [statusCounts, totalApproved] = await Promise.all([
    this.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    this.aggregate([
      { $match: { ...query, status: "approved" } },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$hours" },
        },
      },
    ]),
  ]);

  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    totalApprovedHours: totalApproved[0]?.totalHours || 0,
  };

  statusCounts.forEach((item) => {
    stats[item._id] = item.count;
    stats.total += item.count;
  });

  return stats;
};

/**
 * Static: Check if overtime already exists for date
 */
overtimeSchema.statics.hasExistingRequest = async function (
  organizationId,
  userId,
  date,
  excludeId = null
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    organizationId,
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "approved"] },
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await this.findOne(query);
  return !!existing;
};

/**
 * Static: Get overtime report
 */
overtimeSchema.statics.getReport = async function (organizationId, options = {}) {
  const { userId, startDate, endDate, teamId } = options;

  const matchStage = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
    status: "approved",
    isDeleted: false,
  };

  if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  ];

  // Filter by team if provided
  if (teamId) {
    pipeline.push({
      $match: {
        "user.teamIds": new mongoose.Types.ObjectId(teamId),
      },
    });
  }

  pipeline.push({
    $group: {
      _id: "$userId",
      userName: { $first: { $concat: ["$user.firstName", " ", "$user.lastName"] } },
      userEmail: { $first: "$user.email" },
      totalHours: { $sum: "$hours" },
      totalDays: { $sum: 1 },
      records: { $push: { date: "$date", hours: "$hours", reason: "$reason" } },
    },
  });

  pipeline.push({
    $project: {
      _id: 0,
      userId: "$_id",
      userName: 1,
      userEmail: 1,
      totalHours: 1,
      totalDays: 1,
      averageHoursPerDay: { $divide: ["$totalHours", "$totalDays"] },
      records: 1,
    },
  });

  const report = await this.aggregate(pipeline);

  // Calculate totals
  const summary = {
    totalHours: report.reduce((sum, r) => sum + r.totalHours, 0),
    totalDays: report.reduce((sum, r) => sum + r.totalDays, 0),
    totalUsers: report.length,
  };

  return { users: report, summary };
};

/**
 * Instance: Approve overtime
 */
overtimeSchema.methods.approve = function (approverId, notes = null) {
  this.status = "approved";
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  if (notes) this.notes = notes;
  return this;
};

/**
 * Instance: Reject overtime
 */
overtimeSchema.methods.reject = function (rejectedBy, reason) {
  this.status = "rejected";
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this;
};

/**
 * Instance: Cancel overtime
 */
overtimeSchema.methods.cancel = function () {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  return this;
};

const Overtime = mongoose.model("Overtime", overtimeSchema);

export default Overtime;
