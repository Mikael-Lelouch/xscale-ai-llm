/**
 * PHASE 5: Session Management Module
 * Handles user sessions, timeouts, and concurrent session limits
 */

const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new session
 * @param {object} params - Session parameters
 * @returns {Promise<object>} Session record
 */
async function createSession(params) {
  const {
    user_id,
    ip_address,
    user_agent,
    login_method = "password",
    mfa_verified = false,
  } = params;

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  try {
    const session = await prisma.user_sessions.create({
      data: {
        user_id,
        session_token: sessionToken,
        ip_address,
        user_agent,
        login_method,
        mfa_verified,
        expires_at: expiresAt,
        is_active: true,
      },
    });

    return {
      success: true,
      session,
      token: sessionToken,
    };
  } catch (error) {
    console.error("[SESSION] Error creating session:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify and validate a session token
 * @param {string} token - Session token
 * @returns {Promise<object>} Validation result with session data
 */
async function validateSession(token) {
  if (!token) {
    return {
      valid: false,
      reason: "No token provided",
    };
  }

  try {
    const session = await prisma.user_sessions.findUnique({
      where: { session_token: token },
      include: { user: true },
    });

    if (!session) {
      return {
        valid: false,
        reason: "Session not found",
      };
    }

    // Check if session is active
    if (!session.is_active) {
      return {
        valid: false,
        reason: "Session has been terminated",
        terminationReason: session.termination_reason,
      };
    }

    // Check if session has expired
    if (new Date() > session.expires_at) {
      await terminateSession(token, "timeout");
      return {
        valid: false,
        reason: "Session expired",
      };
    }

    // Check if MFA is required and verified
    if (session.mfa_verified === false) {
      return {
        valid: false,
        reason: "MFA verification required",
        requiresMFA: true,
      };
    }

    // Update last activity
    await prisma.user_sessions.update({
      where: { session_token: token },
      data: { last_activity: new Date() },
    });

    return {
      valid: true,
      session,
      userId: session.user_id,
      user: session.user,
    };
  } catch (error) {
    console.error("[SESSION] Error validating session:", error.message);
    return {
      valid: false,
      reason: "Session validation error",
    };
  }
}

/**
 * Update session last activity
 * @param {string} token - Session token
 * @returns {Promise<object>}
 */
async function updateSessionActivity(token) {
  try {
    return await prisma.user_sessions.update({
      where: { session_token: token },
      data: { last_activity: new Date() },
    });
  } catch (error) {
    console.error("[SESSION] Error updating activity:", error.message);
    return null;
  }
}

/**
 * Terminate a session
 * @param {string} token - Session token
 * @param {string} reason - Termination reason
 * @returns {Promise<object>}
 */
async function terminateSession(token, reason = "logout") {
  try {
    return await prisma.user_sessions.update({
      where: { session_token: token },
      data: {
        is_active: false,
        terminated_at: new Date(),
        termination_reason: reason,
      },
    });
  } catch (error) {
    console.error("[SESSION] Error terminating session:", error.message);
    return null;
  }
}

/**
 * Terminate all user sessions
 * @param {number} user_id - User ID
 * @returns {Promise<number>} Count of terminated sessions
 */
async function terminateAllUserSessions(user_id, reason = "user_logout") {
  try {
    const result = await prisma.user_sessions.updateMany({
      where: {
        user_id,
        is_active: true,
      },
      data: {
        is_active: false,
        terminated_at: new Date(),
        termination_reason: reason,
      },
    });

    return result.count;
  } catch (error) {
    console.error("[SESSION] Error terminating all sessions:", error.message);
    return 0;
  }
}

/**
 * Get user's active sessions
 * @param {number} user_id - User ID
 * @returns {Promise<Array>} Array of active sessions
 */
async function getUserActiveSessions(user_id) {
  try {
    return await prisma.user_sessions.findMany({
      where: {
        user_id,
        is_active: true,
        expires_at: {
          gt: new Date(),
        },
      },
      select: {
        session_token: true,
        ip_address: true,
        user_agent: true,
        login_method: true,
        mfa_verified: true,
        created_at: true,
        last_activity: true,
        expires_at: true,
      },
      orderBy: { created_at: "desc" },
    });
  } catch (error) {
    console.error("[SESSION] Error getting user sessions:", error.message);
    return [];
  }
}

/**
 * Check concurrent session limit and enforce policy
 * @param {number} user_id - User ID
 * @param {number} maxSessions - Maximum concurrent sessions (default: 3)
 * @returns {Promise<object>} Status and action taken
 */
async function enforceConcurrentSessionLimit(user_id, maxSessions = 3) {
  try {
    // Get active sessions
    const activeSessions = await getUserActiveSessions(user_id);

    if (activeSessions.length >= maxSessions) {
      // Terminate oldest session
      const oldestSession = activeSessions[activeSessions.length - 1];
      await terminateSession(oldestSession.session_token, "concurrent_limit_exceeded");

      return {
        limitEnforced: true,
        message: `Terminated oldest session to enforce limit of ${maxSessions}`,
        terminatedToken: oldestSession.session_token,
      };
    }

    return {
      limitEnforced: false,
      activeSessions: activeSessions.length,
      message: `User has ${activeSessions.length} active sessions`,
    };
  } catch (error) {
    console.error("[SESSION] Error enforcing concurrent limit:", error.message);
    return {
      limitEnforced: false,
      error: error.message,
    };
  }
}

/**
 * Cleanup expired sessions
 * @returns {Promise<number>} Count of deleted sessions
 */
async function cleanupExpiredSessions() {
  try {
    const result = await prisma.user_sessions.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    console.log(`[SESSION] Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    console.error("[SESSION] Error cleaning up sessions:", error.message);
    return 0;
  }
}

/**
 * Cleanup terminated sessions older than 30 days
 * @returns {Promise<number>} Count of deleted sessions
 */
async function cleanupTerminatedSessions(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.user_sessions.deleteMany({
      where: {
        is_active: false,
        terminated_at: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[SESSION] Cleaned up ${result.count} old terminated sessions`);
    return result.count;
  } catch (error) {
    console.error("[SESSION] Error cleaning up terminated sessions:", error.message);
    return 0;
  }
}

/**
 * Get session statistics
 * @returns {Promise<object>} Session statistics
 */
async function getSessionStatistics() {
  try {
    const activeSessions = await prisma.user_sessions.count({
      where: {
        is_active: true,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    const expiredSessions = await prisma.user_sessions.count({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    const terminatedSessions = await prisma.user_sessions.count({
      where: {
        is_active: false,
      },
    });

    return {
      activeSessions,
      expiredSessions,
      terminatedSessions,
      totalSessions: activeSessions + expiredSessions + terminatedSessions,
    };
  } catch (error) {
    console.error("[SESSION] Error getting statistics:", error.message);
    return null;
  }
}

module.exports = {
  createSession,
  validateSession,
  updateSessionActivity,
  terminateSession,
  terminateAllUserSessions,
  getUserActiveSessions,
  enforceConcurrentSessionLimit,
  cleanupExpiredSessions,
  cleanupTerminatedSessions,
  getSessionStatistics,
};
