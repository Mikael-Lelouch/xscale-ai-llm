# Sovereignty Dashboard Implementation - PHASE 2

## Overview

The Sovereignty Dashboard is the **critical marketing proof point** for "IA Souveraine Française" positioning. It provides enterprises, governments, and banks with transparent evidence that all data remains local and compliant with RGPD.

**Launch URL**: `/settings/sovereignty` (Admin-only route)

## Architecture

### Frontend Structure

```
frontend/src/pages/Admin/SovereigntyDashboard/
├── index.jsx                      # Main container & orchestrator
├── StatusCards.jsx                 # KPI cards (compliance %, local data, French models)
├── DataResidencyMap.jsx            # Map visual + storage location info
├── ModelChart.jsx                  # Pie chart of provider usage (Mistral/Ollama/Local)
├── ComplianceChecklist.jsx         # RGPD compliance verification checkboxes
└── ActivityLog.jsx                 # Recent events table with filtering
```

### Backend Structure

```
server/
├── models/auditLogs.js             # New AuditLogs model for compliance tracking
├── endpoints/api/admin/index.js    # 5 new REST endpoints
├── prisma/
│   ├── schema.prisma               # New audit_logs table
│   └── migrations/
│       └── 20260620_add_audit_logs/ # Migration file
```

## API Endpoints

### GET `/v1/admin/sovereignty/stats`
Returns comprehensive metrics including compliance status, provider usage, data residency, and system counts.

**Response Example**:
```json
{
  "compliance": {
    "isCompliant": true,
    "complianceScore": 100,
    "externalProviderUsageCount": 0,
    "checksCompleted": [
      {
        "name": "Aucune donnée envoyée à OpenAI/Google/Claude",
        "status": "pass",
        "details": "Zéro intégration avec des API externes"
      }
    ]
  },
  "dataResidency": {
    "provider": "Ollama",
    "dataLocation": "/app/server/storage",
    "isLocal": true,
    "region": "France (Local)",
    "storageType": "SQLite",
    "inferenceCount30Days": 1245
  },
  "providerUsage": {
    "byProvider": [
      {
        "provider": "Ollama",
        "count": 900,
        "percentage": "72.22"
      },
      {
        "provider": "Mistral",
        "count": 345,
        "percentage": "27.78"
      }
    ],
    "total": 1245
  },
  "metrics": {
    "totalInferencesLast30Days": 1245,
    "totalWorkspaces": 5,
    "totalUsers": 12
  },
  "timestamp": "2026-06-20T10:30:00Z"
}
```

### GET `/v1/admin/sovereignty/model-usage?daysBack=30`
Returns detailed model usage breakdown.

**Query Parameters**:
- `daysBack`: Number of days to look back (default: 30)

### GET `/v1/admin/sovereignty/activity-log?limit=50&offset=0&eventType=inference_recorded`
Returns recent audit events with optional filtering.

**Query Parameters**:
- `limit`: Max records (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `eventType`: Filter by event type (optional)

### POST `/v1/admin/sovereignty/log-inference`
Log an inference event for audit tracking.

**Request Body**:
```json
{
  "provider": "Ollama",
  "model": "mistral:latest",
  "workspaceId": 1,
  "userId": 1,
  "metadata": {
    "tokens": 150,
    "duration": 1200
  }
}
```

### POST `/v1/admin/sovereignty/export-compliance-pdf`
Generate and download a French-language compliance attestation PDF.

**Response**: PDF file (application/pdf)

## Database Schema

### audit_logs Table
```sql
CREATE TABLE "audit_logs" (
    id INTEGER PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    metadata TEXT,
    data_location TEXT,
    workspace_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);
```

**Event Types**:
- `inference_recorded` - LLM inference execution
- `provider_change` - Provider configuration change
- `compliance_check` - Scheduled compliance audit
- `data_residency_check` - Data location verification

## Frontend Components

### StatusCards
Displays 4 KPI cards:
1. **Zéro Donnée Externe** - Shows compliance status (✓ Conforme/✗ Non Conforme)
2. **100% Modèles Français** - Shows French model usage percentage
3. **Données Locales** - Shows data location and storage path
4. **Score de Conformité** - Shows overall compliance percentage

**Props**:
- `stats`: Object from `/v1/admin/sovereignty/stats`

### DataResidencyMap
Shows where data is physically stored with regional details.

**Features**:
- France flag emoji (🇫🇷)
- Data location path display
- Storage type info (SQLite)
- Statistics cards (inferences, workspaces, users)

**Props**:
- `dataResidency`: From stats.dataResidency
- `metrics`: From stats.metrics

### ModelChart
Pie chart showing LLM provider usage breakdown.

**Features**:
- Recharts pie chart
- Color-coded by provider
- Percentage display
- "100% Français/Open-Source" badge

**Props**:
- `providerUsage`: From stats.providerUsage

### ComplianceChecklist
Displays 6-item RGPD compliance checklist.

**Checks**:
1. No external provider usage (OpenAI/Google/Claude)
2. Telemetry disabled
3. Data encryption enabled
4. Local backups available
5. No mandatory cloud dependencies
6. Open-source code

**GDPR Actions**:
- Export user data
- Delete user data (right to be forgotten)
- View retention policy

**Props**:
- `compliance`: From stats.compliance

### ActivityLog
Sortable table of recent audit events with CSV export.

**Filters**:
- All events
- Inferences
- Compliance checks
- Provider changes
- Data residency checks

**Features**:
- Real-time event display
- CSV export capability
- Event type color coding
- Pagination info

**Props**:
- `logs`: Activity log array
- `isLoading`: Loading state

## Integration Points

### Menu Integration
The dashboard is accessible from the Admin menu in the SettingsSidebar:
- **Label**: "Tableau de Bord Souveraineté"
- **Path**: `/settings/sovereignty`
- **Role**: Admin only
- **Position**: First item under Admin section

### Frontend Model Extension
Added methods to `frontend/src/models/admin.js`:
```javascript
Admin.sovereigntyStats()           // Fetch stats
Admin.sovereigntyModelUsage()      // Fetch model breakdown
Admin.sovereigntyActivityLog()     // Fetch activity log
Admin.logInference()               // Log an inference
Admin.exportCompliancePDF()        // Export PDF attestation
```

### Routes
Added to `frontend/src/main.jsx`:
```javascript
{
  path: "/settings/sovereignty",
  lazy: async () => {
    const { default: SovereigntyDashboard } = await import(
      "@/pages/Admin/SovereigntyDashboard"
    );
    return { element: <AdminRoute Component={SovereigntyDashboard} /> };
  },
}
```

## Styling & Branding

### Color Scheme (XSCALE Brand)
- **Cyan**: `#06b6d4` - Primary accent (key metrics, actions)
- **Teal**: `#14b8a6` - Secondary accent (success, verified items)
- **Night**: `#0a0e1a` - Dark background
- **Emerald**: `#10b981` - Compliance passed
- **Red**: `#ef4444` - Compliance failed

### UI Patterns
- Glassmorphism cards with `backdrop-blur-sm`
- Border colors: `border-white/10` to `border-white/20`
- Background: `bg-theme-bg-secondary` with overlays
- Text: `text-theme-text-primary` and `text-theme-text-secondary`
- Icons: Phosphor Icons with responsive sizing

## Feature Capabilities

### Data Tracking
- ✓ LLM provider usage per workspace
- ✓ Storage size per workspace
- ✓ Inference counts and token usage
- ✓ Audit trail of compliance events
- ✓ Provider configuration changes
- ✓ Data location verification

### Compliance Features
- ✓ RGPD compliance checklist
- ✓ Data export capability
- ✓ Right to be forgotten (delete data)
- ✓ PDF attestation generation
- ✓ Audit event logging
- ✓ Automatic compliance scoring

### Reporting
- ✓ PDF attestation: "Attestation de Souveraineté"
- ✓ CSV export of audit logs
- ✓ Real-time dashboard metrics
- ✓ 30-day historical data
- ✓ Provider usage breakdown

## Usage Instructions

### For Administrators
1. Navigate to Settings → Admin → Tableau de Bord Souveraineté
2. View compliance status and data residency
3. Check model usage breakdown
4. Review RGPD compliance checklist
5. Export PDF attestation for government/enterprise
6. View recent audit events in activity log

### For Integration
To log inferences from the chat system:
```javascript
import Admin from "@/models/admin";

// When an inference completes
await Admin.logInference(
  "Ollama",           // provider
  "mistral:latest",   // model
  workspaceId,        // workspace
  {
    tokens: 156,
    duration: 1200    // milliseconds
  }
);
```

### Compliance Workflow
1. **Dashboard displays** current compliance status
2. **Attestation PDF** can be downloaded for audits
3. **Activity log** provides audit trail
4. **Auto-refresh** updates metrics every 5 minutes
5. **GDPR actions** allow user data management

## Performance Considerations

### Data Aggregation
- Queries use indexed fields (`event_type`, `created_at`, `provider`, `workspace_id`)
- 30-day data window default (configurable)
- Activity log limited to 50 items (max 100)
- Automatic purge of logs older than 90 days

### Frontend Optimization
- Lazy-loaded route component
- Recharts for efficient pie chart rendering
- Skeleton loading states during data fetch
- Auto-refresh every 5 minutes (configurable)
- Responsive mobile design

## Security & Privacy

### Data Residency Guarantee
- ✓ All data stored in `/app/server/storage` (local filesystem)
- ✓ No cloud provider dependencies
- ✓ No external API calls for LLM inference
- ✓ SQLite encryption optional at storage level

### Compliance Guarantee
- ✓ No telemetry transmission
- ✓ No tracking of user behavior
- ✓ GDPR-compliant data export/deletion
- ✓ Open-source codebase for transparency
- ✓ Local-only inference (Ollama/Mistral)

## Testing Checklist

- [ ] Dashboard loads without errors
- [ ] All stats API endpoints return valid data
- [ ] StatusCards display correct compliance status
- [ ] DataResidencyMap shows France location
- [ ] ModelChart renders pie chart correctly
- [ ] ComplianceChecklist shows all checks
- [ ] ActivityLog displays recent events
- [ ] CSV export works and contains proper data
- [ ] PDF export generates valid French attestation
- [ ] Auto-refresh updates metrics
- [ ] Mobile responsive layout works
- [ ] Admin-only access enforced
- [ ] All colors match XSCALE brand

## Deployment Notes

### Prerequisites
- Prisma migration must be applied: `yarn prisma:setup`
- Node packages: `pdf-lib` and `recharts` (already included)
- SQLite database accessible at configured path

### Environment Variables
- `LOCAL_STORAGE_PATH`: Path where data is stored (default: `/app/server/storage`)
- `DISABLE_TELEMETRY`: Should be "true" for full compliance

### Post-Deployment
1. Run Prisma migration
2. Restart server to load new schema
3. Test dashboard access at `/settings/sovereignty`
4. Verify PDF generation works
5. Monitor audit_logs table population

## Future Enhancements

- [ ] Real-time metrics WebSocket updates
- [ ] Advanced filtering on activity log
- [ ] Custom date range exports
- [ ] Compliance score trending chart
- [ ] Integration with external compliance tools
- [ ] Email attestation reports
- [ ] Multi-region data residency tracking
- [ ] Automated compliance alerts

## Support & Documentation

- **French Interface**: All text is in French for French market positioning
- **Government Ready**: PDF attestation suitable for official audits
- **Enterprise Grade**: Comprehensive audit trail and compliance tracking
- **Transparent**: Shows exactly where data lives and how it's used

---

**Status**: ✅ IMPLEMENTATION COMPLETE - Ready for marketing launch

This dashboard proves 🇫🇷 Souveraineté Numérique for XSCALE AI's positioning in the French market.
