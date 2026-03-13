import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../modules/users/model.js";
import Organization from "../modules/organizations/model.js";
import logger from "../utils/logger.js";

dotenv.config();

const ADMIN_EMAILS = ["mannutemp666@gmail.com", "gagapow525@hutudns.com"];

const resetAdmins = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    logger.info("✅ Connected to MongoDB");

    // Delete existing admin users
    logger.info("Deleting existing admin users...");
    const deleteResult = await User.deleteMany({ email: { $in: ADMIN_EMAILS } });
    logger.info(`Deleted ${deleteResult.deletedCount} users`);

    // Delete their organizations
    logger.info("Deleting admin organizations...");
    const orgResult = await Organization.deleteMany({ ownerEmail: { $in: ADMIN_EMAILS } });
    logger.info(`Deleted ${orgResult.deletedCount} organizations`);

    logger.info("✅ Reset complete! Now run: npm run seed:admin");

  } catch (error) {
    logger.error("Reset failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

resetAdmins();
