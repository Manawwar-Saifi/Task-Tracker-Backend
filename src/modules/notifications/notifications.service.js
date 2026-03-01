/**
 * Notification Service
 *
 * Business logic for notification management.
 * Supports real-time notifications via Socket.io.
 */
import Notification from "./notifications.model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

/**
 * Get notifications for user
 */
export const getNotifications = async (organizationId, userId, options = {}) => {
  return Notification.getNotifications(organizationId, userId, options);
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (organizationId, notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    organizationId,
    userId,
    isDeleted: false,
  })
    .populate("actionBy", "firstName lastName avatar")
    .lean();

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return notification;
};

/**
 * Get unread count
 */
export const getUnreadCount = async (organizationId, userId) => {
  const count = await Notification.getUnreadCount(organizationId, userId);
  return { count };
};

/**
 * Get notification stats
 */
export const getStats = async (organizationId, userId) => {
  return Notification.getStats(organizationId, userId);
};

/**
 * Create notification
 */
export const createNotification = async (organizationId, data, io = null) => {
  const notification = await Notification.create({
    organizationId,
    ...data,
  });

  const populated = await Notification.findById(notification._id)
    .populate("actionBy", "firstName lastName avatar")
    .lean();

  // Emit real-time notification via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${data.userId}`;
    io.to(room).emit("notification", {
      type: "new_notification",
      notification: populated,
    });
    logger.info(`Real-time notification sent to ${room}`);
  }

  logger.info(`Notification created: ${notification._id} for user ${data.userId}`);

  return populated;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (organizationId, notificationId, userId, io = null) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    organizationId,
    userId,
    isDeleted: false,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.isRead) {
    return notification.toObject();
  }

  notification.markAsRead();
  await notification.save();

  const unreadCount = await Notification.getUnreadCount(organizationId, userId);

  // Emit real-time update via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${userId}`;
    io.to(room).emit("notification", {
      type: "notification_read",
      notificationId,
      unreadCount,
    });
  }

  logger.info(`Notification ${notificationId} marked as read by user ${userId}`);

  return notification.toObject();
};

/**
 * Mark notification as unread
 */
export const markAsUnread = async (organizationId, notificationId, userId, io = null) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    organizationId,
    userId,
    isDeleted: false,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (!notification.isRead) {
    return notification.toObject();
  }

  notification.markAsUnread();
  await notification.save();

  const unreadCount = await Notification.getUnreadCount(organizationId, userId);

  // Emit real-time update via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${userId}`;
    io.to(room).emit("notification", {
      type: "notification_unread",
      notificationId,
      unreadCount,
    });
  }

  logger.info(`Notification ${notificationId} marked as unread by user ${userId}`);

  return notification.toObject();
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = async (organizationId, notificationIds, userId, io = null) => {
  const result = await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      organizationId,
      userId,
      isRead: false,
      isDeleted: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  const unreadCount = await Notification.getUnreadCount(organizationId, userId);

  // Emit real-time update via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${userId}`;
    io.to(room).emit("notification", {
      type: "notifications_read",
      notificationIds,
      unreadCount,
    });
  }

  logger.info(`${result.modifiedCount} notifications marked as read for user ${userId}`);

  return { count: result.modifiedCount, unreadCount };
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (organizationId, userId, io = null) => {
  const count = await Notification.markAllAsRead(organizationId, userId);

  // Emit real-time update via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${userId}`;
    io.to(room).emit("notification", {
      type: "all_notifications_read",
      unreadCount: 0,
    });
  }

  logger.info(`${count} notifications marked as read for user ${userId}`);

  return { count };
};

/**
 * Delete notification
 */
export const deleteNotification = async (organizationId, notificationId, userId, io = null) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    organizationId,
    userId,
    isDeleted: false,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  notification.isDeleted = true;
  await notification.save();

  const unreadCount = await Notification.getUnreadCount(organizationId, userId);

  // Emit real-time update via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${userId}`;
    io.to(room).emit("notification", {
      type: "notification_deleted",
      notificationId,
      unreadCount,
    });
  }

  logger.info(`Notification ${notificationId} deleted by user ${userId}`);

  return { message: "Notification deleted successfully" };
};

/**
 * Delete multiple notifications
 */
export const deleteMultiple = async (organizationId, notificationIds, userId, io = null) => {
  const result = await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      organizationId,
      userId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
      },
    }
  );

  const unreadCount = await Notification.getUnreadCount(organizationId, userId);

  // Emit real-time update via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${userId}`;
    io.to(room).emit("notification", {
      type: "notifications_deleted",
      notificationIds,
      unreadCount,
    });
  }

  logger.info(`${result.modifiedCount} notifications deleted for user ${userId}`);

  return { count: result.modifiedCount, unreadCount };
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (organizationId, userId, io = null) => {
  const count = await Notification.deleteAllRead(organizationId, userId);

  const unreadCount = await Notification.getUnreadCount(organizationId, userId);

  // Emit real-time update via Socket.io
  if (io) {
    const room = `org:${organizationId}:user:${userId}`;
    io.to(room).emit("notification", {
      type: "read_notifications_deleted",
      unreadCount,
    });
  }

  logger.info(`${count} read notifications deleted for user ${userId}`);

  return { count };
};

/**
 * Helper: Send notification to user
 * This is a convenience function to create and send notifications
 */
export const sendNotification = async (
  organizationId,
  userId,
  type,
  title,
  message,
  options = {},
  io = null
) => {
  return createNotification(
    organizationId,
    {
      userId,
      type,
      title,
      message,
      ...options,
    },
    io
  );
};

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
  sendNotification,
};
