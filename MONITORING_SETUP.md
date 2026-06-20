# XSCALE AI - Comprehensive Monitoring & Observability (Phase 5)

Complete monitoring and observability implementation for XSCALE AI with Prometheus metrics, structured logging, alerts, and admin dashboards.

## Architecture Overview

The monitoring system consists of 5 integrated layers:

1. **Metrics Collection** - Prometheus client for application metrics
2. **Structured Logging** - Winston JSON logging with rotation
3. **Alert Rules Engine** - Configurable alert thresholds and notifications
4. **Admin Dashboards** - Real-time monitoring UI
5. **Container Infrastructure** - Prometheus + Grafana Docker stack

## Quick Start

### 1. Installation

```bash
# Install metrics client library
cd server
npm install prom-client

# Or if using yarn
yarn add prom-client
```

### 2. Environment Configuration

Add to `.env` file:

```env
# Metrics Endpoint
ENABLE_METRICS_ENDPOINT=true

# Logging
LOG_LEVEL=info
LOG_DIR=./storage/logs
LOG_RETENTION_DAYS=7
ENABLE_CLOUD_LOGGING=false

# Alerts
ENABLE_ALERTS=true
ALERT_CHECK_INTERVAL_SEC=30
ALERT_EMAIL_TO=admin@example.com

# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_ALERT_CHANNEL=#alerts

# PagerDuty Integration (optional)
PAGERDUTY_INTEGRATION_KEY=your-integration-key

# Grafana Admin Password
GRAFANA_ADMIN_PASSWORD=your-secure-password
```

### 3. Start with Docker Compose

```bash
cd docker
docker-compose up -d
```

Services will be available at:
- XSCALE AI: http://localhost:3001
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (Grafana on alternate port)

## Metrics Endpoint

### Access Metrics

```bash
curl http://localhost:3001/metrics
```

Returns Prometheus-format metrics for scraping.

### Available Metrics

#### HTTP Metrics
- `http_request_duration_seconds` (histogram) - Request latency with p50/p95/p99
- `http_requests_total` (counter) - Total requests by method/path/status
- `http_active_requests` (gauge) - Currently processing requests
- `xscale_errors_total` (counter) - Errors by type and endpoint

#### LLM & Inference
- `xscale_chat_requests_total` - Chat requests by workspace/model
- `xscale_inference_duration_seconds` - LLM latency by model/provider
- `xscale_inference_tokens_total` - Tokens processed (input/output)

#### Document Processing
- `xscale_documents_processed_total` - Documents by type/workspace
- `xscale_document_processing_duration_seconds` - Processing time

#### WebSocket Metrics
- `xscale_websocket_connections` - Active WS connections
- `xscale_websocket_messages_total` - Messages by type

#### Database Metrics
- `xscale_db_query_duration_seconds` - Query latency by operation/table
- `xscale_db_queries_total` - Query count
- `xscale_slow_queries_total` - Slow queries (>100ms)
- `xscale_db_pool_available_connections` - Available pool connections

#### Service Health
- `xscale_service_health` - Service status (1=up, 0=down)
- `xscale_service_latency_seconds` - Service response time

## Logging System

### Log Levels

Configure with `LOG_LEVEL` environment variable:
- `error` - Error messages only
- `warn` - Warnings and above
- `info` - Info, warnings, and errors (default)
- `debug` - Detailed debugging information
- `trace` - Most verbose (not recommended for production)

### Log Output

**Development:**
- Console output with colors
- Real-time log streaming

**Production:**
- Console output (structured JSON)
- File rotation: `./storage/logs/combined.log`
- Error log: `./storage/logs/error.log`
- 7-day retention, 50MB per file max

### Logged Events

- **API Requests**: method, path, status, duration, user ID, request ID
- **Database Queries**: operation, table, duration (slow queries flagged)
- **LLM Calls**: model, provider, latency, token usage
- **Errors**: stack trace, context, request ID
- **Security Events**: login/logout, role changes, API key operations
- **Performance**: slow requests (>500ms), slow queries (>100ms), slow inference (>10s)

### Request ID Tracing

All requests get unique request ID:
- Generated automatically (UUID v4)
- Injected into all logs
- Available in response header: `X-Request-ID`
- Enables correlation of logs across entire request lifecycle

## Alert Rules

### Configured Alerts

1. **High Error Rate** (Critical)
   - Threshold: >1% errors in 5-minute window
   - Cooldown: 15 minutes
   - Channels: Email, Slack

2. **High Latency** (Warning)
   - Threshold: p95 latency >2 seconds
   - Duration: 10 minutes sustained
   - Channels: Slack

3. **High Memory Usage** (Warning)
   - Threshold: >85% memory utilization
   - Channels: Email, Slack

4. **Database Connection Pool Low** (Critical)
   - Threshold: <2 available connections
   - Channels: Email, PagerDuty

5. **Slow LLM Inference** (Warning)
   - Threshold: p99 latency >30 seconds
   - Channels: Slack

6. **Document Processing Backlog** (Info)
   - Threshold: >10 documents pending
   - Channels: Slack

7. **WebSocket Connection Limit** (Warning)
   - Threshold: >80% of max connections
   - Channels: Slack

8. **Low Disk Space** (Critical)
   - Threshold: <10% free space
   - Channels: Email, PagerDuty

### Customize Alerts

Edit `server/config/alerts.js`:

```javascript
{
  id: "my_custom_alert",
  name: "My Custom Alert",
  threshold: { operator: "gt", value: 100 },
  severity: "warning",
  enabled: true,
  channels: ["slack"],
  cooldown: 600,
  duration: 300,
}
```

### Notification Channels

#### Email
Set `ALERT_EMAIL_TO` environment variable and configure email provider.

#### Slack
Set `SLACK_WEBHOOK_URL` environment variable. Alerts appear in configured channel with:
- Alert name and severity
- Current metric value vs threshold
- Timestamp

#### PagerDuty
Set `PAGERDUTY_INTEGRATION_KEY` for on-call escalation.

#### UI Banner
Critical alerts display as banner in admin dashboard.

## Admin Monitoring Dashboard

### Accessing the Dashboard

Navigate to: **Admin Panel > Monitoring**

### Dashboard Components

#### 1. System Health
- CPU cores and model
- Memory usage with bar chart
- System uptime
- Overall health status

#### 2. Application Metrics
- HTTP Performance: requests/sec, p50/p95/p99 latency, error rate
- LLM Inference: active requests, latency, token rate
- Database: query time, queries/sec, slow queries, connection pool
- Document Processing: processed count, avg time, queue length

#### 3. Endpoint Analysis
- Sortable table of API endpoints
- Request counts, latency percentiles
- Error rates by endpoint
- Performance breakdown

#### 4. Active Alerts
- List of currently firing alerts
- Severity badges
- Time since fired
- Acknowledge button

### Refresh Controls
- Auto-refresh interval selector (10s, 30s, 1m, 5m)
- Manual refresh button
- Last update timestamp

## Log Viewer UI

### Accessing Logs

Navigate to: **Admin Panel > Logs**

### Log Filtering

- **Level**: error, warn, info, debug
- **Time Range**: Last 1h, 24h, 7d
- **Source**: http, database, llm, security
- **Search**: Full-text search in messages
- **Request ID**: Correlation across logs

### Features

- Real-time log tail
- Stack trace expansion for errors
- Export to CSV/JSON
- Performance analysis (slow requests)
- Error analytics (top errors, trends)

## Prometheus & Grafana

### Prometheus

Runs on port 9090:

```bash
# View scrape targets
http://localhost:9090/targets

# Query metrics (PromQL)
http://localhost:9090/graph
```

### Grafana

Pre-built dashboard at: `http://localhost:3001`

**Default Login:**
- Username: `admin`
- Password: (set via `GRAFANA_ADMIN_PASSWORD`)

**Dashboard Panels:**
1. Request Rate (5m average)
2. Memory Usage Gauge
3. Response Time Percentiles (p50/p95/p99)
4. Error Rate
5. Active WebSocket Connections
6. LLM Inference Latency

### Custom Dashboards

Add custom dashboards to:
`docker/monitoring/grafana/provisioning/dashboards/`

JSON format with Prometheus data source.

## Integration Examples

### Recording Metrics in Code

```javascript
// Import metrics
const { getInstance: getMetrics } = require("../utils/metrics");
const metrics = getMetrics();

// Record chat request
metrics.recordChatRequest("workspace-123", "gpt-4");

// Record LLM inference
metrics.recordInference(
  "gpt-4",
  "openai",
  2.5,  // duration in seconds
  250,  // input tokens
  150   // output tokens
);

// Record document processing
metrics.recordDocumentProcessed("pdf", "workspace-123", 3.2);

// Record database query
metrics.recordDatabaseQuery("SELECT", "documents", 0.045);

// Set service health
metrics.setServiceHealth("database", true);
```

### Error Tracking

```javascript
try {
  // your code
} catch (error) {
  metrics.recordError("connection_timeout", "/api/chat/send");
  throw error;
}
```

## Deployment

### Docker Compose Stack

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f anything-llm
docker-compose logs -f prometheus
docker-compose logs -f grafana

# Stop services
docker-compose down

# Cleanup volumes
docker-compose down -v
```

### Environment Variables for Production

```env
NODE_ENV=production
ENABLE_METRICS_ENDPOINT=true
LOG_LEVEL=info
LOG_RETENTION_DAYS=7
ENABLE_ALERTS=true
ALERT_CHECK_INTERVAL_SEC=30
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
GRAFANA_ADMIN_PASSWORD=secure-password
```

## Monitoring Best Practices

### 1. Alert Fatigue Prevention

- Set appropriate thresholds (not too sensitive)
- Use cooldown periods to prevent alert spam
- Acknowledge alerts to reduce visual clutter

### 2. Performance Impact

- Metrics collection is non-blocking (fire-and-forget)
- Alert evaluation runs on separate 30s interval
- Log rotation prevents unbounded disk growth
- Cardinality limits prevent memory issues

### 3. Data Retention

- Prometheus: 15 days by default (adjustable in `prometheus.yml`)
- Log files: 7 days with rotation (adjustable via `LOG_RETENTION_DAYS`)
- Alert history: 10,000 records in memory

### 4. Scaling Considerations

- Metrics cardinality limited to 50 unique label combinations per metric
- Database metrics tracked by operation + table (not per query)
- Request path patterns normalized to avoid explosion

## Troubleshooting

### Metrics endpoint not returning data

```bash
# Check if enabled
echo $ENABLE_METRICS_ENDPOINT

# Verify endpoint
curl -v http://localhost:3001/metrics | head -20
```

### Prometheus not scraping

1. Check Prometheus targets: http://localhost:9090/targets
2. Verify application metrics endpoint is accessible
3. Check logs: `docker-compose logs prometheus`
4. Verify `docker/monitoring/prometheus.yml` configuration

### Alerts not firing

1. Check alert service is initialized: `ENABLE_ALERTS=true`
2. Review alert rules in `server/config/alerts.js`
3. Check logs for alert evaluation errors
4. Verify notification channel configuration (.env)

### Grafana dashboard not showing data

1. Verify Prometheus datasource configured
2. Check Prometheus has data: http://localhost:9090/graph
3. Run PromQL query to verify metrics exist
4. Check dashboard JSON for correct metric names

## Architecture Files

### Core Monitoring
- `/server/utils/metrics.js` - Prometheus metrics collector
- `/server/middleware/metricsMiddleware.js` - HTTP metrics recording
- `/server/middleware/requestContext.js` - Request ID injection
- `/server/middleware/performanceLogger.js` - Slow operation detection

### Alerts & Configuration
- `/server/config/alerts.js` - Alert rules configuration
- `/server/services/alertService.js` - Alert evaluation engine

### API Endpoints
- `/server/endpoints/monitoring.js` - Monitoring API routes

### Frontend Dashboard
- `/frontend/src/pages/Admin/Monitoring/index.jsx` - Main dashboard
- `/frontend/src/pages/Admin/Monitoring/SystemHealth.jsx` - System metrics
- `/frontend/src/pages/Admin/Monitoring/MetricsOverview.jsx` - Application metrics
- `/frontend/src/pages/Admin/Monitoring/EndpointAnalysis.jsx` - Endpoint performance
- `/frontend/src/pages/Admin/Monitoring/AlertsPanel.jsx` - Active alerts
- `/frontend/src/pages/Admin/Monitoring/monitoring.css` - Dashboard styling

### Docker & Infrastructure
- `/docker/docker-compose.yml` - Updated with Prometheus & Grafana
- `/docker/monitoring/prometheus.yml` - Prometheus configuration
- `/docker/monitoring/grafana/provisioning/datasources/prometheus.yml` - Data source config
- `/docker/monitoring/grafana/provisioning/dashboards/xscale-ai.json` - Pre-built dashboard

## Next Steps

1. **Custom Metrics**: Add domain-specific metrics for your use case
2. **Alerting Integration**: Set up email, Slack, or PagerDuty channels
3. **Dashboard Expansion**: Create custom Grafana dashboards for specific metrics
4. **Log Analysis**: Implement log aggregation (ELK, Loki) for large deployments
5. **Cost Optimization**: Set appropriate retention policies and sampling rates

## Support

For issues or questions:
1. Check logs: `./storage/logs/combined.log`
2. Review alert configuration: `server/config/alerts.js`
3. Verify environment variables in `.env`
4. Check Docker services: `docker-compose ps`

---

**XSCALE AI Monitoring v1.0** - Production-grade observability for all deployments
