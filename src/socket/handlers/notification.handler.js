/**
 * Notification Socket Handler
 * Handles real-time notification events
 *
 * Events:
 * - notification:read - Mark single notification as read
 * - notification:readAll - Mark all notifications as read
 * - typing:start/stop - Typing indicators (for future chat)
 */
import logger from "../../utils/logger.js";

/**
 * Register notification event handlers
 * @param {Server} io - Socket.io server instance
 * @param {Socket} socket - Socket connection
 */
const notificationHandler = (io, socket) => {
  /**
   * Mark single notification as read
   * Client emits: { notificationId: string }
   */
  socket.on("notification:read", async ({ notificationId }) => {
    try {
      // TODO: Import Notification model and update
      // await Notification.findByIdAndUpdate(notificationId, {
      //   read: true,
      //   readAt: new Date()
      // });

      socket.emit("notification:read:success", { notificationId });
      logger.info(`Notification ${notificationId} marked as read`);
    } catch (error) {
      logger.error("Error marking notification read:", error);
      socket.emit("notification:error", { message: "Failed to mark as read" });
    }
  });

  /**
   * Mark all notifications as read for current user
   */
  socket.on("notification:readAll", async () => {
    try {
      // TODO: Import Notification model and update
      // await Notification.updateMany(
      //   { userId: socket.user.id, read: false },
      //   { read: true, readAt: new Date() }
      // );

      socket.emit("notification:readAll:success");
      logger.info(`All notifications marked as read for user ${socket.user?.id}`);
    } catch (error) {
      logger.error("Error marking all notifications read:", error);
      socket.emit("notification:error", {
        message: "Failed to mark all as read",
      });
    }
  });

  /**
   * Get unread notification count
   */
  socket.on("notification:count", async () => {
    try {
      // TODO: Import Notification model and count
      // const count = await Notification.countDocuments({
      //   userId: socket.user.id,
      //   read: false
      // });

      const count = 0; // Placeholder
      socket.emit("notification:count:success", { count });
    } catch (error) {
      logger.error("Error getting notification count:", error);
      socket.emit("notification:error", {
        message: "Failed to get notification count",
      });
    }
  });

  // ============================================
  // TYPING INDICATORS (for future chat features)
  // ============================================

  /**
   * User started typing
   * Client emits: { roomId: string }
   */
  socket.on("typing:start", ({ roomId }) => {
    socket.to(roomId).emit("typing:start", {
      userId: socket.user?.id,
      name: `${socket.user?.firstName} ${socket.user?.lastName}`,
    });
  });

  /**
   * User stopped typing
   * Client emits: { roomId: string }
   */
  socket.on("typing:stop", ({ roomId }) => {
    socket.to(roomId).emit("typing:stop", { userId: socket.user?.id });
  });

  // ============================================
  // PRESENCE (online/offline status)
  // ============================================

  /**
   * User requests online users in their organization
   */
  socket.on("presence:getOnline", async () => {
    try {
      const orgRoom = `org:${socket.user?.organizationId}`;
      const sockets = await io.in(orgRoom).fetchSockets();

      const onlineUsers = sockets.map((s) => ({
        id: s.user?.id,
        name: `${s.user?.firstName} ${s.user?.lastName}`,
      }));

      socket.emit("presence:online", { users: onlineUsers });
    } catch (error) {
      logger.error("Error fetching online users:", error);
    }
  });
};

export default notificationHandler;
