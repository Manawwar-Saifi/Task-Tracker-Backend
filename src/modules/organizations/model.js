import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    /* -------------------- BASIC INFO -------------------- */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    /* -------------------- OWNER (CEO CONTEXT) -------------------- */
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // set AFTER CEO user is created
    },

    /* -------------------- STATUS CONTROL -------------------- */
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
      index: true,
    },

    /* -------------------- SUBSCRIPTION CONTEXT -------------------- */
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    /* -------------------- SYSTEM FLAGS -------------------- */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* -------------------- INDEXES -------------------- */

// Prevent duplicate orgs for same owner email (optional but recommended)
organizationSchema.index(
  { name: 1, ownerEmail: 1 },
  { unique: true }
);

const Organization = mongoose.model(
  "Organization",
  organizationSchema
);

export default Organization;
