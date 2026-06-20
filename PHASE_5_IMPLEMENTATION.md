# PHASE 5: SSO & SECURITY HARDENING IMPLEMENTATION

Enterprise-grade Single Sign-On (SSO) and security hardening for XSCALE AI.

## Overview

This document describes the complete Phase 5 implementation covering:
1. **SSO Integration** (SAML2 & OAuth2)
2. **Multi-Factor Authentication (MFA)** (TOTP + Backup Codes)
3. **Advanced Authentication** (IP Whitelist, Device Fingerprinting, Session Management)
4. **Security Hardening** (Rate Limiting, Security Headers, Audit Logging)
5. **Compliance** (GDPR, SOC2 Type II, HIPAA-adjacent)

---

## Part 1: SSO Implementation

### 1.1 SAML2 Support

**Features:**
- Parse and validate SAML assertions
- Support for signed/unsigned assertions
- NameID format handling
- Attribute statement parsing
- Group extraction for role mapping
- Encrypted assertion support
- Just-in-time user provisioning

**Configuration:**
```
/server/config/sso.js
```

**Environment Variables:**
```bash
SAML_ACS_URL=http://localhost:3001/api/auth/saml/acs
SAML_ISSUER=xscale-ai
SAML_IDP_URL=https://idp.example.com
SAML_IDP_CERT=<certificate-from-idp>
SAML_CERT_PATH=/path/to/cert.pem
SAML_PRIVATE_KEY_PATH=/path/to/key.pem
SAML_JIT_PROVISIONING=true
SAML_AUTO_CREATE_USERS=true
```

**Supported IdPs:**
- Okta
- Azure AD
- Google Workspace
- OneLogin
- Generic SAML2 providers

### 1.2 OAuth2 Support

**Supported Providers:**
1. **Google Workspace**
   - Authorization Code Flow with PKCE
   - Scopes: openid, email, profile
   - Token refresh capability

2. **Microsoft 365 / Azure AD**
   - Multi-tenant support
   - Scopes: openid, email, profile
   - User info from Microsoft Graph

3. **Generic OIDC**
   - Discovery endpoint support
   - Flexible scope/claim handling

**Configuration:**
```bash
OAUTH_GOOGLE_CLIENT_ID=<client-id>
OAUTH_GOOGLE_CLIENT_SECRET=<client-secret>
OAUTH_AZURE_CLIENT_ID=<client-id>
OAUTH_AZURE_CLIENT_SECRET=<client-secret>
OAUTH_AZURE_TENANT=common
OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/oauth/callback
OIDC_DISCOVERY_URL=https://oidc-provider.com/.well-known/openid-configuration
OIDC_CLIENT_ID=<client-id>
OIDC_CLIENT_SECRET=<client-secret>
```

### 1.3 Just-in-Time (JIT) User Provisioning

**Workflow:**
1. User logs in via SSO
2. Extract email and claims from IdP response
3. Look up user by email or external ID
4. If not exists: auto-create user (configurable)
5. Map SAML/OAuth groups to internal roles
6. Link SSO account to user record

**Configuration:**
```javascript
// Database models
sso_integrations       // SAML/OAuth config per workspace
user_sso_accounts      // External IdP account links
sso_oauth_tokens       // OAuth token storage
```

### 1.4 Group/Role Mapping

**SAML Attribute Mapping:**
```javascript
{
  email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  groups: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups"
}
```

**Group to Role Mapping:**
```javascript
{
  "ADMIN_GROUP_ID": "admin",
  "USER_GROUP_ID": "default",
  "VIEWER_GROUP_ID": "viewer"
}
```

**Database Support:**
- Store per-workspace mappings
- Override global defaults
- Support dynamic group updates

### 1.5 Multi-IdP Support

**Per-Workspace Configuration:**
- Each workspace can configure separate SSO providers
- Multiple SAML2 and OAuth2 configurations
- Domain-based workspace auto-assignment
- Fallback to local authentication

---

## Part 2: Multi-Factor Authentication (MFA)

### 2.1 TOTP Implementation

**Features:**
- Time-based One-Time Password
- 32-bit secret for enhanced security
- QR code generation for easy setup
- Backward compatible with authenticator apps

**Setup Flow:**
1. User initiates MFA setup
2. Generate base32 secret
3. Display QR code and manual entry key
4. User scans QR with authenticator app
5. User provides 6-digit code for verification
6. Generate 8 backup codes

**Verification:**
```javascript
const mfa = require('./utils/mfa');

// Verify TOTP token
const valid = mfa.verifyToken(secret, userProvidedCode);

// Allow ±1 time window for clock skew
const valid = mfa.verifyToken(secret, userProvidedCode, window=1);
```

### 2.2 Backup Codes

**Generation:**
- Generate 8 random codes (32-bit hex)
- Hash codes for secure storage
- One-time use enforcement
- Track used code indices

**Format:** `XXXXXXXX` (8 hex characters, uppercase)

**Example:**
```
A1B2C3D4
E5F6G7H8
I9J0K1L2
... (5 more)
```

**Storage:**
- Store hash of concatenated codes
- Store JSON array of used indices
- Never store plaintext codes

**Recovery:**
- Display codes during setup
- User must save them securely
- Used for emergency access

### 2.3 MFA Enforcement

**Workspace-level Configuration:**
```javascript
{
  mfa_enabled: true,      // Allow users to enable MFA
  mfa_enforced: false,    // Require all users to use MFA
  grace_period_days: 7,   // Days before enforcement kicks in
}
```

**Database Models:**
```
mfa_settings            // Per-user MFA configuration
mfa_recovery_sessions   // Temporary MFA bypass sessions
```

---

## Part 3: Advanced Authentication Features

### 3.1 IP Whitelist

**Features:**
- Per-user IP whitelist
- CIDR notation support (e.g., `192.168.1.0/24`)
- Optional enforcement (deny access from unlisted IPs)
- Description for each IP entry

**Database Model:**
```
ip_whitelist {
  user_id
  workspace_id (optional)
  ip_address
  ip_range (CIDR)
  description
  enabled
}
```

**Usage:**
```javascript
// Check if IP is whitelisted
const allowed = await ipWhitelist.isIpAllowed(userId, clientIp);

// Add IP to whitelist
await ipWhitelist.addIp(userId, ipAddress, description);
```

### 3.2 Device Fingerprinting

**Components:**
- User Agent
- Browser name and version
- OS name and version
- Device type (desktop, mobile, tablet)
- Client IP address

**Features:**
- Track trusted devices
- Skip MFA on trusted devices
- Device trust token (secure cookie)
- Geolocation-based anomaly detection

**Database Model:**
```
device_fingerprints {
  user_id
  device_id         // hash(user_agent + ip + accept_lang)
  device_name       // "Chrome on macOS 14.2"
  device_type       // desktop, mobile, tablet, unknown
  browser_name
  os_name
  is_trusted        // User-marked as trusted
  trust_token       // Secure token for bypassing MFA
  last_seen
}
```

### 3.3 Session Management

**Features:**
- Per-session tracking
- Concurrent session limits (default: 3)
- Session timeout (default: 30 minutes inactive)
- Graceful session termination
- Session activity tracking

**Session Lifetime:**
- Created: User login
- Expiration: 24 hours or on logout
- Last Activity: Updated on each request
- Terminated: Admin or user logout

**Database Model:**
```
user_sessions {
  user_id
  session_token
  device_fingerprint_id (optional)
  ip_address
  user_agent
  login_method        // password, sso, api_key
  mfa_verified
  expires_at
  last_activity
  is_active
  terminated_at
  termination_reason
}
```

**Configuration:**
```bash
SSO_SESSION_LIFETIME=3600          # seconds
MAX_CONCURRENT_SESSIONS=3
SESSION_TIMEOUT_INACTIVE=1800      # 30 minutes
```

### 3.4 Login Attempt Tracking

**Features:**
- Track login attempts (success and failure)
- Failed attempt rate limiting
- Account lockout after N failures
- IP-based blocking for suspicious patterns

**Database Model:**
```
login_attempts {
  user_id           // null for unknown user
  username
  ip_address
  success           // true/false
  method            // password, sso, api_key
  mfa_verified
  failure_reason    // invalid_password, mfa_required, etc.
  created_at
}
```

**Security Rules:**
- 5 failed attempts = 15 minute lockout
- Same IP > 10 failures = block for 1 hour
- Trigger suspicious activity alert
- Log to audit trail

---

## Part 4: Security Hardening

### 4.1 Audit Logging

**Event Types:**
- Authentication: login, logout, login_failed, mfa_*
- User Management: user_*, user_role_changed
- SSO: sso_config_*, sso_login
- API Keys: api_key_*
- Permissions: permission_*, workspace_access_*
- Security: ip_whitelist_*, device_trusted, suspicious_activity, account_locked
- Data: data_accessed, data_exported, data_deleted
- Admin: admin_action, compliance_check

**Database Model:**
```
audit_logs {
  event_type
  event_name
  resource_type      // user, workspace, api_key, sso_integration
  resource_id
  user_id
  actor_id           // Who performed the action
  status             // success, failure
  ip_address
  user_agent
  metadata           // JSON: detailed context
  severity           // info, warning, critical
  created_at
}
```

**Retention Policy:**
- Default: 90 days
- Configurable per compliance needs
- Automatic cleanup job

### 4.2 Security Headers

**Implemented Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Usage:**
```javascript
const { securityHeadersMiddleware } = require('./middleware/securityHeaders');
app.use(securityHeadersMiddleware);
```

### 4.3 Rate Limiting

**Strategy:**
- Per-IP rate limiting
- Per-user rate limiting
- Per-endpoint customization
- Sliding window algorithm

**Default Limits:**
```javascript
login:      { windowMs: 15 * 60 * 1000, maxRequests: 5 }   // 5 per 15 min
apiAuth:    { windowMs: 60 * 1000,      maxRequests: 30 }  // 30 per minute
default:    { windowMs: 60 * 1000,      maxRequests: 100 } // 100 per minute
mfaVerify:  { windowMs: 60 * 1000,      maxRequests: 5 }   // Strict: 5 per minute
```

**Usage:**
```javascript
const { rateLimitingMiddleware } = require('./middleware/securityHeaders');
app.use('/api/auth/login', rateLimitingMiddleware({ maxRequests: 5, windowMs: 15*60*1000 }));
```

### 4.4 API Key Rotation

**Features:**
- Auto-rotation scheduling
- Gradual key sunset (old key works for grace period)
- Rotation tracking and audit logs
- Usage tracking and limits

**Database Model:**
```
api_keys {
  id
  name
  secret              // Current secret
  created_secret      // New secret (during rotation)
  secret_expires_at   // When to stop accepting old secret
  rotation_interval   // Days between auto-rotation
  last_rotated_at
  last_used_at
  usage_count
}
```

**Rotation Workflow:**
1. Generate new secret
2. Store as `created_secret`
3. Set `secret_expires_at` to current + grace_period
4. Accept both secrets during grace period
5. After expiration, retire old secret

### 4.5 TLS 1.3 Enforcement

**Configuration:**
```javascript
const options = {
  minVersion: 'TLSv1.3',
  ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
};
```

**Environment:**
```bash
ENABLE_HTTPS=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### 4.6 CORS Hardening

**Allowed Origins (from environment):**
```bash
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

**Default Allowed Origins:**
- http://localhost:3000
- http://localhost:3001
- http://127.0.0.1:3000
- http://127.0.0.1:3001

---

## Part 5: Compliance

### 5.1 GDPR Compliance

**User Rights:**
- Data Export: User can request full data export
- Right to be Forgotten: User deletion cascades all data
- Consent Tracking: Track user consents
- Audit Logging: Maintain audit trail for accountability

**Database Models:**
```
user_data_exports {
  user_id
  status            // pending, processing, ready, expired, failed
  export_type       // full, audit_logs, personal_data
  file_path
  download_token
  expires_at        // 7 days
  requested_at
  completed_at
}

user_consents {
  user_id
  consent_type      // analytics, marketing, data_processing, sso_disclosure
  value             // true/false
  created_at
}
```

### 5.2 SOC2 Type II

**Requirements:**
- Comprehensive audit logging
- Change management (tracked in audit logs)
- Access control (role-based)
- Encryption in transit (TLS 1.3)
- User authentication (MFA support)
- Security monitoring
- Incident response procedures

**Implementation:**
- Audit logs with tamper detection
- Automated backup and recovery
- Regular security assessments
- Documented security procedures

### 5.3 HIPAA-Adjacent

**Features:**
- Audit logs with detailed tracking
- Data encryption in transit
- Access controls per user/workspace
- Session management with timeouts
- Suspicious activity alerts
- User data deletion on request

---

## Database Schema

### New Tables Added

```sql
-- SSO Tables
sso_integrations
user_sso_accounts
sso_oauth_tokens

-- MFA Tables
mfa_settings
mfa_recovery_sessions

-- Session & Security Tables
ip_whitelist
device_fingerprints
user_sessions
login_attempts

-- Compliance Tables
user_data_exports
user_consents

-- Audit (Enhanced)
audit_logs (extended)

-- API Keys (Enhanced)
api_keys (extended with rotation)
```

---

## Configuration Files

### 1. `/server/config/sso.js`
Centralized SSO configuration with validation

### 2. `/server/utils/mfa/index.js`
TOTP generation and verification, backup codes

### 3. `/server/utils/audit/auditLogger.js`
Comprehensive audit logging utilities

### 4. `/server/utils/auth/sessionManager.js`
Session creation, validation, termination

### 5. `/server/middleware/securityHeaders.js`
Security headers, CORS hardening, rate limiting

---

## Environment Variables Required

```bash
# SAML2
SAML_ACS_URL=
SAML_ISSUER=
SAML_IDP_URL=
SAML_IDP_CERT=
SAML_CERT_PATH=
SAML_PRIVATE_KEY_PATH=
SAML_JIT_PROVISIONING=true
SAML_AUTO_CREATE_USERS=true

# OAuth2 - Google
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=

# OAuth2 - Azure
OAUTH_AZURE_CLIENT_ID=
OAUTH_AZURE_CLIENT_SECRET=
OAUTH_AZURE_TENANT=common

# OAuth2 - Generic
OAUTH_REDIRECT_URI=

# OIDC
OIDC_DISCOVERY_URL=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=

# Session
SSO_SESSION_LIFETIME=3600
MAX_CONCURRENT_SESSIONS=3
SESSION_TIMEOUT_INACTIVE=1800

# Security
TLS_MIN_VERSION=TLSv1.3
ALLOWED_ORIGINS=

# Feature Flags
ENABLE_MFA=true
ENABLE_IP_WHITELIST=false
ENFORCE_MFA=false
```

---

## Implementation Phases

### Phase 5.1: Database & Configuration
- [x] Create Prisma schema migrations
- [x] Implement SSO config module
- [ ] Run database migrations
- [ ] Verify schema

### Phase 5.2: Core MFA & Security
- [x] TOTP implementation
- [x] Backup codes
- [x] Audit logging
- [x] Session management

### Phase 5.3: API Endpoints
- [ ] SSO endpoints (login, callback, config)
- [ ] MFA endpoints (setup, verify, backup codes)
- [ ] Session endpoints (list, terminate)
- [ ] Admin endpoints (configure SSO, MFA policies)

### Phase 5.4: Frontend
- [ ] SSO login UI
- [ ] MFA setup wizard
- [ ] Session management UI
- [ ] Admin dashboard for security config

### Phase 5.5: Testing & Documentation
- [ ] Unit tests for MFA
- [ ] Integration tests for SSO
- [ ] Security testing
- [ ] Documentation and deployment guide

---

## Testing Checklist

### SAML2 Testing
- [ ] Metadata parsing
- [ ] Assertion validation
- [ ] User creation (JIT)
- [ ] Group mapping
- [ ] Logout

### OAuth2 Testing
- [ ] Google login flow
- [ ] Azure AD login flow
- [ ] Token refresh
- [ ] User creation (JIT)

### MFA Testing
- [ ] TOTP secret generation
- [ ] QR code display
- [ ] Token verification
- [ ] Backup code generation
- [ ] Backup code validation
- [ ] Grace period logic

### Security Testing
- [ ] Rate limiting enforcement
- [ ] IP whitelist blocking
- [ ] Session timeout
- [ ] Concurrent session limit
- [ ] Audit log recording
- [ ] Security headers present

### Compliance Testing
- [ ] GDPR data export
- [ ] User deletion cascade
- [ ] Audit log retention
- [ ] Consent tracking

---

## Deployment Notes

1. **Database Migration:**
   ```bash
   npm run prisma:setup
   ```

2. **Environment Variables:**
   - Set all required SAML/OAuth credentials
   - Configure TLS certificates
   - Set session timeouts
   - Enable feature flags

3. **SSL/TLS:**
   - Generate or obtain certificates
   - Set `ENABLE_HTTPS=true`
   - Point to certificate files

4. **Monitoring:**
   - Set up audit log monitoring
   - Configure alerts for suspicious activity
   - Monitor session statistics
   - Track API key usage

5. **Backup & Recovery:**
   - Back up encryption keys
   - Back up MFA secrets (encrypted)
   - Document recovery procedures

---

## Security Best Practices

1. **Secrets Management:**
   - Never commit secrets to git
   - Use `.env.local` for development
   - Use environment variables in production
   - Rotate secrets regularly

2. **Encryption:**
   - Encrypt sensitive fields in database (MFA secrets, OAuth tokens)
   - Use TLS 1.3 for all communication
   - Implement field-level encryption for PII

3. **Audit Logging:**
   - Log all authentication events
   - Monitor suspicious patterns
   - Alert on critical events
   - Archive logs for compliance

4. **Session Security:**
   - Use secure, httpOnly cookies
   - Implement session timeout
   - Limit concurrent sessions
   - Validate session on each request

5. **API Security:**
   - Rate limit all endpoints
   - Validate all inputs
   - Use parameterized queries
   - Implement CSRF protection

---

## Support & Troubleshooting

### Common Issues

1. **SAML Assertion Parsing Fails:**
   - Verify IdP certificate is valid
   - Check attribute mapping configuration
   - Ensure ACS URL matches IdP configuration

2. **MFA Token Not Validating:**
   - Check system time synchronization
   - Verify secret was properly encoded in base32
   - Use time window of ±1 for clock skew

3. **OAuth Redirect Loop:**
   - Verify redirect_uri matches IdP configuration
   - Check state parameter handling
   - Ensure CSRF token validation

4. **Session Timeout Too Short:**
   - Increase `SESSION_TIMEOUT_INACTIVE`
   - Check if inactive timeout is being enforced
   - Consider user activity tracking

### Debug Mode

Set `DEBUG=xscale-ai:*` for detailed logging:
```bash
DEBUG=xscale-ai:* npm run dev
```

---

## Future Enhancements

- [ ] Yubikey/hardware token support
- [ ] Passwordless authentication (WebAuthn)
- [ ] Risk-based adaptive authentication
- [ ] Biometric authentication
- [ ] Advanced anomaly detection
- [ ] Zero-knowledge proof authentication
- [ ] Decentralized identity (DID) support

---

**Status:** In Progress
**Last Updated:** 2026-06-20
**Version:** 5.0.0-beta
