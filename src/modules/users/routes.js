/**
 * Users Routes
 * Handles all user management endpoints
 */
import express from "express";
import {
  getMe,
  getUsers,
  getUser,
  createUser,
  updateUser,
  changeStatus,
  assignRole,
  deleteUser,
  getAvailableUsersForTeam,
} from "./controller.js";
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  changeStatusSchema,
  assignRoleSchema,
  getUsersQuerySchema,
} from "./users.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  USER_CREATE,
  USER_READ,
  USER_UPDATE,
  USER_DELETE,
  USER_VIEW_ALL,
  USER_ASSIGN_ROLE,
  TEAM_ADD_MEMBER,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

// Get current logged-in user
router.get("/me", getMe);

// Get users available for team assignment
router.get(
  "/available-for-team/:teamId",
  permissionMiddleware(TEAM_ADD_MEMBER),
  getAvailableUsersForTeam
);

// List users in organization
router.get(
  "/",
  permissionMiddleware(USER_VIEW_ALL),
  validate(getUsersQuerySchema),
  getUsers
);

// Get single user by ID
router.get(
  "/:id",
  permissionMiddleware(USER_READ),
  validate(getUserSchema),
  getUser
);

// Create new user (direct add)
router.post(
  "/",
  permissionMiddleware(USER_CREATE),
  validate(createUserSchema),
  createUser
);

// Update user details
router.put(
  "/:id",
  permissionMiddleware(USER_UPDATE),
  validate(updateUserSchema),
  updateUser
);

// Change user status
router.put(
  "/:id/status",
  permissionMiddleware(USER_UPDATE),
  validate(changeStatusSchema),
  changeStatus
);

// Assign role to user
router.put(
  "/:id/role",
  permissionMiddleware(USER_ASSIGN_ROLE),
  validate(assignRoleSchema),
  assignRole
);

// Delete user
router.delete(
  "/:id",
  permissionMiddleware(USER_DELETE),
  validate(getUserSchema),
  deleteUser
);

export default router;
