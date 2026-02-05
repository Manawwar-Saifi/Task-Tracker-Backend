import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* -------------------- BASIC IDENTITY -------------------- */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // NEVER return password by default
    },

    /* -------------------- ORGANIZATION CONTEXT -------------------- */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* -------------------- HIERARCHY & RBAC -------------------- */
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },

    permissions: [
      {
        type: String,
      },
    ],
    // NOTE:
    // permissions are action-based like:
    // "USER_CREATE", "TASK_APPROVE", "ATTENDANCE_VIEW"

    reportingManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* -------------------- STATUS CONTROL -------------------- */
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* -------------------- WORK CONFIG (IMPORTANT FOR AUTOMATION) -------------------- */
    workHoursPerDay: {
      type: Number,
      default: 8,
    },

    breakMinutesPerDay: {
      type: Number,
      default: 60,
    },

    /* -------------------- SYSTEM FLAGS -------------------- */
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* -------------------- INDEXES -------------------- */

// Unique email per organization
userSchema.index(
  { email: 1, organizationId: 1 },
  { unique: true }
);

// Faster hierarchy queries
userSchema.index({ reportingManagerId: 1 });

const User = mongoose.model("User", userSchema);

export default User;
