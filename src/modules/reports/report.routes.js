/**
 * Report Routes
 *
 * API endpoints for report generation and analytics.
 */
import express from "express";
import * as controller from "./report.controller.js";
import * as validation from "./report.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// Dashboard data
router.get(
  "/dashboard",
  validate(validation.getDashboardDataQuerySchema),
  controller.getDashboardData
);

// Attendance report
router.get(
  "/attendance",
  validate(validation.getAttendanceReportQuerySchema),
  controller.getAttendanceReport
);

// Leave report
router.get(
  "/leave",
  validate(validation.getLeaveReportQuerySchema),
  controller.getLeaveReport
);

// Task report
router.get(
  "/task",
  validate(validation.getTaskReportQuerySchema),
  controller.getTaskReport
);

// Overtime report
router.get(
  "/overtime",
  validate(validation.getOvertimeReportQuerySchema),
  controller.getOvertimeReport
);

// Generate and save report
router.post(
  "/generate",
  validate(validation.generateReportSchema),
  controller.generateReport
);

// Get all saved reports
router.get("/", validate(validation.getReportsQuerySchema), controller.getReports);

// Get report by ID
router.get("/:id", validate(validation.getReportSchema), controller.getReportById);

// Delete report
router.delete("/:id", validate(validation.deleteReportSchema), controller.deleteReport);

export default router;
