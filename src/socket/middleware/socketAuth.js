/**
 * Socket Authentication Middleware
 * Validates JWT token for socket connections
 *
 * Token can be provided via:
 * 1. socket.handshake.auth.token
 * 2. socket.handshake.query.token
 * 3. socket.handshake.headers.authorization
 */
import jwt from "jsonwebtoken";
import User from "../../modules/users/model.js";
import logger from "../../utils/logger.js";

/**
 * Authenticate socket connection
 * @param {Socket} socket - Socket.io socket instance
 * @param {Function} next - Next middleware function
 */
export const socketAuth = async (socket, next) => {
  try {
    // Extract token from various sources
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch user from database
    const user = await User.findById(decoded.id)
      .select("_id firstName lastName email organizationId roleId status")
      .lean();

    if (!user) {
      return next(new Error("User not found"));
    }

    if (user.status !== "active") {
      return next(new Error("User account is inactive"));
    }

    // Attach user info to socket for use in handlers
    socket.user = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      organizationId: user.organizationId?.toString(),
      roleId: user.roleId?.toString(),
    };

    next();
  } catch (error) {
    logger.error("Socket auth error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return next(new Error("Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }

    next(new Error("Authentication failed"));
  }
};

export default socketAuth;
