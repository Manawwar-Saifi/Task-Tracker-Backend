/**
 * Plan Seeder
 * Seeds Free, Professional, and Enterprise plans into the database.
 * Must be run before any registration or admin seeder.
 *
 * Run: npm run seed:plans
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import Plan from "../modules/billing/plan.model.js";
import logger from "../utils/logger.js";

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const PLANS = [
  {
    name: "Free",
    slug: "free",
    description: "Basic plan for small teams getting started",
    pricing: { monthly: 0, yearly: 0, currency: "INR" },
    limits: { maxUsers: 5, maxTeams: 2, maxStorage: 1 },
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
    description: "Full-featured plan for growing organizations",
    pricing: { monthly: 999, yearly: 9999, currency: "INR" },
    limits: { maxUsers: 50, maxTeams: 20, maxStorage: 50 },
    features: {
      advancedReports: true,
      customRoles: true,
      apiAccess: true,
      prioritySupport: false,
      ssoEnabled: false,
      auditLogs: true,
    },
    displayOrder: 2,
    isActive: true,
    isPopular: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Unlimited plan for large enterprises",
    pricing: { monthly: 4999, yearly: 49999, currency: "INR" },
    limits: { maxUsers: -1, maxTeams: -1, maxStorage: -1 }, // -1 = unlimited
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

/**
 * Seed plans into the database
 */
export const seedPlans = async () => {
  logger.info("Seeding subscription plans...");

  const results = [];

  for (const planData of PLANS) {
    const plan = await Plan.findOneAndUpdate(
      { slug: planData.slug },
      planData,
      { upsert: true, new: true }
    );
    results.push(plan);
    logger.info(`✅ Plan seeded: ${plan.name}`);
  }

  logger.info(`Seeded ${results.length} plans successfully`);
  return results;
};

/**
 * Run seeder standalone
 */
const runPlanSeeder = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/task-tracker";

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    logger.info("✅ Connected to MongoDB");

    await seedPlans();

    logger.info("\n========================================");
    logger.info("✅ PLAN SEEDING COMPLETED!");
    logger.info("========================================\n");
  } catch (error) {
    logger.error("Plan seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
};

runPlanSeeder();

export default runPlanSeeder;
