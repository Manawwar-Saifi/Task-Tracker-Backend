/**
 * HR Service
 *
 * Business logic for HR management (Salary & Offer Letters).
 */
import Salary from "./salary.model.js";
import OfferLetter from "./offerLetter.model.js";
import User from "../users/model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

// ==================== SALARY SERVICES ====================

/**
 * Get salary for a user
 */
export const getSalary = async (organizationId, userId, requesterId) => {
  // Check if user exists in organization
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check access: CEO can view all, user can view own
  const requester = await User.findById(requesterId);
  if (!requester.isOwner && requesterId !== userId) {
    throw new AppError("You can only view your own salary", 403);
  }

  const salary = await Salary.getActiveSalary(organizationId, userId);

  if (!salary) {
    return null;
  }

  return salary;
};

/**
 * Get salary history for a user
 */
export const getSalaryHistory = async (organizationId, userId, requesterId) => {
  // Check if user exists in organization
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check access: CEO can view all, user can view own
  const requester = await User.findById(requesterId);
  if (!requester.isOwner && requesterId !== userId) {
    throw new AppError("You can only view your own salary history", 403);
  }

  const history = await Salary.getSalaryHistory(organizationId, userId);
  return history;
};

/**
 * Create or update salary for a user
 */
export const setSalary = async (organizationId, userId, createdBy, data) => {
  // Check if user exists in organization
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Deactivate existing active salary
  const existingSalary = await Salary.findOne({
    organizationId,
    userId,
    isActive: true,
    isDeleted: false,
  });

  if (existingSalary) {
    existingSalary.deactivate();
    await existingSalary.save();
  }

  // Create new salary record
  const salary = await Salary.create({
    organizationId,
    userId,
    basicSalary: data.basicSalary,
    allowances: data.allowances || [],
    deductions: data.deductions || [],
    currency: data.currency || "INR",
    paymentFrequency: data.paymentFrequency || "monthly",
    bankDetails: data.bankDetails || {},
    effectiveFrom: data.effectiveFrom,
    notes: data.notes || null,
    createdBy,
  });

  const populated = await Salary.findById(salary._id)
    .populate("userId", "firstName lastName email employeeId")
    .populate("createdBy", "firstName lastName")
    .lean();

  logger.info(`Salary set for user ${userId} by ${createdBy}`);

  return populated;
};

/**
 * Update salary for a user
 */
export const updateSalary = async (organizationId, userId, updatedBy, data) => {
  // Check if user exists
  const user = await User.findOne({
    _id: userId,
    organizationId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If effectiveFrom is provided and different, create new salary record
  const existingSalary = await Salary.findOne({
    organizationId,
    userId,
    isActive: true,
    isDeleted: false,
  });

  if (!existingSalary) {
    throw new AppError("No active salary found. Please create one first.", 404);
  }

  // Check if this is a new salary record (different effective date)
  if (data.effectiveFrom && new Date(data.effectiveFrom) > existingSalary.effectiveFrom) {
    // Deactivate old and create new
    existingSalary.deactivate();
    await existingSalary.save();

    const newSalary = await Salary.create({
      organizationId,
      userId,
      basicSalary: data.basicSalary ?? existingSalary.basicSalary,
      allowances: data.allowances ?? existingSalary.allowances,
      deductions: data.deductions ?? existingSalary.deductions,
      currency: data.currency ?? existingSalary.currency,
      paymentFrequency: data.paymentFrequency ?? existingSalary.paymentFrequency,
      bankDetails: data.bankDetails ?? existingSalary.bankDetails,
      effectiveFrom: data.effectiveFrom,
      notes: data.notes ?? existingSalary.notes,
      createdBy: updatedBy,
    });

    logger.info(`New salary record created for user ${userId} by ${updatedBy}`);

    return Salary.findById(newSalary._id)
      .populate("userId", "firstName lastName email employeeId")
      .populate("createdBy", "firstName lastName")
      .lean();
  }

  // Otherwise, update existing salary
  if (data.basicSalary !== undefined) existingSalary.basicSalary = data.basicSalary;
  if (data.allowances) existingSalary.allowances = data.allowances;
  if (data.deductions) existingSalary.deductions = data.deductions;
  if (data.currency) existingSalary.currency = data.currency;
  if (data.paymentFrequency) existingSalary.paymentFrequency = data.paymentFrequency;
  if (data.bankDetails) existingSalary.bankDetails = { ...existingSalary.bankDetails, ...data.bankDetails };
  if (data.notes !== undefined) existingSalary.notes = data.notes;
  existingSalary.updatedBy = updatedBy;

  await existingSalary.save();

  logger.info(`Salary updated for user ${userId} by ${updatedBy}`);

  return Salary.findById(existingSalary._id)
    .populate("userId", "firstName lastName email employeeId")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .lean();
};

/**
 * Delete salary record
 */
export const deleteSalary = async (organizationId, userId, deletedBy) => {
  const salary = await Salary.findOne({
    organizationId,
    userId,
    isActive: true,
    isDeleted: false,
  });

  if (!salary) {
    throw new AppError("No active salary found", 404);
  }

  salary.isDeleted = true;
  salary.isActive = false;
  salary.updatedBy = deletedBy;
  await salary.save();

  logger.info(`Salary deleted for user ${userId} by ${deletedBy}`);

  return { message: "Salary record deleted successfully" };
};

/**
 * Get all salaries in organization
 */
export const getAllSalaries = async (organizationId, options = {}) => {
  const { page = 1, limit = 10, department } = options;

  // Get all active salaries
  let salaries = await Salary.find({
    organizationId,
    isActive: true,
    isDeleted: false,
  })
    .populate("userId", "firstName lastName email employeeId department designation")
    .sort({ "userId.firstName": 1 })
    .lean();

  // Filter by department if specified
  if (department) {
    salaries = salaries.filter((s) => s.userId?.department === department);
  }

  const total = salaries.length;
  const paginatedSalaries = salaries.slice((page - 1) * limit, page * limit);

  return {
    salaries: paginatedSalaries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get salary statistics
 */
export const getSalaryStats = async (organizationId) => {
  return Salary.getOrgStats(organizationId);
};

// ==================== OFFER LETTER SERVICES ====================

/**
 * Get all offer letters
 */
export const getOfferLetters = async (organizationId, options = {}) => {
  return OfferLetter.getOfferLetters(organizationId, options);
};

/**
 * Get offer letter by ID
 */
export const getOfferLetterById = async (organizationId, offerId, requesterId) => {
  const offerLetter = await OfferLetter.findOne({
    _id: offerId,
    organizationId,
    isDeleted: false,
  })
    .populate("userId", "firstName lastName email")
    .populate("reportingTo", "firstName lastName email")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .lean();

  if (!offerLetter) {
    throw new AppError("Offer letter not found", 404);
  }

  // Check access: CEO can view all, user can view own
  const requester = await User.findById(requesterId);
  if (!requester.isOwner && offerLetter.userId?._id?.toString() !== requesterId) {
    throw new AppError("You can only view your own offer letter", 403);
  }

  return offerLetter;
};

/**
 * Create offer letter
 */
export const createOfferLetter = async (organizationId, createdBy, data) => {
  // If userId provided, verify user exists
  if (data.userId) {
    const user = await User.findOne({
      _id: data.userId,
      organizationId,
      isDeleted: false,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }
  }

  // Verify reporting manager if provided
  if (data.reportingTo) {
    const manager = await User.findOne({
      _id: data.reportingTo,
      organizationId,
      isDeleted: false,
    });

    if (!manager) {
      throw new AppError("Reporting manager not found", 404);
    }
  }

  const offerLetter = await OfferLetter.create({
    organizationId,
    userId: data.userId || null,
    candidateName: data.candidateName,
    candidateEmail: data.candidateEmail,
    designation: data.designation,
    department: data.department || null,
    joiningDate: data.joiningDate,
    reportingTo: data.reportingTo || null,
    salary: {
      basic: data.salary.basic,
      allowances: data.salary.allowances || [],
      currency: data.salary.currency || "INR",
    },
    employmentType: data.employmentType || "full-time",
    probationPeriod: data.probationPeriod ?? 3,
    noticePeriod: data.noticePeriod ?? 1,
    workLocation: data.workLocation || null,
    terms: data.terms || null,
    notes: data.notes || null,
    createdBy,
  });

  const populated = await OfferLetter.findById(offerLetter._id)
    .populate("userId", "firstName lastName email")
    .populate("reportingTo", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .lean();

  logger.info(`Offer letter created: ${offerLetter._id} by ${createdBy}`);

  return populated;
};

/**
 * Update offer letter
 */
export const updateOfferLetter = async (organizationId, offerId, updatedBy, data) => {
  const offerLetter = await OfferLetter.findOne({
    _id: offerId,
    organizationId,
    isDeleted: false,
  });

  if (!offerLetter) {
    throw new AppError("Offer letter not found", 404);
  }

  // Can only update draft offer letters
  if (offerLetter.status !== "draft") {
    throw new AppError("Can only update draft offer letters", 400);
  }

  // Update fields
  if (data.candidateName) offerLetter.candidateName = data.candidateName;
  if (data.candidateEmail) offerLetter.candidateEmail = data.candidateEmail;
  if (data.designation) offerLetter.designation = data.designation;
  if (data.department !== undefined) offerLetter.department = data.department;
  if (data.joiningDate) offerLetter.joiningDate = data.joiningDate;
  if (data.reportingTo !== undefined) offerLetter.reportingTo = data.reportingTo;
  if (data.salary) {
    if (data.salary.basic !== undefined) offerLetter.salary.basic = data.salary.basic;
    if (data.salary.allowances) offerLetter.salary.allowances = data.salary.allowances;
    if (data.salary.currency) offerLetter.salary.currency = data.salary.currency;
  }
  if (data.employmentType) offerLetter.employmentType = data.employmentType;
  if (data.probationPeriod !== undefined) offerLetter.probationPeriod = data.probationPeriod;
  if (data.noticePeriod !== undefined) offerLetter.noticePeriod = data.noticePeriod;
  if (data.workLocation !== undefined) offerLetter.workLocation = data.workLocation;
  if (data.terms !== undefined) offerLetter.terms = data.terms;
  if (data.notes !== undefined) offerLetter.notes = data.notes;
  offerLetter.updatedBy = updatedBy;

  await offerLetter.save();

  const populated = await OfferLetter.findById(offerLetter._id)
    .populate("userId", "firstName lastName email")
    .populate("reportingTo", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .lean();

  logger.info(`Offer letter updated: ${offerLetter._id} by ${updatedBy}`);

  return populated;
};

/**
 * Send offer letter
 */
export const sendOfferLetter = async (organizationId, offerId, sentBy, expiryDays = 7) => {
  const offerLetter = await OfferLetter.findOne({
    _id: offerId,
    organizationId,
    isDeleted: false,
  });

  if (!offerLetter) {
    throw new AppError("Offer letter not found", 404);
  }

  if (offerLetter.status !== "draft") {
    throw new AppError("Can only send draft offer letters", 400);
  }

  offerLetter.send(expiryDays);
  offerLetter.updatedBy = sentBy;
  await offerLetter.save();

  // TODO: Send email to candidate

  const populated = await OfferLetter.findById(offerLetter._id)
    .populate("userId", "firstName lastName email")
    .populate("reportingTo", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .lean();

  logger.info(`Offer letter sent: ${offerLetter._id} to ${offerLetter.candidateEmail}`);

  return populated;
};

/**
 * Accept offer letter
 */
export const acceptOfferLetter = async (organizationId, offerId, acceptedBy) => {
  const offerLetter = await OfferLetter.findOne({
    _id: offerId,
    organizationId,
    isDeleted: false,
  });

  if (!offerLetter) {
    throw new AppError("Offer letter not found", 404);
  }

  if (offerLetter.status !== "sent") {
    throw new AppError("Can only accept sent offer letters", 400);
  }

  // Check if expired
  if (offerLetter.expiresAt && new Date() > offerLetter.expiresAt) {
    offerLetter.status = "expired";
    await offerLetter.save();
    throw new AppError("Offer letter has expired", 400);
  }

  offerLetter.accept();
  offerLetter.updatedBy = acceptedBy;
  await offerLetter.save();

  const populated = await OfferLetter.findById(offerLetter._id)
    .populate("userId", "firstName lastName email")
    .populate("reportingTo", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .lean();

  logger.info(`Offer letter accepted: ${offerLetter._id}`);

  return populated;
};

/**
 * Reject offer letter
 */
export const rejectOfferLetter = async (organizationId, offerId, rejectedBy, reason = null) => {
  const offerLetter = await OfferLetter.findOne({
    _id: offerId,
    organizationId,
    isDeleted: false,
  });

  if (!offerLetter) {
    throw new AppError("Offer letter not found", 404);
  }

  if (offerLetter.status !== "sent") {
    throw new AppError("Can only reject sent offer letters", 400);
  }

  offerLetter.reject(reason);
  offerLetter.updatedBy = rejectedBy;
  await offerLetter.save();

  const populated = await OfferLetter.findById(offerLetter._id)
    .populate("userId", "firstName lastName email")
    .populate("reportingTo", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .lean();

  logger.info(`Offer letter rejected: ${offerLetter._id}`);

  return populated;
};

/**
 * Withdraw offer letter
 */
export const withdrawOfferLetter = async (organizationId, offerId, withdrawnBy) => {
  const offerLetter = await OfferLetter.findOne({
    _id: offerId,
    organizationId,
    isDeleted: false,
  });

  if (!offerLetter) {
    throw new AppError("Offer letter not found", 404);
  }

  if (!["draft", "sent"].includes(offerLetter.status)) {
    throw new AppError("Can only withdraw draft or sent offer letters", 400);
  }

  offerLetter.withdraw();
  offerLetter.updatedBy = withdrawnBy;
  await offerLetter.save();

  logger.info(`Offer letter withdrawn: ${offerLetter._id} by ${withdrawnBy}`);

  return { message: "Offer letter withdrawn successfully" };
};

/**
 * Delete offer letter
 */
export const deleteOfferLetter = async (organizationId, offerId, deletedBy) => {
  const offerLetter = await OfferLetter.findOne({
    _id: offerId,
    organizationId,
    isDeleted: false,
  });

  if (!offerLetter) {
    throw new AppError("Offer letter not found", 404);
  }

  // Can only delete draft offer letters
  if (offerLetter.status !== "draft") {
    throw new AppError("Can only delete draft offer letters", 400);
  }

  offerLetter.isDeleted = true;
  offerLetter.updatedBy = deletedBy;
  await offerLetter.save();

  logger.info(`Offer letter deleted: ${offerLetter._id} by ${deletedBy}`);

  return { message: "Offer letter deleted successfully" };
};

/**
 * Get offer letter statistics
 */
export const getOfferLetterStats = async (organizationId) => {
  return OfferLetter.getStats(organizationId);
};

/**
 * Get user's own offer letters
 */
export const getMyOfferLetters = async (organizationId, userId) => {
  const offerLetters = await OfferLetter.find({
    organizationId,
    userId,
    isDeleted: false,
  })
    .populate("reportingTo", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();

  return offerLetters;
};

export default {
  // Salary
  getSalary,
  getSalaryHistory,
  setSalary,
  updateSalary,
  deleteSalary,
  getAllSalaries,
  getSalaryStats,
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
