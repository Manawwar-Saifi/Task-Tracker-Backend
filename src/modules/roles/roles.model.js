import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    /* -------------------- BASIC INFO -------------------- */
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    /* -------------------- ORGANIZATION CONTEXT -------------------- */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* -------------------- HIERARCHY LEVEL -------------------- */
    // Lower number = higher authority (1 = CEO, 2 = Manager, etc.)
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 50,
    },

    /* -------------------- PERMISSIONS -------------------- */
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    // Store permission codes directly for faster access
    permissionCodes: [
      {
        type: String,
        trim: true,
      },
    ],

    /* -------------------- SYSTEM FLAGS -------------------- */
    isSystemRole: {
      type: Boolean,
      default: false,
      // System roles cannot be deleted (CEO, Employee)
    },

    isDefault: {
      type: Boolean,
      default: false,
      // Default role assigned to new users
    },

    /* -------------------- STATUS -------------------- */
    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* -------------------- METADATA -------------------- */
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

/* -------------------- INDEXES -------------------- */

// Unique role name per organization
roleSchema.index(
  { slug: 1, organizationId: 1 },
  { unique: true }
);

// Fast permission lookups
roleSchema.index({ permissionCodes: 1 });

// Hierarchy queries
roleSchema.index({ organizationId: 1, level: 1 });

/* -------------------- METHODS -------------------- */

// Check if role has a specific permission
roleSchema.methods.hasPermission = function (permissionCode) {
  return this.permissionCodes.includes(permissionCode);
};

// Check if role has any of the given permissions
roleSchema.methods.hasAnyPermission = function (permissionCodes) {
  return permissionCodes.some((code) =>
    this.permissionCodes.includes(code)
  );
};

// Check if role has all of the given permissions
roleSchema.methods.hasAllPermissions = function (permissionCodes) {
  return permissionCodes.every((code) =>
    this.permissionCodes.includes(code)
  );
};

// Check if this role is higher in hierarchy than another
roleSchema.methods.isHigherThan = function (otherRole) {
  return this.level < otherRole.level;
};

/* -------------------- STATICS -------------------- */

// Get all roles for an organization
roleSchema.statics.findByOrganization = function (organizationId) {
  return this.find({
    organizationId,
    isDeleted: false,
    isActive: true,
  }).sort({ level: 1 });
};

// Get default role for an organization
roleSchema.statics.getDefaultRole = function (organizationId) {
  return this.findOne({
    organizationId,
    isDefault: true,
    isDeleted: false,
  });
};

// Get CEO role for an organization
roleSchema.statics.getCEORole = function (organizationId) {
  return this.findOne({
    organizationId,
    slug: "ceo",
    isDeleted: false,
  });
};

/* -------------------- PRE-SAVE MIDDLEWARE -------------------- */

roleSchema.pre("save", function (next) {
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

const Role = mongoose.model("Role", roleSchema);

export default Role;
