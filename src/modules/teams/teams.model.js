import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    /* -------------------- BASIC INFO -------------------- */
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [100, "Team name cannot exceed 100 characters"],
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    /* -------------------- ORGANIZATION CONTEXT -------------------- */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* -------------------- TEAM STRUCTURE -------------------- */
    // Team leader/head
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Team members
    members: [teamMemberSchema],

    // Parent team (for sub-teams/departments)
    parentTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    /* -------------------- TEAM SETTINGS -------------------- */
    settings: {
      // Can members see each other's tasks
      taskVisibility: {
        type: String,
        enum: ["private", "team", "all"],
        default: "team",
      },
      // Can team lead approve leaves
      canApproveLeaves: {
        type: Boolean,
        default: true,
      },
      // Can team lead approve overtime
      canApproveOvertime: {
        type: Boolean,
        default: true,
      },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* -------------------- VIRTUALS -------------------- */

// Member count
teamSchema.virtual("memberCount").get(function () {
  return this.members ? this.members.length : 0;
});

// Check if has leader
teamSchema.virtual("hasLeader").get(function () {
  return !!this.leaderId;
});

/* -------------------- INDEXES -------------------- */

// Unique team name per organization
teamSchema.index({ slug: 1, organizationId: 1 }, { unique: true });

// Team hierarchy queries
teamSchema.index({ parentTeamId: 1 });

// Leader queries
teamSchema.index({ leaderId: 1 });

// Member queries
teamSchema.index({ "members.userId": 1 });

/* -------------------- PRE-SAVE MIDDLEWARE -------------------- */

teamSchema.pre("save", function (next) {
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

/* -------------------- METHODS -------------------- */

// Check if user is a member
teamSchema.methods.isMember = function (userId) {
  return this.members.some(
    (m) => m.userId.toString() === userId.toString()
  );
};

// Check if user is the leader
teamSchema.methods.isLeader = function (userId) {
  return this.leaderId && this.leaderId.toString() === userId.toString();
};

// Add member to team
teamSchema.methods.addMember = function (userId, addedBy) {
  if (!this.isMember(userId)) {
    this.members.push({
      userId,
      joinedAt: new Date(),
      addedBy,
    });
  }
  return this;
};

// Remove member from team
teamSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(
    (m) => m.userId.toString() !== userId.toString()
  );
  return this;
};

// Get member IDs
teamSchema.methods.getMemberIds = function () {
  return this.members.map((m) => m.userId);
};

/* -------------------- STATICS -------------------- */

// Find teams by organization
teamSchema.statics.findByOrganization = function (organizationId) {
  return this.find({
    organizationId,
    isDeleted: false,
    isActive: true,
  }).sort({ name: 1 });
};

// Find teams where user is a member
teamSchema.statics.findByMember = function (userId) {
  return this.find({
    "members.userId": userId,
    isDeleted: false,
  });
};

// Find teams where user is leader
teamSchema.statics.findByLeader = function (leaderId) {
  return this.find({
    leaderId,
    isDeleted: false,
  });
};

// Find sub-teams
teamSchema.statics.findSubTeams = function (parentTeamId) {
  return this.find({
    parentTeamId,
    isDeleted: false,
  });
};

// Get team hierarchy (all parent teams)
teamSchema.statics.getHierarchy = async function (teamId) {
  const hierarchy = [];
  let currentTeam = await this.findById(teamId);

  while (currentTeam && currentTeam.parentTeamId) {
    const parentTeam = await this.findById(currentTeam.parentTeamId);
    if (parentTeam) {
      hierarchy.unshift(parentTeam);
      currentTeam = parentTeam;
    } else {
      break;
    }
  }

  return hierarchy;
};

const Team = mongoose.model("Team", teamSchema);

export default Team;
