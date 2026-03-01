import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    /* -------------------- PERMISSION IDENTITY -------------------- */
    code: {
      type: String,
      required: [true, "Permission code is required"],
      uppercase: true,
      trim: true,
      // Format: MODULE_ACTION (e.g., USER_CREATE, TASK_APPROVE)
    },

    name: {
      type: String,
      required: [true, "Permission name is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    /* -------------------- MODULE GROUPING -------------------- */
    module: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: [
        "USER",
        "TEAM",
        "TASK",
        "ATTENDANCE",
        "LEAVE",
        "HOLIDAY",
        "OVERTIME",
        "REPORT",
        "NOTIFICATION",
        "PERMISSION",
        "ROLE",
        "ORGANIZATION",
        "SUBSCRIPTION",
        "HR",
        "SETTINGS",
        "AUDIT",
      ],
    },

    /* -------------------- ACTION TYPE -------------------- */
    action: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: [
        "CREATE",
        "READ",
        "UPDATE",
        "DELETE",
        "APPROVE",
        "REJECT",
        "ASSIGN",
        "EXPORT",
        "IMPORT",
        "MANAGE",
        "VIEW_OWN",
        "VIEW_TEAM",
        "VIEW_ALL",
      ],
    },

    /* -------------------- ORGANIZATION CONTEXT -------------------- */
    // null = system permission (available to all orgs)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    /* -------------------- SYSTEM FLAGS -------------------- */
    isSystem: {
      type: Boolean,
      default: false,
      // System permissions cannot be modified
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /* -------------------- METADATA -------------------- */
    category: {
      type: String,
      default: "general",
      // For grouping in UI (core, advanced, admin)
    },

    sortOrder: {
      type: Number,
      default: 0,
      // For display ordering
    },
  },
  {
    timestamps: true,
  }
);

/* -------------------- INDEXES -------------------- */

// Unique permission code per organization (or global)
permissionSchema.index(
  { code: 1, organizationId: 1 },
  { unique: true }
);

// Fast module-based lookups
permissionSchema.index({ module: 1, isActive: 1 });

// Action-based lookups
permissionSchema.index({ action: 1 });

/* -------------------- STATICS -------------------- */

// Get all permissions for an organization (including system permissions)
permissionSchema.statics.findByOrganization = function (organizationId) {
  return this.find({
    $or: [
      { organizationId: organizationId },
      { organizationId: null, isSystem: true },
    ],
    isActive: true,
  }).sort({ module: 1, sortOrder: 1 });
};

// Get permissions by module
permissionSchema.statics.findByModule = function (module, organizationId = null) {
  const query = {
    module: module.toUpperCase(),
    isActive: true,
  };

  if (organizationId) {
    query.$or = [
      { organizationId },
      { organizationId: null, isSystem: true },
    ];
  }

  return this.find(query).sort({ sortOrder: 1 });
};

// Get system permissions only
permissionSchema.statics.getSystemPermissions = function () {
  return this.find({
    isSystem: true,
    isActive: true,
  }).sort({ module: 1, sortOrder: 1 });
};

/* -------------------- PRE-SAVE MIDDLEWARE -------------------- */

permissionSchema.pre("save", function (next) {
  // Auto-generate code from module and action if not provided
  if (!this.code && this.module && this.action) {
    this.code = `${this.module}_${this.action}`;
  }

  // Auto-generate name if not provided
  if (!this.name && this.code) {
    this.name = this.code
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  next();
});

const Permission = mongoose.model("Permission", permissionSchema);

export default Permission;
