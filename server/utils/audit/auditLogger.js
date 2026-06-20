/**
 * PHASE 5: Audit Logging Module
 * Comprehensive audit trail for compliance and security
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Audit event severity levels
 */
const SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
};

/**
 * Audit event types
 */
const EVENT_TYPES = {
  // Authentication
  LOGIN: "login",
  LOGOUT: "logout",
  LOGIN_FAILED: "login_failed",
  MFA_SETUP: "mfa_setup",
  MFA_DISABLE: "mfa_disable",
  MFA_VERIFY: "mfa_verify",
  MFA_FAILED: "mfa_failed",

  // User management
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  USER_SUSPENDED: "user_suspended",
  USER_UNSUSPENDED: "user_unsuspended",
  USER_ROLE_CHANGED: "user_role_changed",

  // SSO
  SSO_CONFIG_CREATED: "sso_config_created",
  SSO_CONFIG_UPDATED: "sso_config_updated",
  SSO_CONFIG_DELETED: "sso_config_deleted",
  SSO_LOGIN: "sso_login",

  // API keys
  API_KEY_CREATED: "api_key_created",
  API_KEY_ROTATED: "api_key_rotated",
  API_KEY_REVOKED: "api_key_revoked",
  API_KEY_USED: "api_key_used",

  // Permissions & Access
  PERMISSION_GRANTED: "permission_granted",
  PERMISSION_REVOKED: "permission_revoked",
  WORKSPACE_ACCESS_GRANTED: "workspace_access_granted",
  WORKSPACE_ACCESS_REVOKED: "workspace_access_revoked",

  // Security
  IP_WHITELIST_ADDED: "ip_whitelist_added",
  IP_WHITELIST_REMOVED: "ip_whitelist_removed",
  DEVICE_TRUSTED: "device_trusted",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  ACCOUNT_LOCKED: "account_locked",

  // Data access
  DATA_ACCESSED: "data_accessed",
  DATA_EXPORTED: "data_exported",
  DATA_DELETED: "data_deleted",

  // Admin actions
  ADMIN_ACTION: "admin_action",
  COMPLIANCE_CHECK: "compliance_check",
};

/**
 * Log an audit event
 * @param {object} params - Event parameters
 * @returns {Promise<object>} Created audit log
 */
async function logAuditEvent(params) {
  const {
    event_type,
    event_name,
    resource_type,
    resource_id,
    user_id,
    actor_id,
    status = "success",
    ip_address,
    user_agent,
    metadata = {},
    severity = SEVERITY.INFO,
  } = params;

  try {
    const auditLog = await prisma.audit_logs.create({
      data: {
        event_type,
        event_name,
        resource_type,
        resource_id,
        user_id,
        actor_id,
        status,
        ip_address,
        user_agent,
        metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata),
        severity,
        created_at: new Date(),
      },
    });

    // Log to console for real-time monitoring in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUDIT] ${event_type} (${status}):`, {
        resource_type,
        user_id,
        actor_id,
        severity,
      });
    }

    return auditLog;
  } catch (error) {
    console.error("[AUDIT ERROR]", error.message);
    // Don't throw - audit logging should never break the application
    return null;
  }
}

/**
 * Log authentication event
 * @param {object} params - Event parameters
 * @returns {Promise<object>}
 */
async function logAuthEvent(params) {
  const {
    event_type,
    user_id,
    ip_address,
    user_agent,
    method = "password",
    mfa_verified = false,
    success = true,
  } = params;

  const eventName = {
    [EVENT_TYPES.LOGIN]: "User login",
    [EVENT_TYPES.LOGOUT]: "User logout",
    [EVENT_TYPES.LOGIN_FAILED]: "Failed login attempt",
    [EVENT_TYPES.MFA_VERIFY]: "MFA verification",
    [EVENT_TYPES.MFA_FAILED]: "MFA verification failed",
  }[event_type] || "Authentication event";

  return logAuditEvent({
    event_type,
    event_name: eventName,
    resource_type: "user",
    resource_id: user_id,
    user_id: event_type === EVENT_TYPES.LOGIN_FAILED ? null : user_id,
    status: success ? "success" : "failure",
    ip_address,
    user_agent,
    metadata: {
      method,
      mfa_verified,
    },
    severity: success ? SEVERITY.INFO : SEVERITY.WARNING,
  });
}

/**
 * Log user management event
 * @param {object} params - Event parameters
 * @returns {Promise<object>}
 */
async function logUserManagementEvent(params) {
  const {
    event_type,
    user_id,
    actor_id,
    changes = {},
  } = params;

  const eventNames = {
    [EVENT_TYPES.USER_CREATED]: "User created",
    [EVENT_TYPES.USER_UPDATED]: "User updated",
    [EVENT_TYPES.USER_DELETED]: "User deleted",
    [EVENT_TYPES.USER_SUSPENDED]: "User suspended",
    [EVENT_TYPES.USER_UNSUSPENDED]: "User unsuspended",
    [EVENT_TYPES.USER_ROLE_CHANGED]: "User role changed",
  };

  return logAuditEvent({
    event_type,
    event_name: eventNames[event_type] || "User management event",
    resource_type: "user",
    resource_id: user_id,
    user_id,
    actor_id,
    metadata: changes,
    severity: SEVERITY.INFO,
  });
}

/**
 * Log SSO event
 * @param {object} params - Event parameters
 * @returns {Promise<object>}
 */
async function logSSOEvent(params) {
  const {
    event_type,
    user_id,
    provider,
    workspace_id,
    success = true,
  } = params;

  const eventNames = {
    [EVENT_TYPES.SSO_CONFIG_CREATED]: "SSO configuration created",
    [EVENT_TYPES.SSO_CONFIG_UPDATED]: "SSO configuration updated",
    [EVENT_TYPES.SSO_CONFIG_DELETED]: "SSO configuration deleted",
    [EVENT_TYPES.SSO_LOGIN]: "SSO login",
  };

  return logAuditEvent({
    event_type,
    event_name: eventNames[event_type] || "SSO event",
    resource_type: "sso_integration",
    user_id,
    status: success ? "success" : "failure",
    metadata: {
      provider,
      workspace_id,
    },
    severity: success ? SEVERITY.INFO : SEVERITY.WARNING,
  });
}

/**
 * Log API key event
 * @param {object} params - Event parameters
 * @returns {Promise<object>}
 */
async function logAPIKeyEvent(params) {
  const {
    event_type,
    api_key_id,
    user_id,
    actor_id,
    name,
  } = params;

  const eventNames = {
    [EVENT_TYPES.API_KEY_CREATED]: "API key created",
    [EVENT_TYPES.API_KEY_ROTATED]: "API key rotated",
    [EVENT_TYPES.API_KEY_REVOKED]: "API key revoked",
    [EVENT_TYPES.API_KEY_USED]: "API key used",
  };

  return logAuditEvent({
    event_type,
    event_name: eventNames[event_type] || "API key event",
    resource_type: "api_key",
    resource_id: api_key_id,
    user_id: user_id || actor_id,
    actor_id,
    metadata: {
      key_name: name,
    },
    severity: event_type === EVENT_TYPES.API_KEY_REVOKED ? SEVERITY.WARNING : SEVERITY.INFO,
  });
}

/**
 * Log suspicious activity
 * @param {object} params - Event parameters
 * @returns {Promise<object>}
 */
async function logSuspiciousActivity(params) {
  const {
    user_id,
    activity_type,
    ip_address,
    user_agent,
    details = {},
  } = params;

  return logAuditEvent({
    event_type: EVENT_TYPES.SUSPICIOUS_ACTIVITY,
    event_name: `Suspicious activity detected: ${activity_type}`,
    resource_type: "user",
    resource_id: user_id,
    user_id,
    status: "failure",
    ip_address,
    user_agent,
    metadata: {
      activity_type,
      ...details,
    },
    severity: SEVERITY.CRITICAL,
  });
}

/**
 * Get audit logs for a user
 * @param {number} user_id - User ID
 * @param {number} limit - Number of logs to retrieve
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} Audit logs
 */
async function getUserAuditLogs(user_id, limit = 50, offset = 0) {
  try {
    return await prisma.audit_logs.findMany({
      where: {
        OR: [
          { user_id },
          { actor_id: user_id },
        ],
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    console.error("[AUDIT ERROR]", error.message);
    return [];
  }
}

/**
 * Get audit logs for a workspace
 * @param {number} workspace_id - Workspace ID
 * @param {number} limit - Number of logs to retrieve
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} Audit logs
 */
async function getWorkspaceAuditLogs(workspace_id, limit = 50, offset = 0) {
  try {
    return await prisma.audit_logs.findMany({
      where: {
        metadata: {
          contains: workspace_id.toString(),
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    console.error("[AUDIT ERROR]", error.message);
    return [];
  }
}

/**
 * Get audit logs by event type
 * @param {string} event_type - Event type
 * @param {number} limit - Number of logs to retrieve
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} Audit logs
 */
async function getAuditLogsByEventType(event_type, limit = 50, offset = 0) {
  try {
    return await prisma.audit_logs.findMany({
      where: { event_type },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    console.error("[AUDIT ERROR]", error.message);
    return [];
  }
}

/**
 * Cleanup old audit logs (retention policy)
 * @param {number} retentionDays - Number of days to retain logs (default: 90)
 * @returns {Promise<number>} Count of deleted logs
 */
async function cleanupOldAuditLogs(retentionDays = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.audit_logs.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[AUDIT] Deleted ${result.count} old audit logs (before ${cutoffDate.toISOString()})`);
    return result.count;
  } catch (error) {
    console.error("[AUDIT ERROR] Cleanup failed:", error.message);
    return 0;
  }
}

module.exports = {
  SEVERITY,
  EVENT_TYPES,
  logAuditEvent,
  logAuthEvent,
  logUserManagementEvent,
  logSSOEvent,
  logAPIKeyEvent,
  logSuspiciousActivity,
  getUserAuditLogs,
  getWorkspaceAuditLogs,
  getAuditLogsByEventType,
  cleanupOldAuditLogs,
};
