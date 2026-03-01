import razorpay from "../../config/razorpay.js";
import Subscription from "../billing/subscription.model.js";
import Organization from "../organizations/model.js";
import AppError from "../../utils/AppError.js";
import { SUBSCRIPTION_STATUS } from "../../config/constants.js";

/**
 * Create Razorpay Order
 */
export const createSubscriptionOrder = async ({
  organizationId,
  plan,
  amount,
  billingCycle,
}) => {
  const org = await Organization.findById(organizationId);

  if (!org) {
    throw new AppError("Organization not found", 404);
  }

  if (org.status !== "pending") {
    throw new AppError("Organization already active", 400);
  }

  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay uses paise
    currency: "INR",
    receipt: `org_${organizationId}`,
    notes: {
      organizationId: organizationId.toString(),
      plan,
      billingCycle,
    },
  });

  // Create pending subscription
  const subscription = await Subscription.create({
    organizationId,
    planKey: plan,
    planName: plan,
    billingCycle,
    status: "pending",
    paymentGateway: "razorpay",
    paymentOrderId: order.id,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    subscriptionId: subscription._id,
  };
};
