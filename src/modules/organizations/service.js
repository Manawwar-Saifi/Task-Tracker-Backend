import Organization from "./model.js";
import AppError from "../../utils/AppError.js";

/**
 * Create organization (pre-payment)
 */
export const createOrganization = async (data) => {
  const { name, ownerEmail } = data;

  if (!name || !ownerEmail) {
    throw new AppError("Organization name and email required", 400);
  }

  const existingOrg = await Organization.findOne({
    name,
    ownerEmail,
    isDeleted: false,
  });

  if (existingOrg) {
    throw new AppError("Organization already exists", 409);
  }

  const org = await Organization.create({
    name,
    ownerEmail,
    status: "pending",
  });

  return org;
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (orgId) => {
  return Organization.findOne({
    _id: orgId,
    isDeleted: false,
  });
};

/**
 * Update organization details
 */
export const updateOrganization = async (orgId, updateData) => {
  const org = await Organization.findOneAndUpdate(
    { _id: orgId, isDeleted: false },
    updateData,
    { new: true, runValidators: true }
  );

  if (!org) {
    throw new AppError("Organization not found", 404);
  }

  return org;
};
