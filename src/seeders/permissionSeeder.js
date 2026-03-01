import Permission from "../modules/permissions/permissions.model.js";
import Role from "../modules/roles/roles.model.js";
import {
  PERMISSIONS_BY_MODULE,
  CEO_PERMISSIONS,
  MANAGER_PERMISSIONS,
  TEAM_LEAD_PERMISSIONS,
  EMPLOYEE_PERMISSIONS,
} from "../constants/permissions.js";
import logger from "../utils/logger.js";

/**
 * Seed system permissions
 * These are global permissions available to all organizations
 */
export const seedSystemPermissions = async () => {
  try {
    logger.info("Starting system permissions seeding...");

    const permissions = [];

    // Flatten all permissions from all modules
    for (const [module, modulePermissions] of Object.entries(PERMISSIONS_BY_MODULE)) {
      for (const perm of modulePermissions) {
        // Extract action from code (e.g., USER_CREATE -> CREATE)
        const action = perm.code.split("_").slice(1).join("_");

        permissions.push({
          code: perm.code,
          name: perm.name,
          description: perm.description,
          module: module,
          action: action || "MANAGE",
          organizationId: null, // System permission
          isSystem: true,
          isActive: true,
          category: getCategoryForModule(module),
          sortOrder: permissions.length,
        });
      }
    }

    // Upsert permissions (update if exists, insert if not)
    for (const perm of permissions) {
      await Permission.findOneAndUpdate(
        { code: perm.code, organizationId: null },
        perm,
        { upsert: true, new: true }
      );
    }

    logger.info(`Seeded ${permissions.length} system permissions successfully`);
    return permissions.length;
  } catch (error) {
    logger.error("Error seeding system permissions:", error);
    throw error;
  }
};

/**
 * Seed default roles for an organization
 * Called when a new organization is created
 */
export const seedOrganizationRoles = async (organizationId, createdBy = null) => {
  try {
    logger.info(`Seeding default roles for organization: ${organizationId}`);

    // Get all system permissions
    const systemPermissions = await Permission.find({
      isSystem: true,
      isActive: true,
    });

    const permissionMap = new Map(
      systemPermissions.map((p) => [p.code, p._id])
    );

    const defaultRoles = [
      {
        name: "CEO",
        slug: "ceo",
        description: "Chief Executive Officer - Full access to all features",
        level: 1,
        permissionCodes: CEO_PERMISSIONS,
        isSystemRole: true,
        isDefault: false,
      },
      {
        name: "Manager",
        slug: "manager",
        description: "Manager - Can manage teams and approve requests",
        level: 2,
        permissionCodes: MANAGER_PERMISSIONS,
        isSystemRole: true,
        isDefault: false,
      },
      {
        name: "Team Lead",
        slug: "team-lead",
        description: "Team Lead - Can manage team tasks and members",
        level: 3,
        permissionCodes: TEAM_LEAD_PERMISSIONS,
        isSystemRole: true,
        isDefault: false,
      },
      {
        name: "Employee",
        slug: "employee",
        description: "Employee - Basic access for daily tasks",
        level: 4,
        permissionCodes: EMPLOYEE_PERMISSIONS,
        isSystemRole: true,
        isDefault: true, // Default role for new users
      },
    ];

    const createdRoles = [];

    for (const roleData of defaultRoles) {
      // Get permission IDs for this role
      const permissionIds = roleData.permissionCodes
        .map((code) => permissionMap.get(code))
        .filter(Boolean);

      const role = await Role.findOneAndUpdate(
        { slug: roleData.slug, organizationId },
        {
          ...roleData,
          organizationId,
          permissions: permissionIds,
          createdBy,
          isActive: true,
          isDeleted: false,
        },
        { upsert: true, new: true }
      );

      createdRoles.push(role);
    }

    logger.info(
      `Seeded ${createdRoles.length} default roles for organization: ${organizationId}`
    );

    return createdRoles;
  } catch (error) {
    logger.error("Error seeding organization roles:", error);
    throw error;
  }
};

/**
 * Get category for module (for UI grouping)
 */
function getCategoryForModule(module) {
  const coreModules = ["USER", "TEAM", "TASK", "ATTENDANCE"];
  const advancedModules = ["LEAVE", "HOLIDAY", "OVERTIME", "REPORT"];
  const adminModules = [
    "ROLE",
    "PERMISSION",
    "ORGANIZATION",
    "SUBSCRIPTION",
    "HR",
    "SETTINGS",
    "AUDIT",
  ];

  if (coreModules.includes(module)) return "core";
  if (advancedModules.includes(module)) return "advanced";
  if (adminModules.includes(module)) return "admin";
  return "general";
}

/**
 * Run full seeding (for initial setup)
 */
export const runFullSeed = async () => {
  try {
    await seedSystemPermissions();
    logger.info("Full permission seeding completed");
  } catch (error) {
    logger.error("Full seeding failed:", error);
    throw error;
  }
};

export default {
  seedSystemPermissions,
  seedOrganizationRoles,
  runFullSeed,
};
