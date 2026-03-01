/**
 * Holiday Service
 *
 * Business logic for holiday management.
 */
import Holiday from "./holiday.model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Get all holidays with filters
 */
export const getHolidays = async (organizationId, options = {}) => {
  const { year, month, type, upcoming, limit = 50 } = options;

  // If upcoming is requested
  if (upcoming) {
    const holidays = await Holiday.getUpcoming(organizationId, limit);
    return holidays;
  }

  // If specific month is requested
  if (year && month !== undefined) {
    const holidays = await Holiday.getByMonth(organizationId, year, month);
    return holidays;
  }

  // Build query
  const query = { organizationId, isActive: true };

  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    query.date = { $gte: startDate, $lte: endDate };
  }

  if (type) {
    query.type = type;
  }

  const holidays = await Holiday.find(query)
    .sort({ date: 1 })
    .limit(limit)
    .populate("createdBy", "firstName lastName")
    .lean();

  return holidays;
};

/**
 * Get upcoming holidays
 */
export const getUpcomingHolidays = async (organizationId, limit = 5) => {
  const holidays = await Holiday.getUpcoming(organizationId, limit);
  return holidays;
};

/**
 * Get a single holiday
 */
export const getHoliday = async (organizationId, holidayId) => {
  const holiday = await Holiday.findOne({
    _id: holidayId,
    organizationId,
  })
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .populate("teams", "name")
    .lean();

  if (!holiday) {
    throw new AppError("Holiday not found", 404);
  }

  return holiday;
};

/**
 * Create a new holiday
 */
export const createHoliday = async (organizationId, userId, data) => {
  // Check for duplicate on same date
  const startOfDay = new Date(data.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data.date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await Holiday.findOne({
    organizationId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existing) {
    throw new AppError("A holiday already exists on this date", 409);
  }

  const holiday = await Holiday.create({
    ...data,
    organizationId,
    createdBy: userId,
    updatedBy: userId,
  });

  logger.info(`Holiday created: ${holiday.name} on ${holiday.date} in org: ${organizationId}`);

  return await Holiday.findById(holiday._id)
    .populate("createdBy", "firstName lastName")
    .lean();
};

/**
 * Update a holiday
 */
export const updateHoliday = async (organizationId, holidayId, userId, data) => {
  const holiday = await Holiday.findOne({
    _id: holidayId,
    organizationId,
  });

  if (!holiday) {
    throw new AppError("Holiday not found", 404);
  }

  // If date is being changed, check for duplicates
  if (data.date) {
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Holiday.findOne({
      organizationId,
      date: { $gte: startOfDay, $lte: endOfDay },
      _id: { $ne: holidayId },
    });

    if (existing) {
      throw new AppError("A holiday already exists on this date", 409);
    }
  }

  Object.assign(holiday, data);
  holiday.updatedBy = userId;
  await holiday.save();

  logger.info(`Holiday updated: ${holiday.name}`);

  return await Holiday.findById(holiday._id)
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .lean();
};

/**
 * Delete a holiday
 */
export const deleteHoliday = async (organizationId, holidayId) => {
  const holiday = await Holiday.findOne({
    _id: holidayId,
    organizationId,
  });

  if (!holiday) {
    throw new AppError("Holiday not found", 404);
  }

  await Holiday.deleteOne({ _id: holidayId });

  logger.info(`Holiday deleted: ${holiday.name}`);

  return { message: "Holiday deleted successfully" };
};

/**
 * Check if a date is a holiday
 */
export const checkHoliday = async (organizationId, date) => {
  const holiday = await Holiday.isHoliday(organizationId, date);

  return {
    isHoliday: !!holiday,
    holiday: holiday || null,
  };
};

/**
 * Get holiday statistics
 */
export const getStats = async (organizationId, year = new Date().getFullYear()) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const holidays = await Holiday.find({
    organizationId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
  });

  const stats = {
    total: holidays.length,
    national: holidays.filter((h) => h.type === "national").length,
    regional: holidays.filter((h) => h.type === "regional").length,
    optional: holidays.filter((h) => h.type === "optional").length,
    custom: holidays.filter((h) => h.type === "custom").length,
    upcoming: holidays.filter((h) => new Date(h.date) >= new Date()).length,
  };

  return stats;
};

/**
 * Get holiday types
 */
export const getHolidayTypes = () => {
  return [
    { value: "national", label: "National Holiday", description: "Government declared national holidays" },
    { value: "regional", label: "Regional Holiday", description: "State or regional holidays" },
    { value: "optional", label: "Optional Holiday", description: "Optional/restricted holidays" },
    { value: "custom", label: "Custom Holiday", description: "Organization specific holidays" },
  ];
};

/**
 * Seed default holidays for an organization
 */
export const seedDefaultHolidays = async (organizationId, userId) => {
  const existingCount = await Holiday.countDocuments({ organizationId });
  if (existingCount > 0) {
    return;
  }

  await Holiday.seedDefaults(organizationId, userId);
  logger.info(`Default holidays seeded for organization: ${organizationId}`);
};
