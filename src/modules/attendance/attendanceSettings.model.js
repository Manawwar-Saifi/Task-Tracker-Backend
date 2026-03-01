/**
 * Attendance Settings Model
 *
 * Organization-level settings for attendance tracking.
 */
import mongoose from "mongoose";

const attendanceSettingsSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true,
    },
    // Work schedule
    workStartTime: {
      type: String, // "09:00"
      default: "09:00",
    },
    workEndTime: {
      type: String, // "18:00"
      default: "18:00",
    },
    graceMinutes: {
      type: Number, // Late login grace period
      default: 15,
      min: 0,
      max: 60,
    },
    // Break settings
    breakDuration: {
      type: Number, // Standard break in minutes
      default: 60,
      min: 0,
      max: 180,
    },
    maxBreaks: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    // Working days (0 = Sunday, 6 = Saturday)
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Mon-Fri
      validate: {
        validator: function (v) {
          return v.every((day) => day >= 0 && day <= 6);
        },
        message: "Working days must be between 0 (Sunday) and 6 (Saturday)",
      },
    },
    // Overtime settings
    overtimeEnabled: {
      type: Boolean,
      default: true,
    },
    minOvertimeMinutes: {
      type: Number, // Minimum overtime to be counted
      default: 30,
    },
    maxOvertimeMinutes: {
      type: Number, // Maximum daily overtime allowed
      default: 240, // 4 hours
    },
    overtimeNeedsApproval: {
      type: Boolean,
      default: true,
    },
    // Half-day settings
    halfDayMinutes: {
      type: Number, // Work minutes to be considered half-day
      default: 240, // 4 hours
    },
    // Geo-fencing (optional)
    geoFencingEnabled: {
      type: Boolean,
      default: false,
    },
    officeLocations: {
      type: [
        {
          name: String,
          latitude: Number,
          longitude: Number,
          radiusMeters: { type: Number, default: 100 },
        },
      ],
      default: [],
    },
    // Auto clock-out
    autoClockOutEnabled: {
      type: Boolean,
      default: false,
    },
    autoClockOutTime: {
      type: String, // "23:59"
      default: "23:59",
    },
    // Week start day (for reports)
    weekStartDay: {
      type: Number,
      default: 1, // Monday
      min: 0,
      max: 6,
    },
    // Timezone
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    // Updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: Get work hours duration in minutes
attendanceSettingsSchema.virtual("workDurationMinutes").get(function () {
  const [startHour, startMin] = this.workStartTime.split(":").map(Number);
  const [endHour, endMin] = this.workEndTime.split(":").map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
});

// Static: Get or create settings for organization
attendanceSettingsSchema.statics.getOrCreate = async function (organizationId) {
  let settings = await this.findOne({ organizationId });

  if (!settings) {
    settings = await this.create({ organizationId });
  }

  return settings;
};

// Method: Check if day is a working day
attendanceSettingsSchema.methods.isWorkingDay = function (date) {
  const dayOfWeek = date.getDay();
  return this.workingDays.includes(dayOfWeek);
};

// Method: Check if time is late
attendanceSettingsSchema.methods.isLateLogin = function (clockInTime) {
  const [startHour, startMin] = this.workStartTime.split(":").map(Number);
  const clockIn = new Date(clockInTime);
  const expectedStart = new Date(clockIn);
  expectedStart.setHours(startHour, startMin + this.graceMinutes, 0, 0);

  return clockIn > expectedStart;
};

// Method: Calculate late by minutes
attendanceSettingsSchema.methods.getLateMinutes = function (clockInTime) {
  const [startHour, startMin] = this.workStartTime.split(":").map(Number);
  const clockIn = new Date(clockInTime);
  const expectedStart = new Date(clockIn);
  expectedStart.setHours(startHour, startMin + this.graceMinutes, 0, 0);

  if (clockIn <= expectedStart) return 0;
  return Math.floor((clockIn - expectedStart) / 60000);
};

// Method: Check if early out
attendanceSettingsSchema.methods.isEarlyOut = function (clockOutTime) {
  const [endHour, endMin] = this.workEndTime.split(":").map(Number);
  const clockOut = new Date(clockOutTime);
  const expectedEnd = new Date(clockOut);
  expectedEnd.setHours(endHour, endMin, 0, 0);

  return clockOut < expectedEnd;
};

// Method: Calculate early out minutes
attendanceSettingsSchema.methods.getEarlyOutMinutes = function (clockOutTime) {
  const [endHour, endMin] = this.workEndTime.split(":").map(Number);
  const clockOut = new Date(clockOutTime);
  const expectedEnd = new Date(clockOut);
  expectedEnd.setHours(endHour, endMin, 0, 0);

  if (clockOut >= expectedEnd) return 0;
  return Math.floor((expectedEnd - clockOut) / 60000);
};

const AttendanceSettings = mongoose.model(
  "AttendanceSettings",
  attendanceSettingsSchema
);

export default AttendanceSettings;
