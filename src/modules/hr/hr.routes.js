/**
 * HR Routes
 *
 * API endpoints for HR management (Salary & Offer Letters).
 */
import express from "express";
import * as controller from "./hr.controller.js";
import * as validation from "./hr.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  HR_VIEW_SALARY,
  HR_UPDATE_SALARY,
  HR_CREATE_OFFER,
  HR_VIEW_OFFER,
  HR_UPDATE_OFFER,
  HR_MANAGE,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// ===================== SALARY ROUTES =====================

// Get my salary (user can view own)
router.get("/salary/my", controller.getMySalary);

// Get salary statistics (CEO/HR only)
router.get(
  "/salary/stats",
  permissionMiddleware([HR_MANAGE, HR_VIEW_SALARY]),
  controller.getSalaryStats
);

// Get all salaries (CEO/HR only)
router.get(
  "/salaries",
  permissionMiddleware([HR_MANAGE, HR_VIEW_SALARY]),
  validate(validation.getSalariesQuerySchema),
  controller.getAllSalaries
);

// Get salary for a user
router.get(
  "/salary/:userId",
  permissionMiddleware([HR_VIEW_SALARY, HR_MANAGE]),
  validate(validation.getSalarySchema),
  controller.getSalary
);

// Get salary history for a user
router.get(
  "/salary/:userId/history",
  permissionMiddleware([HR_VIEW_SALARY, HR_MANAGE]),
  validate(validation.getSalaryHistorySchema),
  controller.getSalaryHistory
);

// Set salary for a user (CEO/HR only)
router.post(
  "/salary/:userId",
  permissionMiddleware([HR_UPDATE_SALARY, HR_MANAGE]),
  validate(validation.createSalarySchema),
  controller.setSalary
);

// Update salary for a user (CEO/HR only)
router.put(
  "/salary/:userId",
  permissionMiddleware([HR_UPDATE_SALARY, HR_MANAGE]),
  validate(validation.updateSalarySchema),
  controller.updateSalary
);

// Delete salary for a user (CEO/HR only)
router.delete(
  "/salary/:userId",
  permissionMiddleware([HR_UPDATE_SALARY, HR_MANAGE]),
  validate(validation.getSalarySchema),
  controller.deleteSalary
);

// ===================== OFFER LETTER ROUTES =====================

// Get my offer letters (user can view own)
router.get("/offer-letters/my", controller.getMyOfferLetters);

// Get offer letter statistics (CEO/HR only)
router.get(
  "/offer-letters/stats",
  permissionMiddleware([HR_MANAGE, HR_VIEW_OFFER]),
  controller.getOfferLetterStats
);

// Get all offer letters (CEO/HR only)
router.get(
  "/offer-letters",
  permissionMiddleware([HR_VIEW_OFFER, HR_MANAGE]),
  validate(validation.getOfferLettersQuerySchema),
  controller.getOfferLetters
);

// Get offer letter by ID
router.get(
  "/offer-letters/:id",
  permissionMiddleware([HR_VIEW_OFFER, HR_MANAGE]),
  validate(validation.getOfferLetterSchema),
  controller.getOfferLetterById
);

// Create offer letter (CEO/HR only)
router.post(
  "/offer-letters",
  permissionMiddleware([HR_CREATE_OFFER, HR_MANAGE]),
  validate(validation.createOfferLetterSchema),
  controller.createOfferLetter
);

// Update offer letter (CEO/HR only)
router.put(
  "/offer-letters/:id",
  permissionMiddleware([HR_UPDATE_OFFER, HR_MANAGE]),
  validate(validation.updateOfferLetterSchema),
  controller.updateOfferLetter
);

// Send offer letter (CEO/HR only)
router.put(
  "/offer-letters/:id/send",
  permissionMiddleware([HR_UPDATE_OFFER, HR_MANAGE]),
  validate(validation.sendOfferLetterSchema),
  controller.sendOfferLetter
);

// Accept offer letter
router.put(
  "/offer-letters/:id/accept",
  validate(validation.getOfferLetterSchema),
  controller.acceptOfferLetter
);

// Reject offer letter
router.put(
  "/offer-letters/:id/reject",
  validate(validation.respondOfferLetterSchema),
  controller.rejectOfferLetter
);

// Withdraw offer letter (CEO/HR only)
router.put(
  "/offer-letters/:id/withdraw",
  permissionMiddleware([HR_UPDATE_OFFER, HR_MANAGE]),
  validate(validation.getOfferLetterSchema),
  controller.withdrawOfferLetter
);

// Delete offer letter (CEO/HR only)
router.delete(
  "/offer-letters/:id",
  permissionMiddleware([HR_UPDATE_OFFER, HR_MANAGE]),
  validate(validation.getOfferLetterSchema),
  controller.deleteOfferLetter
);

export default router;
