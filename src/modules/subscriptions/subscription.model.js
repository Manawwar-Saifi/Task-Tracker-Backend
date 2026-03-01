/**
 * Subscription Model
 *
 * Mongoose schema for subscription management.
 * Supports trial, basic, premium, and enterprise plans.
 */
import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["trial", "basic", "premium", "enterprise"],
      default: "trial",
      required: [true, "Plan is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "cancelled", "expired", "past_due"],
      default: "active",
      required: [true, "Status is required"],
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    // Usage limits
    limits: {
      users: {
        type: Number,
        default: 10,
      },
      storage: {
        type: Number, // in GB
        default: 5,
      },
      projects: {
        type: Number,
        default: 3,
      },
    },
    // Current usage
    usage: {
      users: {
        type: Number,
        default: 0,
      },
      storage: {
        type: Number, // in GB
        default: 0,
      },
      projects: {
        type: Number,
        default: 0,
      },
    },
    // Pricing
    pricing: {
      amount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD", "EUR", "GBP"],
      },
    },
    // Subscription dates
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    trialEndsAt: {
      type: Date,
      default: function () {
        // Trial for 14 days
        return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      },
    },
    // Payment info
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "net_banking", "wallet", "none"],
      default: "none",
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    nextBillingDate: {
      type: Date,
      default: null,
    },
    // External payment gateway info
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
    },
    // Features enabled
    features: {
      attendance: {
        type: Boolean,
        default: true,
      },
      leave: {
        type: Boolean,
        default: true,
      },
      tasks: {
        type: Boolean,
        default: true,
      },
      overtime: {
        type: Boolean,
        default: true,
      },
      hr: {
        type: Boolean,
        default: false,
      },
      reports: {
        type: Boolean,
        default: false,
      },
      analytics: {
        type: Boolean,
        default: false,
      },
      api: {
        type: Boolean,
        default: false,
      },
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      trim: true,
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

// Indexes
subscriptionSchema.index({ organizationId: 1, status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ endDate: 1 });

/**
 * Virtual: Check if subscription is expired
 */
subscriptionSchema.virtual("isExpired").get(function () {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
});

/**
 * Virtual: Check if trial is active
 */
subscriptionSchema.virtual("isTrialActive").get(function () {
  if (this.plan !== "trial") return false;
  if (!this.trialEndsAt) return false;
  return new Date() < this.trialEndsAt;
});

/**
 * Virtual: Days remaining in trial
 */
subscriptionSchema.virtual("trialDaysRemaining").get(function () {
  if (!this.isTrialActive) return 0;
  const now = new Date();
  const diff = this.trialEndsAt - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: Check if usage is within limits
 */
subscriptionSchema.virtual("isWithinLimits").get(function () {
  return (
    this.usage.users <= this.limits.users &&
    this.usage.storage <= this.limits.storage &&
    this.usage.projects <= this.limits.projects
  );
});

/**
 * Static: Get subscription by organization
 */
subscriptionSchema.statics.getByOrganization = async function (organizationId) {
  return this.findOne({ organizationId, isDeleted: false }).lean();
};

/**
 * Static: Get active subscriptions
 */
subscriptionSchema.statics.getActiveSubscriptions = async function (options = {}) {
  const { page = 1, limit = 20, plan } = options;

  const query = { status: "active", isDeleted: false };
  if (plan) query.plan = plan;

  const [subscriptions, total] = await Promise.all([
    this.find(query)
      .populate("organizationId", "name status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    subscriptions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Static: Get subscription stats
 */
subscriptionSchema.statics.getStats = async function () {
  const results = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$plan",
        count: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ["$status", "active"] },
              "$pricing.amount",
              0,
            ],
          },
        },
      },
    },
  ]);

  const stats = {
    total: 0,
    active: 0,
    trial: 0,
    basic: 0,
    premium: 0,
    enterprise: 0,
    totalRevenue: 0,
  };

  const statusCount = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  statusCount.forEach((item) => {
    if (item._id === "active") stats.active = item.count;
  });

  results.forEach((item) => {
    stats[item._id] = item.count;
    stats.total += item.count;
    stats.totalRevenue += item.revenue;
  });

  return stats;
};

/**
 * Instance: Upgrade plan
 */
subscriptionSchema.methods.upgradePlan = function (newPlan, pricing) {
  this.plan = newPlan;
  this.pricing = pricing;

  // Set limits based on plan
  switch (newPlan) {
    case "basic":
      this.limits = { users: 10, storage: 10, projects: 10 };
      this.features = { attendance: true, leave: true, tasks: true, overtime: true, hr: false, reports: false, analytics: false, api: false };
      break;
    case "premium":
      this.limits = { users: 50, storage: 50, projects: 50 };
      this.features = { attendance: true, leave: true, tasks: true, overtime: true, hr: true, reports: true, analytics: true, api: false };
      break;
    case "enterprise":
      this.limits = { users: 9999, storage: 500, projects: 9999 };
      this.features = { attendance: true, leave: true, tasks: true, overtime: true, hr: true, reports: true, analytics: true, api: true };
      break;
  }

  return this;
};

/**
 * Instance: Cancel subscription
 */
subscriptionSchema.methods.cancel = function (reason = null) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  this.autoRenew = false;
  return this;
};

/**
 * Instance: Renew subscription
 */
subscriptionSchema.methods.renew = function () {
  this.status = "active";
  this.lastPaymentDate = new Date();

  // Calculate next billing date
  const nextDate = new Date();
  if (this.billingCycle === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  this.nextBillingDate = nextDate;

  return this;
};

// Check if model already exists to prevent recompilation error
const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
