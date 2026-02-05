import crypto from "crypto";
import Subscription from "../subscriptions/model.js";
import Organization from "../organizations/model.js";
import User from "../users/model.js";
import AppError from "../../utils/AppError.js";

/**
 * Razorpay Webhook Handler
 */
export const razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];

  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ success: false });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  // ✅ PAYMENT SUCCESS
  if (event === "payment.captured") {
    const payment = payload.payment.entity;

    const subscription = await Subscription.findOne({
      paymentOrderId: payment.order_id,
      status: "pending",
    });

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    // Activate subscription
    subscription.status = "active";
    subscription.startDate = new Date();
    subscription.endDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    subscription.paymentTransactionId = payment.id;
    subscription.paymentSignature = signature;

    await subscription.save();

    // Activate organization
    const organization = await Organization.findById(
      subscription.organizationId
    );

    organization.status = "active";
    organization.subscriptionId = subscription._id;
    await organization.save();

    // Create CEO user (if not exists)
    const existingUser = await User.findOne({
      email: organization.ownerEmail,
      organizationId: organization._id,
    });

    if (!existingUser) {
      const ceo = await User.create({
        name: "CEO",
        email: organization.ownerEmail,
        password: "TEMP", // must be reset
        organizationId: organization._id,
        isSuperAdmin: true,
      });

      organization.ownerUserId = ceo._id;
      await organization.save();

      // TODO: send set-password email
    }
  }

  return res.json({ success: true });
};
