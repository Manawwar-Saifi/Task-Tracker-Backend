import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import permissionMiddleware from "../../middlewares/permission.middleware.js";

import {
    createOrganization,
    getMyOrganization,
    updateOrganization,
} from "./controller.js";

const router = express.Router();

/**
 * Create organization (pre-payment)
 * PUBLIC (no auth)
 */
router.post("/", createOrganization);

/**
 * Get current user's organization
 * CEO / Admin
 */
router.get(
    "/me",
    authMiddleware,
    getMyOrganization
);

/**
 * Update organization details
 * Only CEO or permitted admin
 */
router.patch(
    "/",
    authMiddleware,
    permissionMiddleware("ORG_UPDATE"),
    updateOrganization
);

export default router;
