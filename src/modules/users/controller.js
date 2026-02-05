import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as userService from "./service.js";

/**
 * @desc    Get current logged-in user (from token)
 * @route   GET /api/v1/users/me
 * @access  Protected
 */
export const getMe = asyncHandler(async (req, res) => {
    // authMiddleware should attach user to req
    if (!req.user) {
        throw new AppError("User not authenticated", 401);
    }

    return successResponse(
        res,
        200,
        "Current user fetched successfully",
        req.user
    );
});

/**
 * @desc    Get all users of current organization
 * @route   GET /api/v1/users
 * @access  Protected + USER_VIEW
 */
export const getUsers = asyncHandler(async (req, res) => {
    const users = await userService.getUsersByOrganization(
        req.organizationId
    );

    return successResponse(
        res,
        200,
        "Users fetched successfully",
        users
    );
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/v1/users/:userId
 * @access  Protected + USER_VIEW
 */
export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await userService.getUserById(
        userId,
        req.organizationId
    );

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return successResponse(
        res,
        200,
        "User fetched successfully",
        user
    );
});

/**
 * @desc    Create a new user
 * @route   POST /api/v1/users
 * @access  Protected + USER_CREATE
 */
export const createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(
        req.body,
        req.organizationId
    );

    return successResponse(
        res,
        201,
        "User created successfully",
        user
    );
});

/**
 * @desc    Update user details
 * @route   PATCH /api/v1/users/:userId
 * @access  Protected + USER_UPDATE
 */
export const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const updatedUser = await userService.updateUser(
        userId,
        req.organizationId,
        req.body
    );

    if (!updatedUser) {
        throw new AppError("User not found", 404);
    }

    return successResponse(
        res,
        200,
        "User updated successfully",
        updatedUser
    );
});

/**
 * @desc    Activate / Deactivate user
 * @route   PATCH /api/v1/users/:userId/status
 * @access  Protected + USER_STATUS_UPDATE
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
        throw new AppError("Invalid status value", 400);
    }

    const user = await userService.updateUserStatus(
        userId,
        req.organizationId,
        status
    );

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return successResponse(
        res,
        200,
        `User ${status} successfully`,
        user
    );
});
