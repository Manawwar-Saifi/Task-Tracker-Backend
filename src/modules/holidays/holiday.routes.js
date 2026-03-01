/**
 * Holiday Routes
 *
 * API endpoints for holiday management.
 */
import express from "express";
import * as controller from "./holiday.controller.js";
import * as validation from "./holiday.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  HOLIDAY_CREATE,
  HOLIDAY_READ,
  HOLIDAY_UPDATE,
  HOLIDAY_DELETE,
  HOLIDAY_MANAGE,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// ===================== READ ROUTES =====================

// Get holiday types (static list)
router.get("/types", controller.getHolidayTypes);

// Get upcoming holidays
router.get("/upcoming", permissionMiddleware(HOLIDAY_READ), controller.getUpcomingHolidays);

// Get holiday statistics
router.get("/stats", permissionMiddleware(HOLIDAY_READ), controller.getStats);

// Check if a date is a holiday
router.get(
  "/check",
  permissionMiddleware(HOLIDAY_READ),
  validate(validation.checkHolidaySchema),
  controller.checkHoliday
);

// Get all holidays
router.get(
  "/",
  permissionMiddleware(HOLIDAY_READ),
  validate(validation.getHolidaysQuerySchema),
  controller.getHolidays
);

// Get single holiday
router.get(
  "/:id",
  permissionMiddleware(HOLIDAY_READ),
  validate(validation.getHolidaySchema),
  controller.getHoliday
);

// ===================== WRITE ROUTES (Admin) =====================

// Create holiday
router.post(
  "/",
  permissionMiddleware(HOLIDAY_CREATE),
  validate(validation.createHolidaySchema),
  controller.createHoliday
);

// Update holiday
router.put(
  "/:id",
  permissionMiddleware(HOLIDAY_UPDATE),
  validate(validation.updateHolidaySchema),
  controller.updateHoliday
);

// Delete holiday
router.delete(
  "/:id",
  permissionMiddleware(HOLIDAY_DELETE),
  validate(validation.getHolidaySchema),
  controller.deleteHoliday
);

export default router;
