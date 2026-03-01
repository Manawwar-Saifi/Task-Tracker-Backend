/**
 * Notification Controller
 *
 * HTTP handlers for notification management.
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as notificationService from "./notifications.service.js";

/**
 * Get all notifications for current user
 * GET /notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const data = await notificationService.getNotifications(
    req.user.organizationId,
    req.user.userId,
    req.query
  );
  return successResponse(res, 200, "Notifications retrieved", data);
});

/**
 * Get notification by ID
 * GET /notifications/:id
 */
export const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(
    req.user.organizationId,
    req.params.id,
    req.user.userId
  );
  return successResponse(res, 200, "Notification retrieved", { notification });
});

/**
 * Get unread count
 * GET /notifications/unread/count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await notificationService.getUnreadCount(
    req.user.organizationId,
    req.user.userId
  );
  return successResponse(res, 200, "Unread count retrieved", data);
});

/**
 * Get notification stats
 * GET /notifications/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await notificationService.getStats(
    req.user.organizationId,
    req.user.userId
  );
  return successResponse(res, 200, "Notification statistics retrieved", { stats });
});

/**
 * Create notification (Admin only)
 * POST /notifications
 */
export const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(
    req.user.organizationId,
    req.body,
    req.io
  );
  return successResponse(res, 201, "Notification created", { notification });
});

/**
 * Mark notification as read
 * PUT /notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.io
  );
  return successResponse(res, 200, "Notification marked as read", { notification });
});

/**
 * Mark notification as unread
 * PUT /notifications/:id/unread
 */
export const markAsUnread = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsUnread(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.io
  );
  return successResponse(res, 200, "Notification marked as unread", { notification });
});

/**
 * Mark multiple notifications as read
 * PUT /notifications/read/multiple
 */
export const markMultipleAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markMultipleAsRead(
    req.user.organizationId,
    req.body.notificationIds,
    req.user.userId,
    req.io
  );
  return successResponse(res, 200, "Notifications marked as read", result);
});

/**
 * Mark all notifications as read
 * PUT /notifications/read/all
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(
    req.user.organizationId,
    req.user.userId,
    req.io
  );
  return successResponse(res, 200, "All notifications marked as read", result);
});

/**
 * Delete notification
 * DELETE /notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.user.organizationId,
    req.params.id,
    req.user.userId,
    req.io
  );
  return successResponse(res, 200, result.message);
});

/**
 * Delete multiple notifications
 * DELETE /notifications/multiple
 */
export const deleteMultiple = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteMultiple(
    req.user.organizationId,
    req.body.notificationIds,
    req.user.userId,
    req.io
  );
  return successResponse(res, 200, "Notifications deleted", result);
});

/**
 * Delete all read notifications
 * DELETE /notifications/read/all
 */
export const deleteAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteAllRead(
    req.user.organizationId,
    req.user.userId,
    req.io
  );
  return successResponse(res, 200, "Read notifications deleted", result);
});

export default {
  getNotifications,
  getNotificationById,
  getUnreadCount,
  getStats,
  createNotification,
  markAsRead,
  markAsUnread,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteMultiple,
  deleteAllRead,
};
