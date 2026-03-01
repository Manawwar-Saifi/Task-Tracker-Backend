/**
 * Plan Model
 * Subscription plan schema for multi-tenant SaaS
 *
 * Plans are platform-level (not per-organization)
 * Each organization subscribes to one plan
 */
import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    // Plan identification
    name: {
      type: String,
      required: [true, "Plan name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },

    // Pricing structure
    pricing: {
      monthly: { type: Number, required: true },
      yearly: { type: Number, required: true },
      currency: { type: String, default: "INR" },
    },

    // Usage limits (-1 means unlimited)
    limits: {
      maxUsers: { type: Number, default: 10 },
      maxTeams: { type: Number, default: 3 },
      maxStorage: { type: Number, default: 5 }, // in GB
    },

    // Feature flags
    features: {
      advancedReports: { type: Boolean, default: false },
      customRoles: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      ssoEnabled: { type: Boolean, default: false },
      auditLogs: { type: Boolean, default: false },
    },

    // Razorpay integration
    razorpayPlanId: {
      monthly: { type: String, default: null },
      yearly: { type: String, default: null },
    },

    // Display settings
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES (slug already has unique index from field definition)
// ============================================
planSchema.index({ isActive: 1, displayOrder: 1 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if plan has unlimited users
 */
planSchema.methods.isUnlimitedUsers = function () {
  return this.limits.maxUsers === -1;
};

/**
 * Check if plan has unlimited teams
 */
planSchema.methods.isUnlimitedTeams = function () {
  return this.limits.maxTeams === -1;
};

/**
 * Check if a specific feature is enabled
 * @param {string} feature - Feature name (e.g., 'advancedReports')
 */
planSchema.methods.hasFeature = function (feature) {
  return this.features[feature] === true;
};

/**
 * Get yearly discount percentage
 */
planSchema.methods.getYearlyDiscount = function () {
  const monthlyTotal = this.pricing.monthly * 12;
  const yearly = this.pricing.yearly;
  return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get all active plans sorted by display order
 */
planSchema.statics.getActivePlans = function () {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

/**
 * Get plan by slug
 */
planSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isActive: true });
};

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
