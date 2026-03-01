/**
 * Subscription Routes
 *
 * Routes for subscription and plan management.
 */
import express from "express";
import * as controller from "./subscription.controller.js";
import * as validation from "./subscription.validation.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * Public subscription routes (authenticated users)
 */

// Get available plans
router.get("/plans", validate(validation.getPlansSchema), controller.getPlans);

// Get current subscription
router.get("/", controller.getSubscription);

// Update subscription settings
router.put("/", validate(validation.updateSubscriptionSchema), controller.updateSubscription);

// Upgrade plan
router.put("/upgrade", validate(validation.upgradePlanSchema), controller.upgradePlan);

// Cancel subscription
router.post("/cancel", validate(validation.cancelSubscriptionSchema), controller.cancelSubscription);

// Renew subscription
router.post("/renew", controller.renewSubscription);

// Update usage stats
router.put("/usage", validate(validation.updateUsageSchema), controller.updateUsage);

// Check feature access
router.get("/features/:feature", controller.checkFeature);

// Check usage limits
router.get("/limits/:limitType", controller.checkLimit);

/**
 * Admin routes (for platform administrators)
 */

// Get subscription statistics
router.get("/stats", controller.getStats);

// Get all subscriptions
router.get("/all", controller.getAllSubscriptions);

export default router;
