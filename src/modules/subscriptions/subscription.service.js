/**
 * Subscription Service
 *
 * Business logic for subscription management.
 */
import Subscription from "./subscription.model.js";
import User from "../users/model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

// Plan pricing
const PLAN_PRICING = {
  trial: {
    monthly: { amount: 0, currency: "INR" },
    yearly: { amount: 0, currency: "INR" },
  },
  basic: {
    monthly: { amount: 999, currency: "INR" },
    yearly: { amount: 9990, currency: "INR" }, // 2 months free
  },
  premium: {
    monthly: { amount: 2999, currency: "INR" },
    yearly: { amount: 29990, currency: "INR" }, // 2 months free
  },
  enterprise: {
    monthly: { amount: 9999, currency: "INR" },
    yearly: { amount: 99990, currency: "INR" }, // 2 months free
  },
};

/**
 * Get subscription for organization
 */
export const getSubscription = async (organizationId) => {
  const subscription = await Subscription.findOne({
    organizationId,
    isDeleted: { $ne: true },
  }).lean();

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  return subscription;
};

/**
 * Get available plans
 */
export const getPlans = async (billingCycle = "monthly") => {
  const plans = [
    {
      name: "Trial",
      key: "trial",
      price: PLAN_PRICING.trial[billingCycle],
      limits: { users: 5, storage: 2, projects: 1 },
      features: {
        attendance: true,
        leave: true,
        tasks: true,
        overtime: true,
        hr: false,
        reports: false,
        analytics: false,
        api: false,
      },
      popular: false,
    },
    {
      name: "Basic",
      key: "basic",
      price: PLAN_PRICING.basic[billingCycle],
      limits: { users: 10, storage: 10, projects: 10 },
      features: {
        attendance: true,
        leave: true,
        tasks: true,
        overtime: true,
        hr: false,
        reports: false,
        analytics: false,
        api: false,
      },
      popular: false,
    },
    {
      name: "Premium",
      key: "premium",
      price: PLAN_PRICING.premium[billingCycle],
      limits: { users: 50, storage: 50, projects: 50 },
      features: {
        attendance: true,
        leave: true,
        tasks: true,
        overtime: true,
        hr: true,
        reports: true,
        analytics: true,
        api: false,
      },
      popular: true,
    },
    {
      name: "Enterprise",
      key: "enterprise",
      price: PLAN_PRICING.enterprise[billingCycle],
      limits: { users: 9999, storage: 500, projects: 9999 },
      features: {
        attendance: true,
        leave: true,
        tasks: true,
        overtime: true,
        hr: true,
        reports: true,
        analytics: true,
        api: true,
      },
      popular: false,
    },
  ];

  return { plans, billingCycle };
};

/**
 * Upgrade subscription plan
 */
export const upgradePlan = async (organizationId, data) => {
  const { plan, billingCycle = "monthly" } = data;

  const subscription = await Subscription.findOne({
    organizationId,
    isDeleted: false,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  // Cannot downgrade to trial
  if (plan === "trial") {
    throw new AppError("Cannot downgrade to trial plan", 400);
  }

  const pricing = PLAN_PRICING[plan][billingCycle];

  subscription.upgradePlan(plan, pricing);
  subscription.billingCycle = billingCycle;
  subscription.status = "active";

  // Calculate next billing date
  const nextDate = new Date();
  if (billingCycle === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  subscription.nextBillingDate = nextDate;

  await subscription.save();

  logger.info(`Subscription upgraded to ${plan} for organization ${organizationId}`);

  return subscription.toObject();
};

/**
 * Update subscription settings
 */
export const updateSubscription = async (organizationId, data) => {
  const subscription = await Subscription.findOne({
    organizationId,
    isDeleted: false,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  if (data.autoRenew !== undefined) subscription.autoRenew = data.autoRenew;
  if (data.billingCycle) subscription.billingCycle = data.billingCycle;
  if (data.paymentMethod) subscription.paymentMethod = data.paymentMethod;

  await subscription.save();

  logger.info(`Subscription updated for organization ${organizationId}`);

  return subscription.toObject();
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (organizationId, reason = null) => {
  const subscription = await Subscription.findOne({
    organizationId,
    isDeleted: false,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  if (subscription.status === "cancelled") {
    throw new AppError("Subscription is already cancelled", 400);
  }

  subscription.cancel(reason);
  await subscription.save();

  logger.info(`Subscription cancelled for organization ${organizationId}`);

  return subscription.toObject();
};

/**
 * Renew subscription (for payment confirmation)
 */
export const renewSubscription = async (organizationId) => {
  const subscription = await Subscription.findOne({
    organizationId,
    isDeleted: false,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  subscription.renew();
  await subscription.save();

  logger.info(`Subscription renewed for organization ${organizationId}`);

  return subscription.toObject();
};

/**
 * Update usage stats
 */
export const updateUsage = async (organizationId, data) => {
  const subscription = await Subscription.findOne({
    organizationId,
    isDeleted: false,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  if (data.users !== undefined) subscription.usage.users = data.users;
  if (data.storage !== undefined) subscription.usage.storage = data.storage;
  if (data.projects !== undefined) subscription.usage.projects = data.projects;

  await subscription.save();

  return subscription.toObject();
};

/**
 * Check if feature is enabled
 */
export const checkFeature = async (organizationId, feature) => {
  const subscription = await Subscription.findOne({ organizationId, isDeleted: { $ne: true } }).lean();

  if (!subscription) {
    return false;
  }

  // Check if subscription is active
  if (subscription.status !== "active") {
    return false;
  }

  // Check if feature is enabled
  return subscription.features[feature] === true;
};

/**
 * Check if usage is within limits
 */
export const checkLimit = async (organizationId, limitType) => {
  const subscription = await Subscription.findOne({ organizationId, isDeleted: { $ne: true } }).lean();

  if (!subscription) {
    return false;
  }

  return subscription.usage[limitType] < subscription.limits[limitType];
};

/**
 * Get subscription stats (Admin)
 */
export const getStats = async () => {
  return Subscription.getStats();
};

/**
 * Get all subscriptions (Admin)
 */
export const getAllSubscriptions = async (options = {}) => {
  return Subscription.getActiveSubscriptions(options);
};

/**
 * Create trial subscription for new organization
 */
export const createTrialSubscription = async (organizationId) => {
  // Check if subscription already exists
  const existing = await Subscription.findOne({ organizationId });
  if (existing) {
    return existing.toObject();
  }

  const subscription = await Subscription.create({
    organizationId,
    plan: "trial",
    status: "active",
    billingCycle: "monthly",
    limits: { users: 5, storage: 2, projects: 1 },
    usage: { users: 1, storage: 0, projects: 0 },
    pricing: { amount: 0, currency: "INR" },
    features: {
      attendance: true,
      leave: true,
      tasks: true,
      overtime: true,
      hr: false,
      reports: false,
      analytics: false,
      api: false,
    },
  });

  logger.info(`Trial subscription created for organization ${organizationId}`);

  return subscription.toObject();
};

export default {
  getSubscription,
  getPlans,
  upgradePlan,
  updateSubscription,
  cancelSubscription,
  renewSubscription,
  updateUsage,
  checkFeature,
  checkLimit,
  getStats,
  getAllSubscriptions,
  createTrialSubscription,
};
