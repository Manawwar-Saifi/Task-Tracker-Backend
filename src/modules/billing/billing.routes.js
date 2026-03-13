/**
 * Billing Routes
 *
 * Endpoints for subscription and payment management.
 * Organization context is extracted from JWT token.
 */
import express from "express";
import * as billingController from "./billing.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Public routes
 */

// Get all available plans (public)
router.get("/plans", billingController.getPlans);

// Razorpay webhook (public, verified by signature)
router.post("/webhook", billingController.handleWebhook);

/**
 * Protected routes (require authentication)
 */
router.use(authMiddleware);

// Get current subscription
router.get("/subscription", billingController.getCurrentSubscription);

// Get usage stats
router.get("/usage", billingController.getUsage);

// Create checkout session (owner only)
router.post("/checkout", billingController.createCheckout);

// Verify payment and activate subscription (owner only)
router.post("/verify-payment", billingController.verifyPayment);

// Cancel subscription (owner only)
router.post("/cancel", billingController.cancelSubscription);

export default router;
