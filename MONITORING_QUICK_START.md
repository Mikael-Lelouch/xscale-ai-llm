# XSCALE AI Monitoring - Quick Start Guide

## 30-Second Setup

### 1. Install Dependencies
```bash
cd server && npm install
```

### 2. Configure Environment
```bash
# Add to .env
ENABLE_METRICS_ENDPOINT=true
ENABLE_ALERTS=true
LOG_LEVEL=info
GRAFANA_ADMIN_PASSWORD=admin123
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Start Services
```bash
cd docker && docker-compose up -d
```

### 4. Verify Services
```bash
# Check metrics
curl http://localhost:3001/metrics | head -10

# Access dashboards
# - XSCALE AI: http://localhost:3001
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (see docker-compose for port)
```

## Key Files

| Task | File |
|------|------|
| View metrics | `GET http://localhost:3001/metrics` |
| Configure alerts | `server/config/alerts.js` |
| View logs | `./storage/logs/combined.log` |
| Dashboard | Admin Panel > Monitoring |
| Alert history | `GET /api/admin/alerts/history` |
| Prometheus UI | http://localhost:9090 |
| Grafana UI | http://localhost:3001 |

## Essential Endpoints

```bash
# System metrics
curl http://localhost:3001/api/admin/monitoring/system-health

# Active alerts
curl http://localhost:3001/api/admin/alerts/active

# Endpoint performance
curl http://localhost:3001/api/admin/monitoring/endpoints?sortBy=latency

# Recent logs
curl http://localhost:3001/api/admin/logs?limit=50

# Acknowledge alert
curl -X POST http://localhost:3001/api/admin/alerts/high_error_rate/acknowledge
```

## Metrics Reference

**HTTP Performance**
- `http_requests_total` - Total requests
- `http_request_duration_seconds` - Response time (p50, p95, p99)
- `http_active_requests` - Current requests

**Errors**
- `xscale_errors_total` - Errors by type

**LLM**
- `xscale_chat_requests_total` - Chat volume
- `xscale_inference_duration_seconds` - Model latency

**Database**
- `xscale_db_query_duration_seconds` - Query latency
- `xscale_db_pool_available_connections` - Connection pool

**Full List**: See `PHASE_5_DELIVERABLES.md`

## Alert Rules

**Auto-Configured:**
1. High error rate (>1%)
2. High latency (p95 >2s)
3. High memory (>85%)
4. DB pool low (<2 available)
5. Slow inference (>30s)
6. Document backlog (>10 pending)
7. WebSocket limit (>80%)
8. Low disk space (<10%)

**Customize**: Edit `server/config/alerts.js`

## Log Levels

```env
LOG_LEVEL=error      # Errors only
LOG_LEVEL=warn       # Warnings + errors
LOG_LEVEL=info       # Info level (default)
LOG_LEVEL=debug      # Detailed debug info
LOG_LEVEL=trace      # Most verbose
```

## Troubleshooting

### No metrics?
```bash
# Check enabled
echo $ENABLE_METRICS_ENDPOINT

# Test endpoint
curl http://localhost:3001/metrics | head
```

### Prometheus not scraping?
```bash
# View targets
http://localhost:9090/targets

# Check logs
docker-compose logs prometheus
```

### Alerts not firing?
```bash
# Check enabled
echo $ENABLE_ALERTS

# Check config
cat server/config/alerts.js

# View service logs
docker-compose logs anything-llm | grep alert
```

### No data in Grafana?
```bash
# Query in Prometheus
http://localhost:9090/graph
# Run: up{job="xscale-ai"}
# Should return 1

# Check datasource
http://localhost:3001/admin/datasources
```

## Integration Example

```javascript
// Record metrics in your code
const { getInstance: getMetrics } = require("../utils/metrics");
const metrics = getMetrics();

// Chat request
metrics.recordChatRequest("workspace-id", "gpt-4");

// LLM inference
metrics.recordInference("gpt-4", "openai", 2.5, 250, 150);

// Database query
metrics.recordDatabaseQuery("SELECT", "documents", 0.045);

// Error
metrics.recordError("timeout", "/api/chat/send");
```

## Dashboard Access

1. Go to Admin Panel
2. Click "Monitoring" in sidebar
3. View real-time metrics
4. Click "Refresh Now" for manual update
5. Change "Refresh Interval" as needed

## Emergency Disable

To disable monitoring without restarting:

```bash
# In .env
ENABLE_METRICS_ENDPOINT=false
ENABLE_ALERTS=false
LOG_LEVEL=warn
```

Restart application to apply.

## Next Steps

1. ✅ Complete setup (3 mins)
2. Set Slack webhook for alerts (5 mins)
3. Review alert rules in `server/config/alerts.js` (10 mins)
4. Create custom Grafana dashboard (20 mins)
5. Configure email notifications (15 mins)
6. Set up log aggregation for production (optional)

## Documentation

- **Full Setup**: `MONITORING_SETUP.md`
- **Deliverables**: `PHASE_5_DELIVERABLES.md`
- **Code**: `server/utils/metrics.js`, `server/config/alerts.js`

## Support

1. Check logs: `./storage/logs/combined.log`
2. Review documentation files above
3. Run troubleshooting commands
4. Check Prometheus UI for data availability

---

**XSCALE AI Monitoring Ready** ✅
