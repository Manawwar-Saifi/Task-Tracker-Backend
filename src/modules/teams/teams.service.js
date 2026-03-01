/**
 * Teams Service
 * Handles all team-related business logic with subscription enforcement
 */
import Team from "./teams.model.js";
import User from "../users/model.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";
import {
  checkTeamLimit,
  incrementTeamCount,
  decrementTeamCount,
} from "../billing/subscription.service.js";

/**
 * Get all teams for organization with pagination
 * @param {string} organizationId - Organization ID
 * @param {Object} options - Query options
 */
export const getTeams = async (organizationId, options = {}) => {
  const { page = 1, limit = 20, search = "", parentTeamId, isActive } = options;

  const query = {
    organizationId,
    isDeleted: false,
  };

  // Apply filters
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (parentTeamId) {
    query.parentTeamId = parentTeamId;
  }

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }

  const skip = (page - 1) * limit;

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate("leaderId", "firstName lastName email designation")
      .populate("members.userId", "firstName lastName email designation")
      .populate("parentTeamId", "name")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Team.countDocuments(query),
  ]);

  return {
    teams: teams.map(formatTeamResponse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single team by ID
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 */
export const getTeam = async (teamId, organizationId) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  })
    .populate("leaderId", "firstName lastName email designation")
    .populate("members.userId", "firstName lastName email designation roleId")
    .populate("parentTeamId", "name")
    .populate("createdBy", "firstName lastName")
    .lean();

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  return formatTeamResponse(team);
};

/**
 * Create a new team
 * @param {string} organizationId - Organization ID
 * @param {string} userId - Creating user ID
 * @param {Object} data - Team data
 */
export const createTeam = async (organizationId, userId, data) => {
  const { name, description, leaderId, parentTeamId, settings } = data;

  // 1. Check subscription team limit
  const limitCheck = await checkTeamLimit(organizationId);
  if (!limitCheck.canAdd) {
    throw new AppError(limitCheck.message, 403);
  }

  // 2. Check for duplicate team name in organization
  const existingTeam = await Team.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
    isDeleted: false,
  });

  if (existingTeam) {
    throw new AppError("A team with this name already exists", 409);
  }

  // 3. Validate parent team if provided
  if (parentTeamId) {
    const parentTeam = await Team.findOne({
      _id: parentTeamId,
      organizationId,
      isDeleted: false,
    });
    if (!parentTeam) {
      throw new AppError("Parent team not found", 404);
    }
  }

  // 4. Validate leader if provided
  if (leaderId) {
    const leader = await User.findOne({
      _id: leaderId,
      organizationId,
      isDeleted: false,
      status: "active",
    });
    if (!leader) {
      throw new AppError("Leader user not found or not active", 404);
    }
  }

  // 5. Create team
  const team = await Team.create({
    name,
    description: description || "",
    organizationId,
    leaderId: leaderId || null,
    parentTeamId: parentTeamId || null,
    settings: settings || {},
    members: leaderId ? [{ userId: leaderId, addedBy: userId, joinedAt: new Date() }] : [],
    createdBy: userId,
    updatedBy: userId,
  });

  // 6. Increment team count in subscription
  await incrementTeamCount(organizationId);

  // 7. Update leader's teamIds if set
  if (leaderId) {
    await User.findByIdAndUpdate(leaderId, {
      $addToSet: { teamIds: team._id },
    });
  }

  logger.info(`Team created: ${team.name} in org: ${organizationId}`);

  // Return populated team
  return getTeam(team._id, organizationId);
};

/**
 * Update team details
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 * @param {string} userId - Updating user ID
 * @param {Object} data - Update data
 */
export const updateTeam = async (teamId, organizationId, userId, data) => {
  const { name, description, settings, isActive } = data;

  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  // Check for duplicate name if changing name
  if (name && name !== team.name) {
    const existingTeam = await Team.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
      isDeleted: false,
      _id: { $ne: teamId },
    });

    if (existingTeam) {
      throw new AppError("A team with this name already exists", 409);
    }
    team.name = name;
    team.slug = null; // Will regenerate on save
  }

  if (description !== undefined) team.description = description;
  if (settings) team.settings = { ...team.settings, ...settings };
  if (typeof isActive === "boolean") team.isActive = isActive;
  team.updatedBy = userId;

  await team.save();

  logger.info(`Team updated: ${team.name}`);

  return getTeam(team._id, organizationId);
};

/**
 * Delete team (soft delete)
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 * @param {string} userId - Deleting user ID
 */
export const deleteTeam = async (teamId, organizationId, userId) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  // Check for sub-teams
  const subTeams = await Team.countDocuments({
    parentTeamId: teamId,
    isDeleted: false,
  });

  if (subTeams > 0) {
    throw new AppError(
      "Cannot delete team with sub-teams. Delete sub-teams first.",
      400
    );
  }

  // Remove team from members' teamIds
  const memberIds = team.getMemberIds();
  if (memberIds.length > 0) {
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { teamIds: teamId } }
    );
  }

  // Soft delete
  team.isDeleted = true;
  team.updatedBy = userId;
  await team.save();

  // Decrement team count in subscription
  await decrementTeamCount(organizationId);

  logger.info(`Team deleted: ${team.name}`);

  return { message: "Team deleted successfully" };
};

/**
 * Add member to team
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 * @param {string} userId - Adding user ID
 * @param {string} memberUserId - User to add
 */
export const addMember = async (teamId, organizationId, userId, memberUserId) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  // Validate user exists and is in same organization
  const user = await User.findOne({
    _id: memberUserId,
    organizationId,
    isDeleted: false,
    status: "active",
  });

  if (!user) {
    throw new AppError("User not found or not active", 404);
  }

  // Check if already a member
  if (team.isMember(memberUserId)) {
    throw new AppError("User is already a member of this team", 400);
  }

  // Add member
  team.addMember(memberUserId, userId);
  team.updatedBy = userId;
  await team.save();

  // Update user's teamIds
  await User.findByIdAndUpdate(memberUserId, {
    $addToSet: { teamIds: teamId },
  });

  logger.info(`Member ${memberUserId} added to team ${team.name}`);

  return getTeam(team._id, organizationId);
};

/**
 * Remove member from team
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 * @param {string} userId - Removing user ID
 * @param {string} memberUserId - User to remove
 */
export const removeMember = async (teamId, organizationId, userId, memberUserId) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  // Check if user is the leader
  if (team.isLeader(memberUserId)) {
    throw new AppError(
      "Cannot remove team leader. Assign a new leader first.",
      400
    );
  }

  // Check if user is a member
  if (!team.isMember(memberUserId)) {
    throw new AppError("User is not a member of this team", 400);
  }

  // Remove member
  team.removeMember(memberUserId);
  team.updatedBy = userId;
  await team.save();

  // Update user's teamIds
  await User.findByIdAndUpdate(memberUserId, {
    $pull: { teamIds: teamId },
  });

  logger.info(`Member ${memberUserId} removed from team ${team.name}`);

  return getTeam(team._id, organizationId);
};

/**
 * Set team leader
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 * @param {string} userId - Setting user ID
 * @param {string} leaderId - New leader user ID
 */
export const setLeader = async (teamId, organizationId, userId, leaderId) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  // Validate leader exists
  const leader = await User.findOne({
    _id: leaderId,
    organizationId,
    isDeleted: false,
    status: "active",
  });

  if (!leader) {
    throw new AppError("Leader user not found or not active", 404);
  }

  // Add as member if not already
  if (!team.isMember(leaderId)) {
    team.addMember(leaderId, userId);
    await User.findByIdAndUpdate(leaderId, {
      $addToSet: { teamIds: teamId },
    });
  }

  // Set leader
  team.leaderId = leaderId;
  team.updatedBy = userId;
  await team.save();

  logger.info(`Leader set for team ${team.name}: ${leaderId}`);

  return getTeam(team._id, organizationId);
};

/**
 * Get team members
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 */
export const getTeamMembers = async (teamId, organizationId) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  })
    .populate({
      path: "members.userId",
      select: "firstName lastName email designation roleId status",
      populate: {
        path: "roleId",
        select: "name slug level",
      },
    })
    .lean();

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  const members = team.members.map((m) => ({
    ...m.userId,
    odId: m.userId._id,
    joinedAt: m.joinedAt,
    isLeader: team.leaderId?.toString() === m.userId._id?.toString(),
  }));

  return members;
};

/**
 * Bulk add members to team
 * @param {string} teamId - Team ID
 * @param {string} organizationId - Organization ID
 * @param {string} userId - Adding user ID
 * @param {Array} userIds - User IDs to add
 */
export const bulkAddMembers = async (teamId, organizationId, userId, userIds) => {
  const team = await Team.findOne({
    _id: teamId,
    organizationId,
    isDeleted: false,
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  // Validate all users exist in organization
  const users = await User.find({
    _id: { $in: userIds },
    organizationId,
    isDeleted: false,
    status: "active",
  });

  if (users.length !== userIds.length) {
    throw new AppError("One or more users not found or not active", 404);
  }

  // Add members that aren't already in the team
  const addedMembers = [];
  for (const user of users) {
    if (!team.isMember(user._id)) {
      team.addMember(user._id, userId);
      addedMembers.push(user._id);
    }
  }

  if (addedMembers.length > 0) {
    team.updatedBy = userId;
    await team.save();

    // Update users' teamIds
    await User.updateMany(
      { _id: { $in: addedMembers } },
      { $addToSet: { teamIds: teamId } }
    );
  }

  logger.info(`${addedMembers.length} members added to team ${team.name}`);

  return {
    team: await getTeam(team._id, organizationId),
    addedCount: addedMembers.length,
  };
};

/**
 * Get team hierarchy (tree structure)
 * @param {string} organizationId - Organization ID
 */
export const getTeamHierarchy = async (organizationId) => {
  const teams = await Team.find({
    organizationId,
    isDeleted: false,
    isActive: true,
  })
    .populate("leaderId", "firstName lastName")
    .select("name slug leaderId parentTeamId memberCount")
    .sort({ name: 1 })
    .lean();

  // Build hierarchy tree
  const buildTree = (parentId = null) => {
    return teams
      .filter((t) =>
        parentId
          ? t.parentTeamId?.toString() === parentId.toString()
          : !t.parentTeamId
      )
      .map((team) => ({
        ...team,
        id: team._id,
        children: buildTree(team._id),
      }));
  };

  return buildTree();
};

/**
 * Get teams for a specific user
 * @param {string} targetUserId - User ID
 * @param {string} organizationId - Organization ID
 */
export const getUserTeams = async (targetUserId, organizationId) => {
  const teams = await Team.find({
    organizationId,
    "members.userId": targetUserId,
    isDeleted: false,
  })
    .populate("leaderId", "firstName lastName")
    .lean();

  return teams.map(formatTeamResponse);
};

/**
 * Format team response
 */
const formatTeamResponse = (team) => {
  return {
    id: team._id,
    name: team.name,
    slug: team.slug,
    description: team.description,
    leader: team.leaderId
      ? {
          id: team.leaderId._id || team.leaderId,
          firstName: team.leaderId.firstName,
          lastName: team.leaderId.lastName,
          email: team.leaderId.email,
          designation: team.leaderId.designation,
        }
      : null,
    members:
      team.members?.map((m) => ({
        userId: m.userId?._id || m.userId,
        firstName: m.userId?.firstName,
        lastName: m.userId?.lastName,
        email: m.userId?.email,
        designation: m.userId?.designation,
        joinedAt: m.joinedAt,
      })) || [],
    memberCount: team.memberCount || team.members?.length || 0,
    parentTeam: team.parentTeamId
      ? {
          id: team.parentTeamId._id || team.parentTeamId,
          name: team.parentTeamId.name,
        }
      : null,
    settings: team.settings,
    isActive: team.isActive,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
};

/**
 * Escape special regex characters
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

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
  getUserTeams,
};
