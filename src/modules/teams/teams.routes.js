/**
 * Teams Routes
 * Handles all team management endpoints
 */
import express from "express";
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  setLeader,
  getTeamMembers,
  bulkAddMembers,
  getTeamHierarchy,
  getMyTeams,
} from "./teams.controller.js";
import {
  createTeamSchema,
  updateTeamSchema,
  getTeamSchema,
  addMemberSchema,
  removeMemberSchema,
  setLeaderSchema,
  bulkAddMembersSchema,
  getTeamsQuerySchema,
} from "./teams.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  TEAM_CREATE,
  TEAM_READ,
  TEAM_UPDATE,
  TEAM_DELETE,
  TEAM_ADD_MEMBER,
  TEAM_REMOVE_MEMBER,
  TEAM_ASSIGN_LEAD,
  TEAM_VIEW_ALL,
  TEAM_VIEW_OWN,
} from "../../constants/permissions.js";

const router = express.Router();

/* -------------------- PROTECTED ROUTES -------------------- */
router.use(authMiddleware);

/* -------------------- READ ROUTES -------------------- */

// Get my teams (user's own teams) - no special permission needed
router.get("/my", getMyTeams);

// Get team hierarchy
router.get(
  "/hierarchy",
  permissionMiddleware(TEAM_VIEW_ALL),
  getTeamHierarchy
);

// Get all teams (requires VIEW_ALL or VIEW_OWN)
router.get(
  "/",
  permissionMiddleware([TEAM_VIEW_ALL, TEAM_VIEW_OWN]),
  validate(getTeamsQuerySchema),
  getTeams
);

// Get single team
router.get(
  "/:id",
  permissionMiddleware(TEAM_READ),
  validate(getTeamSchema),
  getTeam
);

// Get team members
router.get(
  "/:id/members",
  permissionMiddleware(TEAM_READ),
  validate(getTeamSchema),
  getTeamMembers
);

/* -------------------- CREATE/UPDATE ROUTES -------------------- */

// Create team
router.post(
  "/",
  permissionMiddleware(TEAM_CREATE),
  validate(createTeamSchema),
  createTeam
);

// Update team
router.put(
  "/:id",
  permissionMiddleware(TEAM_UPDATE),
  validate(updateTeamSchema),
  updateTeam
);

// Delete team
router.delete(
  "/:id",
  permissionMiddleware(TEAM_DELETE),
  validate(getTeamSchema),
  deleteTeam
);

/* -------------------- MEMBER MANAGEMENT -------------------- */

// Add member
router.post(
  "/:id/members",
  permissionMiddleware(TEAM_ADD_MEMBER),
  validate(addMemberSchema),
  addMember
);

// Bulk add members
router.post(
  "/:id/members/bulk",
  permissionMiddleware(TEAM_ADD_MEMBER),
  validate(bulkAddMembersSchema),
  bulkAddMembers
);

// Remove member
router.delete(
  "/:id/members/:userId",
  permissionMiddleware(TEAM_REMOVE_MEMBER),
  validate(removeMemberSchema),
  removeMember
);

// Set team leader
router.put(
  "/:id/leader",
  permissionMiddleware(TEAM_ASSIGN_LEAD),
  validate(setLeaderSchema),
  setLeader
);

export default router;
