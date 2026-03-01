/**
 * Holiday Controller
 *
 * HTTP handlers for holiday management.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as holidayService from "./holiday.service.js";

/**
 * Get all holidays
 * GET /holidays
 */
export const getHolidays = asyncHandler(async (req, res) => {
  const holidays = await holidayService.getHolidays(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Holidays retrieved", { holidays });
});

/**
 * Get upcoming holidays
 * GET /holidays/upcoming
 */
export const getUpcomingHolidays = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 5;
  const holidays = await holidayService.getUpcomingHolidays(
    req.user.organizationId,
    limit
  );
  return successResponse(res, 200, "Upcoming holidays retrieved", { holidays });
});

/**
 * Get holiday types
 * GET /holidays/types
 */
export const getHolidayTypes = asyncHandler(async (req, res) => {
  const types = holidayService.getHolidayTypes();
  return successResponse(res, 200, "Holiday types retrieved", { types });
});

/**
 * Get holiday statistics
 * GET /holidays/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  const stats = await holidayService.getStats(req.user.organizationId, year);
  return successResponse(res, 200, "Holiday statistics retrieved", { stats, year });
});

/**
 * Check if a date is a holiday
 * GET /holidays/check
 */
export const checkHoliday = asyncHandler(async (req, res) => {
  const result = await holidayService.checkHoliday(
    req.user.organizationId,
    req.query.date
  );
  return successResponse(res, 200, "Holiday check completed", result);
});

/**
 * Get a single holiday
 * GET /holidays/:id
 */
export const getHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.getHoliday(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, "Holiday retrieved", { holiday });
});

/**
 * Create a new holiday
 * POST /holidays
 */
export const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.createHoliday(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Holiday created successfully", { holiday });
});

/**
 * Update a holiday
 * PUT /holidays/:id
 */
export const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.updateHoliday(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Holiday updated successfully", { holiday });
});

/**
 * Delete a holiday
 * DELETE /holidays/:id
 */
export const deleteHoliday = asyncHandler(async (req, res) => {
  const result = await holidayService.deleteHoliday(
    req.user.organizationId,
    req.params.id
  );
  return successResponse(res, 200, result.message);
});

export default {
  getHolidays,
  getUpcomingHolidays,
  getHolidayTypes,
  getStats,
  checkHoliday,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
