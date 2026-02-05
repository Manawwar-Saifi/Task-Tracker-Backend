import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    /* -------------------- ORGANIZATION LINK -------------------- */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* -------------------- PLAN INFO -------------------- */
    planKey: {
      type: String,
      required: true,
      enum: ["FREE", "BASIC", "PRO", "ENTERPRISE"],
    },

    planName: {
      type: String,
      required: true,
    },

    /* -------------------- BILLING STATUS -------------------- */
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
      index: true,
    },

    /* -------------------- BILLING CYCLE -------------------- */
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
      index: true,
    },

    /* -------------------- PAYMENT GATEWAY -------------------- */
    paymentGateway: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true,
    },

    paymentOrderId: {
      type: String,
      default: null,
      index: true,
    },

    paymentTransactionId: {
      type: String,
      default: null,
    },

    paymentSignature: {
      type: String,
      default: null,
    },

    /* -------------------- USAGE LIMITS (PLAN BASED) -------------------- */
    maxUsers: {
      type: Number,
      default: 5,
    },

    maxTeams: {
      type: Number,
      default: 2,
    },

    maxStorageMB: {
      type: Number,
      default: 500,
    },

    /* -------------------- SYSTEM FLAGS -------------------- */
    isTrial: {
      type: Boolean,
      default: false,
    },

    trialEndsAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* -------------------- INDEXES -------------------- */

// Only one active subscription per org
subscriptionSchema.index(
  { organizationId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

const Subscription = mongoose.model(
  "Subscription",
  subscriptionSchema
);

export default Subscription;
