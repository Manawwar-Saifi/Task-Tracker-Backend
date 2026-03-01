/**
 * Permission Constants
 * Format: MODULE_ACTION
 *
 * This is the core of the Dynamic Permission System (USP)
 * All permissions are granular and can be assigned to any role
 */

// ==================== USER MODULE ====================
export const USER_CREATE = "USER_CREATE";
export const USER_READ = "USER_READ";
export const USER_UPDATE = "USER_UPDATE";
export const USER_DELETE = "USER_DELETE";
export const USER_INVITE = "USER_INVITE";
export const USER_VIEW_OWN = "USER_VIEW_OWN";
export const USER_VIEW_TEAM = "USER_VIEW_TEAM";
export const USER_VIEW_ALL = "USER_VIEW_ALL";
export const USER_ASSIGN_ROLE = "USER_ASSIGN_ROLE";
export const USER_MANAGE = "USER_MANAGE";

// ==================== TEAM MODULE ====================
export const TEAM_CREATE = "TEAM_CREATE";
export const TEAM_READ = "TEAM_READ";
export const TEAM_UPDATE = "TEAM_UPDATE";
export const TEAM_DELETE = "TEAM_DELETE";
export const TEAM_ADD_MEMBER = "TEAM_ADD_MEMBER";
export const TEAM_REMOVE_MEMBER = "TEAM_REMOVE_MEMBER";
export const TEAM_ASSIGN_LEAD = "TEAM_ASSIGN_LEAD";
export const TEAM_VIEW_OWN = "TEAM_VIEW_OWN";
export const TEAM_VIEW_ALL = "TEAM_VIEW_ALL";
export const TEAM_MANAGE = "TEAM_MANAGE";

// ==================== TASK MODULE ====================
export const TASK_CREATE = "TASK_CREATE";
export const TASK_READ = "TASK_READ";
export const TASK_UPDATE = "TASK_UPDATE";
export const TASK_DELETE = "TASK_DELETE";
export const TASK_ASSIGN = "TASK_ASSIGN";
export const TASK_VIEW_OWN = "TASK_VIEW_OWN";
export const TASK_VIEW_TEAM = "TASK_VIEW_TEAM";
export const TASK_VIEW_ALL = "TASK_VIEW_ALL";
export const TASK_APPROVE = "TASK_APPROVE";
export const TASK_MANAGE = "TASK_MANAGE";

// ==================== ATTENDANCE MODULE ====================
export const ATTENDANCE_CREATE = "ATTENDANCE_CREATE";
export const ATTENDANCE_READ = "ATTENDANCE_READ";
export const ATTENDANCE_UPDATE = "ATTENDANCE_UPDATE";
export const ATTENDANCE_DELETE = "ATTENDANCE_DELETE";
export const ATTENDANCE_CLOCK_IN = "ATTENDANCE_CLOCK_IN";
export const ATTENDANCE_CLOCK_OUT = "ATTENDANCE_CLOCK_OUT";
export const ATTENDANCE_VIEW_OWN = "ATTENDANCE_VIEW_OWN";
export const ATTENDANCE_VIEW_TEAM = "ATTENDANCE_VIEW_TEAM";
export const ATTENDANCE_VIEW_ALL = "ATTENDANCE_VIEW_ALL";
export const ATTENDANCE_SET_TIMER = "ATTENDANCE_SET_TIMER";
export const ATTENDANCE_MANAGE = "ATTENDANCE_MANAGE";

// ==================== LEAVE MODULE ====================
export const LEAVE_CREATE = "LEAVE_CREATE";
export const LEAVE_READ = "LEAVE_READ";
export const LEAVE_UPDATE = "LEAVE_UPDATE";
export const LEAVE_DELETE = "LEAVE_DELETE";
export const LEAVE_REQUEST = "LEAVE_REQUEST";
export const LEAVE_APPROVE = "LEAVE_APPROVE";
export const LEAVE_REJECT = "LEAVE_REJECT";
export const LEAVE_VIEW_OWN = "LEAVE_VIEW_OWN";
export const LEAVE_VIEW_TEAM = "LEAVE_VIEW_TEAM";
export const LEAVE_VIEW_ALL = "LEAVE_VIEW_ALL";
export const LEAVE_MANAGE = "LEAVE_MANAGE";

// ==================== HOLIDAY MODULE ====================
export const HOLIDAY_CREATE = "HOLIDAY_CREATE";
export const HOLIDAY_READ = "HOLIDAY_READ";
export const HOLIDAY_UPDATE = "HOLIDAY_UPDATE";
export const HOLIDAY_DELETE = "HOLIDAY_DELETE";
export const HOLIDAY_MANAGE = "HOLIDAY_MANAGE";

// ==================== OVERTIME MODULE ====================
export const OVERTIME_CREATE = "OVERTIME_CREATE";
export const OVERTIME_READ = "OVERTIME_READ";
export const OVERTIME_UPDATE = "OVERTIME_UPDATE";
export const OVERTIME_DELETE = "OVERTIME_DELETE";
export const OVERTIME_REQUEST = "OVERTIME_REQUEST";
export const OVERTIME_APPROVE = "OVERTIME_APPROVE";
export const OVERTIME_REJECT = "OVERTIME_REJECT";
export const OVERTIME_VIEW_OWN = "OVERTIME_VIEW_OWN";
export const OVERTIME_VIEW_TEAM = "OVERTIME_VIEW_TEAM";
export const OVERTIME_VIEW_ALL = "OVERTIME_VIEW_ALL";
export const OVERTIME_MANAGE = "OVERTIME_MANAGE";

// ==================== REPORT MODULE ====================
export const REPORT_CREATE = "REPORT_CREATE";
export const REPORT_READ = "REPORT_READ";
export const REPORT_EXPORT = "REPORT_EXPORT";
export const REPORT_VIEW_OWN = "REPORT_VIEW_OWN";
export const REPORT_VIEW_TEAM = "REPORT_VIEW_TEAM";
export const REPORT_VIEW_ALL = "REPORT_VIEW_ALL";

// ==================== PERMISSION MODULE ====================
export const PERMISSION_CREATE = "PERMISSION_CREATE";
export const PERMISSION_READ = "PERMISSION_READ";
export const PERMISSION_UPDATE = "PERMISSION_UPDATE";
export const PERMISSION_DELETE = "PERMISSION_DELETE";
export const PERMISSION_MANAGE = "PERMISSION_MANAGE";

// ==================== ROLE MODULE ====================
export const ROLE_CREATE = "ROLE_CREATE";
export const ROLE_READ = "ROLE_READ";
export const ROLE_UPDATE = "ROLE_UPDATE";
export const ROLE_DELETE = "ROLE_DELETE";
export const ROLE_ASSIGN = "ROLE_ASSIGN";
export const ROLE_MANAGE = "ROLE_MANAGE";

// ==================== ORGANIZATION MODULE ====================
export const ORGANIZATION_READ = "ORGANIZATION_READ";
export const ORGANIZATION_UPDATE = "ORGANIZATION_UPDATE";
export const ORGANIZATION_MANAGE = "ORGANIZATION_MANAGE";

// ==================== SUBSCRIPTION MODULE ====================
export const SUBSCRIPTION_READ = "SUBSCRIPTION_READ";
export const SUBSCRIPTION_CREATE = "SUBSCRIPTION_CREATE";
export const SUBSCRIPTION_UPDATE = "SUBSCRIPTION_UPDATE";
export const SUBSCRIPTION_MANAGE = "SUBSCRIPTION_MANAGE";

// ==================== HR MODULE (RESTRICTED) ====================
export const HR_VIEW_SALARY = "HR_VIEW_SALARY";
export const HR_UPDATE_SALARY = "HR_UPDATE_SALARY";
export const HR_CREATE_OFFER = "HR_CREATE_OFFER";
export const HR_VIEW_OFFER = "HR_VIEW_OFFER";
export const HR_UPDATE_OFFER = "HR_UPDATE_OFFER";
export const HR_MANAGE = "HR_MANAGE";

// ==================== SETTINGS MODULE ====================
export const SETTINGS_VIEW = "SETTINGS_VIEW";
export const SETTINGS_UPDATE = "SETTINGS_UPDATE";
export const SETTINGS_MANAGE = "SETTINGS_MANAGE";

// ==================== NOTIFICATION MODULE ====================
export const NOTIFICATION_READ = "NOTIFICATION_READ";
export const NOTIFICATION_MANAGE = "NOTIFICATION_MANAGE";

// ==================== AUDIT MODULE ====================
export const AUDIT_READ = "AUDIT_READ";
export const AUDIT_EXPORT = "AUDIT_EXPORT";

/**
 * All permissions grouped by module
 * Used for UI display and bulk operations
 */
export const PERMISSIONS_BY_MODULE = {
  USER: [
    { code: USER_CREATE, name: "Create User", description: "Create new users in the organization" },
    { code: USER_READ, name: "Read User", description: "View user details" },
    { code: USER_UPDATE, name: "Update User", description: "Update user information" },
    { code: USER_DELETE, name: "Delete User", description: "Delete users from organization" },
    { code: USER_INVITE, name: "Invite User", description: "Send invitation to new users" },
    { code: USER_VIEW_OWN, name: "View Own Profile", description: "View own profile details" },
    { code: USER_VIEW_TEAM, name: "View Team Users", description: "View users in own team" },
    { code: USER_VIEW_ALL, name: "View All Users", description: "View all users in organization" },
    { code: USER_ASSIGN_ROLE, name: "Assign Role", description: "Assign roles to users" },
    { code: USER_MANAGE, name: "Manage Users", description: "Full user management access" },
  ],

  TEAM: [
    { code: TEAM_CREATE, name: "Create Team", description: "Create new teams" },
    { code: TEAM_READ, name: "Read Team", description: "View team details" },
    { code: TEAM_UPDATE, name: "Update Team", description: "Update team information" },
    { code: TEAM_DELETE, name: "Delete Team", description: "Delete teams" },
    { code: TEAM_ADD_MEMBER, name: "Add Member", description: "Add members to teams" },
    { code: TEAM_REMOVE_MEMBER, name: "Remove Member", description: "Remove members from teams" },
    { code: TEAM_ASSIGN_LEAD, name: "Assign Lead", description: "Assign team leaders" },
    { code: TEAM_VIEW_OWN, name: "View Own Teams", description: "View teams you belong to" },
    { code: TEAM_VIEW_ALL, name: "View All Teams", description: "View all teams in organization" },
    { code: TEAM_MANAGE, name: "Manage Teams", description: "Full team management access" },
  ],

  TASK: [
    { code: TASK_CREATE, name: "Create Task", description: "Create new tasks" },
    { code: TASK_READ, name: "Read Task", description: "View task details" },
    { code: TASK_UPDATE, name: "Update Task", description: "Update task information" },
    { code: TASK_DELETE, name: "Delete Task", description: "Delete tasks" },
    { code: TASK_ASSIGN, name: "Assign Task", description: "Assign tasks to users" },
    { code: TASK_VIEW_OWN, name: "View Own Tasks", description: "View own tasks" },
    { code: TASK_VIEW_TEAM, name: "View Team Tasks", description: "View team tasks" },
    { code: TASK_VIEW_ALL, name: "View All Tasks", description: "View all tasks in organization" },
    { code: TASK_APPROVE, name: "Approve Task", description: "Approve task completions" },
    { code: TASK_MANAGE, name: "Manage Tasks", description: "Full task management access" },
  ],

  ATTENDANCE: [
    { code: ATTENDANCE_CLOCK_IN, name: "Clock In", description: "Clock in for attendance" },
    { code: ATTENDANCE_CLOCK_OUT, name: "Clock Out", description: "Clock out for attendance" },
    { code: ATTENDANCE_READ, name: "Read Attendance", description: "View attendance records" },
    { code: ATTENDANCE_UPDATE, name: "Update Attendance", description: "Update attendance records" },
    { code: ATTENDANCE_DELETE, name: "Delete Attendance", description: "Delete attendance records" },
    { code: ATTENDANCE_VIEW_OWN, name: "View Own Attendance", description: "View own attendance" },
    { code: ATTENDANCE_VIEW_TEAM, name: "View Team Attendance", description: "View team attendance" },
    { code: ATTENDANCE_VIEW_ALL, name: "View All Attendance", description: "View all attendance" },
    { code: ATTENDANCE_SET_TIMER, name: "Set Timer", description: "Set login/logout timers" },
    { code: ATTENDANCE_MANAGE, name: "Manage Attendance", description: "Full attendance management" },
  ],

  LEAVE: [
    { code: LEAVE_REQUEST, name: "Request Leave", description: "Submit leave requests" },
    { code: LEAVE_READ, name: "Read Leave", description: "View leave requests" },
    { code: LEAVE_UPDATE, name: "Update Leave", description: "Update leave requests" },
    { code: LEAVE_DELETE, name: "Delete Leave", description: "Delete leave requests" },
    { code: LEAVE_APPROVE, name: "Approve Leave", description: "Approve leave requests" },
    { code: LEAVE_REJECT, name: "Reject Leave", description: "Reject leave requests" },
    { code: LEAVE_VIEW_OWN, name: "View Own Leaves", description: "View own leave requests" },
    { code: LEAVE_VIEW_TEAM, name: "View Team Leaves", description: "View team leave requests" },
    { code: LEAVE_VIEW_ALL, name: "View All Leaves", description: "View all leave requests" },
    { code: LEAVE_MANAGE, name: "Manage Leaves", description: "Full leave management access" },
  ],

  HOLIDAY: [
    { code: HOLIDAY_CREATE, name: "Create Holiday", description: "Create holidays" },
    { code: HOLIDAY_READ, name: "Read Holiday", description: "View holidays" },
    { code: HOLIDAY_UPDATE, name: "Update Holiday", description: "Update holidays" },
    { code: HOLIDAY_DELETE, name: "Delete Holiday", description: "Delete holidays" },
    { code: HOLIDAY_MANAGE, name: "Manage Holidays", description: "Full holiday management" },
  ],

  OVERTIME: [
    { code: OVERTIME_REQUEST, name: "Request Overtime", description: "Submit overtime requests" },
    { code: OVERTIME_READ, name: "Read Overtime", description: "View overtime requests" },
    { code: OVERTIME_UPDATE, name: "Update Overtime", description: "Update overtime requests" },
    { code: OVERTIME_DELETE, name: "Delete Overtime", description: "Delete overtime requests" },
    { code: OVERTIME_APPROVE, name: "Approve Overtime", description: "Approve overtime requests" },
    { code: OVERTIME_REJECT, name: "Reject Overtime", description: "Reject overtime requests" },
    { code: OVERTIME_VIEW_OWN, name: "View Own Overtime", description: "View own overtime" },
    { code: OVERTIME_VIEW_TEAM, name: "View Team Overtime", description: "View team overtime" },
    { code: OVERTIME_VIEW_ALL, name: "View All Overtime", description: "View all overtime" },
    { code: OVERTIME_MANAGE, name: "Manage Overtime", description: "Full overtime management" },
  ],

  REPORT: [
    { code: REPORT_READ, name: "Read Reports", description: "View reports" },
    { code: REPORT_CREATE, name: "Create Reports", description: "Generate reports" },
    { code: REPORT_EXPORT, name: "Export Reports", description: "Export reports to file" },
    { code: REPORT_VIEW_OWN, name: "View Own Reports", description: "View own reports" },
    { code: REPORT_VIEW_TEAM, name: "View Team Reports", description: "View team reports" },
    { code: REPORT_VIEW_ALL, name: "View All Reports", description: "View all reports" },
  ],

  ROLE: [
    { code: ROLE_CREATE, name: "Create Role", description: "Create custom roles" },
    { code: ROLE_READ, name: "Read Role", description: "View roles" },
    { code: ROLE_UPDATE, name: "Update Role", description: "Update roles" },
    { code: ROLE_DELETE, name: "Delete Role", description: "Delete roles" },
    { code: ROLE_ASSIGN, name: "Assign Role", description: "Assign roles to users" },
    { code: ROLE_MANAGE, name: "Manage Roles", description: "Full role management" },
  ],

  PERMISSION: [
    { code: PERMISSION_READ, name: "Read Permissions", description: "View permissions" },
    { code: PERMISSION_CREATE, name: "Create Permission", description: "Create custom permissions" },
    { code: PERMISSION_UPDATE, name: "Update Permission", description: "Update permissions" },
    { code: PERMISSION_DELETE, name: "Delete Permission", description: "Delete permissions" },
    { code: PERMISSION_MANAGE, name: "Manage Permissions", description: "Full permission management" },
  ],

  ORGANIZATION: [
    { code: ORGANIZATION_READ, name: "Read Organization", description: "View organization details" },
    { code: ORGANIZATION_UPDATE, name: "Update Organization", description: "Update organization" },
    { code: ORGANIZATION_MANAGE, name: "Manage Organization", description: "Full organization management" },
  ],

  SUBSCRIPTION: [
    { code: SUBSCRIPTION_READ, name: "Read Subscription", description: "View subscription details" },
    { code: SUBSCRIPTION_CREATE, name: "Create Subscription", description: "Create subscription" },
    { code: SUBSCRIPTION_UPDATE, name: "Update Subscription", description: "Update subscription" },
    { code: SUBSCRIPTION_MANAGE, name: "Manage Subscription", description: "Full subscription management" },
  ],

  HR: [
    { code: HR_VIEW_SALARY, name: "View Salary", description: "View salary information" },
    { code: HR_UPDATE_SALARY, name: "Update Salary", description: "Update salary information" },
    { code: HR_CREATE_OFFER, name: "Create Offer Letter", description: "Create offer letters" },
    { code: HR_VIEW_OFFER, name: "View Offer Letter", description: "View offer letters" },
    { code: HR_UPDATE_OFFER, name: "Update Offer Letter", description: "Update offer letters" },
    { code: HR_MANAGE, name: "Manage HR", description: "Full HR management access" },
  ],

  SETTINGS: [
    { code: SETTINGS_VIEW, name: "View Settings", description: "View system settings" },
    { code: SETTINGS_UPDATE, name: "Update Settings", description: "Update system settings" },
    { code: SETTINGS_MANAGE, name: "Manage Settings", description: "Full settings management" },
  ],

  NOTIFICATION: [
    { code: NOTIFICATION_READ, name: "Read Notifications", description: "View notifications" },
    { code: NOTIFICATION_MANAGE, name: "Manage Notifications", description: "Manage notifications" },
  ],

  AUDIT: [
    { code: AUDIT_READ, name: "Read Audit Logs", description: "View audit logs" },
    { code: AUDIT_EXPORT, name: "Export Audit Logs", description: "Export audit logs" },
  ],
};

/**
 * Default permissions for CEO role (all permissions)
 */
export const CEO_PERMISSIONS = Object.values(PERMISSIONS_BY_MODULE)
  .flat()
  .map((p) => p.code);

/**
 * Default permissions for Manager role
 */
export const MANAGER_PERMISSIONS = [
  // User
  USER_READ, USER_VIEW_TEAM, USER_VIEW_ALL, USER_INVITE,
  // Team
  TEAM_CREATE, TEAM_READ, TEAM_UPDATE, TEAM_ADD_MEMBER, TEAM_REMOVE_MEMBER,
  TEAM_VIEW_OWN, TEAM_VIEW_ALL,
  // Task
  TASK_CREATE, TASK_READ, TASK_UPDATE, TASK_DELETE, TASK_ASSIGN,
  TASK_VIEW_OWN, TASK_VIEW_TEAM, TASK_VIEW_ALL, TASK_APPROVE,
  // Attendance
  ATTENDANCE_READ, ATTENDANCE_VIEW_OWN, ATTENDANCE_VIEW_TEAM, ATTENDANCE_VIEW_ALL,
  // Leave
  LEAVE_REQUEST, LEAVE_READ, LEAVE_APPROVE, LEAVE_REJECT,
  LEAVE_VIEW_OWN, LEAVE_VIEW_TEAM, LEAVE_VIEW_ALL,
  // Holiday
  HOLIDAY_READ,
  // Overtime
  OVERTIME_REQUEST, OVERTIME_READ, OVERTIME_APPROVE, OVERTIME_REJECT,
  OVERTIME_VIEW_OWN, OVERTIME_VIEW_TEAM, OVERTIME_VIEW_ALL,
  // Report
  REPORT_READ, REPORT_CREATE, REPORT_EXPORT, REPORT_VIEW_OWN,
  REPORT_VIEW_TEAM, REPORT_VIEW_ALL,
  // Notification
  NOTIFICATION_READ,
];

/**
 * Default permissions for Team Lead role
 */
export const TEAM_LEAD_PERMISSIONS = [
  // User
  USER_READ, USER_VIEW_OWN, USER_VIEW_TEAM,
  // Team
  TEAM_READ, TEAM_VIEW_OWN,
  // Task
  TASK_CREATE, TASK_READ, TASK_UPDATE, TASK_ASSIGN,
  TASK_VIEW_OWN, TASK_VIEW_TEAM, TASK_APPROVE,
  // Attendance
  ATTENDANCE_READ, ATTENDANCE_VIEW_OWN, ATTENDANCE_VIEW_TEAM,
  // Leave
  LEAVE_REQUEST, LEAVE_READ, LEAVE_APPROVE, LEAVE_REJECT,
  LEAVE_VIEW_OWN, LEAVE_VIEW_TEAM,
  // Holiday
  HOLIDAY_READ,
  // Overtime
  OVERTIME_REQUEST, OVERTIME_READ, OVERTIME_APPROVE,
  OVERTIME_VIEW_OWN, OVERTIME_VIEW_TEAM,
  // Report
  REPORT_READ, REPORT_VIEW_OWN, REPORT_VIEW_TEAM,
  // Notification
  NOTIFICATION_READ,
];

/**
 * Default permissions for Employee role
 */
export const EMPLOYEE_PERMISSIONS = [
  // User
  USER_VIEW_OWN,
  // Team
  TEAM_VIEW_OWN,
  // Task
  TASK_CREATE, TASK_READ, TASK_UPDATE, TASK_VIEW_OWN,
  // Attendance
  ATTENDANCE_CLOCK_IN, ATTENDANCE_CLOCK_OUT, ATTENDANCE_VIEW_OWN,
  // Leave
  LEAVE_REQUEST, LEAVE_VIEW_OWN,
  // Holiday
  HOLIDAY_READ,
  // Overtime
  OVERTIME_REQUEST, OVERTIME_VIEW_OWN,
  // Report
  REPORT_VIEW_OWN,
  // Notification
  NOTIFICATION_READ,
];

/**
 * All permission codes as array
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS_BY_MODULE)
  .flat()
  .map((p) => p.code);

export default {
  PERMISSIONS_BY_MODULE,
  CEO_PERMISSIONS,
  MANAGER_PERMISSIONS,
  TEAM_LEAD_PERMISSIONS,
  EMPLOYEE_PERMISSIONS,
  ALL_PERMISSIONS,
};
