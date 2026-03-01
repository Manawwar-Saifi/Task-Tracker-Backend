/**
 * Notification Routes
 *
 * API endpoints for notification management.
 */
import express from "express";
import * as controller from "./notifications.controller.js";
import * as validation from "./notifications.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// Get unread count (must come before /:id route)
router.get("/unread/count", controller.getUnreadCount);

// Get notification stats
router.get("/stats", controller.getStats);

// Mark all as read
router.put("/read/all", controller.markAllAsRead);

// Mark multiple as read
router.put(
  "/read/multiple",
  validate(validation.markMultipleAsReadSchema),
  controller.markMultipleAsRead
);

// Delete all read
router.delete("/read/all", controller.deleteAllRead);

// Delete multiple
router.delete(
  "/multiple",
  validate(validation.deleteMultipleSchema),
  controller.deleteMultiple
);

// Get all notifications
router.get(
  "/",
  validate(validation.getNotificationsQuerySchema),
  controller.getNotifications
);

// Create notification (admin only - requires permission check in controller or middleware)
router.post(
  "/",
  validate(validation.createNotificationSchema),
  controller.createNotification
);

// Get notification by ID
router.get(
  "/:id",
  validate(validation.getNotificationSchema),
  controller.getNotificationById
);

// Mark as read
router.put(
  "/:id/read",
  validate(validation.markAsReadSchema),
  controller.markAsRead
);

// Mark as unread
router.put(
  "/:id/unread",
  validate(validation.markAsReadSchema),
  controller.markAsUnread
);

// Delete notification
router.delete(
  "/:id",
  validate(validation.deleteNotificationSchema),
  controller.deleteNotification
);

export default router;
