import bcrypt from "bcryptjs";
import AppError from "../../utils/AppError.js";
import User from "./model.js";

/**
 * ===============================
 * USER SERVICE
 * ===============================
 * - Contains ALL business logic
 * - No HTTP, no res, no req
 * - Always org-scoped
 */

/**
 * Get all users of an organization
 */
export const getUsersByOrganization = async (organizationId) => {
    if (!organizationId) {
        throw new AppError("Organization context missing", 400);
    }

    const users = await User.find({
        organizationId,
        isDeleted: false,
    }).select("-password");

    return users;
};

/**
 * Get single user by ID (org scoped)
 */
export const getUserById = async (userId, organizationId) => {
    if (!userId || !organizationId) {
        throw new AppError("Invalid request parameters", 400);
    }

    const user = await User.findOne({
        _id: userId,
        organizationId,
        isDeleted: false,
    }).select("-password");

    return user;
};

/**
 * Create a new user
 * NOTE:
 * - This is NOT login/signup
 * - This is internal user creation (admin / CEO)
 */
export const createUser = async (userData, organizationId) => {
    const { email, password, name } = userData;

    if (!email || !password || !name) {
        throw new AppError("Name, email and password are required", 400);
    }

    // Check if user already exists in same org
    const existingUser = await User.findOne({
        email,
        organizationId,
        isDeleted: false,
    });

    if (existingUser) {
        throw new AppError("User already exists with this email", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        organizationId,
        status: "active",
    });

    // Never return password
    user.password = undefined;

    return user;
};

/**
 * Update user details
 * (profile update, admin edit)
 */
export const updateUser = async (
    userId,
    organizationId,
    updateData
) => {
    if (!userId || !organizationId) {
        throw new AppError("Invalid request parameters", 400);
    }

    // Prevent password update here
    if (updateData.password) {
        throw new AppError(
            "Password cannot be updated from this route",
            400
        );
    }

    const user = await User.findOneAndUpdate(
        {
            _id: userId,
            organizationId,
            isDeleted: false,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    ).select("-password");

    return user;
};

/**
 * Activate / Deactivate user
 * Soft status control (NOT delete)
 */
export const updateUserStatus = async (
    userId,
    organizationId,
    status
) => {
    if (!userId || !organizationId) {
        throw new AppError("Invalid request parameters", 400);
    }

    if (!["active", "inactive"].includes(status)) {
        throw new AppError("Invalid user status", 400);
    }

    const user = await User.findOneAndUpdate(
        {
            _id: userId,
            organizationId,
            isDeleted: false,
        },
        { status },
        { new: true }
    ).select("-password");

    return user;
};
