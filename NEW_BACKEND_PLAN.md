# Task Tracker SaaS - Backend Implementation Plan

## Module-by-Module Development Guide

This plan follows your existing folder structure and allows building **one module at a time**.

---

## 📁 Your Existing Folder Structure

```
backend/
├── app.js                          # Express app setup
├── server.js                       # Server entry point
├── package.json
├── .env.example
│
├── src/
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   ├── env.js                  # Environment variables
│   │   ├── redis.js                # Redis connection
│   │   ├── razorpay.js             # Razorpay config
│   │   ├── cloudinary.js           # File upload config
│   │   ├── cors.js                 # CORS config
│   │   └── constants.js            # App constants
│   │
│   ├── constants/
│   │   └── permissions.js          # All permission codes
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── permission.middleware.js # RBAC check
│   │   ├── org.middleware.js       # Organization context
│   │   ├── error.middleware.js     # Global error handler
│   │   ├── rateLimit.middleware.js # Rate limiting
│   │   ├── upload.middleware.js    # File upload
│   │   └── validate.middleware.js  # Zod validation
│   │
│   ├── utils/
│   │   ├── AppError.js             # Custom error class
│   │   ├── apiResponse.js          # Response helpers
│   │   ├── asyncHandler.js         # Async wrapper
│   │   ├── logger.js               # Winston logger
│   │   ├── encrypt.js              # Encryption utils
│   │   ├── date.js                 # Date helpers
│   │   └── cloudinary.util.js      # Upload helpers
│   │
│   ├── seeders/
│   │   └── permissionSeeder.js     # Seed permissions & roles
│   │
│   ├── modules/
│   │   ├── auth/                   # Authentication
│   │   ├── users/                  # User management
│   │   ├── organizations/          # Organization management
│   │   ├── roles/                  # Role management
│   │   ├── permissions/            # Permission management
│   │   ├── teams/                  # Team management
│   │   ├── memberships/            # Org memberships
│   │   ├── hierarchy/              # Reporting hierarchy
│   │   ├── attendance/             # Attendance tracking
│   │   ├── leaves/                 # Leave management
│   │   ├── tasks/                  # Task management
│   │   ├── approvals/              # Approval workflows
│   │   ├── policies/               # Work & holiday policies
│   │   ├── notifications/          # Notifications
│   │   ├── performance/            # Performance tracking
│   │   ├── documents/              # Document management
│   │   ├── billing/                # Billing & plans
│   │   ├── subscriptions/          # Subscription management
│   │   ├── payments/               # Payment processing
│   │   ├── settings/               # Organization settings
│   │   ├── audit-logs/             # Audit logging
│   │   └── automation-or-job/      # Cron jobs
│   │
│   ├── routes.js                   # Main router
│   └── seed.js                     # Database seeder
```

---

## 🎯 Module Implementation Order

Build in this order - each module depends on the previous ones:

| Phase | Module | Priority | Dependencies |
|-------|--------|----------|--------------|
| 1 | Config & Utils | Critical | None |
| 2 | Organizations | Critical | Config |
| 3 | Auth | Critical | Organizations |
| 4 | Users | Critical | Auth, Organizations |
| 5 | Permissions | Critical | Users |
| 6 | Roles | Critical | Permissions |
| 7 | Teams | High | Users, Roles |
| 8 | Memberships | High | Users, Organizations |
| 9 | Hierarchy | High | Users, Teams |
| 10 | Policies | High | Organizations |
| 11 | Attendance | High | Users, Policies |
| 12 | Leaves | High | Users, Policies, Approvals |
| 13 | Tasks | High | Users, Teams |
| 14 | Approvals | Medium | Users, Hierarchy |
| 15 | Notifications | Medium | Users |
| 16 | Performance | Medium | Users, Tasks, Attendance |
| 17 | Documents | Medium | Users, Organizations |
| 18 | Billing & Plans | Medium | Organizations |
| 19 | Subscriptions | Medium | Billing |
| 20 | Payments | Medium | Subscriptions |
| 21 | Settings | Low | Organizations |
| 22 | Audit Logs | Low | All modules |
| 23 | Automation Jobs | Low | All modules |

---

# PHASE 1: Foundation Setup

## Module 1.1: Config & Environment

### Files to Create/Update:

#### `src/config/env.js`
```javascript
// Load and validate environment variables
export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Client
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};
```

#### `src/config/db.js`
```javascript
// MongoDB connection with retry logic
// - Connect to MongoDB
// - Handle connection events
// - Graceful shutdown
```

#### `src/config/redis.js`
```javascript
// Redis connection for:
// - Session caching
// - Rate limiting
// - Job queues
```

### Checklist:
- [ ] Environment variables validation
- [ ] MongoDB connection with events
- [ ] Redis connection (optional for Phase 1)
- [ ] Logger setup (Winston)
- [ ] Error handling utilities

---

## Module 1.2: Core Utilities

### Files:

#### `src/utils/AppError.js`
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

#### `src/utils/apiResponse.js`
```javascript
// Standardized response format:
// { success: true, message: '', data: {} }
export const successResponse = (res, statusCode, message, data = null) => {};
export const errorResponse = (res, statusCode, message, errors = null) => {};
```

#### `src/utils/asyncHandler.js`
```javascript
// Wrap async functions to catch errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### Checklist:
- [ ] AppError class
- [ ] API response helpers
- [ ] Async handler wrapper
- [ ] Logger utility
- [ ] Date utilities
- [ ] Encryption utilities

---

## Module 1.3: Core Middlewares

### Files:

#### `src/middlewares/error.middleware.js`
```javascript
// Global error handler
// - Handle operational errors
// - Handle Mongoose errors
// - Handle JWT errors
// - Log errors
```

#### `src/middlewares/validate.middleware.js`
```javascript
// Zod validation middleware
// - Validate body, params, query
// - Return formatted errors
```

#### `src/middlewares/rateLimit.middleware.js`
```javascript
// Rate limiting
// - General API limit
// - Auth endpoints limit (stricter)
```

### Checklist:
- [ ] Error middleware
- [ ] Validation middleware
- [ ] Rate limit middleware
- [ ] Request logging (morgan)

---

# PHASE 2: Organizations Module

## Module: organizations/

### Files to Implement:

#### `src/modules/organizations/model.js`
```javascript
const organizationSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  email: { type: String, required: true },
  phone: String,

  // Owner (CEO)
  ownerEmail: { type: String, required: true },
  ownerUserId: { type: ObjectId, ref: 'User' },

  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },

  // Branding
  logo: String,

  // Subscription Reference
  subscriptionId: { type: ObjectId, ref: 'Subscription' },

  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'cancelled'],
    default: 'pending'
  },

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
```

#### `src/modules/organizations/service.js`
```javascript
// Business logic:
// - createOrganization(data)
// - getOrganizationById(id)
// - getOrganizationBySlug(slug)
// - updateOrganization(id, data)
// - deleteOrganization(id) // soft delete
// - activateOrganization(id)
// - suspendOrganization(id)
```

#### `src/modules/organizations/controller.js`
```javascript
// HTTP handlers:
// - create (POST /)
// - getById (GET /:id)
// - update (PUT /:id)
// - delete (DELETE /:id)
// - getMyOrganization (GET /me)
```

#### `src/modules/organizations/routes.js`
```javascript
// Routes:
// POST   /                    - Create org (public - registration)
// GET    /me                  - Get my org (auth required)
// GET    /:id                 - Get org by ID (admin)
// PUT    /:id                 - Update org (owner only)
// DELETE /:id                 - Delete org (owner only)
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | /api/v1/organizations | Public | Create new organization |
| GET | /api/v1/organizations/me | Auth | Get current user's org |
| GET | /api/v1/organizations/:id | ORGANIZATION_READ | Get org by ID |
| PUT | /api/v1/organizations/:id | ORGANIZATION_UPDATE | Update org |
| DELETE | /api/v1/organizations/:id | Owner only | Delete org |

### Checklist:
- [ ] Organization model with indexes
- [ ] Organization service with CRUD
- [ ] Organization controller
- [ ] Organization routes
- [ ] Slug generation
- [ ] Validation schemas

---

# PHASE 3: Auth Module

## Module: auth/

### Files to Implement:

#### `src/modules/auth/auth.service.js`
```javascript
// Core auth functions:

// Registration
registerOrganization({ orgName, firstName, lastName, email, password })
  // 1. Create Organization
  // 2. Seed default roles for org
  // 3. Create CEO user with CEO role
  // 4. Generate tokens
  // 5. Return { user, organization, tokens }

// Login
loginUser({ email, password })
  // 1. Find user by email
  // 2. Verify password
  // 3. Check user status
  // 4. Generate tokens
  // 5. Update lastLoginAt
  // 6. Return { user, organization, tokens }

// Token Management
generateAccessToken(user)
generateRefreshToken(user)
verifyAccessToken(token)
verifyRefreshToken(token)
refreshAccessToken(refreshToken)

// Password Management
forgotPassword(email)
resetPassword(token, newPassword)
changePassword(userId, currentPassword, newPassword)

// Invitation Flow
inviteUser(organizationId, inviterUserId, userData)
acceptInvitation(token, password)

// Session
logout(userId)
getCurrentUser(userId)
```

#### `src/modules/auth/auth.controller.js`
```javascript
// Endpoints:
register        // POST /register
login           // POST /login
logout          // POST /logout (auth required)
refreshToken    // POST /refresh-token
forgotPassword  // POST /forgot-password
resetPassword   // POST /reset-password
changePassword  // PUT /change-password (auth required)
inviteUser      // POST /invite (auth + permission)
acceptInvite    // POST /accept-invite/:token
getMe           // GET /me (auth required)
verifyToken     // GET /verify (auth required)
```

#### `src/modules/auth/auth.validation.js`
```javascript
// Zod schemas for:
registerSchema = z.object({
  body: z.object({
    organizationName: z.string().min(2).max(100),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    phone: z.string().optional(),
  })
})

loginSchema
changePasswordSchema
forgotPasswordSchema
resetPasswordSchema
inviteUserSchema
acceptInviteSchema
```

#### `src/modules/auth/auth.routes.js`
```javascript
// Public routes
POST   /register
POST   /login
POST   /refresh-token
POST   /forgot-password
POST   /reset-password
POST   /accept-invite/:token

// Protected routes
POST   /logout
GET    /me
GET    /verify
PUT    /change-password
POST   /invite   // requires USER_INVITE permission
```

### Auth Middleware Update:

#### `src/middlewares/auth.middleware.js`
```javascript
// JWT verification:
// 1. Extract token from Authorization header
// 2. Verify token
// 3. Check if user exists
// 4. Check if user status is active
// 5. Check if password changed after token issued
// 6. Attach user context to req.user:
//    {
//      userId, email, organizationId,
//      roleId, roleName, roleLevel,
//      permissions: [...],
//      isSuperAdmin, isOwner
//    }
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | /api/v1/auth/register | Public | Register new org |
| POST | /api/v1/auth/login | Public | Login |
| POST | /api/v1/auth/logout | Auth | Logout |
| POST | /api/v1/auth/refresh-token | Public | Refresh token |
| POST | /api/v1/auth/forgot-password | Public | Request reset |
| POST | /api/v1/auth/reset-password | Public | Reset password |
| PUT | /api/v1/auth/change-password | Auth | Change password |
| POST | /api/v1/auth/invite | USER_INVITE | Invite user |
| POST | /api/v1/auth/accept-invite/:token | Public | Accept invite |
| GET | /api/v1/auth/me | Auth | Get current user |
| GET | /api/v1/auth/verify | Auth | Verify token |

### Checklist:
- [ ] JWT generation (access + refresh)
- [ ] Password hashing (bcrypt)
- [ ] Registration flow with org creation
- [ ] Login with token generation
- [ ] Token refresh mechanism
- [ ] Password reset flow
- [ ] User invitation flow
- [ ] Auth middleware
- [ ] Validation schemas

---

# PHASE 4: Users Module

## Module: users/

### Files to Implement:

#### `src/modules/users/model.js`
```javascript
const userSchema = new mongoose.Schema({
  // Identity
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true, select: false },
  phone: String,
  avatar: String,

  // Organization
  organizationId: { type: ObjectId, ref: 'Organization', required: true },

  // Employee Info
  employeeId: String,
  department: String,
  designation: String,
  dateOfJoining: Date,

  // RBAC
  roleId: { type: ObjectId, ref: 'Role' },
  permissions: [String],  // Direct permissions

  // Hierarchy
  reportingTo: { type: ObjectId, ref: 'User' },
  teamIds: [{ type: ObjectId, ref: 'Team' }],

  // Work Config
  workHoursPerDay: { type: Number, default: 8 },
  breakMinutesPerDay: { type: Number, default: 60 },
  timezone: { type: String, default: 'Asia/Kolkata' },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'invited', 'suspended'],
    default: 'invited'
  },

  // Flags
  isSuperAdmin: { type: Boolean, default: false },
  isOwner: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  // Invitation
  inviteToken: { type: String, select: false },
  inviteTokenExpiry: Date,
  invitedBy: { type: ObjectId, ref: 'User' },

  // Auth Tokens
  refreshToken: { type: String, select: false },
  refreshTokenExpiry: Date,

  // Password Reset
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: Date,
  passwordChangedAt: Date,

  // Activity
  lastLoginAt: Date,
  lastActiveAt: Date,

}, { timestamps: true });

// Indexes
userSchema.index({ email: 1, organizationId: 1 }, { unique: true });
userSchema.index({ organizationId: 1, status: 1 });
userSchema.index({ roleId: 1 });
userSchema.index({ reportingTo: 1 });
userSchema.index({ teamIds: 1 });

// Virtual: fullName
// Methods: comparePassword, hasPermission, getAllPermissions
// Statics: findByEmail, findActiveByOrganization
```

#### `src/modules/users/service.js`
```javascript
// CRUD Operations
createUser(organizationId, userData)
getUserById(id)
getUsersByOrganization(organizationId, filters, pagination)
updateUser(id, updateData)
deleteUser(id) // soft delete
activateUser(id)
suspendUser(id)

// Role & Permission
assignRole(userId, roleId)
addDirectPermission(userId, permission)
removeDirectPermission(userId, permission)

// Team Management
addToTeam(userId, teamId)
removeFromTeam(userId, teamId)

// Hierarchy
setReportingManager(userId, managerId)
getSubordinates(userId)
getReportingChain(userId)

// Search & Filter
searchUsers(organizationId, query)
getUsersByRole(organizationId, roleId)
getUsersByTeam(teamId)
```

#### `src/modules/users/controller.js`
```javascript
// Endpoints:
list            // GET / (paginated, filtered)
getById         // GET /:id
create          // POST / (same as invite)
update          // PUT /:id
delete          // DELETE /:id
assignRole      // PUT /:id/role
getSubordinates // GET /:id/subordinates
getMyProfile    // GET /me
updateMyProfile // PUT /me
```

#### `src/modules/users/routes.js`
```javascript
// Routes with permissions:
GET    /           // USER_VIEW_ALL or USER_VIEW_TEAM
GET    /me         // Auth only (own profile)
PUT    /me         // Auth only (update own)
GET    /:id        // USER_READ
POST   /           // USER_CREATE
PUT    /:id        // USER_UPDATE
DELETE /:id        // USER_DELETE
PUT    /:id/role   // USER_ASSIGN_ROLE
GET    /:id/subordinates // USER_VIEW_TEAM
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/users | USER_VIEW_ALL | List users |
| GET | /api/v1/users/me | Auth | Get my profile |
| PUT | /api/v1/users/me | Auth | Update my profile |
| GET | /api/v1/users/:id | USER_READ | Get user |
| POST | /api/v1/users | USER_CREATE | Create user |
| PUT | /api/v1/users/:id | USER_UPDATE | Update user |
| DELETE | /api/v1/users/:id | USER_DELETE | Delete user |
| PUT | /api/v1/users/:id/role | USER_ASSIGN_ROLE | Assign role |
| GET | /api/v1/users/:id/subordinates | USER_VIEW_TEAM | Get subordinates |

### Checklist:
- [ ] User model with all fields
- [ ] User service with CRUD
- [ ] User controller
- [ ] User routes with permissions
- [ ] Profile management (own)
- [ ] Role assignment
- [ ] Subordinate fetching
- [ ] Pagination & filtering
- [ ] Validation schemas

---

# PHASE 5: Permissions Module

## Module: permissions/

### Files to Implement:

#### `src/constants/permissions.js`
```javascript
// All permission codes organized by module:

// USER MODULE
export const USER_CREATE = 'USER_CREATE';
export const USER_READ = 'USER_READ';
export const USER_UPDATE = 'USER_UPDATE';
export const USER_DELETE = 'USER_DELETE';
export const USER_INVITE = 'USER_INVITE';
export const USER_VIEW_OWN = 'USER_VIEW_OWN';
export const USER_VIEW_TEAM = 'USER_VIEW_TEAM';
export const USER_VIEW_ALL = 'USER_VIEW_ALL';
export const USER_ASSIGN_ROLE = 'USER_ASSIGN_ROLE';

// TEAM MODULE
export const TEAM_CREATE = 'TEAM_CREATE';
export const TEAM_READ = 'TEAM_READ';
// ... etc

// Define for all modules:
// USER, TEAM, TASK, ATTENDANCE, LEAVE, HOLIDAY,
// OVERTIME, REPORT, PERMISSION, ROLE, ORGANIZATION,
// SUBSCRIPTION, HR, SETTINGS, NOTIFICATION, AUDIT

// Export grouped for UI
export const PERMISSIONS_BY_MODULE = {
  USER: [...],
  TEAM: [...],
  // etc
};

// Default role permissions
export const CEO_PERMISSIONS = [...];
export const MANAGER_PERMISSIONS = [...];
export const TEAM_LEAD_PERMISSIONS = [...];
export const EMPLOYEE_PERMISSIONS = [...];
```

#### `src/modules/permissions/permissions.model.js`
```javascript
const permissionSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  description: String,
  module: {
    type: String,
    required: true,
    enum: ['USER', 'TEAM', 'TASK', 'ATTENDANCE', 'LEAVE', ...]
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', ...]
  },
  organizationId: { type: ObjectId, ref: 'Organization', default: null },
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  category: { type: String, default: 'general' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

// Index: unique code per org (or global)
permissionSchema.index({ code: 1, organizationId: 1 }, { unique: true });
```

#### `src/modules/permissions/permissions.controller.js`
```javascript
// Endpoints:
listAll         // GET / - List all permissions
listByModule    // GET /module/:module - By module
```

#### `src/modules/permissions/permissions.routes.js`
```javascript
GET /           // PERMISSION_READ - List all
GET /module/:module // PERMISSION_READ - By module
```

### Permission Middleware:

#### `src/middlewares/permission.middleware.js`
```javascript
const permissionMiddleware = (requiredPermission, options = {}) => {
  return (req, res, next) => {
    const user = req.user;

    // 1. Super Admin bypass
    if (user.isSuperAdmin) return next();

    // 2. Owner bypass
    if (user.isOwner) return next();

    // 3. Check permissions (role + direct)
    const userPermissions = new Set([
      ...user.permissions,
      ...user.directPermissions
    ]);

    // 4. Handle array of permissions
    const perms = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    // 5. requireAll or requireAny
    const hasPermission = options.requireAll
      ? perms.every(p => userPermissions.has(p))
      : perms.some(p => userPermissions.has(p));

    if (!hasPermission) {
      return next(new AppError('Permission denied', 403));
    }

    next();
  };
};
```

### Checklist:
- [ ] Permission constants file
- [ ] Permission model
- [ ] Permission controller
- [ ] Permission routes
- [ ] Permission middleware
- [ ] Helper functions (requireAll, requireAny)

---

# PHASE 6: Roles Module

## Module: roles/

### Files to Implement:

#### `src/modules/roles/roles.model.js`
```javascript
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,

  organizationId: { type: ObjectId, ref: 'Organization', required: true },

  // Hierarchy (1 = highest)
  level: { type: Number, required: true, min: 1, max: 100 },

  // Permissions
  permissions: [{ type: ObjectId, ref: 'Permission' }],
  permissionCodes: [String], // Denormalized for faster access

  // Flags
  isSystemRole: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

// Index
roleSchema.index({ slug: 1, organizationId: 1 }, { unique: true });

// Methods
roleSchema.methods.hasPermission = function(code) { ... }
roleSchema.methods.isHigherThan = function(otherRole) { ... }
```

#### `src/modules/roles/roles.service.js`
```javascript
// CRUD
createRole(organizationId, roleData)
getRoleById(id)
getRolesByOrganization(organizationId)
updateRole(id, updateData)
deleteRole(id) // Can't delete system roles

// Permission Management
assignPermissions(roleId, permissionCodes)
addPermission(roleId, permissionCode)
removePermission(roleId, permissionCode)

// Queries
getDefaultRole(organizationId)
getCEORole(organizationId)
getRoleBySlug(organizationId, slug)
```

#### `src/modules/roles/roles.controller.js`
```javascript
list            // GET /
getById         // GET /:id
create          // POST /
update          // PUT /:id
delete          // DELETE /:id
assignPermissions // PUT /:id/permissions
```

#### `src/modules/roles/roles.routes.js`
```javascript
GET    /                    // ROLE_READ
GET    /:id                 // ROLE_READ
POST   /                    // ROLE_CREATE
PUT    /:id                 // ROLE_UPDATE
DELETE /:id                 // ROLE_DELETE
PUT    /:id/permissions     // PERMISSION_MANAGE
```

### Seeder:

#### `src/seeders/permissionSeeder.js`
```javascript
// Seed system permissions (run once at app start)
seedSystemPermissions()

// Seed default roles for new organization
seedOrganizationRoles(organizationId, createdBy)
  // Creates: CEO, Manager, Team Lead, Employee
  // With default permissions for each
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/roles | ROLE_READ | List roles |
| GET | /api/v1/roles/:id | ROLE_READ | Get role |
| POST | /api/v1/roles | ROLE_CREATE | Create role |
| PUT | /api/v1/roles/:id | ROLE_UPDATE | Update role |
| DELETE | /api/v1/roles/:id | ROLE_DELETE | Delete role |
| PUT | /api/v1/roles/:id/permissions | PERMISSION_MANAGE | Assign permissions |

### Checklist:
- [ ] Role model with hierarchy
- [ ] Role service with CRUD
- [ ] Role controller
- [ ] Role routes
- [ ] Permission assignment
- [ ] Role seeder
- [ ] System role protection

---

# PHASE 7: Teams Module

## Module: teams/

### Files to Implement:

#### `src/modules/teams/teams.model.js`
```javascript
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: String,
  description: String,

  organizationId: { type: ObjectId, ref: 'Organization', required: true },

  // Leadership
  leaderId: { type: ObjectId, ref: 'User' },

  // Members
  members: [{
    userId: { type: ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    addedBy: { type: ObjectId, ref: 'User' }
  }],

  // Hierarchy (sub-teams)
  parentTeamId: { type: ObjectId, ref: 'Team' },

  // Settings
  settings: {
    taskVisibility: { type: String, enum: ['private', 'team', 'all'], default: 'team' },
    canApproveLeaves: { type: Boolean, default: true },
    canApproveOvertime: { type: Boolean, default: true }
  },

  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  createdBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

// Methods
teamSchema.methods.isMember = function(userId) { ... }
teamSchema.methods.isLeader = function(userId) { ... }
teamSchema.methods.addMember = function(userId, addedBy) { ... }
teamSchema.methods.removeMember = function(userId) { ... }
```

#### `src/modules/teams/teams.service.js`
```javascript
// CRUD
createTeam(organizationId, teamData)
getTeamById(id)
getTeamsByOrganization(organizationId)
updateTeam(id, updateData)
deleteTeam(id)

// Member Management
addMember(teamId, userId, addedBy)
removeMember(teamId, userId)
setLeader(teamId, userId)

// Queries
getTeamsByMember(userId)
getTeamsByLeader(userId)
getSubTeams(parentTeamId)
getTeamHierarchy(teamId)
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/teams | TEAM_VIEW_ALL | List teams |
| GET | /api/v1/teams/my | TEAM_VIEW_OWN | My teams |
| GET | /api/v1/teams/:id | TEAM_READ | Get team |
| POST | /api/v1/teams | TEAM_CREATE | Create team |
| PUT | /api/v1/teams/:id | TEAM_UPDATE | Update team |
| DELETE | /api/v1/teams/:id | TEAM_DELETE | Delete team |
| POST | /api/v1/teams/:id/members | TEAM_ADD_MEMBER | Add member |
| DELETE | /api/v1/teams/:id/members/:userId | TEAM_REMOVE_MEMBER | Remove member |
| PUT | /api/v1/teams/:id/leader | TEAM_ASSIGN_LEAD | Set leader |

### Checklist:
- [ ] Team model
- [ ] Team service
- [ ] Team controller
- [ ] Team routes
- [ ] Member management
- [ ] Leader assignment
- [ ] Sub-team support

---

# PHASE 8-10: Organization Structure

## Module 8: Memberships (organization-memberships/)

Track user membership in organization with status history.

```javascript
// Model fields:
userId, organizationId, status,
joinedAt, leftAt, invitedBy,
membershipType, permissions
```

## Module 9: Hierarchy (hierarchy/)

Manage reporting relationships.

```javascript
// Model fields:
userId, organizationId, reportingTo,
effectiveFrom, effectiveTo, level
```

## Module 10: Policies (policies/)

### Work Policy Model:
```javascript
// work-policy.model.js
organizationId, name,
workingDays, workStartTime, workEndTime,
breakDuration, graceMinutes, overtimeAllowed,
isDefault, isActive
```

### Holiday Policy Model:
```javascript
// holiday-policy.model.js
organizationId, name, date, type,
isOptional, applicableTo, description
```

---

# PHASE 11: Attendance Module

## Module: attendance/

### Files to Implement:

#### `src/modules/attendance/attendance.model.js`
```javascript
const attendanceSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  organizationId: { type: ObjectId, ref: 'Organization', required: true },

  date: { type: Date, required: true },

  // Clock times
  clockIn: Date,
  clockOut: Date,

  // Breaks
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number // minutes
  }],

  // Calculated fields
  totalWorkMinutes: Number,
  totalBreakMinutes: Number,
  overtimeMinutes: Number,

  // Status
  status: {
    type: String,
    enum: ['present', 'absent', 'halfDay', 'leave', 'holiday', 'weekend'],
    default: 'absent'
  },

  // Location (optional)
  clockInLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  clockOutLocation: {
    lat: Number,
    lng: Number,
    address: String
  },

  // Notes
  notes: String,
  adminNotes: String,

  // Flags
  isLate: Boolean,
  isEarlyLeave: Boolean,
  isManualEntry: Boolean,

  markedBy: { type: ObjectId, ref: 'User' }, // If manual
}, { timestamps: true });

// Index
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ organizationId: 1, date: 1 });
```

#### `src/modules/attendance/attendance.service.js`
```javascript
// Clock operations
clockIn(userId)
clockOut(userId)
startBreak(userId)
endBreak(userId)

// Queries
getAttendanceByUser(userId, startDate, endDate)
getAttendanceByOrganization(orgId, date, filters)
getAttendanceByTeam(teamId, date)

// Manual operations
markAttendance(userId, date, data, markedBy)
updateAttendance(id, updateData)

// Reports
getDailySummary(orgId, date)
getMonthlyReport(userId, month, year)
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | /api/v1/attendance/clock-in | ATTENDANCE_CLOCK_IN | Clock in |
| POST | /api/v1/attendance/clock-out | ATTENDANCE_CLOCK_OUT | Clock out |
| POST | /api/v1/attendance/break/start | Auth | Start break |
| POST | /api/v1/attendance/break/end | Auth | End break |
| GET | /api/v1/attendance/my | ATTENDANCE_VIEW_OWN | My attendance |
| GET | /api/v1/attendance/today | Auth | Today's status |
| GET | /api/v1/attendance | ATTENDANCE_VIEW_ALL | List attendance |
| GET | /api/v1/attendance/team | ATTENDANCE_VIEW_TEAM | Team attendance |
| POST | /api/v1/attendance/manual | ATTENDANCE_MANAGE | Manual entry |

### Checklist:
- [ ] Attendance model
- [ ] Clock in/out service
- [ ] Break management
- [ ] Auto-calculation of hours
- [ ] Late/early detection
- [ ] Manual entry support
- [ ] Reports

---

# PHASE 12: Leaves Module

## Module: leaves/

### Files to Implement:

#### `src/modules/leaves/leaves.model.js`
```javascript
// Leave Type Model
const leaveTypeSchema = new mongoose.Schema({
  organizationId: { type: ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true }, // Sick, Casual, Earned
  code: { type: String, required: true },
  allowedDays: { type: Number, required: true },
  carryForward: { type: Boolean, default: false },
  maxCarryForward: Number,
  isPaid: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
});

// Leave Request Model
const leaveSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  organizationId: { type: ObjectId, ref: 'Organization', required: true },

  leaveTypeId: { type: ObjectId, ref: 'LeaveType', required: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // Half day
  isHalfDay: { type: Boolean, default: false },
  halfDayPeriod: { type: String, enum: ['morning', 'afternoon'] },

  totalDays: { type: Number, required: true },

  reason: { type: String, required: true },

  // Approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },

  approvedBy: { type: ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,

  // Attachments (medical certificate etc)
  attachments: [String],

}, { timestamps: true });
```

#### `src/modules/leaves/leaves.service.js`
```javascript
// Leave Types
createLeaveType(orgId, data)
getLeaveTypes(orgId)

// Leave Requests
applyLeave(userId, leaveData)
approveLeave(leaveId, approverId)
rejectLeave(leaveId, approverId, reason)
cancelLeave(leaveId, userId)

// Queries
getMyLeaves(userId, filters)
getPendingApprovals(approverId)
getLeavesByTeam(teamId, dateRange)

// Balance
getLeaveBalance(userId)
calculateLeaveBalance(userId, leaveTypeId)
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/leaves/types | Auth | Get leave types |
| POST | /api/v1/leaves/types | LEAVE_MANAGE | Create leave type |
| GET | /api/v1/leaves/balance | Auth | My leave balance |
| POST | /api/v1/leaves | LEAVE_REQUEST | Apply for leave |
| GET | /api/v1/leaves/my | LEAVE_VIEW_OWN | My leaves |
| GET | /api/v1/leaves/pending | LEAVE_APPROVE | Pending approvals |
| PUT | /api/v1/leaves/:id/approve | LEAVE_APPROVE | Approve leave |
| PUT | /api/v1/leaves/:id/reject | LEAVE_REJECT | Reject leave |
| PUT | /api/v1/leaves/:id/cancel | Auth | Cancel my leave |

### Checklist:
- [ ] Leave type model
- [ ] Leave request model
- [ ] Apply/Approve/Reject flow
- [ ] Leave balance calculation
- [ ] Half-day support
- [ ] Attachment support
- [ ] Email notifications

---

# PHASE 13: Tasks Module

## Module: tasks/

### Files to Implement:

#### `src/modules/tasks/tasks.model.js`
```javascript
const taskSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true }, // Owner
  organizationId: { type: ObjectId, ref: 'Organization', required: true },

  title: { type: String, required: true },
  description: String,

  // Categorization
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  status: {
    type: String,
    enum: ['todo', 'inProgress', 'completed', 'blocked', 'cancelled'],
    default: 'todo'
  },

  // Dates
  dueDate: Date,
  completedAt: Date,

  // Progress
  progress: { type: Number, min: 0, max: 100, default: 0 },

  // Dependencies
  dependencies: [{
    taskId: { type: ObjectId, ref: 'Task' },
    dependentUserId: { type: ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'completed'],
      default: 'pending'
    },
    notifiedAt: Date
  }],

  // Team/Assignment
  teamId: { type: ObjectId, ref: 'Team' },
  assignedTo: { type: ObjectId, ref: 'User' },
  assignedBy: { type: ObjectId, ref: 'User' },

  // Tags
  tags: [String],

  // Visibility
  isVisible: { type: Boolean, default: true },
  // Tasks become invisible after due date passes

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
```

#### `src/modules/tasks/tasks.service.js`
```javascript
// CRUD
createTask(userId, taskData)
getTaskById(id)
updateTask(id, updateData)
deleteTask(id)

// Assignment
assignTask(taskId, assigneeId, assignerId)

// Progress
updateProgress(taskId, progress)
markComplete(taskId)

// Dependencies
addDependency(taskId, dependentTaskId, dependentUserId)
acknowledgeDependency(taskId, dependencyId)

// Queries
getMyTasks(userId, filters)
getTeamTasks(teamId, filters)
getTasksByDueDate(userId, date)

// Auto-hide expired
hideExpiredTasks() // Cron job
```

### API Endpoints:
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/tasks/my | TASK_VIEW_OWN | My tasks |
| GET | /api/v1/tasks/team | TASK_VIEW_TEAM | Team tasks |
| GET | /api/v1/tasks | TASK_VIEW_ALL | All tasks |
| POST | /api/v1/tasks | TASK_CREATE | Create task |
| GET | /api/v1/tasks/:id | TASK_READ | Get task |
| PUT | /api/v1/tasks/:id | TASK_UPDATE | Update task |
| DELETE | /api/v1/tasks/:id | TASK_DELETE | Delete task |
| PUT | /api/v1/tasks/:id/progress | TASK_UPDATE | Update progress |
| PUT | /api/v1/tasks/:id/complete | TASK_UPDATE | Mark complete |
| POST | /api/v1/tasks/:id/assign | TASK_ASSIGN | Assign task |
| POST | /api/v1/tasks/:id/dependency | TASK_CREATE | Add dependency |

### Checklist:
- [ ] Task model
- [ ] Task CRUD service
- [ ] Assignment flow
- [ ] Progress tracking
- [ ] Dependency management
- [ ] Due date visibility
- [ ] Calendar view support

---

# PHASE 14-16: Support Modules

## Module 14: Approvals (approvals/)

Generic approval workflow for leaves, overtime, etc.

```javascript
// approval.model.js
entityType, entityId, requestedBy, requestedAt,
status, approvedBy, approvedAt, rejectionReason,
level, currentLevel // Multi-level approval support
```

## Module 15: Notifications (notifications/)

```javascript
// notifications.model.js
userId, organizationId, type, title, message,
data, read, readAt, actionUrl
```

Services: createNotification, markAsRead, getUnread

## Module 16: Performance (performance/)

```javascript
// performance.model.js
userId, organizationId, period,
tasksCompleted, attendanceRate,
avgWorkHours, leaveDays, rating
```

---

# PHASE 17-20: Billing Modules

## Module 17: Billing (billing/)

### plan.model.js
```javascript
name, description, price, currency, interval,
features: { maxUsers, maxTeams, ... },
razorpayPlanId, isActive
```

## Module 18: Subscriptions (subscriptions/)

### subscription.model.js
```javascript
organizationId, planId, status,
startDate, endDate, razorpaySubscriptionId
```

## Module 19: Payments (payments/)

### payment.model.js
```javascript
organizationId, subscriptionId, amount,
razorpayPaymentId, razorpayOrderId, status
```

### Razorpay Webhook
```javascript
// webhook.js
handlePaymentSuccess
handlePaymentFailed
handleSubscriptionActivated
handleSubscriptionCancelled
```

---

# PHASE 21-23: Admin Modules

## Module 21: Settings (settings/)

Organization settings management.

```javascript
// org-settings.model.js
organizationId,
workingHours: { start, end },
timezone, dateFormat, currency,
emailNotifications, slackIntegration
```

## Module 22: Audit Logs (audit-logs/)

Track all important actions.

```javascript
// audit-logs.model.js
organizationId, userId, action, entity,
entityId, oldValue, newValue, ipAddress, timestamp
```

## Module 23: Automation Jobs (automation-or-job/)

Cron jobs for:
- Auto logout at work end time
- Daily report generation
- Subscription expiry check
- Task visibility update (hide expired)
- Attendance reminder

---

# 🔌 Main Routes File

## `src/routes.js`

```javascript
import express from 'express';

// Import route modules
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/routes.js';
import organizationRoutes from './modules/organizations/routes.js';
import roleRoutes from './modules/roles/roles.routes.js';
import permissionRoutes from './modules/permissions/permissions.routes.js';
import teamRoutes from './modules/teams/teams.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import leaveRoutes from './modules/leaves/leaves.routes.js';
import taskRoutes from './modules/tasks/tasks.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import subscriptionRoutes from './modules/subscriptions/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import auditRoutes from './modules/audit-logs/audit-logs.routes.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/teams', teamRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/billing', billingRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
```

---

# ✅ Implementation Checklist

## Phase 1: Foundation
- [ ] Config files (env, db, redis)
- [ ] Utility functions
- [ ] Core middlewares

## Phase 2-3: Auth & Organizations
- [ ] Organization model & CRUD
- [ ] Auth service (register, login, tokens)
- [ ] Auth middleware

## Phase 4-6: Users & RBAC
- [ ] User model & CRUD
- [ ] Permission constants
- [ ] Role model & CRUD
- [ ] Permission middleware

## Phase 7-10: Teams & Structure
- [ ] Team model & CRUD
- [ ] Membership tracking
- [ ] Hierarchy management
- [ ] Policies setup

## Phase 11-13: Core Features
- [ ] Attendance tracking
- [ ] Leave management
- [ ] Task management

## Phase 14-16: Support Features
- [ ] Approval workflows
- [ ] Notifications
- [ ] Performance tracking

## Phase 17-20: Billing
- [ ] Plans & billing
- [ ] Subscriptions
- [ ] Payments & webhooks

## Phase 21-23: Admin
- [ ] Settings
- [ ] Audit logs
- [ ] Cron jobs

---

# 🚀 Getting Started

1. **Start with Phase 1** - Set up configs and utilities
2. **Build Phase 2-3** - Get auth working
3. **Add Phase 4-6** - Complete RBAC
4. **Continue sequentially** - Each phase builds on previous

Each module can be tested independently before moving to the next.

---

**Total Modules: 23**
**Estimated Development Time: 8-10 weeks (1 developer)**
