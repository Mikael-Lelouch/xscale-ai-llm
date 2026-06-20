# PHASE 5: QUICK START GUIDE

Fast-track setup for SSO and security hardening.

---

## 1. Install Dependencies

```bash
npm install speakeasy qrcode passport-saml passport-google-oauth20 passport-azure-ad samlify xml2js node-forge express-rate-limit
```

---

## 2. Database Setup

```bash
# Run migrations to create new tables
npm run prisma:setup

# Verify schema
npm run prisma:generate
```

---

## 3. Environment Variables

Create `.env.production` with:

```bash
# SAML2 (for enterprise)
SAML_ACS_URL=https://app.example.com/api/auth/saml/acs
SAML_ISSUER=xscale-ai
SAML_IDP_URL=https://idp.example.com/sso
SAML_IDP_CERT=<certificate-from-idp>

# OAuth2 (Google)
OAUTH_GOOGLE_CLIENT_ID=<your-client-id>
OAUTH_GOOGLE_CLIENT_SECRET=<your-client-secret>

# OAuth2 (Azure AD)
OAUTH_AZURE_CLIENT_ID=<your-client-id>
OAUTH_AZURE_CLIENT_SECRET=<your-client-secret>
OAUTH_AZURE_TENANT=common

# Session Configuration
SSO_SESSION_LIFETIME=3600
MAX_CONCURRENT_SESSIONS=3
SESSION_TIMEOUT_INACTIVE=1800

# Enable Features
ENABLE_MFA=true
ENFORCE_MFA=false
```

---

## 4. Basic Usage Examples

### MFA Setup

```javascript
const mfa = require('./server/utils/mfa');

// Generate secret for user
const { secret, qrCode } = await mfa.generateSecret('user@example.com');

// Verify token during setup
const isValid = mfa.verifyToken(secret, '123456');

// Generate backup codes
const codes = mfa.generateBackupCodes();
const hash = mfa.hashBackupCodes(codes);

// Verify during login
const result = mfa.verifyMFAForLogin(mfaSettings, totpCode, backupCode, codes);
```

### Session Management

```javascript
const sessionManager = require('./server/utils/auth/sessionManager');

// Create session
const session = await sessionManager.createSession({
  user_id: 1,
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  login_method: 'password',
  mfa_verified: true,
});

// Validate session
const validation = await sessionManager.validateSession(token);
if (validation.valid) {
  // Session is active
}

// Terminate session
await sessionManager.terminateSession(token, 'logout');
```

### Audit Logging

```javascript
const auditLogger = require('./server/utils/audit/auditLogger');

// Log authentication event
await auditLogger.logAuthEvent({
  event_type: auditLogger.EVENT_TYPES.LOGIN,
  user_id: 1,
  ip_address: req.ip,
  user_agent: req.get('user-agent'),
  method: 'password',
  success: true,
});

// Log SSO event
await auditLogger.logSSOEvent({
  event_type: auditLogger.EVENT_TYPES.SSO_LOGIN,
  user_id: 1,
  provider: 'google',
  success: true,
});

// Query audit logs
const logs = await auditLogger.getUserAuditLogs(userId);
```

### Security Headers

```javascript
const { securityHeadersMiddleware } = require('./server/middleware/securityHeaders');

// Add to Express app
app.use(securityHeadersMiddleware);
```

---

## 5. Integration with Existing Auth

Add to your login endpoint:

```javascript
// Check if MFA is enabled
const mfaSettings = await prisma.mfa_settings.findUnique({
  where: { user_id: user.id },
});

if (mfaSettings?.totp_enabled) {
  // Return MFA prompt
  return res.json({
    requiresMFA: true,
    userId: user.id,
  });
}

// Create session
const session = await sessionManager.createSession({
  user_id: user.id,
  ip_address: req.ip,
  user_agent: req.get('user-agent'),
  login_method: 'password',
  mfa_verified: !mfaSettings?.totp_enabled,
});
```

---

## 6. SSO Configuration

### Add SSO Integration (Admin)

```javascript
// Store in database
await prisma.sso_integrations.create({
  data: {
    workspace_id: 1,
    type: 'saml2',
    name: 'Okta',
    enabled: true,
    config: JSON.stringify({
      metadata_url: 'https://example.okta.com/app/123/sso/saml/metadata',
      entity_id: 'xscale-ai',
    }),
    attribute_mapping: JSON.stringify({
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      groups: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups',
    }),
    group_mapping: JSON.stringify({
      'ADMIN_GROUP': 'admin',
      'USER_GROUP': 'default',
    }),
    created_by: adminUserId,
  },
});
```

### Test SSO Login

1. Navigate to: `http://localhost:3001/api/sso/oauth/login/google?workspaceId=1`
2. Or use SAML metadata: `http://localhost:3001/api/sso/saml/metadata`

---

## 7. Frontend Integration

### MFA Setup Dialog

```javascript
// Show MFA setup
const { qrCode, backupCodes } = await fetch('/api/v1/mfa/setup').then(r => r.json());

// Display QR code for scanning
<img src={qrCode} alt="MFA Setup" />

// Show backup codes (tell user to save them)
{backupCodes.map(code => <div key={code}>{code}</div>)}

// Verify with code from authenticator
const verified = await fetch('/api/v1/mfa/verify', {
  method: 'POST',
  body: JSON.stringify({ token: userEnteredCode })
}).then(r => r.json());
```

### MFA Login Prompt

```javascript
// After password validation
if (response.requiresMFA) {
  // Show MFA verification form
  <form onSubmit={verifyMFA}>
    <input placeholder="Enter 6-digit code or backup code" />
    <button>Verify</button>
  </form>
}
```

---

## 8. Testing Checklist

- [ ] TOTP generation and QR code display
- [ ] MFA token verification
- [ ] Backup code validation
- [ ] Session creation and validation
- [ ] Session timeout enforcement
- [ ] Concurrent session limit
- [ ] Audit log recording
- [ ] Security headers present
- [ ] Rate limiting (try 6+ requests in quick succession)
- [ ] SSO provider integration test

---

## 9. Troubleshooting

### TOTP Token Not Working
- Verify system time is synchronized
- Check if base32 secret is valid
- Try with time window tolerance

### Session Not Valid
- Check if token exists in database
- Verify session hasn't expired
- Ensure session is marked as active

### MFA Setup Missing
- Confirm mfa_settings table exists
- Check if MFA is enabled in env vars
- Verify user has permission

### Audit Logs Not Recording
- Check database connection
- Verify audit_logs table exists
- Check for database errors in logs

---

## 10. Security Best Practices

1. **Encrypt sensitive data:**
   ```javascript
   // MFA secrets should be encrypted in database
   // OAuth tokens should be encrypted in database
   ```

2. **Use HTTPS in production:**
   ```bash
   ENABLE_HTTPS=true
   TLS_MIN_VERSION=TLSv1.3
   ```

3. **Rotate secrets regularly:**
   ```javascript
   // Schedule API key rotation
   // Regenerate backup codes
   // Update OAuth credentials
   ```

4. **Monitor audit logs:**
   ```bash
   # Alert on suspicious activity
   # Track failed login attempts
   # Monitor session statistics
   ```

---

## 11. Quick Commands

```bash
# Check database schema
npm run prisma:studio

# View audit logs (coming in Phase 5.3)
npm run audit:logs

# Test TOTP generation
node -e "const mfa = require('./server/utils/mfa'); mfa.generateSecret('test@example.com').then(console.log)"

# Check session stats
node -e "const sm = require('./server/utils/auth/sessionManager'); sm.getSessionStatistics().then(console.log)"
```

---

## 12. Next Steps

1. Configure IdP provider (SAML/OAuth)
2. Test SSO login flow
3. Enable MFA for users
4. Set up audit log monitoring
5. Deploy to production

---

**Estimated Setup Time:** 30 minutes
**Complexity:** Medium
**Support:** See PHASE_5_IMPLEMENTATION.md for detailed docs
