/**
 * Billing Controller
 *
 * Handles subscription and payment operations.
 * All operations are scoped to the authenticated user's organization.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import Plan from "./plan.model.js";
import Subscription from "./subscription.model.js";
import * as subscriptionService from "./subscription.service.js";
import * as razorpayService from "./razorpay.service.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Get all available plans
 * @route GET /api/v1/billing/plans
 * @access Public
 */
export const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.getActivePlans();

  return successResponse(res, 200, "Plans retrieved successfully", {
    plans: plans.map(plan => ({
      _id: plan._id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      pricing: plan.pricing,
      limits: plan.limits,
      features: plan.features,
      isPopular: plan.isPopular,
      yearlyDiscount: plan.getYearlyDiscount(),
    })),
  });
});

/**
 * Get current organization's subscription
 * @route GET /api/v1/billing/subscription
 * @access Private (requires auth)
 */
export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  if (!organizationId) {
    throw new AppError("Organization not found. Please re-login.", 400);
  }

  const status = await subscriptionService.getSubscriptionStatus(organizationId);

  return successResponse(res, 200, "Subscription retrieved successfully", {
    subscription: status,
  });
});

/**
 * Get subscription usage stats
 * @route GET /api/v1/billing/usage
 * @access Private (requires auth)
 */
export const getUsage = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  const subscription = await subscriptionService.getSubscriptionWithPlan(organizationId);

  if (!subscription) {
    return successResponse(res, 200, "Usage retrieved", {
      usage: {
        users: { current: 0, limit: 5 },
        teams: { current: 0, limit: 5 },
      },
    });
  }

  const plan = subscription.planId;

  return successResponse(res, 200, "Usage retrieved successfully", {
    usage: {
      users: {
        current: subscription.usage?.currentUsers || 0,
        limit: plan?.limits?.maxUsers || 5,
        unlimited: plan?.limits?.maxUsers === -1,
      },
      teams: {
        current: subscription.usage?.currentTeams || 0,
        limit: plan?.limits?.maxTeams || 3,
        unlimited: plan?.limits?.maxTeams === -1,
      },
    },
  });
});

/**
 * Create Razorpay checkout session
 * @route POST /api/v1/billing/checkout
 * @access Private (requires auth, owner only)
 */
export const createCheckout = asyncHandler(async (req, res) => {
  const { organizationId, userId, isOwner } = req.user;
  const { planSlug, billingCycle = "monthly" } = req.body;

  // Only organization owner can purchase plans
  if (!isOwner) {
    throw new AppError("Only organization owner can purchase subscriptions", 403);
  }

  if (!organizationId) {
    throw new AppError("Organization not found. Please re-login.", 400);
  }

  if (!planSlug) {
    throw new AppError("Plan is required", 400);
  }

  // Get plan
  const plan = await Plan.findBySlug(planSlug);
  if (!plan) {
    throw new AppError("Plan not found", 404);
  }

  // Create Razorpay order
  const order = await razorpayService.createOrder({
    organizationId,
    userId,
    planId: plan._id,
    billingCycle,
    amount: billingCycle === "yearly" ? plan.pricing.yearly : plan.pricing.monthly,
    currency: plan.pricing.currency,
  });

  return successResponse(res, 200, "Checkout session created", {
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    },
    plan: {
      name: plan.name,
      slug: plan.slug,
      billingCycle,
    },
  });
});

/**
 * Verify payment and activate subscription
 * @route POST /api/v1/billing/verify-payment
 * @access Private (requires auth, owner only)
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { organizationId, isOwner } = req.user;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planSlug, billingCycle } = req.body;

  if (!isOwner) {
    throw new AppError("Only organization owner can verify payments", 403);
  }

  // Verify signature
  const isValid = razorpayService.verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!isValid) {
    throw new AppError("Payment verification failed", 400);
  }

  // Get plan
  const plan = await Plan.findBySlug(planSlug);
  if (!plan) {
    throw new AppError("Plan not found", 404);
  }

  // Update subscription
  const subscription = await razorpayService.activateSubscription({
    organizationId,
    planId: plan._id,
    billingCycle,
    razorpayPaymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
  });

  logger.info(`Subscription activated for org: ${organizationId}, plan: ${plan.name}`);

  return successResponse(res, 200, "Payment verified and subscription activated", {
    subscription: await subscriptionService.getSubscriptionStatus(organizationId),
  });
});

/**
 * Handle Razorpay webhooks
 * @route POST /api/v1/billing/webhook
 * @access Public (verified by signature)
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  // Verify webhook signature
  const isValid = razorpayService.verifyWebhookSignature(
    JSON.stringify(req.body),
    signature
  );

  if (!isValid) {
    logger.warn("Invalid webhook signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body;

  // Process webhook event
  await razorpayService.processWebhookEvent(event);

  return res.status(200).json({ received: true });
});

/**
 * Cancel subscription (at period end)
 * @route POST /api/v1/billing/cancel
 * @access Private (requires auth, owner only)
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const { organizationId, isOwner } = req.user;

  if (!isOwner) {
    throw new AppError("Only organization owner can cancel subscription", 403);
  }

  const subscription = await Subscription.findOne({ organizationId });

  if (!subscription) {
    throw new AppError("No subscription found", 404);
  }

  subscription.cancelAtPeriodEnd = true;
  subscription.cancelledAt = new Date();
  await subscription.save();

  logger.info(`Subscription cancellation scheduled for org: ${organizationId}`);

  return successResponse(res, 200, "Subscription will be cancelled at the end of the billing period", {
    cancelAt: subscription.currentPeriod.end,
  });
});

export default {
  getPlans,
  getCurrentSubscription,
  getUsage,
  createCheckout,
  verifyPayment,
  handleWebhook,
  cancelSubscription,
};
