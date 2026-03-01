/**
 * Leave Type Model
 *
 * Defines types of leaves available in an organization.
 * Each organization can have its own leave types with custom configurations.
 */
import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Leave type name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Leave type code is required"],
      uppercase: true,
      trim: true,
      maxlength: [10, "Code cannot exceed 10 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    allowedDays: {
      type: Number,
      required: [true, "Allowed days is required"],
      min: [0, "Allowed days cannot be negative"],
      default: 12,
    },
    carryForward: {
      enabled: {
        type: Boolean,
        default: false,
      },
      maxDays: {
        type: Number,
        default: 0,
        min: 0,
      },
      expiryMonths: {
        type: Number,
        default: 3,
        min: 1,
      },
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    requiresDocument: {
      type: Boolean,
      default: false,
    },
    minDaysNotice: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxConsecutiveDays: {
      type: Number,
      default: 0, // 0 means no limit
      min: 0,
    },
    applicableGender: {
      type: String,
      enum: ["all", "male", "female", "other"],
      default: "all",
    },
    color: {
      type: String,
      default: "#3B82F6", // Default blue color for UI
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false, // System leave types cannot be deleted
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique leave type code per organization
leaveTypeSchema.index({ organizationId: 1, code: 1 }, { unique: true });
leaveTypeSchema.index({ organizationId: 1, isActive: 1 });

/**
 * Seed default leave types for a new organization
 */
leaveTypeSchema.statics.seedDefaults = async function (organizationId, createdBy) {
  const defaultTypes = [
    {
      name: "Casual Leave",
      code: "CL",
      description: "For personal matters and casual absences",
      allowedDays: 12,
      carryForward: { enabled: false, maxDays: 0 },
      isPaid: true,
      color: "#10B981",
      isSystem: true,
    },
    {
      name: "Sick Leave",
      code: "SL",
      description: "For illness and medical appointments",
      allowedDays: 12,
      carryForward: { enabled: true, maxDays: 6, expiryMonths: 6 },
      isPaid: true,
      requiresDocument: true,
      color: "#EF4444",
      isSystem: true,
    },
    {
      name: "Earned Leave",
      code: "EL",
      description: "Earned/Privilege leave accumulated over time",
      allowedDays: 15,
      carryForward: { enabled: true, maxDays: 30, expiryMonths: 12 },
      isPaid: true,
      minDaysNotice: 7,
      color: "#8B5CF6",
      isSystem: true,
    },
    {
      name: "Leave Without Pay",
      code: "LWP",
      description: "Unpaid leave when other leaves are exhausted",
      allowedDays: 0, // Unlimited but unpaid
      carryForward: { enabled: false },
      isPaid: false,
      color: "#6B7280",
      isSystem: true,
    },
  ];

  const leaveTypes = defaultTypes.map((type) => ({
    ...type,
    organizationId,
    createdBy,
    updatedBy: createdBy,
  }));

  return await this.insertMany(leaveTypes);
};

/**
 * Get all active leave types for an organization
 */
leaveTypeSchema.statics.getActiveTypes = function (organizationId) {
  return this.find({ organizationId, isActive: true }).sort({ name: 1 });
};

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);

export default LeaveType;
