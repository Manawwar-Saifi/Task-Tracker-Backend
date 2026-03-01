/**
 * Salary Model
 *
 * Mongoose schema for employee salary management.
 * Confidential data - restricted access.
 */
import mongoose from "mongoose";

const allowanceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
  },
  { _id: false }
);

const deductionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
  },
  { _id: false }
);

const salarySchema = new mongoose.Schema(
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
      required: [true, "User is required"],
      index: true,
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    allowances: {
      type: [allowanceSchema],
      default: [],
    },
    deductions: {
      type: [deductionSchema],
      default: [],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"],
    },
    paymentFrequency: {
      type: String,
      enum: ["monthly", "bi-weekly", "weekly"],
      default: "monthly",
    },
    bankDetails: {
      accountNumber: {
        type: String,
        trim: true,
        default: null,
      },
      bankName: {
        type: String,
        trim: true,
        default: null,
      },
      ifscCode: {
        type: String,
        trim: true,
        default: null,
      },
      accountHolderName: {
        type: String,
        trim: true,
        default: null,
      },
    },
    effectiveFrom: {
      type: Date,
      required: [true, "Effective date is required"],
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
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
salarySchema.index({ organizationId: 1, userId: 1 });
salarySchema.index({ organizationId: 1, isActive: 1 });

/**
 * Virtual: Calculate total allowances
 */
salarySchema.virtual("totalAllowances").get(function () {
  return this.allowances.reduce((sum, item) => {
    if (item.type === "percentage") {
      return sum + (this.basicSalary * item.amount) / 100;
    }
    return sum + item.amount;
  }, 0);
});

/**
 * Virtual: Calculate total deductions
 */
salarySchema.virtual("totalDeductions").get(function () {
  return this.deductions.reduce((sum, item) => {
    if (item.type === "percentage") {
      return sum + (this.basicSalary * item.amount) / 100;
    }
    return sum + item.amount;
  }, 0);
});

/**
 * Virtual: Calculate gross salary
 */
salarySchema.virtual("grossSalary").get(function () {
  return this.basicSalary + this.totalAllowances;
});

/**
 * Virtual: Calculate net salary
 */
salarySchema.virtual("netSalary").get(function () {
  return this.grossSalary - this.totalDeductions;
});

/**
 * Static: Get active salary for user
 */
salarySchema.statics.getActiveSalary = async function (organizationId, userId) {
  return this.findOne({
    organizationId,
    userId,
    isActive: true,
    isDeleted: false,
  })
    .populate("userId", "firstName lastName email employeeId")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .lean();
};

/**
 * Static: Get salary history for user
 */
salarySchema.statics.getSalaryHistory = async function (organizationId, userId) {
  return this.find({
    organizationId,
    userId,
    isDeleted: false,
  })
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({ effectiveFrom: -1 })
    .lean();
};

/**
 * Static: Get organization salary statistics
 */
salarySchema.statics.getOrgStats = async function (organizationId) {
  const salaries = await this.find({
    organizationId,
    isActive: true,
    isDeleted: false,
  }).lean();

  if (salaries.length === 0) {
    return {
      totalEmployees: 0,
      totalMonthlyPayroll: 0,
      averageSalary: 0,
      minSalary: 0,
      maxSalary: 0,
    };
  }

  const netSalaries = salaries.map((s) => {
    const totalAllowances = s.allowances.reduce((sum, item) => {
      if (item.type === "percentage") {
        return sum + (s.basicSalary * item.amount) / 100;
      }
      return sum + item.amount;
    }, 0);

    const totalDeductions = s.deductions.reduce((sum, item) => {
      if (item.type === "percentage") {
        return sum + (s.basicSalary * item.amount) / 100;
      }
      return sum + item.amount;
    }, 0);

    return s.basicSalary + totalAllowances - totalDeductions;
  });

  const totalMonthlyPayroll = netSalaries.reduce((sum, s) => sum + s, 0);

  return {
    totalEmployees: salaries.length,
    totalMonthlyPayroll,
    averageSalary: Math.round(totalMonthlyPayroll / salaries.length),
    minSalary: Math.min(...netSalaries),
    maxSalary: Math.max(...netSalaries),
  };
};

/**
 * Instance: Deactivate salary (when updating)
 */
salarySchema.methods.deactivate = function () {
  this.isActive = false;
  this.effectiveTo = new Date();
  return this;
};

const Salary = mongoose.model("Salary", salarySchema);

export default Salary;
