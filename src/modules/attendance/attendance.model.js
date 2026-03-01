/**
 * Attendance Model
 *
 * Daily attendance records with time tracking and breaks.
 */
import mongoose from "mongoose";

// Break sub-schema
const breakSchema = new mongoose.Schema(
  {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in minutes
      default: null,
    },
    type: {
      type: String,
      enum: ["lunch", "tea", "personal", "other"],
      default: "other",
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    clockIn: {
      type: Date,
      default: null,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    breaks: {
      type: [breakSchema],
      default: [],
    },
    isOnBreak: {
      type: Boolean,
      default: false,
    },
    totalWorkMinutes: {
      type: Number,
      default: 0,
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
    },
    effectiveWorkMinutes: {
      type: Number, // totalWorkMinutes - totalBreakMinutes
      default: 0,
    },
    status: {
      type: String,
      enum: ["present", "absent", "half_day", "on_leave", "holiday", "weekend"],
      default: "absent",
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateByMinutes: {
      type: Number,
      default: 0,
    },
    isEarlyOut: {
      type: Boolean,
      default: false,
    },
    earlyOutByMinutes: {
      type: Number,
      default: 0,
    },
    overtime: {
      requested: {
        type: Number, // minutes
        default: 0,
      },
      approved: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      approvedAt: {
        type: Date,
        default: null,
      },
    },
    notes: {
      type: String,
      maxlength: 500,
      default: "",
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null },
    },
    device: {
      deviceType: { type: String, default: null },
      userAgent: { type: String, default: null },
      ip: { type: String, default: null },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isManualEntry: {
      type: Boolean,
      default: false,
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

// Compound indexes for efficient queries
attendanceSchema.index({ organizationId: 1, date: 1 });
attendanceSchema.index({ organizationId: 1, userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ organizationId: 1, status: 1, date: 1 });

// Virtual: formatted work hours
attendanceSchema.virtual("workHours").get(function () {
  const hours = Math.floor(this.effectiveWorkMinutes / 60);
  const minutes = this.effectiveWorkMinutes % 60;
  return `${hours}h ${minutes}m`;
});

// Virtual: formatted break time
attendanceSchema.virtual("breakTime").get(function () {
  const hours = Math.floor(this.totalBreakMinutes / 60);
  const minutes = this.totalBreakMinutes % 60;
  return `${hours}h ${minutes}m`;
});

// Method: Start a break
attendanceSchema.methods.startBreak = function (type = "other") {
  if (this.isOnBreak) {
    throw new Error("Already on break");
  }
  if (!this.clockIn) {
    throw new Error("Not clocked in");
  }
  if (this.clockOut) {
    throw new Error("Already clocked out");
  }

  this.breaks.push({
    startTime: new Date(),
    endTime: null,
    duration: null,
    type,
  });
  this.isOnBreak = true;
};

// Method: End current break
attendanceSchema.methods.endBreak = function () {
  if (!this.isOnBreak) {
    throw new Error("Not on break");
  }

  const currentBreak = this.breaks[this.breaks.length - 1];
  const endTime = new Date();
  currentBreak.endTime = endTime;
  currentBreak.duration = Math.floor(
    (endTime - currentBreak.startTime) / 60000
  );

  this.isOnBreak = false;
  this.calculateTotalBreak();
};

// Method: Calculate total break minutes
attendanceSchema.methods.calculateTotalBreak = function () {
  this.totalBreakMinutes = this.breaks.reduce(
    (total, brk) => total + (brk.duration || 0),
    0
  );
};

// Method: Calculate work minutes
attendanceSchema.methods.calculateWorkMinutes = function () {
  if (!this.clockIn) {
    this.totalWorkMinutes = 0;
    this.effectiveWorkMinutes = 0;
    return;
  }

  const endTime = this.clockOut || new Date();
  this.totalWorkMinutes = Math.floor((endTime - this.clockIn) / 60000);
  this.effectiveWorkMinutes = Math.max(
    0,
    this.totalWorkMinutes - this.totalBreakMinutes
  );
};

// Pre-save: calculate work minutes
attendanceSchema.pre("save", function (next) {
  this.calculateWorkMinutes();
  next();
});

// Static: Get today's date (start of day)
attendanceSchema.statics.getTodayDate = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Static: Find or create today's record
attendanceSchema.statics.findOrCreateToday = async function (
  organizationId,
  userId
) {
  const today = this.getTodayDate();

  let record = await this.findOne({
    organizationId,
    userId,
    date: today,
    isDeleted: false,
  });

  if (!record) {
    record = await this.create({
      organizationId,
      userId,
      date: today,
      status: "absent",
    });
  }

  return record;
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
