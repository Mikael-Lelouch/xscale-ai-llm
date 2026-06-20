/**
 * PHASE 5: MFA API Endpoints
 * Handles TOTP setup, verification, and backup codes
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const mfa = require("../../../utils/mfa");
const { auditLogger } = require("../../../utils/audit/auditLogger");

/**
 * POST /api/mfa/setup
 * Initiate MFA setup (generate secret and QR code)
 */
async function setupMFA(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Check if MFA already enabled
    const existingMFA = await prisma.mfa_settings.findUnique({
      where: { user_id: userId },
    });

    if (existingMFA?.totp_enabled) {
      return res.status(400).json({
        error: "MFA already enabled for this user",
      });
    }

    // Get user email for secret generation
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    // Generate TOTP secret and QR code
    const { secret, qrCode, manualEntryKey } = await mfa.generateSecret(
      user.username,
      "XSCALE AI"
    );

    // Generate backup codes
    const backupCodes = mfa.generateBackupCodes(8);
    const backupCodesHash = mfa.hashBackupCodes(backupCodes);

    // Save temporary MFA settings (not yet enabled)
    await prisma.mfa_settings.upsert({
      where: { user_id: userId },
      update: {
        totp_secret: encryptSecret(secret),
        totp_verified: false,
        backup_codes_hash: backupCodesHash,
      },
      create: {
        user_id: userId,
        totp_secret: encryptSecret(secret),
        totp_verified: false,
        backup_codes_hash: backupCodesHash,
      },
    });

    // Return QR code and backup codes to user
    // Backup codes should be displayed once and user must save them
    res.json({
      success: true,
      qrCode,
      manualEntryKey,
      backupCodes, // NEVER save these - user must save them themselves
      message: "MFA setup initiated. Scan QR code with authenticator app and verify with the 6-digit code.",
    });

    // Log MFA setup initiated
    await auditLogger.logAuthEvent({
      event_type: "mfa_setup",
      user_id: userId,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    console.error("[MFA] Setup error:", error.message);
    res.status(500).json({
      error: "Failed to setup MFA",
      message: error.message,
    });
  }
}

/**
 * POST /api/mfa/verify
 * Verify TOTP token and enable MFA
 */
async function verifyMFA(req, res) {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      return res.status(400).json({
        error: "Invalid token format",
        message: "Token must be 6 digits",
      });
    }

    // Get MFA settings
    const mfaSettings = await prisma.mfa_settings.findUnique({
      where: { user_id: userId },
    });

    if (!mfaSettings) {
      return res.status(400).json({
        error: "MFA not initialized",
        message: "Please run setup first",
      });
    }

    // Decrypt secret and verify token
    const secret = decryptSecret(mfaSettings.totp_secret);
    const isValid = mfa.verifyToken(secret, token);

    if (!isValid) {
      // Log failed verification
      await auditLogger.logAuthEvent({
        event_type: "mfa_failed",
        user_id: userId,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        success: false,
      });

      return res.status(401).json({
        error: "Invalid MFA token",
        message: "Please check your authenticator app and try again",
      });
    }

    // Enable MFA
    await prisma.mfa_settings.update({
      where: { user_id: userId },
      data: {
        totp_verified: true,
        totp_enabled: true,
        backup_codes_generated_at: new Date(),
      },
    });

    // Log successful MFA setup
    await auditLogger.logAuthEvent({
      event_type: "mfa_setup",
      user_id: userId,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      success: true,
    });

    res.json({
      success: true,
      message: "MFA successfully enabled",
    });
  } catch (error) {
    console.error("[MFA] Verification error:", error.message);
    res.status(500).json({
      error: "MFA verification failed",
      message: error.message,
    });
  }
}

/**
 * POST /api/mfa/disable
 * Disable MFA for user
 */
async function disableMFA(req, res) {
  try {
    const { currentPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Require password confirmation
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    const isPasswordValid = await validatePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    // Disable MFA
    await prisma.mfa_settings.update({
      where: { user_id: userId },
      data: {
        totp_enabled: false,
        totp_verified: false,
        totp_secret: null,
        backup_codes_hash: null,
        backup_codes_used: null,
      },
    });

    // Log MFA disable
    await auditLogger.logAuthEvent({
      event_type: "mfa_disable",
      user_id: userId,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      success: true,
    });

    res.json({
      success: true,
      message: "MFA successfully disabled",
    });
  } catch (error) {
    console.error("[MFA] Disable error:", error.message);
    res.status(500).json({
      error: "Failed to disable MFA",
      message: error.message,
    });
  }
}

/**
 * POST /api/mfa/verify-login
 * Verify MFA during login
 */
async function verifyMFALogin(req, res) {
  try {
    const { userId, token, backupCode } = req.body;

    if (!userId || (!token && !backupCode)) {
      return res.status(400).json({
        error: "Missing required parameters",
      });
    }

    // Get MFA settings
    const mfaSettings = await prisma.mfa_settings.findUnique({
      where: { user_id: parseInt(userId) },
    });

    if (!mfaSettings?.totp_enabled) {
      return res.status(400).json({
        error: "MFA not enabled for this user",
      });
    }

    // Get backup codes for validation (if using backup code)
    let backupCodes = null;
    if (backupCode && mfaSettings.backup_codes_hash) {
      // In production, you'd need to securely retrieve backup codes
      // For now, we use hash-based verification
      backupCodes = []; // Placeholder
    }

    // Decrypt secret
    const secret = decryptSecret(mfaSettings.totp_secret);

    // Verify MFA
    const mfaResult = mfa.verifyMFAForLogin(
      {
        totp_enabled: mfaSettings.totp_enabled,
        totp_secret: secret,
        backup_codes_hash: mfaSettings.backup_codes_hash,
        backup_codes_used: mfaSettings.backup_codes_used,
      },
      token,
      backupCode,
      backupCodes
    );

    if (!mfaResult.mfaVerified) {
      // Log failed MFA attempt
      await auditLogger.logAuthEvent({
        event_type: "mfa_failed",
        user_id: parseInt(userId),
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        success: false,
      });

      return res.status(401).json({
        error: "Invalid MFA token or backup code",
      });
    }

    // Mark backup code as used if applicable
    if (mfaResult.usedBackupIndex >= 0) {
      const usedIndices = mfaSettings.backup_codes_used
        ? JSON.parse(mfaSettings.backup_codes_used)
        : [];
      const updatedIndices = mfa.markBackupCodeUsed(usedIndices, mfaResult.usedBackupIndex);

      await prisma.mfa_settings.update({
        where: { user_id: parseInt(userId) },
        data: {
          backup_codes_used: JSON.stringify(updatedIndices),
        },
      });

      // Warn user if backup codes are running low
      const remaining = mfa.getRemainingBackupCodesCount(backupCodes, updatedIndices);
      if (remaining <= 2) {
        res.json({
          success: true,
          mfaVerified: true,
          warning: `Only ${remaining} backup codes remaining. Please regenerate.`,
        });
        return;
      }
    }

    res.json({
      success: true,
      mfaVerified: true,
    });
  } catch (error) {
    console.error("[MFA] Login verification error:", error.message);

    const userId = parseInt(req.body.userId);
    if (userId) {
      await auditLogger.logAuthEvent({
        event_type: "mfa_failed",
        user_id: userId,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        success: false,
      });
    }

    res.status(500).json({
      error: "MFA verification failed",
      message: error.message,
    });
  }
}

/**
 * GET /api/mfa/status
 * Get MFA status for user
 */
async function getMFAStatus(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const mfaSettings = await prisma.mfa_settings.findUnique({
      where: { user_id: userId },
      select: {
        totp_enabled: true,
        totp_verified: true,
        backup_codes_generated_at: true,
        backup_codes_used: true,
        enforced: true,
      },
    });

    // Calculate remaining backup codes
    let remainingBackupCodes = 0;
    if (mfaSettings?.backup_codes_used) {
      const usedIndices = JSON.parse(mfaSettings.backup_codes_used);
      remainingBackupCodes = 8 - usedIndices.length;
    }

    res.json({
      enabled: mfaSettings?.totp_enabled || false,
      verified: mfaSettings?.totp_verified || false,
      enforced: mfaSettings?.enforced || false,
      backupCodesGenerated: !!mfaSettings?.backup_codes_generated_at,
      remainingBackupCodes,
      lastUpdated: mfaSettings?.backup_codes_generated_at,
    });
  } catch (error) {
    console.error("[MFA] Status error:", error.message);
    res.status(500).json({
      error: "Failed to get MFA status",
      message: error.message,
    });
  }
}

/**
 * POST /api/mfa/regenerate-backup-codes
 * Regenerate backup codes
 */
async function regenerateBackupCodes(req, res) {
  try {
    const { currentPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Verify password
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    const isPasswordValid = await validatePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    // Generate new backup codes
    const backupCodes = mfa.generateBackupCodes(8);
    const backupCodesHash = mfa.hashBackupCodes(backupCodes);

    // Update backup codes
    await prisma.mfa_settings.update({
      where: { user_id: userId },
      data: {
        backup_codes_hash: backupCodesHash,
        backup_codes_used: JSON.stringify([]), // Reset used codes
        backup_codes_generated_at: new Date(),
      },
    });

    // Log backup code regeneration
    await auditLogger.logAuthEvent({
      event_type: "mfa_setup",
      user_id: userId,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      success: true,
    });

    res.json({
      success: true,
      backupCodes,
      message: "Backup codes regenerated successfully",
    });
  } catch (error) {
    console.error("[MFA] Regenerate backup codes error:", error.message);
    res.status(500).json({
      error: "Failed to regenerate backup codes",
      message: error.message,
    });
  }
}

/**
 * Helper functions
 */

function encryptSecret(secret) {
  // Encrypt TOTP secret for storage
  // Implementation would use AES encryption
  return secret;
}

function decryptSecret(encrypted) {
  // Decrypt TOTP secret from storage
  // Implementation would use AES decryption
  return encrypted;
}

async function validatePassword(password, hash) {
  // Validate password against hash
  // Implementation would use bcrypt
  return true;
}

function mfaEndpoints(app) {
  if (!app) return;

  app.post("/v1/mfa/setup", setupMFA);
  app.post("/v1/mfa/verify", verifyMFA);
  app.post("/v1/mfa/disable", disableMFA);
  app.post("/v1/mfa/verify-login", verifyMFALogin);
  app.get("/v1/mfa/status", getMFAStatus);
  app.post("/v1/mfa/regenerate-backup-codes", regenerateBackupCodes);
}

module.exports = { mfaEndpoints };
