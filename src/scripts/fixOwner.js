/**
 * Fix Owner Script
 * Sets isOwner: true for CEO users in each organization
 *
 * Run: node src/scripts/fixOwner.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import User from "../modules/users/model.js";
import Organization from "../modules/organizations/model.js";
import logger from "../utils/logger.js";

// Load environment variables
dotenv.config();

// Use Google DNS for SRV record resolution
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const fixOwners = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    logger.info("✅ Connected to MongoDB");

    // Get all organizations
    const organizations = await Organization.find({});
    logger.info(`Found ${organizations.length} organizations`);

    for (const org of organizations) {
      // Find user with ownerEmail
      if (org.ownerEmail) {
        const ownerUser = await User.findOne({
          email: org.ownerEmail.toLowerCase(),
          organizationId: org._id
        });

        if (ownerUser && !ownerUser.isOwner) {
          ownerUser.isOwner = true;
          ownerUser.status = "active";
          await ownerUser.save();
          logger.info(`✅ Set isOwner=true for: ${ownerUser.email} (${org.name})`);
        } else if (ownerUser && ownerUser.isOwner) {
          logger.info(`Already owner: ${ownerUser.email} (${org.name})`);
        }
      }

      // Also check ownerUserId
      if (org.ownerUserId) {
        const ownerUser = await User.findById(org.ownerUserId);
        if (ownerUser && !ownerUser.isOwner) {
          ownerUser.isOwner = true;
          ownerUser.status = "active";
          await ownerUser.save();
          logger.info(`✅ Set isOwner=true for: ${ownerUser.email} (${org.name})`);
        }
      }
    }

    // Also fix any user with CEO role who isn't marked as owner
    const ceoUsers = await User.find({}).populate('roleId');
    for (const user of ceoUsers) {
      if (user.roleId?.slug === 'ceo' && !user.isOwner) {
        user.isOwner = true;
        await user.save();
        logger.info(`✅ Set isOwner=true for CEO role user: ${user.email}`);
      }
    }

    logger.info("\n========================================");
    logger.info("✅ OWNER FIX COMPLETED!");
    logger.info("========================================\n");

  } catch (error) {
    logger.error("Fix failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
};

fixOwners();
