/**
 * Subscription Model
 * Tracks organization subscription status and billing
 *
 * Flow:
 * 1. On registration -> Create trial subscription (Professional plan, 14 days)
 * 2. Trial expires -> Downgrade to FREE plan
 * 3. User upgrades -> Status becomes "active"
 * 4. Payment fails -> Status becomes "past_due"
 */
import mongoose from "mongoose";
import { SUBSCRIPTION_STATUS } from "../../config/constants.js";

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.TRIAL,
    },
    // Current billing period
    currentPeriod: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    // Trial specific fields
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    // Razorpay integration
    razorpaySubscriptionId: { type: String, default: null },
    razorpayCustomerId: { type: String, default: null },
    // Cancellation
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    // Usage tracking (denormalized for quick access)
    usage: {
      currentUsers: { type: Number, default: 1 }, // CEO counts as 1
      currentTeams: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (organizationId already has unique index from field definition)
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ "currentPeriod.end": 1 }); // For expiry checks

/**
 * Check if subscription is active (trial or paid)
 */
subscriptionSchema.methods.isActive = function () {
  return [SUBSCRIPTION_STATUS.TRIAL, SUBSCRIPTION_STATUS.ACTIVE].includes(
    this.status
  );
};

/**
 * Check if trial has expired
 */
subscriptionSchema.methods.isTrialExpired = function () {
  if (this.status !== SUBSCRIPTION_STATUS.TRIAL) return false;
  return new Date() > this.trialEndDate;
};

/**
 * Get days remaining in trial
 */
subscriptionSchema.methods.getTrialDaysRemaining = function () {
  if (this.status !== SUBSCRIPTION_STATUS.TRIAL) return 0;
  const now = new Date();
  const end = new Date(this.trialEndDate);
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
