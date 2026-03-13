import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../users/model.js";
import Organization from "../organizations/model.js";
import Role from "../roles/roles.model.js";
import EmailVerification from "./emailVerification.model.js";
import "../teams/teams.model.js"; // Register Team model for populate
import { seedOrganizationRoles } from "../../seeders/permissionSeeder.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";
import { sendOtpEmail } from "../../services/email.service.js";
import {
  createTrialSubscription,
  getSubscriptionStatus,
  checkUserLimit,
  incrementUserCount,
} from "../billing/subscription.service.js";

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN = "15m",
  JWT_REFRESH_EXPIRES_IN = "7d",
} = process.env;

/**
 * Generate Access Token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
      isSuperAdmin: user.isSuperAdmin,
      isOwner: user.isOwner,
    },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      tokenVersion: Date.now(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Generate both tokens
 */
export const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired access token", 401);
  }
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};

// ============ OTP FUNCTIONS ============

/**
 * Generate 6-digit numeric OTP
 */
const generateOtp = () => {
  // Cryptographically secure random 6-digit number
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP for storage (SHA256)
 */
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Generate verification token after OTP is verified
 */
const generateVerificationToken = (email) => {
  return jwt.sign(
    { email: email.toLowerCase(), purpose: "email_verification" },
    JWT_ACCESS_SECRET,
    { expiresIn: "30m" }
  );
};

/**
 * Send OTP to email for verification
 */
export const sendOtp = async (email, ip) => {
  const normalizedEmail = email.toLowerCase();

  // Check if email already registered
  const existingUser = await User.findOne({
    email: normalizedEmail,
    isDeleted: false,
  });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  // Check existing verification record for rate limiting
  let verification = await EmailVerification.findOne({ email: normalizedEmail });

  if (verification) {
    // Rate limit: max 3 resends per 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (verification.resendCount >= 3 && verification.lastResendAt > fifteenMinsAgo) {
      throw new AppError("Too many OTP requests. Please try again later.", 429);
    }
  }

  // Generate and hash OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  // Upsert verification record
  await EmailVerification.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      $inc: { resendCount: verification ? 1 : 0 },
      lastResendAt: new Date(),
      requestIp: ip,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send OTP email
  try {
    await sendOtpEmail(normalizedEmail, otp);
    logger.info(`OTP sent to: ${normalizedEmail}`);
  } catch (emailError) {
    // Delete the verification record if email fails
    await EmailVerification.deleteOne({ email: normalizedEmail });
    logger.error(`Failed to send OTP email: ${emailError.message}`);
    throw new AppError(
      emailError.message || "Failed to send verification email. Please try again.",
      500
    );
  }

  return { message: "OTP sent to email" };
};

/**
 * Verify OTP and return verification token
 */
export const verifyOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase();

  const verification = await EmailVerification.findOne({
    email: normalizedEmail,
    expiresAt: { $gt: new Date() },
  });

  if (!verification) {
    throw new AppError("OTP expired or not found. Please request a new one.", 400);
  }

  // Check max attempts
  if (verification.attempts >= 5) {
    throw new AppError("Too many failed attempts. Please request a new OTP.", 429);
  }

  // Verify OTP hash
  const otpHash = hashOtp(otp);
  if (verification.otpHash !== otpHash) {
    verification.attempts += 1;
    await verification.save();
    const remaining = 5 - verification.attempts;
    throw new AppError(
      `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      400
    );
  }

  // Delete verification record (one-time use)
  await EmailVerification.deleteOne({ _id: verification._id });

  // Generate verification token
  const verificationToken = generateVerificationToken(normalizedEmail);

  logger.info(`Email verified: ${normalizedEmail}`);

  return {
    message: "Email verified successfully",
    verificationToken,
  };
};

/**
 * Resend OTP (alias for sendOtp with additional checks)
 */
export const resendOtp = async (email, ip) => {
  return sendOtp(email, ip);
};

// ============ REGISTRATION ============

/**
 * Register new organization with CEO
 */
export const registerOrganization = async ({
  verificationToken,
  organizationName,
  firstName,
  lastName,
  email,
  password,
  phone,
}) => {
  // Verify email verification token
  if (verificationToken) {
    try {
      const decoded = jwt.verify(verificationToken, JWT_ACCESS_SECRET);
      if (
        decoded.purpose !== "email_verification" ||
        decoded.email !== email.toLowerCase()
      ) {
        throw new Error("Invalid token");
      }
    } catch (error) {
      throw new AppError(
        "Invalid or expired verification. Please verify your email again.",
        400
      );
    }
  }
  // Check if organization with same name and owner email exists
  const existingOrg = await Organization.findOne({
    ownerEmail: email.toLowerCase(),
    isDeleted: false,
  });

  if (existingOrg) {
    throw new AppError(
      "An organization already exists with this email",
      409
    );
  }

  // Create organization
  const organization = await Organization.create({
    name: organizationName,
    ownerEmail: email.toLowerCase(),
    status: "active",
  });

  // Seed default roles for the organization
  const roles = await seedOrganizationRoles(organization._id);

  // Get CEO role
  const ceoRole = roles.find((r) => r.slug === "ceo");

  if (!ceoRole) {
    throw new AppError("Failed to create default roles", 500);
  }

  // Create CEO user
  let user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    phone,
    organizationId: organization._id,
    roleId: ceoRole._id,
    status: "active",
    isOwner: true,
    dateOfJoining: new Date(),
  });

  // Populate role for response
  user = await User.findById(user._id).populate("roleId", "name slug level");

  // Update organization with owner user ID
  organization.ownerUserId = user._id;
  await organization.save();

  // Create trial subscription (14-day Professional trial)
  const subscription = await createTrialSubscription(organization._id);
  logger.info(`Trial subscription created for org: ${organization.name}`);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save refresh token
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  logger.info(`New organization registered: ${organization.name}`);

  // Get subscription status for response
  const subscriptionStatus = await getSubscriptionStatus(organization._id);

  return {
    user: sanitizeUser(user),
    organization: {
      _id: organization._id,
      name: organization.name,
      status: organization.status,
    },
    subscription: subscriptionStatus,
    accessToken,
    refreshToken,
  };
};

/**
 * Login user
 */
export const loginUser = async ({ email, password, organizationId }) => {
  // Find user with password and populate role
  const user = await User.findOne({
    email: email.toLowerCase(),
    ...(organizationId && { organizationId }),
    isDeleted: false,
  })
    .select("+password +refreshToken")
    .populate("roleId", "name slug level");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if user is active
  if (user.status !== "active") {
    throw new AppError(
      `Your account is ${user.status}. Please contact administrator.`,
      403
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Get organization
  const organization = await Organization.findById(user.organizationId);

  // Auto-fix: Set isOwner if user is organization owner but flag is missing
  if (organization && !user.isOwner) {
    const isOrgOwner =
      organization.ownerEmail?.toLowerCase() === user.email.toLowerCase() ||
      organization.ownerUserId?.toString() === user._id.toString();

    if (isOrgOwner) {
      user.isOwner = true;
      logger.info(`Auto-fixed isOwner flag for: ${user.email}`);
    }
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Update user login info
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  // Get subscription status
  const subscriptionStatus = organization
    ? await getSubscriptionStatus(organization._id)
    : null;

  logger.info(`User logged in: ${user.email}`);

  return {
    user: sanitizeUser(user),
    organization: organization
      ? {
          _id: organization._id,
          name: organization.name,
          status: organization.status,
        }
      : null,
    subscription: subscriptionStatus,
    accessToken,
    refreshToken,
  };
};

/**
 * Logout user
 */
export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
    refreshTokenExpiry: null,
  });

  logger.info(`User logged out: ${userId}`);
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Find user with refresh token
  const user = await User.findOne({
    _id: decoded.userId,
    refreshToken,
    isDeleted: false,
  }).select("+refreshToken");

  if (!user) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Check if refresh token is expired
  if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
    throw new AppError("Refresh token expired. Please login again.", 401);
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  return { accessToken };
};

/**
 * Change password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  // Update password
  user.password = newPassword;
  user.refreshToken = null; // Invalidate all sessions
  user.refreshTokenExpiry = null;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  return { message: "Password changed successfully" };
};

/**
 * Forgot password - Generate reset token
 */
export const forgotPassword = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  });

  if (!user) {
    // Don't reveal if user exists
    return { message: "If email exists, reset link has been sent" };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  logger.info(`Password reset requested for: ${user.email}`);

  // TODO: Send email with reset link
  // await sendPasswordResetEmail(user.email, resetToken);

  return {
    message: "If email exists, reset link has been sent",
    resetToken, // Remove in production - only for development
  };
};

/**
 * Reset password with token
 */
export const resetPassword = async (resetToken, newPassword) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: new Date() },
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  user.refreshToken = null;
  user.refreshTokenExpiry = null;
  await user.save();

  logger.info(`Password reset for: ${user.email}`);

  return { message: "Password reset successfully" };
};

/**
 * Invite user to organization
 */
export const inviteUser = async (
  organizationId,
  invitedBy,
  { firstName, lastName, email, roleId, teamIds, reportingTo, department, designation }
) => {
  // Check subscription user limit
  const limitCheck = await checkUserLimit(organizationId);
  if (!limitCheck.canAdd) {
    throw new AppError(limitCheck.message, 403);
  }

  // Check if user already exists in organization
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    organizationId,
    isDeleted: false,
  });

  if (existingUser) {
    throw new AppError("User already exists in this organization", 409);
  }

  // Validate role belongs to organization
  if (roleId) {
    const role = await Role.findOne({
      _id: roleId,
      organizationId,
      isDeleted: false,
    });
    if (!role) {
      throw new AppError("Invalid role", 400);
    }
  }

  // Generate invite token
  const inviteToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(inviteToken)
    .digest("hex");

  // Create user with invited status
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: crypto.randomBytes(16).toString("hex"), // Temporary password
    organizationId,
    roleId: roleId || null,
    teamIds: teamIds || [],
    reportingTo: reportingTo || null,
    department: department || null,
    designation: designation || null,
    status: "invited",
    inviteToken: hashedToken,
    inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    invitedBy,
  });

  logger.info(`User invited: ${email} to org: ${organizationId}`);

  // TODO: Send invitation email
  // await sendInvitationEmail(user.email, inviteToken);

  return {
    user: sanitizeUser(user),
    inviteToken, // Remove in production
  };
};

/**
 * Accept invitation and set password
 */
export const acceptInvitation = async (inviteToken, password) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(inviteToken)
    .digest("hex");

  const user = await User.findOne({
    inviteToken: hashedToken,
    inviteTokenExpiry: { $gt: new Date() },
    status: "invited",
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("Invalid or expired invitation", 400);
  }

  // Update user
  user.password = password;
  user.status = "active";
  user.inviteToken = null;
  user.inviteTokenExpiry = null;
  user.dateOfJoining = new Date();
  await user.save();

  // Increment user count in subscription
  await incrementUserCount(user.organizationId);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // Get organization
  const organization = await Organization.findById(user.organizationId);

  logger.info(`Invitation accepted: ${user.email}`);

  return {
    user: sanitizeUser(user),
    organization: {
      _id: organization._id,
      name: organization.name,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)
    .populate("roleId", "name slug level permissionCodes")
    .populate("teamIds", "name")
    .populate("reportingTo", "firstName lastName email");

  if (!user || user.isDeleted) {
    throw new AppError("User not found", 404);
  }

  const organization = await Organization.findById(user.organizationId);

  // Get subscription status
  const subscriptionStatus = organization
    ? await getSubscriptionStatus(organization._id)
    : null;

  return {
    user: sanitizeUser(user),
    organization: organization
      ? {
          _id: organization._id,
          name: organization.name,
          status: organization.status,
        }
      : null,
    subscription: subscriptionStatus,
    permissions: await user.getAllPermissions(),
  };
};

/**
 * Sanitize user object (remove sensitive data)
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };

  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.refreshTokenExpiry;
  delete userObj.inviteToken;
  delete userObj.inviteTokenExpiry;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpiry;

  // Add helper fields for frontend
  userObj.roleName = userObj.roleId?.name || (userObj.isOwner ? "CEO" : null);
  userObj.roleLevel = userObj.roleId?.level || (userObj.isOwner ? 1 : 999);

  return userObj;
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  sendOtp,
  verifyOtp,
  resendOtp,
  registerOrganization,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  resetPassword,
  inviteUser,
  acceptInvitation,
  getCurrentUser,
};
