/**
 * PHASE 5: SSO Configuration Module
 * Centralized configuration for SAML2, OAuth2, and OIDC providers
 */

const path = require("path");

/**
 * Default SSO configuration
 */
const DEFAULT_SSO_CONFIG = {
  // SAML2 Configuration
  saml2: {
    assertion_consumer_service_url: process.env.SAML_ACS_URL || "http://localhost:3001/api/auth/saml/acs",
    issuer: process.env.SAML_ISSUER || "xscale-ai",
    identity_provider_url: process.env.SAML_IDP_URL,
    identity_provider_cert: process.env.SAML_IDP_CERT,
    certificate_path: process.env.SAML_CERT_PATH,
    private_key_path: process.env.SAML_PRIVATE_KEY_PATH,
    want_assertions_signed: true,
    want_response_signed: true,
    authn_request_signed: true,
    name_id_format: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  },

  // OAuth2 / OIDC Configuration
  oauth2: {
    // Google
    google: {
      client_id: process.env.OAUTH_GOOGLE_CLIENT_ID,
      client_secret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
      auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
      token_url: "https://oauth2.googleapis.com/token",
      userinfo_url: "https://openidconnect.googleapis.com/v1/userinfo",
      scopes: ["openid", "email", "profile"],
      redirect_uri: process.env.OAUTH_REDIRECT_URI || "http://localhost:3001/api/auth/oauth/callback",
    },

    // Microsoft / Azure AD
    azure: {
      client_id: process.env.OAUTH_AZURE_CLIENT_ID,
      client_secret: process.env.OAUTH_AZURE_CLIENT_SECRET,
      tenant: process.env.OAUTH_AZURE_TENANT || "common",
      auth_url: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
      token_url: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
      userinfo_url: "https://graph.microsoft.com/v1.0/me",
      scopes: ["openid", "email", "profile"],
      redirect_uri: process.env.OAUTH_REDIRECT_URI || "http://localhost:3001/api/auth/oauth/callback",
    },

    // Generic OIDC
    oidc: {
      discovery_url: process.env.OIDC_DISCOVERY_URL,
      client_id: process.env.OIDC_CLIENT_ID,
      client_secret: process.env.OIDC_CLIENT_SECRET,
      scopes: ["openid", "email", "profile"],
      redirect_uri: process.env.OAUTH_REDIRECT_URI || "http://localhost:3001/api/auth/oauth/callback",
    },
  },

  // Attribute mapping (SAML to user fields)
  attribute_mapping: {
    email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    given_name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    family_name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
    groups: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups",
  },

  // Group to role mapping
  group_mapping: {
    // Default mappings - can be overridden per workspace
    // "ADMIN_GROUP_ID": "admin",
    // "USER_GROUP_ID": "default",
  },

  // Just-in-time provisioning
  jit_provisioning: {
    enabled: process.env.SAML_JIT_PROVISIONING === "true",
    auto_create_users: process.env.SAML_AUTO_CREATE_USERS !== "false", // default: true
    auto_assign_workspace: process.env.SAML_AUTO_ASSIGN_WORKSPACE !== "false", // default: true
    domain_based_workspace_assignment: process.env.SAML_DOMAIN_WORKSPACE === "true",
  },

  // Session configuration
  session: {
    lifetime: parseInt(process.env.SSO_SESSION_LIFETIME || "3600"), // seconds
    max_concurrent_sessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || "3"),
    timeout_inactive: parseInt(process.env.SESSION_TIMEOUT_INACTIVE || "1800"), // 30 min
  },
};

/**
 * Validate SSO configuration
 * @returns {object} Validation result { valid: boolean, errors: string[] }
 */
function validateSSOConfig(config) {
  const errors = [];

  if (config.saml2?.enabled && !config.saml2.identity_provider_url) {
    errors.push("SAML2 enabled but identity_provider_url not configured");
  }

  if (config.oauth2?.google?.enabled && !config.oauth2.google.client_id) {
    errors.push("Google OAuth enabled but client_id not configured");
  }

  if (config.oauth2?.azure?.enabled && !config.oauth2.azure.client_id) {
    errors.push("Azure OAuth enabled but client_id not configured");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get SSO configuration with defaults merged
 * @param {object} customConfig - Custom configuration to merge
 * @returns {object} Merged configuration
 */
function getSSOConfig(customConfig = {}) {
  return {
    ...DEFAULT_SSO_CONFIG,
    ...customConfig,
    saml2: {
      ...DEFAULT_SSO_CONFIG.saml2,
      ...customConfig.saml2,
    },
    oauth2: {
      ...DEFAULT_SSO_CONFIG.oauth2,
      ...customConfig.oauth2,
    },
  };
}

/**
 * Build OAuth provider config from database config
 * @param {string} provider - Provider name (google, azure, oidc)
 * @param {object} dbConfig - Config from database
 * @returns {object} Provider configuration
 */
function buildOAuthProviderConfig(provider, dbConfig = {}) {
  const baseConfig = DEFAULT_SSO_CONFIG.oauth2[provider] || {};
  return {
    ...baseConfig,
    ...dbConfig,
  };
}

/**
 * Build SAML provider config from database config
 * @param {object} dbConfig - Config from database
 * @returns {object} SAML configuration
 */
function buildSAMLProviderConfig(dbConfig = {}) {
  return {
    ...DEFAULT_SSO_CONFIG.saml2,
    ...dbConfig,
  };
}

module.exports = {
  DEFAULT_SSO_CONFIG,
  getSSOConfig,
  validateSSOConfig,
  buildOAuthProviderConfig,
  buildSAMLProviderConfig,
};
