/**
 * Subscription Service
 * Handles all subscription-related business logic
 *
 * Functions:
 * - createTrialSubscription: Create 14-day trial on registration
 * - checkUserLimit: Check if org can add more users
 * - checkTeamLimit: Check if org can add more teams
 * - downgradeToFree: Downgrade expired trial to FREE plan
 * - upgradeSubscription: Upgrade to paid plan
 * - getSubscriptionWithPlan: Get subscription with plan details
 */
import Subscription from "./subscription.model.js";
import Plan from "./plan.model.js";
import { SUBSCRIPTION_STATUS, TRIAL_DAYS } from "../../config/constants.js";
import AppError from "../../utils/AppError.js";

/**
 * Create trial subscription for new organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Subscription>} Created subscription
 */
export const createTrialSubscription = async (organizationId) => {
  // Get Professional plan for trial
  const professionalPlan = await Plan.findOne({ slug: "professional" });
  if (!professionalPlan) {
    throw new AppError("Professional plan not found. Run seed first.", 500);
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.create({
    organizationId,
    planId: professionalPlan._id,
    status: SUBSCRIPTION_STATUS.TRIAL,
    currentPeriod: {
      start: now,
      end: trialEnd,
    },
    trialStartDate: now,
    trialEndDate: trialEnd,
    usage: {
      currentUsers: 1, // CEO
      currentTeams: 0,
    },
  });

  return subscription;
};

/**
 * Get subscription with plan details
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Subscription with plan
 */
export const getSubscriptionWithPlan = async (organizationId) => {
  const subscription = await Subscription.findOne({ organizationId }).populate(
    "planId"
  );
  return subscription;
};

/**
 * Check if organization can add more users
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} { canAdd: boolean, current: number, limit: number, message?: string }
 */
export const checkUserLimit = async (organizationId) => {
  console.log(`\n[USER LIMIT] Checking for org: ${organizationId}`);

  const subscription = await getSubscriptionWithPlan(organizationId);

  if (!subscription) {
    console.log(`[USER LIMIT] ⚠️ No subscription found for org: ${organizationId}`);
    // Free tier: limit to 5 users
    const FREE_USER_LIMIT = 5;
    const User = (await import("../users/model.js")).default;
    const currentUsers = await User.countDocuments({
      organizationId,
      isDeleted: false,
      status: { $ne: 'invited' } // Don't count pending invites
    });

    if (currentUsers >= FREE_USER_LIMIT) {
      console.log(`[USER LIMIT] ❌ Free tier limit reached: ${currentUsers}/${FREE_USER_LIMIT}`);
      return {
        canAdd: false,
        current: currentUsers,
        limit: FREE_USER_LIMIT,
        message: `Free tier user limit reached (${currentUsers}/${FREE_USER_LIMIT}). Subscribe to add more users.`,
      };
    }

    console.log(`[USER LIMIT] ✅ Free tier: ${currentUsers}/${FREE_USER_LIMIT} users`);
    return { canAdd: true, current: currentUsers, limit: FREE_USER_LIMIT };
  }

  const plan = subscription.planId;

  if (!plan) {
    console.log(`[USER LIMIT] ⚠️ Subscription exists but no plan linked`);
    // Free tier: limit to 5 users
    const FREE_USER_LIMIT = 5;
    const User = (await import("../users/model.js")).default;
    const currentUsers = await User.countDocuments({
      organizationId,
      isDeleted: false,
      status: { $ne: 'invited' }
    });

    if (currentUsers >= FREE_USER_LIMIT) {
      console.log(`[USER LIMIT] ❌ Free tier limit reached: ${currentUsers}/${FREE_USER_LIMIT}`);
      return {
        canAdd: false,
        current: currentUsers,
        limit: FREE_USER_LIMIT,
        message: `Free tier user limit reached (${currentUsers}/${FREE_USER_LIMIT}). Subscribe to add more users.`,
      };
    }

    console.log(`[USER LIMIT] ✅ Free tier: ${currentUsers}/${FREE_USER_LIMIT} users`);
    return { canAdd: true, current: currentUsers, limit: FREE_USER_LIMIT };
  }

  const currentUsers = subscription.usage?.currentUsers || 0;
  const maxUsers = plan.limits?.maxUsers || 5;

  console.log(`[USER LIMIT] Plan: ${plan.name}, Current: ${currentUsers}, Max: ${maxUsers}`);

  // -1 means unlimited
  if (maxUsers === -1) {
    console.log(`[USER LIMIT] ✅ Unlimited users allowed`);
    return { canAdd: true, current: currentUsers, limit: -1 };
  }

  if (currentUsers >= maxUsers) {
    console.log(`[USER LIMIT] ❌ Limit reached: ${currentUsers}/${maxUsers}`);
    return {
      canAdd: false,
      current: currentUsers,
      limit: maxUsers,
      message: `User limit reached (${currentUsers}/${maxUsers}). Upgrade your plan to add more users.`,
    };
  }

  console.log(`[USER LIMIT] ✅ Can add user: ${currentUsers}/${maxUsers}`);
  return { canAdd: true, current: currentUsers, limit: maxUsers };
};

/**
 * Check if organization can add more teams
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} { canAdd: boolean, current: number, limit: number, message?: string }
 */
export const checkTeamLimit = async (organizationId) => {
  console.log(`\n[TEAM LIMIT] Checking for org: ${organizationId}`);

  const subscription = await getSubscriptionWithPlan(organizationId);

  if (!subscription) {
    console.log(`[TEAM LIMIT] ⚠️ No subscription found for org: ${organizationId}`);
    // Free tier: limit to 5 teams
    const FREE_TEAM_LIMIT = 5;
    const Team = (await import("../teams/teams.model.js")).default;
    const currentTeams = await Team.countDocuments({ organizationId, isDeleted: false });

    if (currentTeams >= FREE_TEAM_LIMIT) {
      console.log(`[TEAM LIMIT] ❌ Free tier limit reached: ${currentTeams}/${FREE_TEAM_LIMIT}`);
      return {
        canAdd: false,
        current: currentTeams,
        limit: FREE_TEAM_LIMIT,
        message: `Free tier team limit reached (${currentTeams}/${FREE_TEAM_LIMIT}). Subscribe to add more teams.`,
      };
    }

    console.log(`[TEAM LIMIT] ✅ Free tier: ${currentTeams}/${FREE_TEAM_LIMIT} teams`);
    return { canAdd: true, current: currentTeams, limit: FREE_TEAM_LIMIT };
  }

  const plan = subscription.planId;

  if (!plan) {
    console.log(`[TEAM LIMIT] ⚠️ Subscription exists but no plan linked`);
    // Free tier: limit to 5 teams
    const FREE_TEAM_LIMIT = 5;
    const Team = (await import("../teams/teams.model.js")).default;
    const currentTeams = await Team.countDocuments({ organizationId, isDeleted: false });

    if (currentTeams >= FREE_TEAM_LIMIT) {
      console.log(`[TEAM LIMIT] ❌ Free tier limit reached: ${currentTeams}/${FREE_TEAM_LIMIT}`);
      return {
        canAdd: false,
        current: currentTeams,
        limit: FREE_TEAM_LIMIT,
        message: `Free tier team limit reached (${currentTeams}/${FREE_TEAM_LIMIT}). Subscribe to add more teams.`,
      };
    }

    console.log(`[TEAM LIMIT] ✅ Free tier: ${currentTeams}/${FREE_TEAM_LIMIT} teams`);
    return { canAdd: true, current: currentTeams, limit: FREE_TEAM_LIMIT };
  }

  const currentTeams = subscription.usage?.currentTeams || 0;
  const maxTeams = plan.limits?.maxTeams || 3;

  console.log(`[TEAM LIMIT] Plan: ${plan.name}, Current: ${currentTeams}, Max: ${maxTeams}`);

  // -1 means unlimited
  if (maxTeams === -1) {
    console.log(`[TEAM LIMIT] ✅ Unlimited teams allowed`);
    return { canAdd: true, current: currentTeams, limit: -1 };
  }

  if (currentTeams >= maxTeams) {
    console.log(`[TEAM LIMIT] ❌ Limit reached: ${currentTeams}/${maxTeams}`);
    return {
      canAdd: false,
      current: currentTeams,
      limit: maxTeams,
      message: `Team limit reached (${currentTeams}/${maxTeams}). Upgrade your plan to add more teams.`,
    };
  }

  console.log(`[TEAM LIMIT] ✅ Can add team: ${currentTeams}/${maxTeams}`);
  return { canAdd: true, current: currentTeams, limit: maxTeams };
};

/**
 * Increment user count in subscription
 * @param {string} organizationId - Organization ID
 * @param {number} count - Number to increment (default 1)
 */
export const incrementUserCount = async (organizationId, count = 1) => {
  await Subscription.findOneAndUpdate(
    { organizationId },
    { $inc: { "usage.currentUsers": count } }
  );
};

/**
 * Decrement user count in subscription
 * @param {string} organizationId - Organization ID
 * @param {number} count - Number to decrement (default 1)
 */
export const decrementUserCount = async (organizationId, count = 1) => {
  await Subscription.findOneAndUpdate(
    { organizationId },
    { $inc: { "usage.currentUsers": -count } }
  );
};

/**
 * Increment team count in subscription
 * @param {string} organizationId - Organization ID
 * @param {number} count - Number to increment (default 1)
 */
export const incrementTeamCount = async (organizationId, count = 1) => {
  await Subscription.findOneAndUpdate(
    { organizationId },
    { $inc: { "usage.currentTeams": count } }
  );
};

/**
 * Decrement team count in subscription
 * @param {string} organizationId - Organization ID
 * @param {number} count - Number to decrement (default 1)
 */
export const decrementTeamCount = async (organizationId, count = 1) => {
  await Subscription.findOneAndUpdate(
    { organizationId },
    { $inc: { "usage.currentTeams": -count } }
  );
};

/**
 * Downgrade organization to FREE plan (called when trial expires)
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Subscription>} Updated subscription
 */
export const downgradeToFree = async (organizationId) => {
  const freePlan = await Plan.findOne({ slug: "free" });
  if (!freePlan) {
    throw new AppError("Free plan not found. Run seed first.", 500);
  }

  const now = new Date();
  // Free plan doesn't expire - set end date far in future
  const endDate = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.findOneAndUpdate(
    { organizationId },
    {
      planId: freePlan._id,
      status: SUBSCRIPTION_STATUS.ACTIVE, // Free is considered "active"
      currentPeriod: {
        start: now,
        end: endDate,
      },
      trialEndDate: null,
    },
    { new: true }
  );

  return subscription;
};

/**
 * Check if organization's trial has expired and downgrade if needed
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} { isExpired: boolean, subscription: Subscription }
 */
export const checkAndHandleTrialExpiry = async (organizationId) => {
  const subscription = await Subscription.findOne({ organizationId });

  if (!subscription) {
    return { isExpired: false, subscription: null };
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.TRIAL) {
    return { isExpired: false, subscription };
  }

  if (subscription.isTrialExpired()) {
    const updatedSubscription = await downgradeToFree(organizationId);
    return { isExpired: true, subscription: updatedSubscription };
  }

  return { isExpired: false, subscription };
};

/**
 * Get subscription status for organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Subscription status details
 */
export const getSubscriptionStatus = async (organizationId) => {
  const subscription = await getSubscriptionWithPlan(organizationId);

  if (!subscription) {
    return {
      hasSubscription: false,
      status: null,
      plan: null,
      usage: null,
      trialDaysRemaining: 0,
    };
  }

  const plan = subscription.planId;

  return {
    hasSubscription: true,
    status: subscription.status,
    plan: {
      name: plan.name,
      slug: plan.slug,
      limits: plan.limits,
      features: plan.features,
    },
    usage: subscription.usage,
    trialDaysRemaining: subscription.getTrialDaysRemaining(),
    currentPeriod: subscription.currentPeriod,
    isActive: subscription.isActive(),
  };
};

export default {
  createTrialSubscription,
  getSubscriptionWithPlan,
  checkUserLimit,
  checkTeamLimit,
  incrementUserCount,
  decrementUserCount,
  incrementTeamCount,
  decrementTeamCount,
  downgradeToFree,
  checkAndHandleTrialExpiry,
  getSubscriptionStatus,
};
