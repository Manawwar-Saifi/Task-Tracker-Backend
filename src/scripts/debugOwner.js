/**
 * Debug Owner Script - Check database state
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const debugOwner = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected\n");

    // Get collections directly
    const db = mongoose.connection.db;

    // Find all organizations
    const orgs = await db.collection("organizations").find({}).toArray();
    console.log("=== ORGANIZATIONS ===");
    for (const org of orgs) {
      console.log(`\nOrg: ${org.name}`);
      console.log(`  _id: ${org._id}`);
      console.log(`  ownerEmail: ${org.ownerEmail}`);
      console.log(`  ownerUserId: ${org.ownerUserId}`);
      console.log(`  status: ${org.status}`);
    }

    // Find all users
    const users = await db.collection("users").find({ isDeleted: { $ne: true } }).toArray();
    console.log("\n\n=== USERS ===");
    for (const user of users) {
      console.log(`\n${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`  _id: ${user._id}`);
      console.log(`  organizationId: ${user.organizationId}`);
      console.log(`  roleId: ${user.roleId}`);
      console.log(`  isOwner: ${user.isOwner}`);
      console.log(`  isSuperAdmin: ${user.isSuperAdmin}`);
      console.log(`  status: ${user.status}`);
    }

    // Find all roles
    const roles = await db.collection("roles").find({}).toArray();
    console.log("\n\n=== ROLES ===");
    for (const role of roles) {
      console.log(`\n${role.name} (${role.slug})`);
      console.log(`  _id: ${role._id}`);
      console.log(`  level: ${role.level}`);
      console.log(`  permissionCodes count: ${role.permissionCodes?.length || 0}`);
    }

    // Now fix the owner
    console.log("\n\n=== FIXING OWNER ===");
    for (const org of orgs) {
      // Find owner user
      let ownerUser = null;

      if (org.ownerUserId) {
        ownerUser = await db.collection("users").findOne({ _id: org.ownerUserId });
      }

      if (!ownerUser && org.ownerEmail) {
        ownerUser = await db.collection("users").findOne({
          email: org.ownerEmail.toLowerCase(),
          organizationId: org._id
        });
      }

      if (!ownerUser) {
        // Get first user in org
        ownerUser = await db.collection("users").findOne({
          organizationId: org._id
        });
      }

      if (ownerUser) {
        console.log(`\nOwner found: ${ownerUser.firstName} ${ownerUser.lastName}`);

        // Fix isOwner flag
        if (!ownerUser.isOwner) {
          await db.collection("users").updateOne(
            { _id: ownerUser._id },
            { $set: { isOwner: true } }
          );
          console.log("✅ Set isOwner = true");
        } else {
          console.log("✅ isOwner already true");
        }

        // Fix organization ownerUserId
        if (!org.ownerUserId || org.ownerUserId.toString() !== ownerUser._id.toString()) {
          await db.collection("organizations").updateOne(
            { _id: org._id },
            { $set: { ownerUserId: ownerUser._id, ownerEmail: ownerUser.email } }
          );
          console.log("✅ Updated organization ownerUserId and ownerEmail");
        }

        // Find CEO role
        let ceoRole = await db.collection("roles").findOne({
          organizationId: org._id,
          slug: "ceo"
        });

        if (ceoRole) {
          // Update user to have CEO role
          if (ownerUser.roleId?.toString() !== ceoRole._id.toString()) {
            await db.collection("users").updateOne(
              { _id: ownerUser._id },
              { $set: { roleId: ceoRole._id } }
            );
            console.log("✅ Assigned CEO role to owner");
          }

          // Make sure CEO role has level 1
          if (ceoRole.level !== 1) {
            await db.collection("roles").updateOne(
              { _id: ceoRole._id },
              { $set: { level: 1 } }
            );
            console.log("✅ Set CEO role level = 1");
          }
        }
      }
    }

    console.log("\n\n✅ DEBUG AND FIX COMPLETE!");
    console.log("Please restart the backend server and try again.\n");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

debugOwner();
