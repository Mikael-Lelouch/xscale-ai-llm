/**
 * PHASE 5: Multi-Factor Authentication (MFA) Module
 * Implements TOTP and backup codes for enhanced security
 */

const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

/**
 * Generate a new TOTP secret and QR code
 * @param {string} userIdentifier - Email or username
 * @param {string} appName - Application name for display
 * @returns {Promise<object>} { secret, qrCode (data URL), manualEntryKey }
 */
async function generateSecret(userIdentifier, appName = "XSCALE AI") {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${userIdentifier})`,
    issuer: appName,
    length: 32, // Stronger secret
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
    manualEntryKey: secret.base32,
    otpAuthUrl: secret.otpauth_url,
  };
}

/**
 * Verify a TOTP token
 * @param {string} secret - Base32 encoded secret
 * @param {string} token - 6-digit code from authenticator
 * @param {number} window - Time window tolerance (default: 1 = 30 second intervals)
 * @returns {boolean} True if token is valid
 */
function verifyToken(secret, token, window = 1) {
  if (!secret || !token) {
    return false;
  }

  try {
    // speakeasy allows ±1 time window by default, which is good for clock skew
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window,
    });

    return verified;
  } catch (error) {
    console.error("[MFA] Token verification error:", error.message);
    return false;
  }
}

/**
 * Check if a backup code is valid
 * @param {string} code - User-provided backup code
 * @param {string} backupCodesHash - Stored hash
 * @param {string} usedCodesJson - JSON array of used code indices
 * @param {Array<string>} allBackupCodes - All generated backup codes
 * @returns {object} { valid: boolean, index: number (of code) }
 */
function isValidBackupCode(code, backupCodesHash, usedCodesJson, allBackupCodes) {
  if (!code || !allBackupCodes || allBackupCodes.length === 0) {
    return { valid: false, index: -1 };
  }

  try {
    const usedIndices = usedCodesJson ? JSON.parse(usedCodesJson) : [];

    // Find matching code
    for (let i = 0; i < allBackupCodes.length; i++) {
      if (usedIndices.includes(i)) {
        // Code already used
        continue;
      }

      // Compare hashes to avoid timing attacks
      const codeHash = hashBackupCode(allBackupCodes[i]);
      if (constantTimeCompare(codeHash, hashBackupCode(code))) {
        return { valid: true, index: i };
      }
    }

    return { valid: false, index: -1 };
  } catch (error) {
    console.error("[MFA] Backup code validation error:", error.message);
    return { valid: false, index: -1 };
  }
}

/**
 * Generate backup codes
 * @param {number} count - Number of codes to generate (default: 8)
 * @returns {Array<string>} Array of backup codes
 */
function generateBackupCodes(count = 8) {
  const codes = [];

  for (let i = 0; i < count; i++) {
    // Generate 32-bit random number, format as 8 hex digits
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash a backup code (for storage)
 * @param {string} code - Backup code
 * @returns {string} SHA256 hash
 */
function hashBackupCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Hash all backup codes for storage
 * @param {Array<string>} codes - Array of backup codes
 * @returns {string} SHA256 hash of concatenated codes
 */
function hashBackupCodes(codes) {
  const concatenated = codes.join("|");
  return crypto.createHash("sha256").update(concatenated).digest("hex");
}

/**
 * Mark a backup code as used
 * @param {Array<number>} usedIndices - Current used indices
 * @param {number} codeIndex - Index of code to mark as used
 * @returns {Array<number>} Updated indices array
 */
function markBackupCodeUsed(usedIndices, codeIndex) {
  if (!usedIndices.includes(codeIndex)) {
    usedIndices.push(codeIndex);
  }
  return usedIndices;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
function constantTimeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }

  return result === 0;
}

/**
 * Get remaining backup codes count
 * @param {Array<string>} allCodes - All codes
 * @param {Array<number>} usedIndices - Used code indices
 * @returns {number} Count of remaining unused codes
 */
function getRemainingBackupCodesCount(allCodes, usedIndices) {
  if (!allCodes || allCodes.length === 0) {
    return 0;
  }
  return allCodes.length - (usedIndices ? usedIndices.length : 0);
}

/**
 * Verify MFA is complete for login
 * @param {object} mfaSettings - MFA settings from database
 * @param {string} totpToken - User-provided TOTP token (optional)
 * @param {string} backupCode - User-provided backup code (optional)
 * @param {Array<string>} backupCodes - All backup codes (required if using backup)
 * @returns {object} { mfaRequired: boolean, mfaVerified: boolean, usedBackupIndex: number }
 */
function verifyMFAForLogin(mfaSettings, totpToken, backupCode, backupCodes) {
  // Check if MFA is actually enabled
  if (!mfaSettings || !mfaSettings.totp_enabled) {
    return {
      mfaRequired: false,
      mfaVerified: true, // No MFA needed
      usedBackupIndex: -1,
    };
  }

  let mfaVerified = false;
  let usedBackupIndex = -1;

  // Try TOTP first
  if (totpToken && mfaSettings.totp_secret) {
    mfaVerified = verifyToken(mfaSettings.totp_secret, totpToken);
  }

  // Fall back to backup code if TOTP fails
  if (!mfaVerified && backupCode && backupCodes && backupCodes.length > 0) {
    const usedIndices = mfaSettings.backup_codes_used
      ? JSON.parse(mfaSettings.backup_codes_used)
      : [];
    const backupCodeResult = isValidBackupCode(
      backupCode,
      mfaSettings.backup_codes_hash,
      mfaSettings.backup_codes_used,
      backupCodes
    );

    if (backupCodeResult.valid) {
      mfaVerified = true;
      usedBackupIndex = backupCodeResult.index;
    }
  }

  return {
    mfaRequired: true,
    mfaVerified,
    usedBackupIndex,
  };
}

module.exports = {
  generateSecret,
  verifyToken,
  isValidBackupCode,
  generateBackupCodes,
  hashBackupCode,
  hashBackupCodes,
  markBackupCodeUsed,
  constantTimeCompare,
  getRemainingBackupCodesCount,
  verifyMFAForLogin,
};
