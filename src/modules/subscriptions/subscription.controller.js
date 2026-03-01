/**
 * Subscription Controller
 *
 * HTTP handlers for subscription management endpoints.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as subscriptionService from "./subscription.service.js";

/**
 * Get subscription for organization
 * @route GET /api/v1/subscriptions
 */
export const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getSubscription(req.user.organizationId);
  return successResponse(res, 200, "Subscription retrieved successfully", { subscription });
});

/**
 * Get available plans
 * @route GET /api/v1/subscriptions/plans
 */
export const getPlans = asyncHandler(async (req, res) => {
  const { billingCycle } = req.query;
  const data = await subscriptionService.getPlans(billingCycle);
  return successResponse(res, 200, "Plans retrieved successfully", data);
});

/**
 * Upgrade subscription plan
 * @route PUT /api/v1/subscriptions/upgrade
 */
export const upgradePlan = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.upgradePlan(req.user.organizationId, req.body);
  return successResponse(res, 200, "Plan upgraded successfully", { subscription });
});

/**
 * Update subscription settings
 * @route PUT /api/v1/subscriptions
 */
export const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.updateSubscription(req.user.organizationId, req.body);
  return successResponse(res, 200, "Subscription updated successfully", { subscription });
});

/**
 * Cancel subscription
 * @route POST /api/v1/subscriptions/cancel
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const subscription = await subscriptionService.cancelSubscription(req.user.organizationId, reason);
  return successResponse(res, 200, "Subscription cancelled successfully", { subscription });
});

/**
 * Renew subscription
 * @route POST /api/v1/subscriptions/renew
 */
export const renewSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.renewSubscription(req.user.organizationId);
  return successResponse(res, 200, "Subscription renewed successfully", { subscription });
});

/**
 * Update usage stats
 * @route PUT /api/v1/subscriptions/usage
 */
export const updateUsage = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.updateUsage(req.user.organizationId, req.body);
  return successResponse(res, 200, "Usage updated successfully", { subscription });
});

/**
 * Check if feature is enabled
 * @route GET /api/v1/subscriptions/features/:feature
 */
export const checkFeature = asyncHandler(async (req, res) => {
  const { feature } = req.params;
  const enabled = await subscriptionService.checkFeature(req.user.organizationId, feature);
  return successResponse(res, 200, "Feature check completed", { feature, enabled });
});

/**
 * Check if usage is within limits
 * @route GET /api/v1/subscriptions/limits/:limitType
 */
export const checkLimit = asyncHandler(async (req, res) => {
  const { limitType } = req.params;
  const withinLimit = await subscriptionService.checkLimit(req.user.organizationId, limitType);
  return successResponse(res, 200, "Limit check completed", { limitType, withinLimit });
});

/**
 * Get subscription stats (Admin)
 * @route GET /api/v1/subscriptions/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await subscriptionService.getStats();
  return successResponse(res, 200, "Stats retrieved successfully", { stats });
});

/**
 * Get all subscriptions (Admin)
 * @route GET /api/v1/subscriptions/all
 */
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  const data = await subscriptionService.getAllSubscriptions(req.query);
  return successResponse(res, 200, "Subscriptions retrieved successfully", data);
});

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
};
