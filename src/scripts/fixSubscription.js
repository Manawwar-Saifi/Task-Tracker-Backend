/**
 * Fix Subscription Script
 * Checks and fixes subscription issues for organizations
 *
 * Run: node --env-file=.env src/scripts/fixSubscription.js
 */
import mongoose from "mongoose";
import dns from "dns";
import Organization from "../modules/organizations/model.js";

// Use Google DNS for SRV record resolution (fixes router DNS issues)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import Subscription from "../modules/billing/subscription.model.js";
import Plan from "../modules/billing/plan.model.js";

const MONGO_URI = process.env.MONGO_URI;

async function fixSubscriptions() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected!\n");

    // Get all organizations
    const organizations = await Organization.find({ isDeleted: false }).lean();
    console.log(`Found ${organizations.length} organizations\n`);

    // Get Professional plan
    const professionalPlan = await Plan.findOne({ slug: "professional" });
    if (!professionalPlan) {
      console.log("ERROR: Professional plan not found. Run plan seeder first.");
      console.log("Available plans:");
      const plans = await Plan.find({});
      plans.forEach((p) => console.log(`  - ${p.name} (${p.slug})`));
      process.exit(1);
    }

    console.log(`Using Professional plan: ${professionalPlan.name}`);
    console.log(`  Max Users: ${professionalPlan.limits.maxUsers}`);
    console.log(`  Max Teams: ${professionalPlan.limits.maxTeams}\n`);

    for (const org of organizations) {
      console.log(`\n========== ${org.name} ==========`);
      console.log(`Organization ID: ${org._id}`);
      console.log(`Owner Email: ${org.ownerEmail}`);

      // Check subscription
      let subscription = await Subscription.findOne({
        organizationId: org._id,
      }).populate("planId");

      if (!subscription) {
        console.log("❌ No subscription found - CREATING...");

        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

        subscription = await Subscription.create({
          organizationId: org._id,
          planId: professionalPlan._id,
          status: "trial",
          currentPeriod: {
            start: now,
            end: trialEnd,
          },
          trialStartDate: now,
          trialEndDate: trialEnd,
          usage: {
            currentUsers: 1, // At least the owner
            currentTeams: 0,
          },
        });

        console.log("✅ Subscription created!");
      } else {
        console.log(`✅ Subscription exists`);
        console.log(`   Plan: ${subscription.planId?.name || "Unknown"}`);
        console.log(`   Status: ${subscription.status}`);
        console.log(
          `   Teams: ${subscription.usage?.currentTeams || 0}/${subscription.planId?.limits?.maxTeams || "?"}`
        );
        console.log(
          `   Users: ${subscription.usage?.currentUsers || 0}/${subscription.planId?.limits?.maxUsers || "?"}`
        );

        // Check if plan is linked
        if (!subscription.planId) {
          console.log("❌ No plan linked - FIXING...");
          subscription.planId = professionalPlan._id;
          await subscription.save();
          console.log("✅ Plan linked!");
        }

        // Reset team count if it seems wrong
        const actualTeamCount = await mongoose.model("Team").countDocuments({
          organizationId: org._id,
          isDeleted: false,
        });

        if (subscription.usage.currentTeams !== actualTeamCount) {
          console.log(
            `⚠️  Team count mismatch: recorded=${subscription.usage.currentTeams}, actual=${actualTeamCount}`
          );
          subscription.usage.currentTeams = actualTeamCount;
          await subscription.save();
          console.log("✅ Team count corrected!");
        }
      }
    }

    console.log("\n\n========== SUMMARY ==========");
    const allSubs = await Subscription.find({}).populate("planId");
    console.log(`Total subscriptions: ${allSubs.length}`);
    for (const sub of allSubs) {
      console.log(
        `  - Org: ${sub.organizationId}, Plan: ${sub.planId?.name || "None"}, Teams: ${sub.usage?.currentTeams || 0}/${sub.planId?.limits?.maxTeams || "?"}`
      );
    }

    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixSubscriptions();
