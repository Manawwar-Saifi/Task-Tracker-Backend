/**
 * Holiday Model
 *
 * Manages organization holidays and calendar events.
 */
import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    date: {
      type: Date,
      required: [true, "Holiday date is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["national", "regional", "optional", "custom"],
      default: "custom",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ["yearly", "monthly", null],
      default: null,
    },
    applicableTo: {
      type: String,
      enum: ["all", "specific_teams", "specific_departments"],
      default: "all",
    },
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    }],
    departments: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique holiday per date per organization
holidaySchema.index({ organizationId: 1, date: 1 }, { unique: true });
holidaySchema.index({ organizationId: 1, type: 1 });
holidaySchema.index({ organizationId: 1, isActive: 1, date: 1 });

/**
 * Check if a specific date is a holiday
 */
holidaySchema.statics.isHoliday = async function (organizationId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const holiday = await this.findOne({
    organizationId,
    date: { $gte: startOfDay, $lte: endOfDay },
    isActive: true,
  });

  return holiday;
};

/**
 * Get holidays for a specific month
 */
holidaySchema.statics.getByMonth = function (organizationId, year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return this.find({
    organizationId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
  }).sort({ date: 1 });
};

/**
 * Get holidays for a specific year
 */
holidaySchema.statics.getByYear = function (organizationId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  return this.find({
    organizationId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
  }).sort({ date: 1 });
};

/**
 * Get upcoming holidays
 */
holidaySchema.statics.getUpcoming = function (organizationId, limit = 5) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    organizationId,
    date: { $gte: today },
    isActive: true,
  })
    .sort({ date: 1 })
    .limit(limit);
};

/**
 * Seed default national holidays for India
 */
holidaySchema.statics.seedDefaults = async function (organizationId, createdBy, year = new Date().getFullYear()) {
  const defaultHolidays = [
    { name: "Republic Day", date: new Date(year, 0, 26), type: "national" },
    { name: "Holi", date: new Date(year, 2, 14), type: "national" },
    { name: "Good Friday", date: new Date(year, 3, 18), type: "optional" },
    { name: "Independence Day", date: new Date(year, 7, 15), type: "national" },
    { name: "Gandhi Jayanti", date: new Date(year, 9, 2), type: "national" },
    { name: "Dussehra", date: new Date(year, 9, 12), type: "national" },
    { name: "Diwali", date: new Date(year, 10, 1), type: "national" },
    { name: "Christmas", date: new Date(year, 11, 25), type: "national" },
  ];

  const holidays = defaultHolidays.map((h) => ({
    ...h,
    organizationId,
    createdBy,
    isRecurring: true,
    recurringPattern: "yearly",
  }));

  // Use insertMany with ordered: false to skip duplicates
  try {
    await this.insertMany(holidays, { ordered: false });
  } catch (error) {
    // Ignore duplicate key errors
    if (error.code !== 11000) {
      throw error;
    }
  }
};

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
