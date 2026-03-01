/**
 * Attendance Service
 *
 * Business logic for attendance management.
 */
import Attendance from "./attendance.model.js";
import AttendanceSettings from "./attendanceSettings.model.js";
import User from "../users/model.js";
import Team from "../teams/teams.model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Get today's attendance status for a user
 */
export const getTodayStatus = async (organizationId, userId) => {
  const today = Attendance.getTodayDate();
  const settings = await AttendanceSettings.getOrCreate(organizationId);

  let attendance = await Attendance.findOne({
    organizationId,
    userId,
    date: today,
    isDeleted: false,
  });

  if (!attendance) {
    // Return empty status if no record exists
    return {
      date: today,
      clockIn: null,
      clockOut: null,
      breaks: [],
      isOnBreak: false,
      totalWorkMinutes: 0,
      totalBreakMinutes: 0,
      effectiveWorkMinutes: 0,
      status: "absent",
      settings: {
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime,
        maxBreaks: settings.maxBreaks,
        breakDuration: settings.breakDuration,
      },
    };
  }

  // Calculate current work minutes if clocked in
  if (attendance.clockIn && !attendance.clockOut) {
    attendance.calculateWorkMinutes();
  }

  return {
    id: attendance._id,
    date: attendance.date,
    clockIn: attendance.clockIn,
    clockOut: attendance.clockOut,
    breaks: attendance.breaks,
    isOnBreak: attendance.isOnBreak,
    totalWorkMinutes: attendance.totalWorkMinutes,
    totalBreakMinutes: attendance.totalBreakMinutes,
    effectiveWorkMinutes: attendance.effectiveWorkMinutes,
    workHours: attendance.workHours,
    breakTime: attendance.breakTime,
    status: attendance.status,
    isLate: attendance.isLate,
    lateByMinutes: attendance.lateByMinutes,
    settings: {
      workStartTime: settings.workStartTime,
      workEndTime: settings.workEndTime,
      maxBreaks: settings.maxBreaks,
      breakDuration: settings.breakDuration,
    },
  };
};

/**
 * Clock in
 */
export const clockIn = async (organizationId, userId, data = {}) => {
  const today = Attendance.getTodayDate();
  const settings = await AttendanceSettings.getOrCreate(organizationId);

  // Check if already clocked in
  let attendance = await Attendance.findOne({
    organizationId,
    userId,
    date: today,
    isDeleted: false,
  });

  if (attendance && attendance.clockIn) {
    throw new AppError("Already clocked in today", 400);
  }

  const now = new Date();

  // Check if it's a working day
  if (!settings.isWorkingDay(now)) {
    logger.warn(`User ${userId} clocking in on non-working day`);
  }

  // Calculate if late
  const isLate = settings.isLateLogin(now);
  const lateByMinutes = settings.getLateMinutes(now);

  if (!attendance) {
    attendance = new Attendance({
      organizationId,
      userId,
      date: today,
    });
  }

  attendance.clockIn = now;
  attendance.status = "present";
  attendance.isLate = isLate;
  attendance.lateByMinutes = lateByMinutes;
  attendance.notes = data.notes || "";
  attendance.location = data.location || null;

  await attendance.save();

  logger.info(`User ${userId} clocked in at ${now.toISOString()}`);

  return {
    ...attendance.toObject(),
    workHours: attendance.workHours,
    breakTime: attendance.breakTime,
  };
};

/**
 * Clock out
 */
export const clockOut = async (organizationId, userId, data = {}) => {
  const today = Attendance.getTodayDate();
  const settings = await AttendanceSettings.getOrCreate(organizationId);

  const attendance = await Attendance.findOne({
    organizationId,
    userId,
    date: today,
    isDeleted: false,
  });

  if (!attendance || !attendance.clockIn) {
    throw new AppError("Not clocked in today", 400);
  }

  if (attendance.clockOut) {
    throw new AppError("Already clocked out today", 400);
  }

  if (attendance.isOnBreak) {
    throw new AppError("Please end your break before clocking out", 400);
  }

  const now = new Date();

  // Calculate early out
  const isEarlyOut = settings.isEarlyOut(now);
  const earlyOutByMinutes = settings.getEarlyOutMinutes(now);

  attendance.clockOut = now;
  attendance.isEarlyOut = isEarlyOut;
  attendance.earlyOutByMinutes = earlyOutByMinutes;

  if (data.notes) {
    attendance.notes = attendance.notes
      ? `${attendance.notes}\n${data.notes}`
      : data.notes;
  }

  // Determine final status based on work minutes
  attendance.calculateWorkMinutes();
  if (attendance.effectiveWorkMinutes < settings.halfDayMinutes) {
    attendance.status = "half_day";
  }

  await attendance.save();

  logger.info(
    `User ${userId} clocked out at ${now.toISOString()}, worked ${attendance.effectiveWorkMinutes} minutes`
  );

  return {
    ...attendance.toObject(),
    workHours: attendance.workHours,
    breakTime: attendance.breakTime,
  };
};

/**
 * Start break
 */
export const startBreak = async (organizationId, userId, type = "other") => {
  const today = Attendance.getTodayDate();
  const settings = await AttendanceSettings.getOrCreate(organizationId);

  const attendance = await Attendance.findOne({
    organizationId,
    userId,
    date: today,
    isDeleted: false,
  });

  if (!attendance || !attendance.clockIn) {
    throw new AppError("Not clocked in today", 400);
  }

  if (attendance.clockOut) {
    throw new AppError("Already clocked out", 400);
  }

  if (attendance.isOnBreak) {
    throw new AppError("Already on break", 400);
  }

  if (attendance.breaks.length >= settings.maxBreaks) {
    throw new AppError(`Maximum ${settings.maxBreaks} breaks allowed per day`, 400);
  }

  attendance.startBreak(type);
  await attendance.save();

  logger.info(`User ${userId} started ${type} break`);

  return {
    ...attendance.toObject(),
    workHours: attendance.workHours,
    breakTime: attendance.breakTime,
  };
};

/**
 * End break
 */
export const endBreak = async (organizationId, userId) => {
  const today = Attendance.getTodayDate();

  const attendance = await Attendance.findOne({
    organizationId,
    userId,
    date: today,
    isDeleted: false,
  });

  if (!attendance) {
    throw new AppError("No attendance record found", 400);
  }

  if (!attendance.isOnBreak) {
    throw new AppError("Not on break", 400);
  }

  attendance.endBreak();
  await attendance.save();

  logger.info(
    `User ${userId} ended break, total break time: ${attendance.totalBreakMinutes} minutes`
  );

  return {
    ...attendance.toObject(),
    workHours: attendance.workHours,
    breakTime: attendance.breakTime,
  };
};

/**
 * Get attendance records with filters
 */
export const getAttendance = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    userId,
    teamId,
    status,
    startDate,
    endDate,
    isLate,
  } = options;

  const query = { organizationId, isDeleted: false };

  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (isLate !== undefined) query.isLate = isLate;

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Team filter - get all user IDs from team
  if (teamId) {
    const team = await Team.findOne({
      _id: teamId,
      organizationId,
      isDeleted: false,
    });
    if (team) {
      const memberIds = team.getMemberIds();
      query.userId = { $in: memberIds };
    }
  }

  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate("userId", "firstName lastName email avatar designation")
      .sort({ date: -1, clockIn: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(query),
  ]);

  return {
    attendance: records.map((r) => ({
      ...r,
      workHours: formatMinutes(r.effectiveWorkMinutes),
      breakTime: formatMinutes(r.totalBreakMinutes),
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get my attendance history
 */
export const getMyAttendance = async (organizationId, userId, options = {}) => {
  return getAttendance(organizationId, { ...options, userId });
};

/**
 * Get team attendance for a specific date
 */
export const getTeamAttendance = async (organizationId, teamId, date) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  }).populate("members.userId", "firstName lastName email avatar designation");

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  const targetDate = date ? new Date(date) : Attendance.getTodayDate();
  targetDate.setHours(0, 0, 0, 0);

  const memberIds = team.getMemberIds();

  const records = await Attendance.find({
    organizationId,
    userId: { $in: memberIds },
    date: targetDate,
    isDeleted: false,
  })
    .populate("userId", "firstName lastName email avatar designation")
    .lean();

  // Create a map for quick lookup
  const recordMap = new Map();
  records.forEach((r) => recordMap.set(r.userId._id.toString(), r));

  // Build team attendance with all members
  const teamAttendance = team.members.map((member) => {
    const record = recordMap.get(member.userId._id.toString());
    return {
      user: member.userId,
      attendance: record
        ? {
            id: record._id,
            clockIn: record.clockIn,
            clockOut: record.clockOut,
            status: record.status,
            workHours: formatMinutes(record.effectiveWorkMinutes),
            isLate: record.isLate,
          }
        : null,
    };
  });

  // Calculate summary
  const summary = {
    date: targetDate,
    total: memberIds.length,
    present: records.filter((r) => r.status === "present").length,
    absent: memberIds.length - records.filter((r) => r.clockIn).length,
    onLeave: records.filter((r) => r.status === "on_leave").length,
    late: records.filter((r) => r.isLate).length,
  };

  return {
    team: {
      id: team._id,
      name: team.name,
    },
    summary,
    members: teamAttendance,
  };
};

/**
 * Get attendance summary/statistics
 */
export const getSummary = async (organizationId, options = {}) => {
  const { period = "today", userId, teamId } = options;

  const query = { organizationId, isDeleted: false };
  if (userId) query.userId = userId;

  // Calculate date range based on period
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  let startDate, endDate;

  switch (period) {
    case "today":
      startDate = today;
      endDate = today;
      break;
    case "week":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
      endDate = today;
      break;
    case "month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = today;
      break;
    case "year":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = today;
      break;
    default:
      startDate = today;
      endDate = today;
  }

  query.date = { $gte: startDate, $lte: endDate };

  // Team filter
  if (teamId) {
    const team = await Team.findOne({
      _id: teamId,
      organizationId,
      isDeleted: false,
    });
    if (team) {
      query.userId = { $in: team.getMemberIds() };
    }
  }

  const records = await Attendance.find(query).lean();

  // Calculate statistics
  const totalRecords = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const halfDayCount = records.filter((r) => r.status === "half_day").length;
  const leaveCount = records.filter((r) => r.status === "on_leave").length;
  const lateCount = records.filter((r) => r.isLate).length;
  const earlyOutCount = records.filter((r) => r.isEarlyOut).length;

  const totalWorkMinutes = records.reduce(
    (sum, r) => sum + (r.effectiveWorkMinutes || 0),
    0
  );
  const totalBreakMinutes = records.reduce(
    (sum, r) => sum + (r.totalBreakMinutes || 0),
    0
  );

  const avgWorkMinutes =
    presentCount > 0 ? Math.round(totalWorkMinutes / presentCount) : 0;

  return {
    period,
    dateRange: {
      start: startDate,
      end: endDate,
    },
    stats: {
      totalRecords,
      present: presentCount,
      absent: absentCount,
      halfDay: halfDayCount,
      onLeave: leaveCount,
      late: lateCount,
      earlyOut: earlyOutCount,
      attendanceRate:
        totalRecords > 0
          ? Math.round((presentCount / totalRecords) * 100)
          : 0,
      punctualityRate:
        presentCount > 0
          ? Math.round(((presentCount - lateCount) / presentCount) * 100)
          : 0,
    },
    workTime: {
      totalHours: formatMinutes(totalWorkMinutes),
      totalBreakHours: formatMinutes(totalBreakMinutes),
      averageHours: formatMinutes(avgWorkMinutes),
    },
  };
};

/**
 * Get attendance settings
 */
export const getSettings = async (organizationId) => {
  const settings = await AttendanceSettings.getOrCreate(organizationId);
  return settings;
};

/**
 * Update attendance settings
 */
export const updateSettings = async (organizationId, userId, data) => {
  let settings = await AttendanceSettings.findOne({ organizationId });

  if (!settings) {
    settings = new AttendanceSettings({ organizationId });
  }

  Object.assign(settings, data);
  settings.updatedBy = userId;

  await settings.save();

  logger.info(`Attendance settings updated for org: ${organizationId}`);

  return settings;
};

/**
 * Update attendance record (admin)
 */
export const updateAttendanceRecord = async (
  organizationId,
  recordId,
  userId,
  data
) => {
  const attendance = await Attendance.findOne({
    _id: recordId,
    organizationId,
    isDeleted: false,
  });

  if (!attendance) {
    throw new AppError("Attendance record not found", 404);
  }

  // Update allowed fields
  if (data.clockIn) attendance.clockIn = new Date(data.clockIn);
  if (data.clockOut) attendance.clockOut = new Date(data.clockOut);
  if (data.status) attendance.status = data.status;
  if (data.notes !== undefined) attendance.notes = data.notes;

  attendance.isManualEntry = true;
  attendance.updatedBy = userId;

  // Recalculate work minutes
  attendance.calculateWorkMinutes();

  await attendance.save();

  logger.info(`Attendance record ${recordId} updated by user ${userId}`);

  return {
    ...attendance.toObject(),
    workHours: attendance.workHours,
    breakTime: attendance.breakTime,
  };
};

/**
 * Create manual attendance entry (admin)
 */
export const createManualEntry = async (organizationId, createdBy, data) => {
  const { userId, date, clockIn, clockOut, status, notes } = data;

  // Check if user belongs to organization
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Check for existing record
  const existing = await Attendance.findOne({
    organizationId,
    userId,
    date: targetDate,
    isDeleted: false,
  });

  if (existing) {
    throw new AppError("Attendance record already exists for this date", 400);
  }

  const attendance = await Attendance.create({
    organizationId,
    userId,
    date: targetDate,
    clockIn: new Date(clockIn),
    clockOut: clockOut ? new Date(clockOut) : null,
    status: status || "present",
    notes: notes || "",
    isManualEntry: true,
    updatedBy: createdBy,
  });

  logger.info(
    `Manual attendance entry created for user ${userId} on ${date} by ${createdBy}`
  );

  return {
    ...attendance.toObject(),
    workHours: attendance.workHours,
    breakTime: attendance.breakTime,
  };
};

// Helper function to format minutes as "Xh Ym"
function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default {
  getTodayStatus,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAttendance,
  getMyAttendance,
  getTeamAttendance,
  getSummary,
  getSettings,
  updateSettings,
  updateAttendanceRecord,
  createManualEntry,
};
