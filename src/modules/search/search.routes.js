import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import User from "../users/model.js";
import Task from "../tasks/tasks.model.js";
import Team from "../teams/teams.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/v1/search?q=keyword&limit=5
 * Unified search across users, tasks, teams — org-scoped, fast
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, limit = 5 } = req.query;
    const orgId = req.user.organizationId;

    if (!q || q.trim().length < 2) {
      return successResponse(res, 200, "Search results", {
        users: [],
        tasks: [],
        teams: [],
      });
    }

    const search = q.trim();
    const max = Math.min(parseInt(limit) || 5, 10);

    // Run all 3 queries in parallel for speed
    const [users, tasks, teams] = await Promise.all([
      User.find({
        organizationId: orgId,
        isDeleted: false,
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      })
        .select("firstName lastName email status roleId avatar designation department")
        .populate("roleId", "name level")
        .limit(max)
        .lean(),

      Task.find({
        organizationId: orgId,
        isDeleted: false,
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      })
        .select("title status priority dueDate userId")
        .populate("userId", "firstName lastName")
        .limit(max)
        .lean(),

      Team.find({
        organizationId: orgId,
        isDeleted: false,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      })
        .select("name description members")
        .limit(max)
        .lean(),
    ]);

    return successResponse(res, 200, "Search results", {
      users: users.map((u) => ({
        _id: u._id,
        name: `${u.firstName} ${u.lastName || ""}`.trim(),
        email: u.email,
        status: u.status,
        role: u.roleId?.name || "Employee",
        department: u.department,
        designation: u.designation,
      })),
      tasks: tasks.map((t) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignee: t.userId
          ? `${t.userId.firstName} ${t.userId.lastName || ""}`.trim()
          : null,
      })),
      teams: teams.map((t) => ({
        _id: t._id,
        name: t.name,
        description: t.description,
        memberCount: t.members?.length || 0,
      })),
    });
  })
);

export default router;
