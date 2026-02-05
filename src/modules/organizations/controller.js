import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import * as orgService from "./service.js";

/**
 * Create organization (before payment)
 */
export const createOrganization = asyncHandler(
    async (req, res) => {
        const org = await orgService.createOrganization(req.body);

        return successResponse(
            res,
            201,
            "Organization created successfully",
            org
        );
    }
);

/**
 * Get current user's organization
 */
export const getMyOrganization = asyncHandler(
    async (req, res) => {
        const org = await orgService.getOrganizationById(
            req.organizationId
        );

        if (!org) {
            throw new AppError("Organization not found", 404);
        }

        return successResponse(
            res,
            200,
            "Organization fetched successfully",
            org
        );
    }
);

/**
 * Update organization details
 */
export const updateOrganization = asyncHandler(
    async (req, res) => {
        const org = await orgService.updateOrganization(
            req.organizationId,
            req.body
        );

        return successResponse(
            res,
            200,
            "Organization updated successfully",
            org
        );
    }
);
