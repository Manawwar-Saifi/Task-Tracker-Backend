/**
 * Report Service
 *
 * Business logic for report generation and analytics.
 */
import Report from "./report.model.js";
import Attendance from "../attendance/attendance.model.js";
import Leave from "../leaves/leaves.model.js";
import Task from "../tasks/tasks.model.js";
import Overtime from "../overtime/overtime.model.js";
import Team from "../teams/teams.model.js";
import User from "../users/model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Get all reports
 */
export const getReports = async (organizationId, options = {}) => {
  return Report.getReports(organizationId, options);
};

/**
 * Get report by ID
 */
export const getReportById = async (organizationId, reportId) => {
  const report = await Report.findOne({
    _id: reportId,
    organizationId,
    isDeleted: false,
  })
    .populate("generatedBy", "firstName lastName")
    .lean();

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  return report;
};

/**
 * Delete report
 */
export const deleteReport = async (organizationId, reportId) => {
  const report = await Report.findOne({
    _id: reportId,
    organizationId,
    isDeleted: false,
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  report.isDeleted = true;
  await report.save();

  logger.info(`Report deleted: ${reportId}`);

  return { message: "Report deleted successfully" };
};

/**
 * Generate attendance report
 */
export const getAttendanceReport = async (organizationId, options = {}) => {
  const { startDate, endDate, userId, teamId } = options;

  const query = { organizationId, isDeleted: false };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (userId) query.userId = userId;

  const attendanceRecords = await Attendance.find(query)
    .populate("userId", "firstName lastName email")
    .sort({ date: -1 })
    .lean();

  // Calculate statistics using correct model field names
  const presentRecords = attendanceRecords.filter((a) => a.clockIn);
  const totalWorkMinutes = attendanceRecords.reduce((sum, a) => sum + (a.effectiveWorkMinutes || 0), 0);

  const stats = {
    totalRecords: attendanceRecords.length,
    totalPresent: presentRecords.length,
    totalAbsent: attendanceRecords.length - presentRecords.length,
    totalWorkHours: Math.round((totalWorkMinutes / 60) * 10) / 10,
    totalBreakMinutes: attendanceRecords.reduce((sum, a) => sum + (a.totalBreakMinutes || 0), 0),
    averageWorkHours:
      presentRecords.length > 0
        ? Math.round((totalWorkMinutes / presentRecords.length / 60) * 10) / 10
        : 0,
    averageBreakMinutes:
      presentRecords.length > 0
        ? Math.round(attendanceRecords.reduce((sum, a) => sum + (a.totalBreakMinutes || 0), 0) / presentRecords.length)
        : 0,
  };

  return {
    records: attendanceRecords,
    stats,
    filters: { startDate, endDate, userId, teamId },
  };
};

/**
 * Generate leave report
 */
export const getLeaveReport = async (organizationId, options = {}) => {
  const { startDate, endDate, userId, status } = options;

  const query = { organizationId, isDeleted: false };

  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  if (userId) query.userId = userId;
  if (status) query.status = status;

  const leaveRecords = await Leave.find(query)
    .populate("userId", "firstName lastName email")
    .populate("leaveTypeId", "name")
    .sort({ startDate: -1 })
    .lean();

  // Calculate statistics
  const stats = {
    totalLeaves: leaveRecords.length,
    pending: leaveRecords.filter((l) => l.status === "pending").length,
    approved: leaveRecords.filter((l) => l.status === "approved").length,
    rejected: leaveRecords.filter((l) => l.status === "rejected").length,
    cancelled: leaveRecords.filter((l) => l.status === "cancelled").length,
    totalDays: leaveRecords
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + l.totalDays, 0),
  };

  return {
    records: leaveRecords,
    stats,
    filters: { startDate, endDate, userId, status },
  };
};

/**
 * Generate task report
 */
export const getTaskReport = async (organizationId, options = {}) => {
  const { startDate, endDate, userId, teamId, status } = options;

  const query = { organizationId, isDeleted: false };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (userId) query.userId = userId;
  if (teamId) query.teamId = teamId;
  if (status) query.status = status;

  const taskRecords = await Task.find(query)
    .populate("userId", "firstName lastName email")
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();

  // Calculate statistics
  const completedCount = taskRecords.filter((t) => t.status === "completed").length;
  const stats = {
    totalTasks: taskRecords.length,
    todo: taskRecords.filter((t) => t.status === "todo").length,
    inProgress: taskRecords.filter((t) => t.status === "in_progress").length,
    review: taskRecords.filter((t) => t.status === "review").length,
    completed: completedCount,
    completedTasks: completedCount,
    cancelled: taskRecords.filter((t) => t.status === "cancelled").length,
    overdue: taskRecords.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"
    ).length,
    completionRate: taskRecords.length > 0 ? Math.round((completedCount / taskRecords.length) * 100) : 0,
    averageProgress:
      taskRecords.length > 0
        ? Math.round(taskRecords.reduce((sum, t) => sum + (t.progress || 0), 0) / taskRecords.length)
        : 0,
  };

  return {
    records: taskRecords,
    stats,
    filters: { startDate, endDate, userId, teamId, status },
  };
};

/**
 * Generate overtime report
 */
export const getOvertimeReport = async (organizationId, options = {}) => {
  const { startDate, endDate, userId, status } = options;

  const query = { organizationId, isDeleted: false };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (userId) query.userId = userId;
  if (status) query.status = status;

  const overtimeRecords = await Overtime.find(query)
    .populate("userId", "firstName lastName email")
    .populate("approvedBy", "firstName lastName")
    .sort({ date: -1 })
    .lean();

  // Calculate statistics
  const stats = {
    totalRequests: overtimeRecords.length,
    pending: overtimeRecords.filter((o) => o.status === "pending").length,
    approved: overtimeRecords.filter((o) => o.status === "approved").length,
    rejected: overtimeRecords.filter((o) => o.status === "rejected").length,
    cancelled: overtimeRecords.filter((o) => o.status === "cancelled").length,
    totalApprovedHours: overtimeRecords
      .filter((o) => o.status === "approved")
      .reduce((sum, o) => sum + o.hours, 0),
  };

  return {
    records: overtimeRecords,
    stats,
    filters: { startDate, endDate, userId, status },
  };
};

/**
 * Get dashboard data
 */
export const getDashboardData = async (organizationId, period = "month") => {
  // Calculate date range based on period
  let startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  // Get counts
  const [
    totalUsers,
    totalTeams,
    totalTasks,
    completedTasks,
    pendingLeaves,
    totalAttendance,
    pendingOvertimes,
  ] = await Promise.all([
    User.countDocuments({ organizationId, isDeleted: false }),
    Team.countDocuments({ organizationId, isDeleted: false }),
    Task.countDocuments({ organizationId, isDeleted: false }),
    Task.countDocuments({ organizationId, status: "completed", isDeleted: false }),
    Leave.countDocuments({ organizationId, status: "pending", isDeleted: false }),
    Attendance.countDocuments({
      organizationId,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    }),
    Overtime.countDocuments({ organizationId, status: "pending", isDeleted: false }),
  ]);

  return {
    overview: {
      totalUsers,
      totalTeams,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    },
    pending: {
      leaves: pendingLeaves,
      overtimes: pendingOvertimes,
    },
    attendance: {
      totalRecords: totalAttendance,
      period,
    },
  };
};

/**
 * Generate and save report
 */
export const generateReport = async (organizationId, generatedBy, data) => {
  const { reportType, title, description, startDate, endDate, filters, format } = data;

  // Generate the appropriate report
  let reportData;
  let autoTitle = title;

  switch (reportType) {
    case "attendance":
      reportData = await getAttendanceReport(organizationId, filters || {});
      if (!autoTitle) autoTitle = "Attendance Report";
      break;
    case "leave":
      reportData = await getLeaveReport(organizationId, filters || {});
      if (!autoTitle) autoTitle = "Leave Report";
      break;
    case "task":
      reportData = await getTaskReport(organizationId, filters || {});
      if (!autoTitle) autoTitle = "Task Report";
      break;
    case "overtime":
      reportData = await getOvertimeReport(organizationId, filters || {});
      if (!autoTitle) autoTitle = "Overtime Report";
      break;
    case "dashboard":
      reportData = await getDashboardData(organizationId, filters?.period || "month");
      if (!autoTitle) autoTitle = "Dashboard Report";
      break;
    default:
      throw new AppError("Invalid report type", 400);
  }

  // Save report metadata
  const report = await Report.create({
    organizationId,
    generatedBy,
    reportType,
    title: autoTitle,
    description: description || null,
    filters: filters || {},
    startDate: startDate || null,
    endDate: endDate || null,
    format: format || "json",
    status: "completed",
    data: reportData,
  });

  const populated = await Report.findById(report._id)
    .populate("generatedBy", "firstName lastName")
    .lean();

  logger.info(`Report generated: ${report._id} by ${generatedBy}`);

  return populated;
};

export default {
  getReports,
  getReportById,
  deleteReport,
  getAttendanceReport,
  getLeaveReport,
  getTaskReport,
  getOvertimeReport,
  getDashboardData,
  generateReport,
};
