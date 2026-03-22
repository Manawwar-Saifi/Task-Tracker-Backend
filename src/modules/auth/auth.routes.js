import express from "express";
import {
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
  verifyInvitation,
  acceptInvitation,
  getMe,
  verifyToken,
} from "./auth.controller.js";
import authMiddleware, { optionalAuth } from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import { USER_INVITE } from "../../constants/permissions.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  otpSendLimiter,
  otpVerifyLimiter,
} from "../../middlewares/otpRateLimit.middleware.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  inviteUserSchema,
  acceptInvitationSchema,
} from "./auth.validation.js";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */

/* -------- OTP ROUTES -------- */

// Send OTP to email
router.post(
  "/send-otp",
  otpSendLimiter,
  validate(sendOtpSchema),
  sendOtp
);

// Verify OTP
router.post(
  "/verify-otp",
  otpVerifyLimiter,
  validate(verifyOtpSchema),
  verifyOtp
);

// Resend OTP
router.post(
  "/resend-otp",
  otpSendLimiter,
  validate(sendOtpSchema),
  resendOtp
);

/* -------- REGISTRATION -------- */

// Register new organization with CEO
router.post("/register", validate(registerSchema), register);

// Login
router.post("/login", validate(loginSchema), login);

// Refresh access token
router.post("/refresh-token", refreshToken);

// Forgot password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword
);

// Verify invitation token (get invite details)
router.get("/verify-invite/:token", verifyInvitation);

// Accept invitation
router.post(
  "/accept-invite/:token",
  validate(acceptInvitationSchema),
  acceptInvitation
);

/* -------------------- PROTECTED ROUTES -------------------- */

// Logout — optionalAuth so it works even with an expired token
router.post("/logout", optionalAuth, logout);

// Get current user
router.get("/me", authMiddleware, getMe);

// Verify token
router.get("/verify", authMiddleware, verifyToken);

// Change password
router.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  changePassword
);

// Invite user (requires permission)
router.post(
  "/invite",
  authMiddleware,
  permissionMiddleware(USER_INVITE),
  validate(inviteUserSchema),
  inviteUser
);

export default router;
