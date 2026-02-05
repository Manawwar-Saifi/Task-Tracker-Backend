import express from "express";

const router = express.Router();
import { razorpayWebhook } from "./modules/payments/webhook.js";

/* -------------------- AUTH -------------------- */
import authRoutes from "./modules/auth/auth.routes.js";

/* -------------------- USERS -------------------- */
import userRoutes from "./modules/users/routes.js";

/* -------------------- ORGANIZATIONS -------------------- */
// import organizationRoutes from "./modules/organizations/organization.routes.js";

/* -------------------- MEMBERSHIPS -------------------- */
// import membershipRoutes from "./modules/memberships/organization-memberships.routes.js";

/* -------------------- ROLES & PERMISSIONS -------------------- */
// import roleRoutes from "./modules/roles/role.routes.js";
// import permissionRoutes from "./modules/permissions/permission.routes.js";

/* -------------------- CORE FEATURES -------------------- */
// import teamRoutes from "./modules/teams/team.routes.js";
// import taskRoutes from "./modules/tasks/task.routes.js";
// import attendanceRoutes from "./modules/attendance/attendance.routes.js";

/* -------------------- LEAVES & APPROVALS -------------------- */
// import leaveRoutes from "./modules/leaves/leave.routes.js";
// import approvalRoutes from "./modules/approvals/approval.routes.js";

/* -------------------- BILLING & SUBSCRIPTION -------------------- */
// import billingRoutes from "./modules/billing/billing.routes.js";
// import paymentRoutes from "./modules/payments/payment.routes.js";
// import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";

/* -------------------- HEALTH CHECK -------------------- */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});
router.post(
  "/webhooks/razorpay",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }),
  razorpayWebhook
);

/* -------------------- ROUTE REGISTRATION -------------------- */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
// router.use("/organizations", organizationRoutes);
// router.use("/memberships", membershipRoutes);
// router.use("/roles", roleRoutes);
// router.use("/permissions", permissionRoutes);
// router.use("/teams", teamRoutes);
// router.use("/tasks", taskRoutes);
// router.use("/attendance", attendanceRoutes);
// router.use("/leaves", leaveRoutes);
// router.use("/approvals", approvalRoutes);
// router.use("/billing", billingRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/subscriptions", subscriptionRoutes);

export default router;
