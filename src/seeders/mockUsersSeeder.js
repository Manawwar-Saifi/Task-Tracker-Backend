/**
 * Mock Users Seeder
 * Creates test users with different roles for development/testing
 *
 * Run: npm run seed:users
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import User from "../modules/users/model.js";
import Organization from "../modules/organizations/model.js";
import Role from "../modules/roles/roles.model.js";
import logger from "../utils/logger.js";

// Load environment variables
dotenv.config();

// Use Google DNS for SRV record resolution
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

/**
 * Mock Users Configuration
 * All users have password: Test@123456
 */
const MOCK_USERS = [
  // Manager
  {
    firstName: "John",
    lastName: "Manager",
    email: "manager@test.com",
    roleSlug: "manager",
    department: "Operations",
    designation: "Operations Manager",
  },
  // Team Leads
  {
    firstName: "Sarah",
    lastName: "Wilson",
    email: "teamlead1@test.com",
    roleSlug: "team-lead",
    department: "Engineering",
    designation: "Engineering Lead",
  },
  {
    firstName: "Mike",
    lastName: "Johnson",
    email: "teamlead2@test.com",
    roleSlug: "team-lead",
    department: "Sales",
    designation: "Sales Lead",
  },
  // Employees
  {
    firstName: "Emily",
    lastName: "Davis",
    email: "employee1@test.com",
    roleSlug: "employee",
    department: "Engineering",
    designation: "Software Developer",
  },
  {
    firstName: "David",
    lastName: "Brown",
    email: "employee2@test.com",
    roleSlug: "employee",
    department: "Engineering",
    designation: "Frontend Developer",
  },
  {
    firstName: "Jessica",
    lastName: "Taylor",
    email: "employee3@test.com",
    roleSlug: "employee",
    department: "Sales",
    designation: "Sales Executive",
  },
  {
    firstName: "Chris",
    lastName: "Anderson",
    email: "employee4@test.com",
    roleSlug: "employee",
    department: "Marketing",
    designation: "Marketing Specialist",
  },
  {
    firstName: "Amanda",
    lastName: "Martinez",
    email: "employee5@test.com",
    roleSlug: "employee",
    department: "HR",
    designation: "HR Coordinator",
  },
];

const DEFAULT_PASSWORD = "Test@123456";

/**
 * Create mock users for an organization
 */
const createMockUsers = async (organizationId) => {
  try {
    // Get all roles for the organization
    const roles = await Role.find({ organizationId });
    const roleMap = new Map(roles.map((r) => [r.slug, r._id]));

    const createdUsers = [];
    const skippedUsers = [];

    for (const userData of MOCK_USERS) {
      // Check if user already exists
      const existingUser = await User.findOne({
        email: userData.email,
        organizationId,
      });

      if (existingUser) {
        skippedUsers.push(userData.email);
        continue;
      }

      // Get role ID
      const roleId = roleMap.get(userData.roleSlug);
      if (!roleId) {
        logger.warn(`Role not found: ${userData.roleSlug}`);
        continue;
      }

      // Create user
      const user = await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: DEFAULT_PASSWORD,
        organizationId,
        roleId,
        department: userData.department,
        designation: userData.designation,
        status: "active",
        dateOfJoining: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ), // Random date within last year
      });

      createdUsers.push({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: userData.roleSlug,
      });
    }

    return { createdUsers, skippedUsers };
  } catch (error) {
    logger.error("Error creating mock users:", error);
    throw error;
  }
};

/**
 * Run the mock users seeder
 */
const runMockUsersSeeder = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/task-tracker";

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    logger.info("✅ Connected to MongoDB");

    // Find all organizations (or specify a particular one)
    const organizations = await Organization.find({ status: "active" });

    if (organizations.length === 0) {
      logger.warn("No active organizations found. Run seed:admin first.");
      return;
    }

    logger.info(`Found ${organizations.length} organization(s)`);

    for (const org of organizations) {
      logger.info(`\n📦 Creating mock users for: ${org.name}`);

      const { createdUsers, skippedUsers } = await createMockUsers(org._id);

      if (createdUsers.length > 0) {
        logger.info(`\n✅ Created ${createdUsers.length} users:`);
        createdUsers.forEach((u) => {
          logger.info(`   - ${u.name} (${u.email}) - ${u.role}`);
        });
      }

      if (skippedUsers.length > 0) {
        logger.info(`\n⏭️  Skipped ${skippedUsers.length} existing users:`);
        skippedUsers.forEach((email) => {
          logger.info(`   - ${email}`);
        });
      }
    }

    logger.info("\n========================================");
    logger.info("✅ MOCK USERS SEEDING COMPLETED!");
    logger.info("========================================\n");

    logger.info("📧 Test User Credentials:");
    logger.info("----------------------------------------");
    logger.info(`Password for all test users: ${DEFAULT_PASSWORD}`);
    logger.info("----------------------------------------");
    logger.info("Manager:     manager@test.com");
    logger.info("Team Lead 1: teamlead1@test.com");
    logger.info("Team Lead 2: teamlead2@test.com");
    logger.info("Employee 1:  employee1@test.com");
    logger.info("Employee 2:  employee2@test.com");
    logger.info("Employee 3:  employee3@test.com");
    logger.info("Employee 4:  employee4@test.com");
    logger.info("Employee 5:  employee5@test.com");
    logger.info("----------------------------------------\n");
  } catch (error) {
    logger.error("Mock users seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
};

// Run if executed directly
runMockUsersSeeder();

export { createMockUsers, runMockUsersSeeder };
export default runMockUsersSeeder;
