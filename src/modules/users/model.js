import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    /* -------------------- BASIC IDENTITY -------------------- */
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // NEVER return password by default
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    /* -------------------- ORGANIZATION CONTEXT -------------------- */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* -------------------- EMPLOYEE INFO -------------------- */
    employeeId: {
      type: String,
      trim: true,
      default: null,
    },

    department: {
      type: String,
      trim: true,
      default: null,
    },

    designation: {
      type: String,
      trim: true,
      default: null,
    },

    dateOfJoining: {
      type: Date,
      default: null,
    },

    /* -------------------- HIERARCHY & RBAC -------------------- */
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },

    // Direct permission overrides (in addition to role permissions)
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],

    // Reporting manager
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Teams user belongs to
    teamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    /* -------------------- WORK CONFIG -------------------- */
    workHoursPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 24,
    },

    breakMinutesPerDay: {
      type: Number,
      default: 60,
      min: 0,
      max: 480,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    /* -------------------- STATUS CONTROL -------------------- */
    status: {
      type: String,
      enum: ["active", "inactive", "invited", "suspended"],
      default: "invited",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* -------------------- SYSTEM FLAGS -------------------- */
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    isOwner: {
      type: Boolean,
      default: false,
      // Organization owner (CEO who created the org)
    },

    /* -------------------- INVITATION -------------------- */
    inviteToken: {
      type: String,
      default: null,
      select: false,
    },

    inviteTokenExpiry: {
      type: Date,
      default: null,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* -------------------- AUTH TOKENS -------------------- */
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    refreshTokenExpiry: {
      type: Date,
      default: null,
    },

    /* -------------------- PASSWORD RESET -------------------- */
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpiry: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    /* -------------------- ACTIVITY -------------------- */
    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* -------------------- VIRTUALS -------------------- */

// Full name virtual
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Alias for backward compatibility
userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/* -------------------- INDEXES -------------------- */

// Unique email per organization
userSchema.index({ email: 1, organizationId: 1 }, { unique: true });

// Faster hierarchy queries
userSchema.index({ reportingTo: 1 });

// Team membership queries
userSchema.index({ teamIds: 1 });

// Role-based queries
userSchema.index({ roleId: 1, organizationId: 1 });

// Status queries
userSchema.index({ organizationId: 1, status: 1, isDeleted: 1 });

/* -------------------- PRE-SAVE MIDDLEWARE -------------------- */

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

/* -------------------- METHODS -------------------- */

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Check if user has a specific permission
userSchema.methods.hasPermission = async function (permissionCode) {
  // Super admin bypass
  if (this.isSuperAdmin) return true;

  // Check direct permissions
  if (this.permissions.includes(permissionCode)) return true;

  // Check role permissions
  if (this.roleId) {
    await this.populate("roleId");
    if (this.roleId && this.roleId.permissionCodes) {
      return this.roleId.permissionCodes.includes(permissionCode);
    }
  }

  return false;
};

// Get all permissions (role + direct)
userSchema.methods.getAllPermissions = async function () {
  const permissions = new Set(this.permissions);

  if (this.roleId) {
    await this.populate("roleId");
    if (this.roleId && this.roleId.permissionCodes) {
      this.roleId.permissionCodes.forEach((p) => permissions.add(p));
    }
  }

  return Array.from(permissions);
};

// Check if user is higher in hierarchy than another user
userSchema.methods.isHigherThan = async function (otherUser) {
  if (this.isSuperAdmin) return true;
  if (this.isOwner && !otherUser.isOwner) return true;

  await this.populate("roleId");
  await otherUser.populate("roleId");

  if (!this.roleId || !otherUser.roleId) return false;

  return this.roleId.level < otherUser.roleId.level;
};

/* -------------------- STATICS -------------------- */

// Find by email in organization
userSchema.statics.findByEmail = function (email, organizationId) {
  return this.findOne({
    email: email.toLowerCase(),
    organizationId,
    isDeleted: false,
  });
};

// Find active users in organization
userSchema.statics.findActiveByOrganization = function (organizationId) {
  return this.find({
    organizationId,
    status: "active",
    isDeleted: false,
  });
};

// Find users by team
userSchema.statics.findByTeam = function (teamId) {
  return this.find({
    teamIds: teamId,
    isDeleted: false,
  });
};

// Find subordinates
userSchema.statics.findSubordinates = function (userId) {
  return this.find({
    reportingTo: userId,
    isDeleted: false,
  });
};

const User = mongoose.model("User", userSchema);

export default User;
