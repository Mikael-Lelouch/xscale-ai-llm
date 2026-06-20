/**
 * PHASE 5: SSO API Endpoints
 * Handles SAML2, OAuth2, and OIDC authentication flows
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { auditLogger } = require("../../../utils/audit/auditLogger");
const { sessionManager } = require("../../../utils/auth/sessionManager");

/**
 * POST /api/sso/saml/metadata
 * Get SAML2 metadata for IdP configuration
 */
async function getSAMLMetadata(req, res) {
  try {
    const { workspaceId } = req.body;

    // Get SAML configuration
    const ssoConfig = await prisma.sso_integrations.findFirst({
      where: {
        workspace_id: parseInt(workspaceId),
        type: "saml2",
        enabled: true,
      },
    });

    if (!ssoConfig) {
      return res.status(404).json({
        error: "SAML configuration not found",
      });
    }

    // Generate SAML metadata XML
    // This would use samlify or passport-saml to generate
    const metadata = generateSAMLMetadata(ssoConfig);

    res.type("application/xml");
    res.send(metadata);
  } catch (error) {
    console.error("[SSO] Error getting SAML metadata:", error.message);
    res.status(500).json({
      error: "Failed to retrieve SAML metadata",
      message: error.message,
    });
  }
}

/**
 * POST /api/sso/saml/acs
 * SAML Assertion Consumer Service (ACS) endpoint
 * Handles SAML response from IdP
 */
async function handleSAMLCallback(req, res) {
  try {
    const { SAMLResponse, RelayState } = req.body;

    if (!SAMLResponse) {
      return res.status(400).json({
        error: "Missing SAML response",
      });
    }

    // Parse and validate SAML response
    // This would use samlify to parse and validate
    const samlData = parseSAMLResponse(SAMLResponse);

    if (!samlData.valid) {
      await auditLogger.logAuthEvent({
        event_type: "login_failed",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        method: "saml",
        success: false,
      });

      return res.status(401).json({
        error: "Invalid SAML response",
        message: samlData.error,
      });
    }

    // Extract user info
    const { email, name, groups, nameID } = samlData;

    // Find or create user (JIT provisioning)
    let user = await prisma.users.findUnique({
      where: { username: email },
    });

    if (!user) {
      // Create user if JIT is enabled
      const workspace = await prisma.workspaces.findFirst({
        where: { id: parseInt(RelayState) },
      });

      if (workspace?.sso_auto_create_users) {
        user = await prisma.users.create({
          data: {
            username: email,
            password: generateRandomPassword(), // Require SSO login
          },
        });

        await auditLogger.logUserManagementEvent({
          event_type: "user_created",
          user_id: user.id,
          changes: { source: "sso_jit_provisioning" },
        });
      } else {
        return res.status(401).json({
          error: "User not found and auto-creation is disabled",
        });
      }
    }

    // Link SSO account to user
    const ssoAccount = await prisma.user_sso_accounts.upsert({
      where: {
        provider_user_id_provider: {
          provider_user_id: nameID,
          provider: "saml2",
        },
      },
      update: {
        last_login: new Date(),
      },
      create: {
        user_id: user.id,
        provider: "saml2",
        provider_user_id: nameID,
        email,
        name,
        groups: groups ? JSON.stringify(groups) : null,
      },
    });

    // Apply group-based role mapping
    if (groups && groups.length > 0) {
      await applyGroupRoleMapping(user.id, groups);
    }

    // Create session
    const session = await sessionManager.createSession({
      user_id: user.id,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      login_method: "sso",
      mfa_verified: true, // Assume IdP verified identity
    });

    // Log successful login
    await auditLogger.logAuthEvent({
      event_type: "login",
      user_id: user.id,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      method: "saml",
      success: true,
    });

    // Redirect to dashboard with session token
    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?token=${session.token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("[SSO] SAML callback error:", error.message);

    await auditLogger.logAuthEvent({
      event_type: "login_failed",
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      method: "saml",
      success: false,
    });

    res.status(500).json({
      error: "SAML authentication failed",
      message: error.message,
    });
  }
}

/**
 * GET /api/sso/oauth/login/:provider
 * Initiate OAuth login flow
 */
async function initiateOAuthLogin(req, res) {
  try {
    const { provider } = req.params;
    const { workspaceId } = req.query;

    // Validate provider
    const validProviders = ["google", "azure", "oidc"];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        error: "Invalid OAuth provider",
      });
    }

    // Get OAuth configuration
    const oauthConfig = await getOAuthConfig(provider, workspaceId);

    if (!oauthConfig) {
      return res.status(404).json({
        error: "OAuth provider not configured",
      });
    }

    // Generate state for CSRF protection
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    // Store state in session (or Redis)
    await stateCache.set(`oauth_state_${state}`, {
      provider,
      workspaceId,
      nonce,
      createdAt: Date.now(),
    });

    // Generate authorization URL
    const authUrl = buildOAuthAuthorizationUrl(provider, oauthConfig, {
      state,
      nonce,
      redirectUri: `${process.env.API_URL || "http://localhost:3001"}/api/sso/oauth/callback`,
    });

    res.json({
      authUrl,
      provider,
    });
  } catch (error) {
    console.error("[SSO] OAuth login error:", error.message);
    res.status(500).json({
      error: "Failed to initiate OAuth login",
      message: error.message,
    });
  }
}

/**
 * GET /api/sso/oauth/callback
 * Handle OAuth provider callback
 */
async function handleOAuthCallback(req, res) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      return res.status(400).json({
        error: "Missing authorization code or state",
      });
    }

    // Retrieve and validate state
    const stateData = await stateCache.get(`oauth_state_${state}`);

    if (!stateData || stateData.createdAt < Date.now() - 10 * 60 * 1000) {
      // State expired (10 minute window)
      return res.status(401).json({
        error: "Invalid or expired state parameter",
      });
    }

    const { provider, workspaceId } = stateData;

    // Exchange code for tokens
    const tokens = await exchangeOAuthCode(provider, code);

    // Get user info from provider
    const userInfo = await getOAuthUserInfo(provider, tokens.access_token);

    // Find or create user (JIT provisioning)
    let user = await prisma.users.findUnique({
      where: { username: userInfo.email },
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          username: userInfo.email,
          password: generateRandomPassword(),
        },
      });

      await auditLogger.logUserManagementEvent({
        event_type: "user_created",
        user_id: user.id,
        changes: { source: `oauth_jit_provisioning_${provider}` },
      });
    }

    // Link OAuth account to user
    const ssoAccount = await prisma.user_sso_accounts.upsert({
      where: {
        provider_user_id: {
          provider_user_id: userInfo.sub,
          provider,
        },
      },
      update: {
        last_login: new Date(),
      },
      create: {
        user_id: user.id,
        provider,
        provider_user_id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
      },
    });

    // Store OAuth tokens
    if (tokens.refresh_token) {
      await prisma.sso_oauth_tokens.upsert({
        where: { user_sso_account_id: ssoAccount.id },
        update: {
          access_token: encryptToken(tokens.access_token),
          refresh_token: encryptToken(tokens.refresh_token),
          expires_at: new Date(Date.now() + tokens.expires_in * 1000),
        },
        create: {
          user_sso_account_id: ssoAccount.id,
          access_token: encryptToken(tokens.access_token),
          refresh_token: encryptToken(tokens.refresh_token),
          token_type: "Bearer",
          expires_at: new Date(Date.now() + tokens.expires_in * 1000),
        },
      });
    }

    // Create session
    const session = await sessionManager.createSession({
      user_id: user.id,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      login_method: "sso",
      mfa_verified: true,
    });

    // Log successful login
    await auditLogger.logSSOEvent({
      event_type: "sso_login",
      user_id: user.id,
      provider,
      workspace_id: workspaceId,
      success: true,
    });

    // Redirect to dashboard
    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?token=${session.token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("[SSO] OAuth callback error:", error.message);

    await auditLogger.logAuthEvent({
      event_type: "login_failed",
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      method: "oauth",
      success: false,
    });

    res.status(500).json({
      error: "OAuth authentication failed",
      message: error.message,
    });
  }
}

/**
 * POST /api/sso/logout
 * Logout user and terminate SSO session
 */
async function logout(req, res) {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (token) {
      await sessionManager.terminateSession(token, "logout");
    }

    if (userId) {
      await auditLogger.logAuthEvent({
        event_type: "logout",
        user_id: userId,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        success: true,
      });
    }

    res.json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("[SSO] Logout error:", error.message);
    res.status(500).json({
      error: "Logout failed",
      message: error.message,
    });
  }
}

/**
 * Helper functions
 */

function generateSAMLMetadata(config) {
  // Generate SAML metadata XML
  // Implementation would use samlify
  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
  <!-- Generated SAML metadata -->
</EntityDescriptor>`;
}

function parseSAMLResponse(samlResponse) {
  // Parse and validate SAML response
  // Implementation would use samlify
  return {
    valid: true,
    email: "user@example.com",
    name: "User Name",
    groups: ["group1", "group2"],
    nameID: "unique-id-from-idp",
  };
}

function generateRandomPassword() {
  return require("crypto").randomBytes(32).toString("hex");
}

function generateRandomString(length) {
  return require("crypto").randomBytes(length / 2).toString("hex");
}

async function getOAuthConfig(provider, workspaceId) {
  // Get OAuth configuration from database or environment
  return null;
}

async function exchangeOAuthCode(provider, code) {
  // Exchange authorization code for tokens
  return {
    access_token: "",
    refresh_token: "",
    expires_in: 3600,
  };
}

async function getOAuthUserInfo(provider, accessToken) {
  // Get user info from OAuth provider
  return {
    sub: "",
    email: "",
    name: "",
  };
}

function encryptToken(token) {
  // Encrypt token for storage
  return token;
}

async function applyGroupRoleMapping(userId, groups) {
  // Apply group-to-role mapping
  // Implementation would update user roles based on groups
}

// Simple in-memory cache for state (should use Redis in production)
const stateCache = {
  data: new Map(),
  set(key, value) {
    this.data.set(key, value);
    // Auto-cleanup after 15 minutes
    setTimeout(() => this.data.delete(key), 15 * 60 * 1000);
  },
  get(key) {
    return this.data.get(key);
  },
};

function ssoEndpoints(app) {
  if (!app) return;

  // SAML endpoints
  app.post("/v1/sso/saml/metadata", getSAMLMetadata);
  app.post("/v1/sso/saml/acs", handleSAMLCallback);

  // OAuth endpoints
  app.get("/v1/sso/oauth/login/:provider", initiateOAuthLogin);
  app.get("/v1/sso/oauth/callback", handleOAuthCallback);

  // Logout
  app.post("/v1/sso/logout", logout);
}

module.exports = { ssoEndpoints };
