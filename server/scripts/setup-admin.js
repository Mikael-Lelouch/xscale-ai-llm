#!/usr/bin/env node
/**
 * Admin Account Setup Script
 *
 * Usage: node setup-admin.js [username] [password]
 *
 * This script creates an admin account for the application.
 * If username/password are not provided, you'll be prompted.
 */

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "production"}`,
});

const prisma = require("../utils/prisma");
const { User } = require("../models/user");
const { generateRecoveryCodes } = require("../utils/PasswordRecovery");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupAdmin() {
  try {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("    Admin Account Setup");
    console.log("═══════════════════════════════════════════════════\n");

    let username = process.argv[2];
    let password = process.argv[3];

    // Get username if not provided
    if (!username) {
      username = await prompt("Enter admin username: ");
      if (!username) {
        console.error("❌ Username cannot be empty");
        process.exit(1);
      }
    }

    // Get password if not provided
    if (!password) {
      password = await prompt("Enter admin password: ");
      if (!password) {
        console.error("❌ Password cannot be empty");
        process.exit(1);
      }
    }

    console.log("\n🔄 Creating admin account...\n");

    // Create the user
    const { user, error } = await User.create({
      username,
      password,
      role: "admin",
    });

    if (error) {
      console.error("❌ Error creating user:", error);
      process.exit(1);
    }

    if (!user) {
      console.error("❌ Failed to create user account");
      process.exit(1);
    }

    console.log(`✅ Admin account created: ${user.username}\n`);

    // Generate recovery codes
    console.log("🔄 Generating recovery codes...\n");
    const recoveryCodes = await generateRecoveryCodes(user.id);

    console.log("═══════════════════════════════════════════════════");
    console.log("📝 SAVE THESE RECOVERY CODES IN A SECURE LOCATION");
    console.log("═══════════════════════════════════════════════════\n");
    console.log("You need any 2 of these 4 codes to recover your account:\n");

    recoveryCodes.forEach((code, index) => {
      console.log(`  ${index + 1}. ${code}`);
    });

    console.log("\n" + "═══════════════════════════════════════════════════");
    console.log("\n✅ Setup complete!\n");
    console.log("You can now log in with:");
    console.log(`  Username: ${username}`);
    console.log(`  Password: (the password you just entered)\n`);
    console.log("🔐 Keep your recovery codes safe. You'll need them to");
    console.log("   recover your account if you forget your password.\n");

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

setupAdmin();
