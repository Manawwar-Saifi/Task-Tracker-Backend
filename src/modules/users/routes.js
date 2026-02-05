import express from "express";

// controllers (we’ll implement next)
import {
getMe,
getUsers,
getUserById,
createUser,
updateUser,
updateUserStatus
} from "./controller.js";

// middlewares (already planned / partially built)
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */

// Get current logged-in user
router.get(
  "/me",
  authMiddleware,
  getMe
);

// List users in organization
router.get(
  "/",
  authMiddleware,
  permissionMiddleware("USER_VIEW"),
  getUsers
);

// Get single user by ID
router.get(
  "/:userId",
  authMiddleware,
  permissionMiddleware("USER_VIEW"),
  getUserById
);

// Create new user
router.post(
  "/",
  authMiddleware,
  permissionMiddleware("USER_CREATE"),
  createUser
);

// Update user profile
router.patch(
  "/:userId",
  authMiddleware,
  permissionMiddleware("USER_UPDATE"),
  updateUser
);

// Activate / Deactivate user
router.patch(
  "/:userId/status",
  authMiddleware,
  permissionMiddleware("USER_STATUS_UPDATE"),
  updateUserStatus
);

export default router;
