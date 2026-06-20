# Local Models API - Endpoints Quick Reference

## Summary Table

| Method | Endpoint | Purpose | Status Codes |
|--------|----------|---------|--------------|
| GET | `/v1/local-models/health` | Check provider connectivity | 200, 500 |
| GET | `/v1/local-models/list` | List available models | 200, 500 |
| GET | `/v1/local-models/config` | Get saved configurations | 200, 500 |
| POST | `/v1/local-models/config` | Save/update configuration | 200, 400, 500 |
| POST | `/v1/local-models/test-connection` | Test provider connectivity | 200, 400, 500 |
| GET | `/v1/system/deployment-mode` | Get deployment mode | 200, 500 |

---

## 1. GET /v1/local-models/health

**Purpose**: Check connectivity status of all three local model providers

**Query Parameters**: None

**Response (200)**:
```json
{
  "success": true,
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "name": "Ollama",
      "status": "connected|disconnected|error",
      "error": null
    },
    "lmstudio": { "baseUrl": "...", "status": "...", ... },
    "localai": { "baseUrl": "...", "status": "...", ... }
  },
  "timestamp": "2026-06-20T17:11:00.000Z"
}
```

**Status Values**:
- `connected` - Provider is accessible and responding
- `disconnected` - Cannot reach provider
- `error` - Provider returned error status
- `unknown` - Not checked yet

**Server Error (500)**:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 2. GET /v1/local-models/list

**Purpose**: List available models from local providers

**Query Parameters**:
- `provider` (optional) - Filter by provider: `ollama`, `lmstudio`, or `localai`

**Response (200)**:
```json
{
  "success": true,
  "models": {
    "ollama": [
      {
        "name": "mistral",
        "size": 3800000000,
        "modified": "2024-06-20T10:30:00Z"
      }
    ],
    "lmstudio": [
      {
        "name": "model-id",
        "owned_by": "lm-studio"
      }
    ],
    "localai": [
      {
        "name": "model-name"
      }
    ]
  },
  "recommendations": {
    "local": [
      {
        "name": "mistral",
        "source": "ollama",
        "size": "7b",
        "recommended": true
      }
    ]
  }
}
```

**With ?provider=ollama Filter**:
```json
{
  "success": true,
  "models": {
    "ollama": [
      { "name": "mistral", "size": 3800000000, ... }
    ]
  }
}
```

---

## 3. GET /v1/local-models/config

**Purpose**: Get current configuration for all providers from database

**Query Parameters**: None

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "ollama": {
      "id": 1,
      "providerId": "ollama",
      "isEnabled": true,
      "baseUrl": "http://localhost:11434",
      "temperature": 0.7,
      "maxTokens": 2048,
      "defaultModel": "mistral",
      "createdAt": "2026-06-20T17:11:00.000Z",
      "updatedAt": "2026-06-20T17:11:00.000Z"
    },
    "lmstudio": { ... },
    "localai": { ... }
  }
}
```

**When No Config Exists** (empty data):
```json
{
  "success": true,
  "data": {}
}
```

---

## 4. POST /v1/local-models/config

**Purpose**: Save or update configuration for a provider

**Request Body** (required fields: providerId, baseUrl):
```json
{
  "providerId": "ollama",
  "baseUrl": "http://localhost:11434",
  "isEnabled": true,
  "temperature": 0.7,
  "maxTokens": 2048,
  "defaultModel": "mistral"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "providerId": "ollama",
    "isEnabled": true,
    "baseUrl": "http://localhost:11434",
    "temperature": 0.7,
    "maxTokens": 2048,
    "defaultModel": "mistral",
    "createdAt": "2026-06-20T17:11:00.000Z",
    "updatedAt": "2026-06-20T17:11:00.000Z"
  }
}
```

**Validation Error (400)**:
```json
{
  "success": false,
  "error": "providerId and baseUrl are required"
}
```

**Invalid Provider (400)**:
```json
{
  "success": false,
  "error": "Invalid providerId. Must be one of: ollama, lmstudio, localai"
}
```

**Invalid URL (400)**:
```json
{
  "success": false,
  "error": "Invalid baseUrl format"
}
```

**Invalid Temperature (400)**:
```json
{
  "success": false,
  "error": "Temperature must be between 0 and 1"
}
```

---

## 5. POST /v1/local-models/test-connection

**Purpose**: Test connectivity to a specific provider with timeout

**Request Body** (required fields: providerId, baseUrl):
```json
{
  "providerId": "ollama",
  "baseUrl": "http://localhost:11434"
}
```

**Success Response (200)** - Connected:
```json
{
  "success": true,
  "status": "connected",
  "message": "Successfully connected to ollama",
  "data": {
    "provider": "ollama",
    "connected": true,
    "models": 5
  }
}
```

**Timeout Response (200)** - After 3 seconds:
```json
{
  "success": true,
  "status": "timeout",
  "message": "Connection to ollama timed out (3s)",
  "data": {
    "provider": "ollama",
    "connected": false
  }
}
```

**Connection Error (200)** - Cannot reach:
```json
{
  "success": true,
  "status": "disconnected",
  "message": "Failed to connect to ollama: getaddrinfo ENOTFOUND localhost",
  "data": {
    "provider": "ollama",
    "connected": false,
    "error": "getaddrinfo ENOTFOUND localhost"
  }
}
```

**HTTP Error (200)** - Bad response:
```json
{
  "success": true,
  "status": "error",
  "message": "HTTP 500 from ollama",
  "data": {
    "provider": "ollama",
    "connected": false,
    "statusCode": 500
  }
}
```

**Validation Error (400)**:
```json
{
  "success": false,
  "error": "providerId and baseUrl are required"
}
```

---

## 6. GET /v1/system/deployment-mode

**Purpose**: Detect current deployment mode (local vs cloud)

**Query Parameters**: None

**Response (200)** - Local Mode:
```json
{
  "success": true,
  "mode": "local",
  "provider": "ollama",
  "isLocal": true
}
```

**Response (200)** - Cloud Mode (US):
```json
{
  "success": true,
  "mode": "cloud-us",
  "provider": "openai",
  "isLocal": false
}
```

**Response (200)** - Cloud Mode (EU):
```json
{
  "success": true,
  "mode": "cloud-eu",
  "provider": "azure-openai",
  "isLocal": false
}
```

---

## Common Request Examples

### cURL Examples

**Check Health**:
```bash
curl http://localhost:3001/api/v1/local-models/health
```

**List All Models**:
```bash
curl http://localhost:3001/api/v1/local-models/list
```

**List Ollama Models Only**:
```bash
curl "http://localhost:3001/api/v1/local-models/list?provider=ollama"
```

**Get Current Config**:
```bash
curl http://localhost:3001/api/v1/local-models/config
```

**Save Ollama Config**:
```bash
curl -X POST http://localhost:3001/api/v1/local-models/config \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "ollama",
    "baseUrl": "http://localhost:11434",
    "temperature": 0.7,
    "maxTokens": 2048,
    "defaultModel": "mistral"
  }'
```

**Test Ollama Connection**:
```bash
curl -X POST http://localhost:3001/api/v1/local-models/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "ollama",
    "baseUrl": "http://localhost:11434"
  }'
```

**Check Deployment Mode**:
```bash
curl http://localhost:3001/api/v1/system/deployment-mode
```

### JavaScript/Fetch Examples

**Check Health**:
```javascript
const health = await fetch('/api/v1/local-models/health').then(r => r.json());
```

**Save Config**:
```javascript
const result = await fetch('/api/v1/local-models/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    providerId: 'ollama',
    baseUrl: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 2048,
    defaultModel: 'mistral'
  })
}).then(r => r.json());
```

---

## Request/Response Validation

### Request Validation

**providerId**:
- Required for config/test endpoints
- Must be: `ollama`, `lmstudio`, or `localai`
- Case-insensitive

**baseUrl**:
- Required for config/test endpoints
- Must be valid URL format (e.g., http://localhost:11434)
- Validated with `new URL(baseUrl)`

**temperature**:
- Optional, defaults to 0.7
- Must be between 0 and 1
- Type: number

**maxTokens**:
- Optional, defaults to 2048
- Must be positive integer
- Type: number

**isEnabled**:
- Optional, defaults to false
- Type: boolean

**defaultModel**:
- Optional
- Must be non-empty string if provided
- Type: string or null

### Response Structure

All responses follow this pattern:

**Success**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "ISO-8601 timestamp (health only)"
}
```

**Error**:
```json
{
  "success": false,
  "error": "Human readable error message"
}
```

**Connection Test** (special case):
```json
{
  "success": true,
  "status": "connected|timeout|disconnected|error",
  "message": "Human readable status message",
  "data": { /* status data */ }
}
```

---

## Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | Success | All successful requests and test results |
| 400 | Bad Request | Missing required fields, invalid format, validation error |
| 500 | Server Error | Database error, unexpected exception |

---

## Timeouts

| Operation | Timeout | Behavior |
|-----------|---------|----------|
| Health check per provider | 3 seconds | Returns status: "disconnected" if timeout |
| Test connection | 3 seconds | Returns status: "timeout" if timeout |
| Model list fetch | 5 seconds | Falls back to empty array if timeout |

---

## Configuration Examples

### Ollama
```json
{
  "providerId": "ollama",
  "baseUrl": "http://localhost:11434",
  "temperature": 0.7,
  "maxTokens": 2048,
  "defaultModel": "mistral"
}
```

### LM Studio
```json
{
  "providerId": "lmstudio",
  "baseUrl": "http://localhost:1234/v1",
  "temperature": 0.8,
  "maxTokens": 4096,
  "defaultModel": "model-id"
}
```

### LocalAI
```json
{
  "providerId": "localai",
  "baseUrl": "http://localhost:8080/v1",
  "temperature": 0.5,
  "maxTokens": 1024,
  "defaultModel": "model-name"
}
```

---

## Integration Pattern

```javascript
// 1. Check health
const health = await fetch('/api/v1/local-models/health').then(r => r.json());
if (health.providers.ollama.status !== 'connected') {
  console.log('Ollama not available');
  return;
}

// 2. List models
const models = await fetch('/api/v1/local-models/list?provider=ollama')
  .then(r => r.json());
console.log(models.ollama); // Array of available models

// 3. Save config
const config = await fetch('/api/v1/local-models/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    providerId: 'ollama',
    baseUrl: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 2048,
    defaultModel: models.ollama[0].name
  })
}).then(r => r.json());

// 4. Get config
const saved = await fetch('/api/v1/local-models/config').then(r => r.json());
console.log(saved.data.ollama); // Saved configuration
```

---

## Endpoint Availability

All endpoints are available immediately after:
1. Running `yarn prisma:setup`
2. Starting the server
3. Frontend can call them at `/api/v1/local-models/*`

No additional setup or configuration required beyond database migration.
