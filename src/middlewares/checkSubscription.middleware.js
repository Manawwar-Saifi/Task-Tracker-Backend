/**
 * Subscription Check Middleware
 * Validates subscription status and limits before allowing operations
 *
 * Usage:
 * router.post('/users/invite', authenticate, checkUserLimit, controller.invite)
 * router.post('/teams', authenticate, checkTeamLimit, controller.create)
 */
import {
  checkUserLimit as checkUserLimitService,
  checkTeamLimit as checkTeamLimitService,
  checkAndHandleTrialExpiry,
  getSubscriptionStatus,
} from "../modules/billing/subscription.service.js";
import AppError from "../utils/AppError.js";

/**
 * Check if organization can add more users
 * Returns 403 if limit reached
 */
export const checkUserLimit = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return next(new AppError("Organization not found", 400));
    }

    const limitCheck = await checkUserLimitService(organizationId);

    if (!limitCheck.canAdd) {
      return res.status(403).json({
        status: "error",
        message: limitCheck.message,
        data: {
          current: limitCheck.current,
          limit: limitCheck.limit,
          upgradeRequired: true,
        },
      });
    }

    // Attach limit info to request for potential use
    req.subscriptionLimits = {
      users: limitCheck,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if organization can add more teams
 * Returns 403 if limit reached
 */
export const checkTeamLimit = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return next(new AppError("Organization not found", 400));
    }

    const limitCheck = await checkTeamLimitService(organizationId);

    if (!limitCheck.canAdd) {
      return res.status(403).json({
        status: "error",
        message: limitCheck.message,
        data: {
          current: limitCheck.current,
          limit: limitCheck.limit,
          upgradeRequired: true,
        },
      });
    }

    // Attach limit info to request
    req.subscriptionLimits = {
      ...req.subscriptionLimits,
      teams: limitCheck,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check subscription status (trial expired, cancelled, etc.)
 * Downgrades to FREE plan if trial expired
 * Blocks access if subscription is in bad state
 */
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return next(new AppError("Organization not found", 400));
    }

    // Check and handle trial expiry (auto-downgrade to FREE)
    const { isExpired, subscription } =
      await checkAndHandleTrialExpiry(organizationId);

    if (isExpired) {
      // Trial just expired, notify but allow access (now on FREE plan)
      req.trialJustExpired = true;
    }

    if (!subscription) {
      return next(new AppError("No subscription found", 403));
    }

    // Block if subscription is cancelled or past_due
    if (["cancelled", "past_due"].includes(subscription.status)) {
      return res.status(403).json({
        status: "error",
        message: `Subscription is ${subscription.status}. Please update your payment method.`,
        data: {
          subscriptionStatus: subscription.status,
          upgradeRequired: true,
        },
      });
    }

    // Attach subscription to request
    req.subscription = subscription;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Attach subscription status to request (non-blocking)
 * Useful for routes that want subscription info but don't need to enforce limits
 */
export const attachSubscriptionStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (organizationId) {
      req.subscriptionStatus = await getSubscriptionStatus(organizationId);
    }

    next();
  } catch (error) {
    // Non-blocking - just log and continue
    console.error("Error attaching subscription status:", error.message);
    next();
  }
};

export default {
  checkUserLimit,
  checkTeamLimit,
  checkSubscriptionStatus,
  attachSubscriptionStatus,
};
