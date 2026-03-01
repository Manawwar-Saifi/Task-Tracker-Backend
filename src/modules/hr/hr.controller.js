/**
 * HR Controller
 *
 * HTTP handlers for HR management (Salary & Offer Letters).
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as hrService from "./hr.service.js";

// ==================== SALARY CONTROLLERS ====================

/**
 * Get salary for a user
 * GET /hr/salary/:userId
 */
export const getSalary = asyncHandler(async (req, res) => {
  const salary = await hrService.getSalary(
    req.user.organizationId,
    req.params.userId,
    req.user.userId
  );
  return successResponse(res, 200, "Salary retrieved", { salary });
});

/**
 * Get salary history for a user
 * GET /hr/salary/:userId/history
 */
export const getSalaryHistory = asyncHandler(async (req, res) => {
  const history = await hrService.getSalaryHistory(
    req.user.organizationId,
    req.params.userId,
    req.user.userId
  );
  return successResponse(res, 200, "Salary history retrieved", { history });
});

/**
 * Set salary for a user
 * POST /hr/salary/:userId
 */
export const setSalary = asyncHandler(async (req, res) => {
  const salary = await hrService.setSalary(
    req.user.organizationId,
    req.params.userId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Salary set successfully", { salary });
});

/**
 * Update salary for a user
 * PUT /hr/salary/:userId
 */
export const updateSalary = asyncHandler(async (req, res) => {
  const salary = await hrService.updateSalary(
    req.user.organizationId,
    req.params.userId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Salary updated successfully", { salary });
});

/**
 * Delete salary for a user
 * DELETE /hr/salary/:userId
 */
export const deleteSalary = asyncHandler(async (req, res) => {
  const result = await hrService.deleteSalary(
    req.user.organizationId,
    req.params.userId,
    req.user.userId
  );
  return successResponse(res, 200, result.message);
});

/**
 * Get all salaries in organization
 * GET /hr/salaries
 */
export const getAllSalaries = asyncHandler(async (req, res) => {
  const data = await hrService.getAllSalaries(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Salaries retrieved", data);
});

/**
 * Get salary statistics
 * GET /hr/salary/stats
 */
export const getSalaryStats = asyncHandler(async (req, res) => {
  const stats = await hrService.getSalaryStats(req.user.organizationId);
  return successResponse(res, 200, "Salary statistics retrieved", { stats });
});

/**
 * Get my salary
 * GET /hr/salary/my
 */
export const getMySalary = asyncHandler(async (req, res) => {
  const salary = await hrService.getSalary(
    req.user.organizationId,
    req.user.userId,
    req.user.userId
  );
  return successResponse(res, 200, "Your salary retrieved", { salary });
});

// ==================== OFFER LETTER CONTROLLERS ====================

/**
 * Get all offer letters
 * GET /hr/offer-letters
 */
export const getOfferLetters = asyncHandler(async (req, res) => {
  const data = await hrService.getOfferLetters(
    req.user.organizationId,
    req.query
  );
  return successResponse(res, 200, "Offer letters retrieved", data);
});

/**
 * Get offer letter by ID
 * GET /hr/offer-letters/:id
 */
export const getOfferLetterById = asyncHandler(async (req, res) => {
  const offerLetter = await hrService.getOfferLetterById(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, "Offer letter retrieved", { offerLetter });
});

/**
 * Create offer letter
 * POST /hr/offer-letters
 */
export const createOfferLetter = asyncHandler(async (req, res) => {
  const offerLetter = await hrService.createOfferLetter(
    req.user.organizationId,
    req.user.userId,
    req.body
  );
  return successResponse(res, 201, "Offer letter created", { offerLetter });
});

/**
 * Update offer letter
 * PUT /hr/offer-letters/:id
 */
export const updateOfferLetter = asyncHandler(async (req, res) => {
  const offerLetter = await hrService.updateOfferLetter(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body
  );
  return successResponse(res, 200, "Offer letter updated", { offerLetter });
});

/**
 * Send offer letter
 * PUT /hr/offer-letters/:id/send
 */
export const sendOfferLetter = asyncHandler(async (req, res) => {
  const offerLetter = await hrService.sendOfferLetter(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body?.expiryDays
  );
  return successResponse(res, 200, "Offer letter sent", { offerLetter });
});

/**
 * Accept offer letter
 * PUT /hr/offer-letters/:id/accept
 */
export const acceptOfferLetter = asyncHandler(async (req, res) => {
  const offerLetter = await hrService.acceptOfferLetter(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, "Offer letter accepted", { offerLetter });
});

/**
 * Reject offer letter
 * PUT /hr/offer-letters/:id/reject
 */
export const rejectOfferLetter = asyncHandler(async (req, res) => {
  const offerLetter = await hrService.rejectOfferLetter(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.body?.reason
  );
  return successResponse(res, 200, "Offer letter rejected", { offerLetter });
});

/**
 * Withdraw offer letter
 * PUT /hr/offer-letters/:id/withdraw
 */
export const withdrawOfferLetter = asyncHandler(async (req, res) => {
  const result = await hrService.withdrawOfferLetter(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, result.message);
});

/**
 * Delete offer letter
 * DELETE /hr/offer-letters/:id
 */
export const deleteOfferLetter = asyncHandler(async (req, res) => {
  const result = await hrService.deleteOfferLetter(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, result.message);
});

/**
 * Get offer letter statistics
 * GET /hr/offer-letters/stats
 */
export const getOfferLetterStats = asyncHandler(async (req, res) => {
  const stats = await hrService.getOfferLetterStats(req.user.organizationId);
  return successResponse(res, 200, "Offer letter statistics retrieved", { stats });
});

/**
 * Get my offer letters
 * GET /hr/offer-letters/my
 */
export const getMyOfferLetters = asyncHandler(async (req, res) => {
  const offerLetters = await hrService.getMyOfferLetters(
    req.user.organizationId,
    req.user.userId
  );
  return successResponse(res, 200, "Your offer letters retrieved", { offerLetters });
});

export default {
  // Salary
  getSalary,
  getSalaryHistory,
  setSalary,
  updateSalary,
  deleteSalary,
  getAllSalaries,
  getSalaryStats,
  getMySalary,
  // Offer Letter
  getOfferLetters,
  getOfferLetterById,
  createOfferLetter,
  updateOfferLetter,
  sendOfferLetter,
  acceptOfferLetter,
  rejectOfferLetter,
  withdrawOfferLetter,
  deleteOfferLetter,
  getOfferLetterStats,
  getMyOfferLetters,
};
