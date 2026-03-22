import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import User from "../modules/users/model.js";
import Organization from "../modules/organizations/model.js";
import Role from "../modules/roles/roles.model.js";
import { seedSystemPermissions, seedOrganizationRoles } from "./permissionSeeder.js";
import { seedPlans } from "./planSeeder.js";
import { createTrialSubscription } from "../modules/billing/subscription.service.js";
import logger from "../utils/logger.js";

// Load environment variables
dotenv.config();

// Use Google DNS for SRV record resolution (fixes router DNS issues)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/**
 * Admin Seed Configuration
 */
const ADMIN_CONFIG = {
  // Super Admin (Platform Admin - Your account)
  superAdmin: {
    firstName: "Super",
    lastName: "Admin",
    email: "mannutemp666@gmail.com",
    password: "Admin@123456",
    isSuperAdmin: true,
    status: "active",
  },

  // Company CEO (Organization Owner)
  companyCEO: {
    firstName: "Company",
    lastName: "CEO",
    email: "gagapow525@hutudns.com",
    password: "Ceo@123456",
    isOwner: true,
    status: "active",
    organization: {
      name: "WorkTrack Demo Organization",
    },
  },
};

/**
 * Create Super Admin (Platform-level admin)
 * This user has access across all organizations
 */
const createSuperAdmin = async () => {
  try {
    const { superAdmin } = ADMIN_CONFIG;

    // Check if super admin already exists
    let existingUser = await User.findOne({ email: superAdmin.email });

    if (existingUser) {
      logger.info(`Super Admin already exists: ${superAdmin.email}`);

      // Update to ensure super admin flag is set
      if (!existingUser.isSuperAdmin) {
        existingUser.isSuperAdmin = true;
        existingUser.status = "active";
        await existingUser.save();
        logger.info(`Updated existing user to Super Admin`);
      }

      return existingUser;
    }

    // Create a system organization for super admin
    let systemOrg = await Organization.findOne({ name: "System Administration" });

    if (!systemOrg) {
      systemOrg = await Organization.create({
        name: "System Administration",
        ownerEmail: superAdmin.email,
        status: "active",
      });
      logger.info(`Created System Administration organization`);

      // Seed roles for system org
      await seedOrganizationRoles(systemOrg._id);
    }

    // Get CEO role for system org
    const ceoRole = await Role.findOne({
      organizationId: systemOrg._id,
      slug: "ceo",
    });

    // Create super admin user
    const user = await User.create({
      ...superAdmin,
      organizationId: systemOrg._id,
      roleId: ceoRole?._id,
      isSuperAdmin: true,
      isOwner: true,
      dateOfJoining: new Date(),
    });

    // Update organization with owner
    systemOrg.ownerUserId = user._id;
    await systemOrg.save();

    logger.info(`✅ Super Admin created successfully!`);
    logger.info(`   Email: ${superAdmin.email}`);
    logger.info(`   Password: ${superAdmin.password}`);

    return user;
  } catch (error) {
    logger.error("Error creating Super Admin:", error);
    throw error;
  }
};

/**
 * Create Company CEO (Organization Owner)
 * This is a demo organization with a CEO
 */
const createCompanyCEO = async () => {
  try {
    const { companyCEO } = ADMIN_CONFIG;

    // Check if CEO already exists
    let existingUser = await User.findOne({ email: companyCEO.email });

    if (existingUser) {
      logger.info(`Company CEO already exists: ${companyCEO.email}`);

      // Ensure isOwner is set
      if (!existingUser.isOwner) {
        existingUser.isOwner = true;
        existingUser.status = "active";
        await existingUser.save();
        logger.info(`Updated existing user to Owner`);
      }

      return existingUser;
    }

    // Create organization
    let organization = await Organization.findOne({
      name: companyCEO.organization.name,
    });

    if (!organization) {
      organization = await Organization.create({
        name: companyCEO.organization.name,
        ownerEmail: companyCEO.email,
        status: "active",
      });
      logger.info(`Created organization: ${companyCEO.organization.name}`);

      // Seed roles for this organization
      await seedOrganizationRoles(organization._id);
    }

    // Get CEO role for organization
    const ceoRole = await Role.findOne({
      organizationId: organization._id,
      slug: "ceo",
    });

    // Create CEO user
    const user = await User.create({
      firstName: companyCEO.firstName,
      lastName: companyCEO.lastName,
      email: companyCEO.email,
      password: companyCEO.password,
      organizationId: organization._id,
      roleId: ceoRole?._id,
      isOwner: true,
      status: "active",
      designation: "Chief Executive Officer",
      department: "Executive",
      dateOfJoining: new Date(),
    });

    // Update organization with owner
    organization.ownerUserId = user._id;
    await organization.save();

    // Create trial subscription for the demo org
    try {
      await createTrialSubscription(organization._id);
      logger.info(`Trial subscription created for: ${companyCEO.organization.name}`);
    } catch (subError) {
      logger.warn(`Could not create trial subscription: ${subError.message}`);
    }

    logger.info(`✅ Company CEO created successfully!`);
    logger.info(`   Organization: ${companyCEO.organization.name}`);
    logger.info(`   Email: ${companyCEO.email}`);
    logger.info(`   Password: ${companyCEO.password}`);

    return user;
  } catch (error) {
    logger.error("Error creating Company CEO:", error);
    throw error;
  }
};

/**
 * Run the admin seeder
 */
const runAdminSeeder = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/task-tracker";

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    logger.info("✅ Connected to MongoDB");

    // First, seed system permissions
    logger.info("\n📋 Seeding system permissions...");
    await seedSystemPermissions();

    // Create Super Admin
    logger.info("\n👤 Creating Super Admin...");
    await createSuperAdmin();

    // Seed plans (required for subscription creation)
    logger.info("\n💳 Seeding subscription plans...");
    await seedPlans();

    // Create Company CEO
    logger.info("\n👔 Creating Company CEO...");
    await createCompanyCEO();

    logger.info("\n========================================");
    logger.info("✅ ADMIN SEEDING COMPLETED SUCCESSFULLY!");
    logger.info("========================================\n");

    logger.info("📧 Login Credentials:");
    logger.info("----------------------------------------");
    logger.info("SUPER ADMIN (Platform Admin):");
    logger.info(`   Email:    ${ADMIN_CONFIG.superAdmin.email}`);
    logger.info(`   Password: ${ADMIN_CONFIG.superAdmin.password}`);
    logger.info("----------------------------------------");
    logger.info("COMPANY CEO (Organization Owner):");
    logger.info(`   Email:    ${ADMIN_CONFIG.companyCEO.email}`);
    logger.info(`   Password: ${ADMIN_CONFIG.companyCEO.password}`);
    logger.info(`   Org:      ${ADMIN_CONFIG.companyCEO.organization.name}`);
    logger.info("----------------------------------------\n");

  } catch (error) {
    logger.error("Admin seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
};

// Run if executed directly
runAdminSeeder();

export { createSuperAdmin, createCompanyCEO, runAdminSeeder };
export default runAdminSeeder;
