/**
 * Razorpay Service
 *
 * Handles all Razorpay payment operations:
 * - Create orders
 * - Verify payment signatures
 * - Process webhooks
 * - Activate subscriptions
 *
 * All operations are linked to organizationId for multi-tenant isolation.
 */
import crypto from "crypto";
import razorpay from "../../config/razorpay.js";
import Subscription from "./subscription.model.js";
import { SUBSCRIPTION_STATUS } from "../../config/constants.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Create Razorpay order for payment
 * @param {Object} params - Order parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.userId - User ID (purchaser)
 * @param {string} params.planId - Plan ID
 * @param {string} params.billingCycle - 'monthly' or 'yearly'
 * @param {number} params.amount - Amount in smallest currency unit (paise for INR)
 * @param {string} params.currency - Currency code (default: INR)
 * @returns {Promise<Object>} Razorpay order
 */
export const createOrder = async ({
  organizationId,
  userId,
  planId,
  billingCycle,
  amount,
  currency = "INR",
}) => {
  try {
    // Amount should be in paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `org_${organizationId}_${Date.now()}`,
      notes: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        planId: planId.toString(),
        billingCycle,
      },
    });

    logger.info(`Razorpay order created: ${order.id} for org: ${organizationId}`);
    return order;
  } catch (error) {
    logger.error("Error creating Razorpay order:", error);
    throw new AppError("Failed to create payment order", 500);
  }
};

/**
 * Verify payment signature
 * @param {Object} params - Payment verification params
 * @param {string} params.razorpay_order_id - Razorpay order ID
 * @param {string} params.razorpay_payment_id - Razorpay payment ID
 * @param {string} params.razorpay_signature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
export const verifyPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === razorpay_signature;
  } catch (error) {
    logger.error("Error verifying payment signature:", error);
    return false;
  }
};

/**
 * Verify webhook signature
 * @param {string} body - Request body as string
 * @param {string} signature - Webhook signature from header
 * @returns {boolean} True if signature is valid
 */
export const verifyWebhookSignature = (body, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    logger.error("Error verifying webhook signature:", error);
    return false;
  }
};

/**
 * Activate subscription after successful payment
 * @param {Object} params - Activation parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.planId - Plan ID
 * @param {string} params.billingCycle - 'monthly' or 'yearly'
 * @param {string} params.razorpayPaymentId - Razorpay payment ID
 * @param {string} params.razorpayOrderId - Razorpay order ID
 * @returns {Promise<Object>} Updated subscription
 */
export const activateSubscription = async ({
  organizationId,
  planId,
  billingCycle,
  razorpayPaymentId,
  razorpayOrderId,
}) => {
  const now = new Date();

  // Calculate period end based on billing cycle
  let periodEnd;
  if (billingCycle === "yearly") {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Update or create subscription
  const subscription = await Subscription.findOneAndUpdate(
    { organizationId },
    {
      planId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      currentPeriod: {
        start: now,
        end: periodEnd,
      },
      trialEndDate: null, // Clear trial
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      razorpaySubscriptionId: razorpayOrderId,
      $push: {
        paymentHistory: {
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
          amount: 0, // Will be updated from webhook
          status: "captured",
          paidAt: now,
        },
      },
    },
    { new: true, upsert: true }
  );

  logger.info(`Subscription activated for org: ${organizationId}`);
  return subscription;
};

/**
 * Process Razorpay webhook events
 * @param {Object} event - Webhook event payload
 */
export const processWebhookEvent = async (event) => {
  const { event: eventType, payload } = event;

  logger.info(`Processing webhook: ${eventType}`);

  switch (eventType) {
    case "payment.captured":
      await handlePaymentCaptured(payload);
      break;

    case "payment.failed":
      await handlePaymentFailed(payload);
      break;

    case "subscription.charged":
      await handleSubscriptionCharged(payload);
      break;

    case "subscription.cancelled":
      await handleSubscriptionCancelled(payload);
      break;

    default:
      logger.info(`Unhandled webhook event: ${eventType}`);
  }
};

/**
 * Handle payment captured event
 */
const handlePaymentCaptured = async (payload) => {
  const payment = payload.payment.entity;
  const { organizationId } = payment.notes || {};

  if (!organizationId) {
    logger.warn("Payment captured without organizationId");
    return;
  }

  logger.info(`Payment captured for org: ${organizationId}, amount: ${payment.amount}`);

  // Update subscription payment history
  await Subscription.updateOne(
    { organizationId },
    {
      $set: {
        "paymentHistory.$[elem].amount": payment.amount / 100, // Convert from paise
        "paymentHistory.$[elem].status": "captured",
      },
    },
    {
      arrayFilters: [{ "elem.paymentId": payment.id }],
    }
  );
};

/**
 * Handle payment failed event
 */
const handlePaymentFailed = async (payload) => {
  const payment = payload.payment.entity;
  const { organizationId } = payment.notes || {};

  if (!organizationId) {
    logger.warn("Payment failed without organizationId");
    return;
  }

  logger.warn(`Payment failed for org: ${organizationId}`);

  // Update subscription status
  await Subscription.updateOne(
    { organizationId },
    {
      status: SUBSCRIPTION_STATUS.PAST_DUE,
    }
  );
};

/**
 * Handle subscription charged (recurring payment)
 */
const handleSubscriptionCharged = async (payload) => {
  const subscription = payload.subscription.entity;
  const { organizationId } = subscription.notes || {};

  if (!organizationId) {
    logger.warn("Subscription charged without organizationId");
    return;
  }

  logger.info(`Subscription renewed for org: ${organizationId}`);

  // Extend subscription period
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Subscription.updateOne(
    { organizationId },
    {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      "currentPeriod.start": now,
      "currentPeriod.end": periodEnd,
    }
  );
};

/**
 * Handle subscription cancelled
 */
const handleSubscriptionCancelled = async (payload) => {
  const subscription = payload.subscription.entity;
  const { organizationId } = subscription.notes || {};

  if (!organizationId) {
    logger.warn("Subscription cancelled without organizationId");
    return;
  }

  logger.info(`Subscription cancelled for org: ${organizationId}`);

  await Subscription.updateOne(
    { organizationId },
    {
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: new Date(),
    }
  );
};

export default {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  activateSubscription,
  processWebhookEvent,
};
