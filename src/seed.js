/**
 * Master Seeder
 * Seeds database with initial data
 *
 * Run: node src/seed.js
 * Seeds: Subscription Plans, System Permissions
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import Plan from "./modules/billing/plan.model.js";
import { seedSystemPermissions } from "./seeders/permissionSeeder.js";
import { PLAN_LIMITS } from "./config/constants.js";

dotenv.config();

// ============================================
// DEFAULT SUBSCRIPTION PLANS
// ============================================
const defaultPlans = [
  {
    name: "Free",
    slug: "free",
    description: "Basic features for small teams",
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: "INR",
    },
    limits: {
      maxUsers: PLAN_LIMITS.FREE.maxUsers,
      maxTeams: PLAN_LIMITS.FREE.maxTeams,
      maxStorage: 1,
    },
    features: {
      advancedReports: false,
      customRoles: false,
      apiAccess: false,
      prioritySupport: false,
      ssoEnabled: false,
      auditLogs: false,
    },
    displayOrder: 0,
    isActive: true,
    isPopular: false,
  },
  {
    name: "Starter",
    slug: "starter",
    description: "Perfect for small teams getting started",
    pricing: {
      monthly: PLAN_LIMITS.STARTER.price,
      yearly: PLAN_LIMITS.STARTER.price * 10, // 2 months free
      currency: "INR",
    },
    limits: {
      maxUsers: PLAN_LIMITS.STARTER.maxUsers,
      maxTeams: PLAN_LIMITS.STARTER.maxTeams,
      maxStorage: 5,
    },
    features: {
      advancedReports: false,
      customRoles: false,
      apiAccess: false,
      prioritySupport: false,
      ssoEnabled: false,
      auditLogs: false,
    },
    displayOrder: 1,
    isActive: true,
    isPopular: false,
  },
  {
    name: "Professional",
    slug: "professional",
    description: "Best for growing teams",
    pricing: {
      monthly: PLAN_LIMITS.PROFESSIONAL.price,
      yearly: PLAN_LIMITS.PROFESSIONAL.price * 10,
      currency: "INR",
    },
    limits: {
      maxUsers: PLAN_LIMITS.PROFESSIONAL.maxUsers,
      maxTeams: PLAN_LIMITS.PROFESSIONAL.maxTeams,
      maxStorage: 25,
    },
    features: {
      advancedReports: true,
      customRoles: true,
      apiAccess: false,
      prioritySupport: true,
      ssoEnabled: false,
      auditLogs: true,
    },
    displayOrder: 2,
    isActive: true,
    isPopular: true, // Highlighted as "Popular"
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "For large organizations with advanced needs",
    pricing: {
      monthly: PLAN_LIMITS.ENTERPRISE.price,
      yearly: PLAN_LIMITS.ENTERPRISE.price * 10,
      currency: "INR",
    },
    limits: {
      maxUsers: PLAN_LIMITS.ENTERPRISE.maxUsers, // -1 = unlimited
      maxTeams: PLAN_LIMITS.ENTERPRISE.maxTeams,
      maxStorage: 100,
    },
    features: {
      advancedReports: true,
      customRoles: true,
      apiAccess: true,
      prioritySupport: true,
      ssoEnabled: true,
      auditLogs: true,
    },
    displayOrder: 3,
    isActive: true,
    isPopular: false,
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

/**
 * Seed subscription plans
 */
const seedPlans = async () => {
  try {
    // Check if plans already exist
    const existingCount = await Plan.countDocuments();
    if (existingCount > 0) {
      logger.info(`Plans already exist (${existingCount}). Skipping...`);
      return;
    }

    // Insert plans
    await Plan.insertMany(defaultPlans);
    logger.info(`Seeded ${defaultPlans.length} subscription plans`);
  } catch (error) {
    logger.error("Error seeding plans:", error);
    throw error;
  }
};

/**
 * Main seeder function
 */
const runSeed = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB for seeding");

    // Run seeders
    logger.info("Starting database seeding...");

    // 1. Seed system permissions
    await seedSystemPermissions();

    // 2. Seed subscription plans
    await seedPlans();

    logger.info("All seeds completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
};

// Run if called directly (node src/seed.js)
runSeed();
