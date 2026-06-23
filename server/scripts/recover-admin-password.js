#!/usr/bin/env node
/**
 * Admin Password Recovery Script
 *
 * Usage: node recover-admin-password.js
 *
 * This script generates new recovery codes for the admin user.
 * Use these codes to recover your account through the UI.
 */

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "production"}`,
});

const prisma = require("../utils/prisma");
const { generateRecoveryCodes } = require("../utils/PasswordRecovery");

/**
 * Retrieves admin user and generates new recovery codes
 * Displays the 4 recovery codes and instructions for account recovery
 * User needs any 2 of 4 codes to recover their account
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If admin user is not found or code generation fails
 */
async function recoverAdminPassword() {
  try {
    console.log("🔍 Looking for admin user...\n");

    // Find admin user (assuming 'admin' is the username or first user with admin role)
    const adminUser = await prisma.users.findFirst({
      where: {
        role: "admin",
      },
    });

    if (!adminUser) {
      console.error("❌ No admin user found in the database");
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.username} (ID: ${adminUser.id})\n`);

    console.log("🔄 Generating new recovery codes...\n");
    const newRecoveryCodes = await generateRecoveryCodes(adminUser.id);

    console.log("✅ New recovery codes generated!\n");
    console.log("═".repeat(60));
    console.log("📝 SAVE THESE CODES IN A SECURE LOCATION");
    console.log("═".repeat(60));
    console.log("\nYou need any 2 of these 4 codes to recover your account:\n");

    newRecoveryCodes.forEach((code, index) => {
      console.log(`  ${index + 1}. ${code}`);
    });

    console.log("\n" + "═".repeat(60));
    console.log("\n📋 Next steps:\n");
    console.log("1. Go to your login page");
    console.log("2. Click 'Forgot Password' or 'Recover Account'");
    console.log("3. Enter your username: " + adminUser.username);
    console.log("4. Enter any 2 of the recovery codes above");
    console.log("5. You'll receive a reset token to set a new password\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

recoverAdminPassword();
