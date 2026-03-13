/**
 * Email Service
 * Handles all email sending operations using nodemailer
 */

import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

// Create transporter (singleton)
let transporter = null;

/**
 * Initialize email transporter
 */
const initTransporter = () => {
  if (transporter) return transporter;

  // Check if SMTP is configured
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn("SMTP not configured - emails will be logged to console");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  // Verify connection on startup
  transporter.verify((error) => {
    if (error) {
      logger.error("SMTP connection failed:", error.message);
    } else {
      logger.info("SMTP server is ready to send emails");
    }
  });

  return transporter;
};

/**
 * Send email (with fallback to console logging in dev)
 */
const sendEmail = async (mailOptions) => {
  const transport = initTransporter();

  if (!transport) {
    // Log to console if SMTP not configured (dev mode)
    logger.info("📧 Email would be sent:");
    logger.info(`   To: ${mailOptions.to}`);
    logger.info(`   Subject: ${mailOptions.subject}`);
    logger.info(`   Text: ${mailOptions.text}`);
    return { messageId: "dev-mode-no-smtp" };
  }

  try {
    const result = await transport.sendMail(mailOptions);
    logger.info(`Email sent to: ${mailOptions.to} (${result.messageId})`);
    return result;
  } catch (error) {
    logger.error(`Failed to send email to ${mailOptions.to}:`, error.message);

    // Check for common SMTP errors
    if (error.message.includes("535") || error.message.includes("BadCredentials")) {
      throw new Error(
        "Email service configuration error. Please check SMTP credentials."
      );
    }
    if (error.message.includes("ECONNREFUSED")) {
      throw new Error("Unable to connect to email server.");
    }

    throw new Error("Failed to send email. Please try again later.");
  }
};

/**
 * Send OTP verification email
 */
export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Task Tracker" <${env.FROM_EMAIL}>`,
    to: email,
    subject: "Verify your email - OTP Code",
    html: getOtpEmailTemplate(otp),
    text: `Your verification code is: ${otp}. This code expires in 10 minutes.`,
  };

  return sendEmail(mailOptions);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const mailOptions = {
    from: `"Task Tracker" <${env.FROM_EMAIL}>`,
    to: email,
    subject: "Reset your password",
    html: getPasswordResetTemplate(resetUrl),
    text: `Reset your password by clicking this link: ${resetUrl}. This link expires in 30 minutes.`,
  };

  return sendEmail(mailOptions);
};

/**
 * Send invitation email
 */
export const sendInvitationEmail = async (
  email,
  inviterName,
  organizationName,
  inviteUrl
) => {
  const mailOptions = {
    from: `"Task Tracker" <${env.FROM_EMAIL}>`,
    to: email,
    subject: `You've been invited to join ${organizationName}`,
    html: getInvitationTemplate(inviterName, organizationName, inviteUrl),
    text: `${inviterName} has invited you to join ${organizationName} on Task Tracker. Accept your invitation: ${inviteUrl}`,
  };

  return sendEmail(mailOptions);
};

// ============ EMAIL TEMPLATES ============

/**
 * OTP verification email template
 */
const getOtpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #0d9488; margin: 0; font-size: 28px; }
    h2 { color: #1e293b; margin: 0 0 16px; font-size: 24px; }
    p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px dashed #14b8a6; }
    .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #0d9488; font-family: 'Courier New', monospace; }
    .expiry { color: #94a3b8; font-size: 14px; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>Task Tracker</h1>
      </div>
      <h2>Verify your email address</h2>
      <p>Hello! Use the following verification code to complete your registration. This code is valid for 10 minutes.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p class="expiry">Expires in 10 minutes</p>
      </div>
      <p>If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Task Tracker. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Password reset email template
 */
const getPasswordResetTemplate = (resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #0d9488; margin: 0; font-size: 28px; }
    h2 { color: #1e293b; margin: 0 0 16px; font-size: 24px; }
    p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
    .button { display: inline-block; background: #0d9488; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #0f766e; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>Task Tracker</h1>
      </div>
      <h2>Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to create a new password. This link expires in 30 minutes.</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Task Tracker. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Invitation email template
 */
const getInvitationTemplate = (inviterName, organizationName, inviteUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #0d9488; margin: 0; font-size: 28px; }
    h2 { color: #1e293b; margin: 0 0 16px; font-size: 24px; }
    p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
    .org-name { color: #0d9488; font-weight: 600; }
    .button { display: inline-block; background: #0d9488; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>Task Tracker</h1>
      </div>
      <h2>You've been invited!</h2>
      <p><strong>${inviterName}</strong> has invited you to join <span class="org-name">${organizationName}</span> on Task Tracker.</p>
      <p>Task Tracker helps teams collaborate, track tasks, and manage projects efficiently.</p>
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </div>
      <p>This invitation expires in 7 days.</p>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Task Tracker. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export default {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
};
