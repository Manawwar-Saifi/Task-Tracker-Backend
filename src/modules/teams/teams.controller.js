/**
 * Teams Controller
 * Handles HTTP requests for team management
 */
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as teamsService from "./teams.service.js";

/**
 * @desc    Get all teams in organization
 * @route   GET /api/v1/teams
 * @access  Protected + TEAM_VIEW_ALL or TEAM_VIEW_OWN
 */
export const getTeams = asyncHandler(async (req, res) => {
  const { page, limit, search, parentTeamId, isActive } = req.query;

  const data = await teamsService.getTeams(req.user.organizationId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    parentTeamId,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });

  return successResponse(res, 200, "Teams retrieved successfully", data);
});

/**
 * @desc    Get single team
 * @route   GET /api/v1/teams/:id
 * @access  Protected + TEAM_READ
 */
export const getTeam = asyncHandler(async (req, res) => {
  const team = await teamsService.getTeam(req.params.id, req.user.organizationId);

  return successResponse(res, 200, "Team retrieved successfully", { team });
});

/**
 * @desc    Create new team
 * @route   POST /api/v1/teams
 * @access  Protected + TEAM_CREATE
 */
export const createTeam = asyncHandler(async (req, res) => {
  const team = await teamsService.createTeam(
    req.user.organizationId,
    req.user.userId,
    req.body
  );

  return successResponse(res, 201, "Team created successfully", { team });
});

/**
 * @desc    Update team
 * @route   PUT /api/v1/teams/:id
 * @access  Protected + TEAM_UPDATE
 */
export const updateTeam = asyncHandler(async (req, res) => {
  const team = await teamsService.updateTeam(
    req.params.id,
    req.user.organizationId,
    req.user.userId,
    req.body
  );

  return successResponse(res, 200, "Team updated successfully", { team });
});

/**
 * @desc    Delete team
 * @route   DELETE /api/v1/teams/:id
 * @access  Protected + TEAM_DELETE
 */
export const deleteTeam = asyncHandler(async (req, res) => {
  const result = await teamsService.deleteTeam(
    req.params.id,
    req.user.organizationId,
    req.user.userId
  );

  return successResponse(res, 200, result.message);
});

/**
 * @desc    Add member to team
 * @route   POST /api/v1/teams/:id/members
 * @access  Protected + TEAM_ADD_MEMBER
 */
export const addMember = asyncHandler(async (req, res) => {
  const team = await teamsService.addMember(
    req.params.id,
    req.user.organizationId,
    req.user.userId,
    req.body.userId
  );

  return successResponse(res, 200, "Member added successfully", { team });
});

/**
 * @desc    Remove member from team
 * @route   DELETE /api/v1/teams/:id/members/:userId
 * @access  Protected + TEAM_REMOVE_MEMBER
 */
export const removeMember = asyncHandler(async (req, res) => {
  const team = await teamsService.removeMember(
    req.params.id,
    req.user.organizationId,
    req.user.userId,
    req.params.userId
  );

  return successResponse(res, 200, "Member removed successfully", { team });
});

/**
 * @desc    Set team leader
 * @route   PUT /api/v1/teams/:id/leader
 * @access  Protected + TEAM_ASSIGN_LEAD
 */
export const setLeader = asyncHandler(async (req, res) => {
  const team = await teamsService.setLeader(
    req.params.id,
    req.user.organizationId,
    req.user.userId,
    req.body.userId
  );

  return successResponse(res, 200, "Team leader updated successfully", { team });
});

/**
 * @desc    Get team members
 * @route   GET /api/v1/teams/:id/members
 * @access  Protected + TEAM_READ
 */
export const getTeamMembers = asyncHandler(async (req, res) => {
  const members = await teamsService.getTeamMembers(
    req.params.id,
    req.user.organizationId
  );

  return successResponse(res, 200, "Team members retrieved", { members });
});

/**
 * @desc    Bulk add members to team
 * @route   POST /api/v1/teams/:id/members/bulk
 * @access  Protected + TEAM_ADD_MEMBER
 */
export const bulkAddMembers = asyncHandler(async (req, res) => {
  const result = await teamsService.bulkAddMembers(
    req.params.id,
    req.user.organizationId,
    req.user.userId,
    req.body.userIds
  );

  return successResponse(
    res,
    200,
    `${result.addedCount} members added successfully`,
    { team: result.team }
  );
});

/**
 * @desc    Get team hierarchy
 * @route   GET /api/v1/teams/hierarchy
 * @access  Protected + TEAM_VIEW_ALL
 */
export const getTeamHierarchy = asyncHandler(async (req, res) => {
  const hierarchy = await teamsService.getTeamHierarchy(req.user.organizationId);

  return successResponse(res, 200, "Team hierarchy retrieved", { hierarchy });
});

/**
 * @desc    Get teams for current user
 * @route   GET /api/v1/teams/my
 * @access  Protected
 */
export const getMyTeams = asyncHandler(async (req, res) => {
  const teams = await teamsService.getUserTeams(
    req.user.userId,
    req.user.organizationId
  );

  return successResponse(res, 200, "Your teams retrieved", { teams });
});

export default {
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
};
