# PHASE 5: Multi-Tenant Billing & Usage Quotas Implementation

## Overview

PHASE 5 implements a complete SaaS billing system for XSCALE AI, enabling multi-tenant workspace subscriptions, usage tracking, quota enforcement, and revenue management.

## Features Implemented

### 1. Workspace Tiers
- **Free Tier**: 1 user, 1GB storage, 1,000 messages/month, 100k tokens/month, 1 hour inference
- **Pro Tier**: 5 users, 10GB storage, 50k messages/month, 5M tokens/month, 100 hours inference ($29.99/month)
- **Team Tier**: 10 users, 50GB storage, 500k messages/month, 50M tokens/month, 1000 hours inference ($99.99/month)
- **Enterprise Tier**: Unlimited everything (custom pricing)

### 2. Usage Tracking
- Real-time tracking of messages, tokens, storage, inference hours
- Daily and hourly snapshots for analytics
- Per-workspace aggregation
- Efficient database queries with proper indexing

### 3. Quota Enforcement
- Middleware-based quota checking before operations
- Progressive warnings at 80%, 90%, 100% thresholds
- Automatic warning creation and acknowledgment
- Free tier blocks at limit; paid tiers allow overages with charges

### 4. Billing System
- Invoice generation and tracking
- Overage charge calculation
- Multiple currency support (default USD)
- Invoice PDF storage and email delivery hooks
- Monthly billing period alignment

### 5. Stripe Integration Foundation
- Subscription record management
- Payment method tracking
- Customer and subscription ID mapping
- Ready for webhook integration

### 6. Admin Dashboard
- Overview with KPI cards (revenue, invoices, subscriptions, tier breakdown)
- Workspace billing list with tier/status filtering
- Analytics view with trends and distribution charts
- Bulk workspace management

### 7. User Dashboard
- Current subscription and tier information
- Real-time usage metrics with visual progress bars
- Warning alerts for quota thresholds
- Invoice history with PDF downloads
- Upgrade call-to-action

## Database Schema

### New Tables

#### `workspace_tiers`
Stores tier subscription for each workspace.

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Unique tier record |
| workspace_id | INT | Unique foreign key to workspaces |
| tier | TEXT | 'free', 'pro', 'team', 'enterprise' |
| max_users | INT | null = unlimited |
| max_storage_gb | INT | null = unlimited |
| max_messages_month | INT | null = unlimited |
| max_tokens_month | INT | null = unlimited |
| max_inference_hours | INT | null = unlimited |
| monthly_price | FLOAT | USD price |
| trial_ends_at | DATETIME | Null if no trial |
| current_period_start | DATETIME | Billing period start |
| current_period_end | DATETIME | Billing period end |
| subscription_id | TEXT | Stripe subscription ID |
| status | TEXT | active, canceled, past_due, unpaid |
| auto_renew | BOOLEAN | Auto-renewal enabled |
| billing_email | TEXT | Email for invoices |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### `usage_metrics`
Daily/hourly snapshots of usage per workspace.

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| workspace_id | INT | Reference to workspace |
| workspace_tier_id | INT | Reference to tier |
| messages_used | INT | Messages sent this snapshot |
| documents_stored_gb | FLOAT | Total storage used |
| active_users | INT | Active users count |
| tokens_used | INT | Tokens consumed |
| inference_hours | FLOAT | Inference time used |
| snapshot_type | TEXT | 'hourly' or 'daily' |
| snapshot_date | DATETIME | When snapshot was taken |
| billing_period_start | DATETIME | Period start |
| billing_period_end | DATETIME | Period end |
| created_at | DATETIME | Record creation |
| updated_at | DATETIME | Last update |

#### `billing_invoices`
Invoice records for billing.

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| workspace_id | INT | Reference to workspace |
| workspace_tier_id | INT | Reference to tier |
| invoice_number | TEXT | Unique invoice ID (INV-WS-TIMESTAMP) |
| stripe_invoice_id | TEXT | Reference to Stripe invoice |
| status | TEXT | draft, pending, sent, paid, failed, void |
| subtotal | FLOAT | Base subscription cost |
| tax | FLOAT | Tax amount |
| total | FLOAT | Total due |
| currency | TEXT | USD, EUR, etc. |
| overage_messages | INT | Messages over limit |
| overage_storage_gb | FLOAT | Storage over limit |
| overage_amount | FLOAT | Overage charges |
| billing_period_start | DATETIME | Period start |
| billing_period_end | DATETIME | Period end |
| issued_at | DATETIME | Invoice date |
| due_date | DATETIME | Payment due |
| paid_at | DATETIME | Payment received |
| pdf_url | TEXT | Hosted PDF URL |
| email_sent_at | DATETIME | Email delivery date |
| created_at | DATETIME | Record creation |
| updated_at | DATETIME | Last update |

#### `stripe_subscriptions`
Stripe subscription tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| workspace_id | INT | Reference to workspace |
| workspace_tier_id | INT | Reference to tier |
| stripe_subscription_id | TEXT | Unique Stripe ID |
| stripe_customer_id | TEXT | Stripe customer |
| stripe_product_id | TEXT | Stripe product |
| stripe_price_id | TEXT | Stripe price object |
| status | TEXT | active, past_due, unpaid, canceled, incomplete |
| current_period_start | DATETIME | Period start |
| current_period_end | DATETIME | Period end |
| cancel_at_period_end | BOOLEAN | Scheduled for cancellation |
| canceled_at | DATETIME | Cancellation date |
| stripe_payment_method_id | TEXT | Default payment method |
| metadata | TEXT | JSON additional data |
| created_at | DATETIME | Record creation |
| updated_at | DATETIME | Last update |

#### `payment_methods`
Stored payment methods per workspace.

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| workspace_id | INT | Reference to workspace |
| stripe_payment_method_id | TEXT | Unique Stripe ID |
| stripe_customer_id | TEXT | Stripe customer |
| type | TEXT | 'card' or 'bank_account' |
| card_last_four | TEXT | Last 4 digits (cards) |
| card_brand | TEXT | Visa, Mastercard, etc. |
| card_exp_month | INT | Expiry month |
| card_exp_year | INT | Expiry year |
| account_last_four | TEXT | Last 4 digits (ACH) |
| account_bank_name | TEXT | Bank name |
| is_default | BOOLEAN | Default payment method |
| created_at | DATETIME | Record creation |
| updated_at | DATETIME | Last update |

#### `usage_warnings`
Quota warnings per workspace.

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| workspace_id | INT | Reference to workspace |
| warning_type | TEXT | quota_80, quota_90, quota_100, overage_charge |
| metric_type | TEXT | messages, storage, users, tokens, inference_hours |
| threshold_percent | INT | 80, 90, or 100 |
| current_usage | INT | Current usage value |
| limit | INT | Limit value |
| acknowledged | BOOLEAN | User has seen warning |
| acknowledged_at | DATETIME | When acknowledged |
| created_at | DATETIME | Record creation |
| updated_at | DATETIME | Last update |

## Server Models

### `WorkspaceTier` (`/server/models/workspaceTier.js`)

Core model for managing workspace tier subscriptions.

**Methods:**
- `get(tierId)` - Get tier by ID
- `getByWorkspaceId(workspaceId)` - Get tier for workspace
- `getByName(tierName)` - Get tier definition by name
- `create(workspaceId, tierName)` - Create new tier subscription
- `update(tierId, updates)` - Update tier settings
- `changeTier(workspaceId, newTierName)` - Upgrade/downgrade workspace
- `isLimitExceeded(workspaceId, metricType, currentValue)` - Check if limit violated
- `getUsagePercentage(workspaceId, metricType, currentValue)` - Get % of limit used
- `getDefaultTierDef()` - Get free tier definition
- `getTierDef(tierName)` - Get specific tier definition

### `UsageMetrics` (`/server/models/usageMetrics.js`)

Tracks and aggregates usage metrics.

**Methods:**
- `recordEvent(workspaceId, metricData)` - Record usage event
- `getCurrentMonthUsage(workspaceId)` - Get aggregated month usage
- `getUsageForPeriod(workspaceId, startDate, endDate)` - Get usage range
- `getLatestSnapshot(workspaceId)` - Get most recent snapshot
- `getUsageStatus(workspaceId)` - Get full usage with percentages and limits
- `isQuotaExceeded(workspaceId, metricType, newValue)` - Check if action violates quota
- `isNearLimit(workspaceId, metricType, threshold)` - Check if near limit

### `BillingInvoice` (`/server/models/billingInvoice.js`)

Invoice management.

**Methods:**
- `create(workspaceId, invoiceData)` - Create new invoice
- `get(invoiceId)` - Get invoice by ID
- `getByNumber(invoiceNumber)` - Get by invoice number
- `getByStripeId(stripeInvoiceId)` - Get by Stripe ID
- `getByWorkspaceId(workspaceId, limit)` - Get workspace invoices
- `updateStatus(invoiceId, status)` - Update invoice status
- `markAsSent(invoiceId, pdfUrl)` - Mark sent and store PDF URL
- `markAsPaid(invoiceId, paidAt)` - Mark as paid
- `getForPeriod(workspaceId, startDate, endDate)` - Get invoices in date range
- `getMonthlyRevenue(month, year)` - Get monthly revenue stats
- `getRevenueForPeriod(startDate, endDate)` - Get revenue in period
- `getOverdue()` - Get overdue invoices

### `UsageWarning` (`/server/models/usageWarning.js`)

Warning management for quota thresholds.

**Methods:**
- `create(workspaceId, warningData)` - Create new warning
- `get(warningId)` - Get warning by ID
- `getUnacknowledged(workspaceId)` - Get unacknowledged warnings
- `getByWorkspaceId(workspaceId, limit)` - Get workspace warnings
- `getByType(workspaceId, warningType)` - Filter by warning type
- `getByMetric(workspaceId, metricType)` - Filter by metric type
- `acknowledge(warningId)` - Mark warning as read
- `acknowledgeAll(workspaceId, warningType, metricType)` - Bulk acknowledge
- `checkAndCreate(workspaceId, metricType, currentValue, limit, thresholds)` - Auto-create
- `getCritical(workspaceId)` - Get critical (100%) warnings

### `StripeSubscription` (`/server/models/stripeSubscription.js`)

Stripe subscription integration.

**Methods:**
- `create(workspaceId, subscriptionData)` - Create subscription record
- `getByWorkspaceId(workspaceId)` - Get subscription for workspace
- `getByStripeId(stripeSubscriptionId)` - Get by Stripe ID
- `getByCustomerId(stripeCustomerId)` - Get by Stripe customer ID
- `updateStatus(subscriptionId, status, periodDates)` - Update status
- `cancel(subscriptionId, immediate)` - Cancel subscription
- `cancelByStripeId(stripeSubscriptionId, immediate)` - Cancel by Stripe ID
- `getNearRenewal(daysAhead)` - Get subscriptions renewing soon
- `getPastDue()` - Get past due subscriptions
- `getActive(limit, offset)` - Get active subscriptions

## Middleware

### `quotaEnforcement` (`/server/middleware/quotaEnforcement.js`)

Middleware to enforce quota limits on operations.

**Usage:**
```javascript
app.post(
  '/api/chat/:workspaceId',
  quotaEnforcement({ metricType: 'messages', allowOverage: false }),
  chatHandler
);
```

**Features:**
- Automatic quota checking before operation
- Progressive warning headers (X-Quota-Status, X-Quota-Message)
- Blocks operations if quota exceeded (status 429)
- Allows overages on paid tiers with charges
- Creates warning alerts at 80%, 90%, 100%

**Helper Functions:**
- `checkQuota(workspaceId, metricType, valueToAdd)` - Programmatic quota check
- `recordUsageAndCheckQuota(workspaceId, metricType, value)` - Record + check in one call

## API Endpoints

### User Endpoints (Workspace Members)

#### Get Current Subscription
```
GET /api/v1/billing/workspace/:workspaceId/subscription
Authorization: Bearer {authToken}

Response:
{
  "success": true,
  "tier": { ... },
  "subscription": { ... }
}
```

#### Get Current Usage
```
GET /api/v1/billing/workspace/:workspaceId/usage
Authorization: Bearer {authToken}

Response:
{
  "success": true,
  "usage": {
    "messages": { "used": 850, "limit": 1000, "percentage": 85 },
    "storage": { "used": 0.5, "limit": 1, "percentage": 50 },
    "tokens": { "used": 50000, "limit": 100000, "percentage": 50 },
    "inference": { "used": 0.5, "limit": 1, "percentage": 50 }
  },
  "tier": "free",
  "billing_period": { "start": "2026-06-01", "end": "2026-06-30" },
  "warnings": [ ... ]
}
```

#### Get Invoices
```
GET /api/v1/billing/workspace/:workspaceId/invoices?limit=12
Authorization: Bearer {authToken}

Response:
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "invoice_number": "INV-123-1234567890",
      "status": "paid",
      "amount": 29.99,
      "issued_at": "2026-06-01",
      "pdf_url": "..."
    }
  ]
}
```

#### Download Invoice PDF
```
GET /api/v1/billing/workspace/:workspaceId/invoices/:invoiceId/pdf
Authorization: Bearer {authToken}

Response:
{
  "success": true,
  "pdf_url": "https://...",
  "invoice_number": "INV-123-..."
}
```

#### Acknowledge Warning
```
PATCH /api/v1/billing/workspace/:workspaceId/warnings/:warningId/acknowledge
Authorization: Bearer {authToken}

Response:
{
  "success": true,
  "message": "Warning acknowledged",
  "warning": { ... }
}
```

### Public Endpoints

#### Get Available Tiers
```
GET /api/v1/billing/tiers

Response:
{
  "success": true,
  "tiers": [
    {
      "name": "free",
      "displayName": "Free",
      "price": 0,
      "description": "...",
      "features": { ... },
      "limits": { ... }
    },
    ...
  ]
}
```

### Admin Endpoints (Requires Admin Role)

#### Get All Workspaces with Billing
```
GET /api/v1/billing/admin/workspaces?limit=50&offset=0
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "workspaces": [ ... ],
  "pagination": { "total": 150, "limit": 50, "offset": 0, "pages": 3 }
}
```

#### Get Billing Analytics
```
GET /api/v1/billing/admin/analytics
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "analytics": {
    "current_month_revenue": 2999.00,
    "current_month_invoices": 45,
    "last_month_revenue": 2750.00,
    "active_subscriptions": 42,
    "tier_breakdown": {
      "free": 100,
      "pro": 25,
      "team": 15,
      "enterprise": 2
    }
  }
}
```

## Frontend Components

### Admin Dashboard
**Path:** `/frontend/src/pages/Admin/Billing/`

- `index.jsx` - Main admin billing dashboard
- `BillingAnalytics.jsx` - Analytics and KPI cards
- `WorkspaceBillingList.jsx` - Workspace tier and status table

**Features:**
- KPI cards (revenue, invoices, subscriptions, tier distribution)
- Tab navigation (Analytics, Workspaces)
- Workspace filtering by tier and status
- Revenue trend analytics

### Workspace Billing Portal
**Path:** `/frontend/src/pages/Workspace/Billing/`

- `index.jsx` - Main billing page
- `UsageMetrics.jsx` - Usage progress bars with warnings
- `SubscriptionInfo.jsx` - Tier features and billing info
- `InvoiceHistory.jsx` - Invoice list with download

**Features:**
- Current tier display
- Real-time usage metrics with color-coded bars
- Warning alerts
- Upgrade CTA
- Invoice history with PDF downloads
- Billing period display

### Quota Warning Banner
**Path:** `/frontend/src/components/QuotaWarningBanner/`

- `index.jsx` - Dismissible warning banner

**Features:**
- Yellow warning at 80%-90% usage
- Red critical alert at 100% (quota exceeded)
- Shows affected metrics
- Upgrade call-to-action

## Integration Points

### Recording Usage Events

In any endpoint that tracks usage (chat, inference, etc.):

```javascript
const { UsageMetrics } = require("../models/usageMetrics");

// After operation completes
await UsageMetrics.recordEvent(workspaceId, {
  messages: 1,  // If chat message
  tokens: inputTokens + outputTokens,
  storage: 0,  // If storing document
  inferenceHours: inferenceTime / 3600,
});
```

### Checking Quotas Before Operations

```javascript
const { checkQuota } = require("../middleware/quotaEnforcement");

// Before starting operation
const quotaStatus = await checkQuota(workspaceId, "messages", 1);
if (!quotaStatus.allowed) {
  return response.status(429).json({
    error: "Quota exceeded",
    quota: quotaStatus
  });
}
```

### Creating Warnings

```javascript
const { UsageWarning } = require("../models/usageWarning");

await UsageWarning.checkAndCreate(
  workspaceId,
  "messages",
  currentMessages,
  limit,
  [80, 90, 100]
);
```

## Environment Variables

Add to `.env.development` and `.env`:

```bash
# Billing
BILLING_ENABLED=true

# Stripe (when implementing payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pricing
OVERAGE_PRICE_PER_1K_TOKENS=0.01
STORAGE_OVERAGE_PRICE_PER_GB=1.00

# Stripe Redirect URLs
STRIPE_SUCCESS_URL=http://localhost:3000/workspace/:workspaceId/billing?status=success
STRIPE_CANCEL_URL=http://localhost:3000/workspace/:workspaceId/billing?status=cancel
```

## Database Migration

Run the migration to create all billing tables:

```bash
cd /home/user/xscale-ai-llm
yarn prisma:migrate
```

Migration file: `/server/prisma/migrations/20260620_add_billing_system/migration.sql`

## Testing

### Test Recording Usage
```bash
curl -X POST http://localhost:3001/api/v1/billing/workspace/1/usage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "messages": 1,
    "tokens": 1000
  }'
```

### Test Getting Usage Status
```bash
curl http://localhost:3001/api/v1/billing/workspace/1/usage \
  -H "Authorization: Bearer TOKEN"
```

### Test Getting Tiers
```bash
curl http://localhost:3001/api/v1/billing/tiers
```

## Next Steps (Future Phases)

### Phase 5A: Stripe Webhook Integration
- Implement webhook handler for subscription events
- Auto-create invoices from Stripe
- Handle payment failures and retries
- Payment receipt emails

### Phase 5B: Upgrade/Downgrade Flow
- Stripe checkout session creation
- Tier upgrade/downgrade with proration
- Cancellation with grace period
- Refund processing

### Phase 5C: Usage-Based Overages
- Real-time overage tracking
- Overage charge calculation
- Automated email notifications
- Overage settlement on invoices

### Phase 5D: Advanced Analytics
- Revenue dashboards with charts
- MRR and churn tracking
- Cohort analysis
- Lifetime value calculations
- CSV export of reports

### Phase 5E: Self-Service Portal
- Payment method management
- Invoice download history
- Subscription management UI
- Billing email preferences
- Tax ID management

## Files Created

### Server Models
- `/server/models/workspaceTier.js` - Tier management
- `/server/models/usageMetrics.js` - Usage tracking
- `/server/models/billingInvoice.js` - Invoice management
- `/server/models/usageWarning.js` - Warning tracking
- `/server/models/stripeSubscription.js` - Stripe integration

### Middleware
- `/server/middleware/quotaEnforcement.js` - Quota enforcement

### API Endpoints
- `/server/endpoints/billing.js` - All billing endpoints

### Frontend Components
- `/frontend/src/pages/Admin/Billing/index.jsx` - Admin dashboard
- `/frontend/src/pages/Admin/Billing/BillingAnalytics.jsx` - Analytics
- `/frontend/src/pages/Admin/Billing/WorkspaceBillingList.jsx` - Workspace list
- `/frontend/src/pages/Workspace/Billing/index.jsx` - User billing portal
- `/frontend/src/pages/Workspace/Billing/UsageMetrics.jsx` - Usage display
- `/frontend/src/pages/Workspace/Billing/SubscriptionInfo.jsx` - Tier info
- `/frontend/src/pages/Workspace/Billing/InvoiceHistory.jsx` - Invoices
- `/frontend/src/components/QuotaWarningBanner/index.jsx` - Warning banner

### Database
- `/server/prisma/migrations/20260620_add_billing_system/migration.sql` - Schema migration
- Updated: `/server/prisma/schema.prisma` - Prisma schema with new models

### Configuration
- Updated: `/server/index.js` - Register billing endpoints

## Tier Definitions

### Free
- **Price:** $0/month
- **Users:** 1
- **Storage:** 1 GB
- **Messages:** 1,000/month
- **Tokens:** 100,000/month
- **Inference:** 1 hour/month

### Pro
- **Price:** $29.99/month
- **Users:** 5
- **Storage:** 10 GB
- **Messages:** 50,000/month
- **Tokens:** 5,000,000/month
- **Inference:** 100 hours/month

### Team
- **Price:** $99.99/month
- **Users:** 10
- **Storage:** 50 GB
- **Messages:** 500,000/month
- **Tokens:** 50,000,000/month
- **Inference:** 1,000 hours/month

### Enterprise
- **Price:** Custom
- **Users:** Unlimited
- **Storage:** Unlimited
- **Messages:** Unlimited
- **Tokens:** Unlimited
- **Inference:** Unlimited

## Architecture Decisions

### Quota Enforcement
- Implemented as middleware for easy integration into existing endpoints
- Progressive warnings (80%, 90%, 100%) allow users to see limits approaching
- Free tier blocks at limit; paid tiers allow overages with charges
- Checks performed before operation to prevent partial execution

### Usage Snapshots
- Daily snapshots balance accuracy with database performance
- Storage usage is "max" (not summed) since it represents current state
- Messages, tokens, inference are cumulative within billing period
- Hourly snapshots available for future high-frequency tracking

### Invoice Generation
- Stripe handles subscription invoicing
- We maintain local copies for audit trail and UI display
- Invoice numbers follow pattern: INV-WORKSPACE_ID-TIMESTAMP
- PDF URLs stored for easy retrieval

### Warning System
- Automatic checks prevent manual oversight
- Unacknowledged warnings bubble up in UI
- Multiple threshold levels help users see urgency
- Acknowledgment prevents alert fatigue

### Billing Period
- Calendar month (1st-last day) aligns with user expectations
- Simpler than anniversary billing
- Matches Stripe's default behavior

## Security Considerations

1. **Workspace Isolation**: All quota/usage queries filtered by workspace_id
2. **Auth Checks**: All endpoints require valid authentication
3. **Admin Checks**: Admin analytics endpoints verify admin role
4. **Rate Limiting**: Quota enforcement acts as built-in rate limiter
5. **Data Sanitization**: Model updates filter allowed fields

## Performance Optimizations

1. **Indexes** on high-frequency queries:
   - workspace_id for all tables
   - snapshot_date for time-range queries
   - invoice status and period dates

2. **Aggregation** at query time avoids redundant storage

3. **Lazy-load** warnings only when needed

4. **Batch operations** supported for admin bulk actions

## Troubleshooting

### Quota Not Enforcing
1. Verify middleware is registered on endpoint
2. Check workspace has tier assigned (create default if missing)
3. Review quotaEnforcement middleware logs

### Usage Not Recording
1. Verify UsageMetrics.recordEvent is called after operation
2. Check workspace_tier exists for workspace
3. Verify metric values are positive

### Warnings Not Appearing
1. Verify UsageWarning.checkAndCreate is called
2. Check unacknowledged warnings in database
3. Verify warning display in frontend

### Invoice Issues
1. Verify workspace_tier exists
2. Check invoice_number uniqueness
3. Confirm pdf_url is valid if stored
