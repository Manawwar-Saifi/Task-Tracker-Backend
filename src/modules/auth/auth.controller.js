import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as authService from "./auth.service.js";

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ============ OTP CONTROLLERS ============

/**
 * @desc    Send OTP to email
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ip = req.ip || req.connection?.remoteAddress;

  const data = await authService.sendOtp(email, ip);

  return successResponse(res, 200, data.message);
});

/**
 * @desc    Verify OTP
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const data = await authService.verifyOtp(email, otp);

  return successResponse(res, 200, data.message, {
    verificationToken: data.verificationToken,
  });
});

/**
 * @desc    Resend OTP
 * @route   POST /api/v1/auth/resend-otp
 * @access  Public
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ip = req.ip || req.connection?.remoteAddress;

  const data = await authService.resendOtp(email, ip);

  return successResponse(res, 200, data.message);
});

// ============ REGISTRATION ============

/**
 * @desc    Register new organization with CEO
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { verificationToken, organizationName, firstName, lastName, email, password, phone } =
    req.body;

  const data = await authService.registerOrganization({
    verificationToken,
    organizationName,
    firstName,
    lastName,
    email,
    password,
    phone,
  });

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", data.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return successResponse(res, 201, "Organization registered successfully", {
    user: data.user,
    organization: data.organization,
    subscription: data.subscription,
    accessToken: data.accessToken,
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, organizationId } = req.body;

  const data = await authService.loginUser({
    email,
    password,
    organizationId,
  });

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", data.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return successResponse(res, 200, "Login successful", {
    user: data.user,
    organization: data.organization,
    accessToken: data.accessToken,
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.userId);

  // Clear refresh token cookie
  res.clearCookie("refreshToken", REFRESH_TOKEN_COOKIE_OPTIONS);

  return successResponse(res, 200, "Logged out successfully");
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public (with valid refresh token)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const refreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not provided",
    });
  }

  const data = await authService.refreshAccessToken(refreshToken);

  return successResponse(res, 200, "Token refreshed successfully", data);
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const data = await authService.changePassword(
    req.user.userId,
    currentPassword,
    newPassword
  );

  // Clear refresh token cookie (force re-login)
  res.clearCookie("refreshToken", REFRESH_TOKEN_COOKIE_OPTIONS);

  return successResponse(res, 200, data.message);
});

/**
 * @desc    Forgot password - Request reset
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const data = await authService.forgotPassword(email);

  return successResponse(res, 200, data.message, {
    // Include reset token in dev mode only
    ...(process.env.NODE_ENV === "development" && {
      resetToken: data.resetToken,
    }),
  });
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  const data = await authService.resetPassword(resetToken, newPassword);

  return successResponse(res, 200, data.message);
});

/**
 * @desc    Invite user to organization
 * @route   POST /api/v1/auth/invite
 * @access  Private (requires USER_INVITE permission)
 */
export const inviteUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, roleId, teamIds, reportingTo, department, designation } =
    req.body;

  const data = await authService.inviteUser(
    req.user.organizationId,
    req.user.userId,
    {
      firstName,
      lastName,
      email,
      roleId,
      teamIds,
      reportingTo,
      department,
      designation,
    }
  );

  return successResponse(res, 201, "Invitation sent successfully", {
    user: data.user,
    // Include invite token in dev mode only
    ...(process.env.NODE_ENV === "development" && {
      inviteToken: data.inviteToken,
    }),
  });
});

/**
 * @desc    Verify invitation token and return invite details
 * @route   GET /api/v1/auth/verify-invite/:token
 * @access  Public
 */
export const verifyInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const data = await authService.verifyInvitation(token);

  return successResponse(res, 200, "Invitation is valid", data);
});

/**
 * @desc    Accept invitation and set password
 * @route   POST /api/v1/auth/accept-invite/:token
 * @access  Public
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const data = await authService.acceptInvitation(token, password);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", data.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return successResponse(res, 200, "Invitation accepted successfully", {
    user: data.user,
    organization: data.organization,
    accessToken: data.accessToken,
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getCurrentUser(req.user.userId);

  return successResponse(res, 200, "User profile retrieved", data);
});

/**
 * @desc    Verify token validity
 * @route   GET /api/v1/auth/verify
 * @access  Private
 */
export const verifyToken = asyncHandler(async (req, res) => {
  // If we reach here, the token is valid (auth middleware passed)
  return successResponse(res, 200, "Token is valid", {
    valid: true,
    userId: req.user.userId,
    organizationId: req.user.organizationId,
  });
});

export default {
  sendOtp,
  verifyOtp,
  resendOtp,
  register,
  login,
  logout,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  inviteUser,
  acceptInvitation,
  getMe,
  verifyToken,
};
