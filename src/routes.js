// src/routes.js

import express from "express";

const router = express.Router();

/* -------------------------------------------------
   MODULE ROUTE IMPORTS
------------------------------------------------- */

// Auth & User
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
// Organization & Membership
import organizationRoutes from "./modules/organizations/organization.routes.js";
import membershipRoutes from "./modules/memberships/organization-memberships.routes.js";

// RBAC
import roleRoutes from "./modules/roles/role.routes.js";
import permissionRoutes from "./modules/permissions/permission.routes.js";

// Core Features
import teamRoutes from "./modules/teams/team.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import leaveRoutes from "./modules/leaves/leave.routes.js";
import approvalRoutes from "./modules/approvals/approval.routes.js";

// Performance & Reports
import performanceRoutes from "./modules/performance/performance.routes.js";

// Documents
import documentRoutes from "./modules/documents/document.routes.js";

// Notifications
import notificationRoutes from "./modules/notifications/notification.routes.js";

// Billing & Subscription
import billingRoutes from "./modules/billing/billing.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";

/* -------------------------------------------------
   BASE ROUTES
------------------------------------------------- */

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});

/* -------------------------------------------------
   ROUTE REGISTRATION
------------------------------------------------- */

// Auth
router.use("/auth", authRoutes);

// Users
router.use("/users", userRoutes);

// Organization & Membership
router.use("/organizations", organizationRoutes);
router.use("/memberships", membershipRoutes);

// RBAC
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);

// Teams & Tasks
router.use("/teams", teamRoutes);
router.use("/tasks", taskRoutes);

// Attendance & Leave
router.use("/attendance", attendanceRoutes);
router.use("/leaves", leaveRoutes);
router.use("/approvals", approvalRoutes);

// Performance & Reports
router.use("/performance", performanceRoutes);

// Documents
router.use("/documents", documentRoutes);

// Notifications
router.use("/notifications", notificationRoutes);

// Billing & Subscription
router.use("/billing", billingRoutes);
router.use("/payments", paymentRoutes);
router.use("/subscriptions", subscriptionRoutes);

export default router;
