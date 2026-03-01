/**
 * Offer Letter Model
 *
 * Mongoose schema for offer letter management.
 * Confidential data - restricted access.
 */
import mongoose from "mongoose";

const offerLetterSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Candidate info (may differ from user if pre-registration)
    candidateName: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
    },
    candidateEmail: {
      type: String,
      required: [true, "Candidate email is required"],
      trim: true,
      lowercase: true,
    },
    // Position details
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
    },
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Compensation details
    salary: {
      basic: {
        type: Number,
        required: [true, "Basic salary is required"],
        min: 0,
      },
      allowances: [
        {
          name: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
          type: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
        },
      ],
      currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD", "EUR", "GBP"],
      },
    },
    // Employment details
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },
    probationPeriod: {
      type: Number,
      default: 3, // months
      min: 0,
    },
    noticePeriod: {
      type: Number,
      default: 1, // months
      min: 0,
    },
    workLocation: {
      type: String,
      trim: true,
      default: null,
    },
    // Document
    documentUrl: {
      type: String,
      default: null,
    },
    // Status workflow
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "withdrawn", "expired"],
      default: "draft",
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    // Terms and conditions
    terms: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
offerLetterSchema.index({ organizationId: 1, status: 1 });
offerLetterSchema.index({ organizationId: 1, userId: 1 });

/**
 * Virtual: Calculate total CTC
 */
offerLetterSchema.virtual("totalCTC").get(function () {
  const allowanceTotal = this.salary.allowances.reduce((sum, item) => {
    if (item.type === "percentage") {
      return sum + (this.salary.basic * item.amount) / 100;
    }
    return sum + item.amount;
  }, 0);

  return (this.salary.basic + allowanceTotal) * 12; // Annual
});

/**
 * Virtual: Monthly CTC
 */
offerLetterSchema.virtual("monthlyCTC").get(function () {
  const allowanceTotal = this.salary.allowances.reduce((sum, item) => {
    if (item.type === "percentage") {
      return sum + (this.salary.basic * item.amount) / 100;
    }
    return sum + item.amount;
  }, 0);

  return this.salary.basic + allowanceTotal;
});

/**
 * Virtual: Check if expired
 */
offerLetterSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt && this.status === "sent";
});

/**
 * Static: Get offer letters with filters
 */
offerLetterSchema.statics.getOfferLetters = async function (
  organizationId,
  options = {}
) {
  const { page = 1, limit = 10, status, userId } = options;

  const query = { organizationId, isDeleted: false };

  if (status) query.status = status;
  if (userId) query.userId = userId;

  const [offerLetters, total] = await Promise.all([
    this.find(query)
      .populate("userId", "firstName lastName email")
      .populate("reportingTo", "firstName lastName")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    offerLetters,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Static: Get statistics
 */
offerLetterSchema.statics.getStats = async function (organizationId) {
  const results = await this.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), isDeleted: false } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    expired: 0,
  };

  results.forEach((item) => {
    stats[item._id] = item.count;
    stats.total += item.count;
  });

  return stats;
};

/**
 * Instance: Send offer letter
 */
offerLetterSchema.methods.send = function (expiryDays = 7) {
  this.status = "sent";
  this.sentAt = new Date();
  this.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  return this;
};

/**
 * Instance: Accept offer letter
 */
offerLetterSchema.methods.accept = function () {
  if (this.status !== "sent") {
    throw new Error("Only sent offer letters can be accepted");
  }
  this.status = "accepted";
  this.acceptedAt = new Date();
  return this;
};

/**
 * Instance: Reject offer letter
 */
offerLetterSchema.methods.reject = function (reason = null) {
  if (this.status !== "sent") {
    throw new Error("Only sent offer letters can be rejected");
  }
  this.status = "rejected";
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this;
};

/**
 * Instance: Withdraw offer letter
 */
offerLetterSchema.methods.withdraw = function () {
  if (!["draft", "sent"].includes(this.status)) {
    throw new Error("Only draft or sent offer letters can be withdrawn");
  }
  this.status = "withdrawn";
  return this;
};

const OfferLetter = mongoose.model("OfferLetter", offerLetterSchema);

export default OfferLetter;
