import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Hashed OTP (SHA256 - never store plain OTP)
    otpHash: {
      type: String,
      required: true,
    },

    // Expiry time (10 minutes from creation)
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index - auto-delete expired docs
    },

    // Rate limiting: verification attempts
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },

    // Rate limiting: resend requests
    resendCount: {
      type: Number,
      default: 0,
      max: 3,
    },

    lastResendAt: {
      type: Date,
      default: null,
    },

    // Track IP for abuse detection
    requestIp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
emailVerificationSchema.index({ email: 1, expiresAt: 1 });

const EmailVerification = mongoose.model(
  "EmailVerification",
  emailVerificationSchema
);

export default EmailVerification;
