# PHASE 5: Quick Start Guide

## 5 Minute Setup

### 1. Run Database Migration
```bash
cd /home/user/xscale-ai-llm
yarn prisma:migrate
```

This creates all billing tables (workspace_tiers, usage_metrics, billing_invoices, etc.)

### 2. Initialize Tiers for Existing Workspaces

If you have existing workspaces, initialize them with the Free tier:

```javascript
// In a script or quick test
const { WorkspaceTier } = require('./server/models/workspaceTier');
const prisma = require('./server/utils/prisma');

const workspaces = await prisma.workspaces.findMany();
for (const ws of workspaces) {
  await WorkspaceTier.create(ws.id, 'free');
}
```

### 3. Verify Endpoints Are Working

```bash
# Get available tiers
curl http://localhost:3001/api/v1/billing/tiers

# Get workspace subscription (replace ID and TOKEN)
curl http://localhost:3001/api/v1/billing/workspace/1/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get usage metrics
curl http://localhost:3001/api/v1/billing/workspace/1/usage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Quota Enforcement

### 1. Add Quota Check to Chat Endpoint

Edit `/server/endpoints/chat.js`:

```javascript
const { quotaEnforcement } = require("../middleware/quotaEnforcement");

router.post(
  "/chat/:workspaceId",
  [quotaEnforcement({ metricType: "messages" })],
  async (request, response) => {
    // existing chat handler
  }
);
```

### 2. Record Usage After Chat

In the chat response handler:

```javascript
const { UsageMetrics } = require("../models/usageMetrics");

// After generating response
await UsageMetrics.recordEvent(workspaceId, {
  messages: 1,
  tokens: tokenCount
});
```

### 3. Test It

1. Create/select a Free tier workspace (1,000 messages/month)
2. Send 950 messages (usage should be at 95%, warning shown)
3. Send message 1,001 (should be blocked with 429 status)

## Admin Dashboard Access

1. Log in as admin user
2. Navigate to: `/admin/billing`
3. View:
   - Revenue metrics
   - Subscription stats
   - Tier distribution
   - Workspace billing list

## User Billing Portal

1. Log in as workspace member
2. Go to workspace settings
3. Click "Billing" tab
4. View:
   - Current subscription
   - Usage metrics
   - Invoice history
   - Upgrade options

## Key Model Usage

### Record a Usage Event
```javascript
const { UsageMetrics } = require("./models/usageMetrics");

await UsageMetrics.recordEvent(workspaceId, {
  messages: 1,        // Messages sent
  tokens: 2500,       // Tokens used
  storage: 0.05,      // GB stored
  inferenceHours: 0.1 // Hours of inference
});
```

### Check Current Usage
```javascript
const status = await UsageMetrics.getUsageStatus(workspaceId);
console.log(status.usage.messages); // { used: 500, limit: 1000, percentage: 50 }
```

### Check if Quota Exceeded
```javascript
const { checkQuota } = require("./middleware/quotaEnforcement");

const quota = await checkQuota(workspaceId, "messages", 1);
if (!quota.allowed) {
  console.log("Would exceed quota");
}
```

### Create Warning
```javascript
const { UsageWarning } = require("./models/usageWarning");

await UsageWarning.checkAndCreate(
  workspaceId,
  "messages",
  950,    // current usage
  1000,   // limit
  [80, 90, 100]  // thresholds
);
```

### Get Workspace Tier
```javascript
const { WorkspaceTier } = require("./models/workspaceTier");

const tier = await WorkspaceTier.getByWorkspaceId(workspaceId);
console.log(tier.tier);                    // "free" | "pro" | "team" | "enterprise"
console.log(tier.max_messages_month);      // 1000
```

### Change Workspace Tier
```javascript
await WorkspaceTier.changeTier(workspaceId, "pro");
// Workspace now has Pro tier limits
```

## Configuration Options

### Tier Limits (in `/server/models/workspaceTier.js`)

Edit `TierDefinitions` to adjust limits:

```javascript
const TierDefinitions = {
  FREE: {
    tier: "free",
    max_users: 1,              // Change to 2
    max_storage_gb: 1,         // Change to 2
    max_messages_month: 1000,  // Change to 2000
    // ... etc
  },
  // ...
};
```

### Price Changes

Edit tier prices in `TierDefinitions`:

```javascript
PRO: {
  // ...
  monthly_price: 29.99,  // Change this
},
```

### Warning Thresholds

Adjust in quota enforcement middleware check (80%, 90%, 100%):

```javascript
// in quotaEnforcement.js, change:
if (metric.percentage >= 90)   // Change to 85
if (metric.percentage >= 80)   // Change to 75
```

## Integration Checklist

- [ ] Run database migration
- [ ] Initialize tiers for existing workspaces
- [ ] Test /api/v1/billing/tiers endpoint
- [ ] Add quotaEnforcement middleware to relevant endpoints
- [ ] Add UsageMetrics.recordEvent calls after operations
- [ ] Test quota enforcement (free tier + messages)
- [ ] Verify admin dashboard loads
- [ ] Verify user billing portal shows correct usage
- [ ] Test usage warning creation at 80%, 90%, 100%
- [ ] Confirm quota warnings appear in frontend

## Next Steps

### Add Stripe Integration (Future Phase)
```bash
# Install Stripe SDK
cd /server && yarn add stripe

# Set environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Add Invoice Generation (Future Phase)
Implement in Stripe webhook handler to auto-create `BillingInvoice` records.

### Add Usage-Based Overages (Future Phase)
Track overage charges and add to next invoice.

## Support

### Debug Usage Not Recording
1. Check that UsageMetrics.recordEvent is called
2. Verify workspace_tier exists: `SELECT * FROM workspace_tiers WHERE workspace_id = 1`
3. Check usage_metrics table: `SELECT * FROM usage_metrics WHERE workspace_id = 1 ORDER BY created_at DESC`

### Debug Quota Not Enforcing
1. Verify middleware is registered on endpoint
2. Check request includes workspaceId
3. Verify tier has limits set (not null)
4. Check response headers for X-Quota-* headers

### Reset Workspace Usage (Development)
```javascript
const prisma = require("./utils/prisma");

// Reset daily usage
await prisma.usage_metrics.deleteMany({
  where: { workspace_id: 1 }
});

// Reset warnings
await prisma.usage_warnings.deleteMany({
  where: { workspace_id: 1 }
});
```

## Common Errors & Fixes

### "No tier found for workspace"
- Cause: Workspace doesn't have workspace_tier record
- Fix: `await WorkspaceTier.create(workspaceId, 'free')`

### Quota check returns "unlimited"
- Cause: Tier limit is null
- Check: `SELECT max_messages_month FROM workspace_tiers WHERE workspace_id = 1`
- Fix: Update tier or change to different tier

### Warning alerts not appearing in frontend
- Cause: Frontend component not imported or warnings not created
- Fix: Verify UsageWarning.checkAndCreate is called in middleware

### Old migrations failing
- Cause: SQLite doesn't support certain ALTER operations
- Fix: Delete `anythingllm.db` and re-run migrations from scratch (dev only)

## File Structure

```
/server
  /models
    workspaceTier.js          # Tier management
    usageMetrics.js           # Usage tracking
    billingInvoice.js         # Invoices
    usageWarning.js           # Warnings
    stripeSubscription.js     # Stripe records
  /middleware
    quotaEnforcement.js       # Quota checking
  /endpoints
    billing.js                # All billing API routes
  /prisma
    /migrations
      /20260620_add_billing_system
        migration.sql         # Database schema

/frontend/src
  /pages
    /Admin
      /Billing
        index.jsx             # Admin dashboard
        BillingAnalytics.jsx  # Analytics charts
        WorkspaceBillingList.jsx  # Workspace table
    /Workspace
      /Billing
        index.jsx             # User billing portal
        UsageMetrics.jsx      # Usage display
        SubscriptionInfo.jsx  # Tier info
        InvoiceHistory.jsx    # Invoice list
  /components
    /QuotaWarningBanner
      index.jsx               # Warning banner
```

## Performance Tips

1. **Snapshot queries** are fast due to indexes on workspace_id and snapshot_date
2. **Usage aggregation** happens at query time - no redundant data storage
3. **Middleware** checks are non-blocking async operations
4. **Batch warning creation** supported for large-scale operations

## Security Notes

1. All endpoints require authentication (except /billing/tiers)
2. Admin endpoints check for admin role
3. Users can only access their own workspace billing
4. Usage can only be recorded by authenticated requests
5. Tier changes audit trail stored in updated_at timestamps

---

**Ready to deploy?** After testing locally, you're ready to:
1. Commit changes: `git add . && git commit -m "PHASE 5: Billing system"`
2. Run production migration: `yarn prisma:migrate --prod`
3. Deploy frontend and server
4. Verify endpoints working in production
