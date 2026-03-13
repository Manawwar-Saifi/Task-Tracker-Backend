/**
 * Roles Routes
 */

import express from "express";
import * as rolesController from "./roles.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all roles
router.get("/", rolesController.getRoles);

// Get single role
router.get("/:id", rolesController.getRole);

// Create role
router.post("/", rolesController.createRole);

// Update role
router.put("/:id", rolesController.updateRole);

// Delete role
router.delete("/:id", rolesController.deleteRole);

export default router;
