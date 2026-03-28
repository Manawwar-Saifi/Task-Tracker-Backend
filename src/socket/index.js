/**
 * Socket.io Server Setup
 * Real-time communication handler
 *
 * Flow:
 * 1. Initialize with HTTP server
 * 2. Apply auth middleware
 * 3. Handle connection events
 * 4. Register event handlers
 */
import { Server } from "socket.io";
import logger from "../utils/logger.js";
import { socketAuth } from "./middleware/socketAuth.js";
import notificationHandler from "./handlers/notification.handler.js";

let io;

/**
 * Initialize Socket.io with HTTP server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((u) => u.trim()).filter(Boolean)
        : (process.env.CLIENT_URL || "http://localhost:5174"),
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuth);

  // Connection handler
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.user?.id}`);

    // Join user to their personal room (for direct messages)
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join organization room (for org-wide broadcasts)
    if (socket.user?.organizationId) {
      socket.join(`org:${socket.user.organizationId}`);
    }

    // Register event handlers
    notificationHandler(io, socket);

    // Disconnect handler
    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    // Error handler
    socket.on("error", (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info("Socket.io initialized");
  return io;
};

/**
 * Get Socket.io instance
 * @returns {Server} Socket.io server instance
 * @throws {Error} If socket not initialized
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};

/**
 * Emit event to specific user
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit event to all users in an organization
 * @param {string} orgId - Organization ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const emitToOrg = (orgId, event, data) => {
  if (io) {
    io.to(`org:${orgId}`).emit(event, data);
  }
};

/**
 * Emit event to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const emitToUsers = (userIds, event, data) => {
  if (io) {
    userIds.forEach((userId) => {
      io.to(`user:${userId}`).emit(event, data);
    });
  }
};

export default { initSocket, getIO, emitToUser, emitToOrg, emitToUsers };
