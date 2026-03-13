/**
 * Fix Owner Permissions Script
 *
 * This script:
 * 1. Finds all organization owners and ensures isOwner flag is set
 * 2. Ensures the owner has CEO role (level 1) with all permissions
 *
 * Run: node src/seeders/fixOwnerPermissions.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import User from "../modules/users/model.js";
import Organization from "../modules/organizations/model.js";
import Role from "../modules/roles/roles.model.js";
import { CEO_PERMISSIONS } from "../constants/permissions.js";
import logger from "../utils/logger.js";

// Load environment variables
dotenv.config();

// Use Google DNS for SRV record resolution
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

/**
 * Fix owner permissions for all organizations
 */
const fixOwnerPermissions = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/task-tracker";

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    logger.info("✅ Connected to MongoDB");

    // Find all organizations
    const organizations = await Organization.find({ status: "active" });
    logger.info(`Found ${organizations.length} active organization(s)`);

    for (const org of organizations) {
      logger.info(`\n📦 Processing organization: ${org.name}`);

      // Find owner user by ownerEmail or ownerUserId
      let ownerUser = null;

      if (org.ownerUserId) {
        ownerUser = await User.findById(org.ownerUserId);
      }

      if (!ownerUser && org.ownerEmail) {
        ownerUser = await User.findOne({
          email: org.ownerEmail.toLowerCase(),
          organizationId: org._id,
        });
      }

      if (!ownerUser) {
        // Find the first user created in this org (likely the owner)
        ownerUser = await User.findOne({ organizationId: org._id })
          .sort({ createdAt: 1 })
          .limit(1);
      }

      if (!ownerUser) {
        logger.warn(`   ⚠️ No owner found for ${org.name}`);
        continue;
      }

      logger.info(`   Owner: ${ownerUser.firstName} ${ownerUser.lastName} (${ownerUser.email})`);
      logger.info(`   Current isOwner: ${ownerUser.isOwner}`);

      // Fix 1: Set isOwner flag
      if (!ownerUser.isOwner) {
        ownerUser.isOwner = true;
        await ownerUser.save({ validateBeforeSave: false });
        logger.info(`   ✅ Set isOwner = true`);
      }

      // Fix 2: Update organization ownerUserId if not set
      if (!org.ownerUserId) {
        org.ownerUserId = ownerUser._id;
        await org.save();
        logger.info(`   ✅ Set organization ownerUserId`);
      }

      // Fix 3: Ensure CEO role exists with all permissions
      let ceoRole = await Role.findOne({
        organizationId: org._id,
        slug: "ceo",
      });

      if (!ceoRole) {
        // Create CEO role
        ceoRole = await Role.create({
          name: "CEO",
          slug: "ceo",
          description: "Chief Executive Officer - Full access",
          level: 1,
          permissionCodes: CEO_PERMISSIONS,
          organizationId: org._id,
          isSystemRole: true,
          isActive: true,
        });
        logger.info(`   ✅ Created CEO role`);
      } else {
        // Update CEO role permissions
        ceoRole.permissionCodes = CEO_PERMISSIONS;
        ceoRole.level = 1;
        await ceoRole.save();
        logger.info(`   ✅ Updated CEO role permissions (${CEO_PERMISSIONS.length} permissions)`);
      }

      // Fix 4: Assign CEO role to owner if they don't have it
      const currentRole = await Role.findById(ownerUser.roleId);
      logger.info(`   Current role: ${currentRole?.name || "None"} (level: ${currentRole?.level || "N/A"})`);

      if (!currentRole || currentRole.level !== 1) {
        ownerUser.roleId = ceoRole._id;
        await ownerUser.save({ validateBeforeSave: false });
        logger.info(`   ✅ Assigned CEO role to owner`);
      }

      // Fix 5: Also fix "Administrator" role if it exists (add all permissions)
      const adminRole = await Role.findOne({
        organizationId: org._id,
        $or: [
          { slug: "administrator" },
          { slug: "admin" },
          { name: { $regex: /^admin/i } },
        ],
      });

      if (adminRole) {
        adminRole.permissionCodes = CEO_PERMISSIONS;
        adminRole.level = 1; // Give admin same level as CEO
        await adminRole.save();
        logger.info(`   ✅ Updated "${adminRole.name}" role with all permissions`);
      }
    }

    logger.info("\n========================================");
    logger.info("✅ OWNER PERMISSIONS FIX COMPLETED!");
    logger.info("========================================\n");
    logger.info("Please restart your backend server and re-login.");

  } catch (error) {
    logger.error("Fix failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
};

// Run
fixOwnerPermissions();

export default fixOwnerPermissions;
