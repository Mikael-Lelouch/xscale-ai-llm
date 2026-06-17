# Local Models Backend API Implementation Guide

## Overview

This document describes the backend API endpoints required to support the Local Models configuration feature in XSCALE AI.

## Architecture

The Local Models feature requires a new API endpoint group at `/api/v1/local-models/` with the following operations:

```
/api/v1/local-models/
├── health (GET)              - Check provider availability
├── list (POST)               - List models from provider
├── config (GET/POST)         - Get/set configuration
└── test-connection (POST)    - Test connectivity
```

## Database Schema

### LocalModelConfig Table

Store per-provider configuration:

```sql
CREATE TABLE local_model_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(255) NOT NULL UNIQUE,  -- ollama, lmstudio, localai
  base_url VARCHAR(500),                   -- e.g., http://localhost:11434
  selected_model VARCHAR(255),             -- e.g., llama2
  temperature FLOAT DEFAULT 0.7,           -- 0.0 - 1.0
  max_tokens INT DEFAULT 2048,             -- Max generation tokens
  enabled BOOLEAN DEFAULT FALSE,           -- Is this provider active?
  last_health_check TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Alternatively, use existing `SystemSettings` table:

```javascript
// Store as JSON in SystemSettings
{
  key: "local_models_config",
  value: {
    providers: {
      ollama: {
        baseUrl: "http://localhost:11434",
        selectedModel: "llama2",
        temperature: 0.7,
        maxTokens: 2048,
        enabled: true,
        lastHealthCheck: "2024-06-17T10:30:00Z"
      },
      lmstudio: { ... },
      localai: { ... }
    }
  }
}
```

## API Endpoints

### 1. GET /api/v1/local-models/health

**Purpose**: Check connectivity to all local model providers

**Authentication**: Admin only

**Request**:
```bash
GET /api/v1/local-models/health
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "timestamp": "2024-06-17T10:30:00Z",
  "providers": {
    "ollama": {
      "status": "connected",
      "baseUrl": "http://localhost:11434",
      "message": "Connection successful",
      "responseTime": 45,
      "modelCount": 3,
      "version": "0.1.0"
    },
    "lmstudio": {
      "status": "error",
      "baseUrl": "http://localhost:1234",
      "message": "Connection refused: ECONNREFUSED",
      "responseTime": 0
    },
    "localai": {
      "status": "connected",
      "baseUrl": "http://localhost:8080",
      "message": "Connection successful",
      "responseTime": 78,
      "modelCount": 1,
      "version": "1.0.0"
    }
  }
}
```

**Error Response (401/403)**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Implementation Notes**:
- Timeout each provider check to 3-5 seconds
- Cache results for 10-30 seconds to avoid hammering providers
- Don't block if one provider fails
- Include response time for diagnostics

### 2. POST /api/v1/local-models/list

**Purpose**: Fetch available models from a specific provider

**Authentication**: Admin only

**Request**:
```bash
POST /api/v1/local-models/list
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "ollama"  // Required: ollama, lmstudio, localai
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "provider": "ollama",
  "models": [
    {
      "name": "llama2",
      "size": "7b",
      "digest": "sha256:abcd1234...",
      "modifiedAt": "2024-06-10T15:30:00Z",
      "quantization": "q4_0"
    },
    {
      "name": "mistral",
      "size": "7b",
      "digest": "sha256:efgh5678...",
      "modifiedAt": "2024-06-15T10:00:00Z",
      "quantization": "q4_K_M"
    }
  ],
  "error": null
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "provider": "ollama",
  "models": [],
  "error": "Provider not connected: Connection refused"
}
```

**Implementation Notes**:
- Validate provider parameter
- Handle provider-specific API formats
- Normalize response across providers
- Cache model list with 5-10 minute TTL
- Include model metadata (size, quantization, last modified)

### 3. GET /api/v1/local-models/config

**Purpose**: Retrieve current local models configuration

**Authentication**: Admin only

**Request**:
```bash
GET /api/v1/local-models/config
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "config": {
    "selectedProvider": "ollama",
    "selectedModel": "llama2",
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434",
        "temperature": 0.7,
        "maxTokens": 2048,
        "enabled": true
      },
      "lmstudio": {
        "baseUrl": "http://localhost:1234",
        "temperature": 0.5,
        "maxTokens": 4096,
        "enabled": false
      },
      "localai": {
        "baseUrl": "http://localhost:8080",
        "temperature": 0.7,
        "maxTokens": 2048,
        "enabled": false
      }
    }
  }
}
```

### 4. POST /api/v1/local-models/config

**Purpose**: Save local models configuration

**Authentication**: Admin only

**Request**:
```bash
POST /api/v1/local-models/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "ollama",
  "model": "llama2",
  "settings": {
    "baseUrl": "http://localhost:11434",
    "temperature": 0.7,
    "maxTokens": 2048,
    "enabled": true
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Configuration saved successfully",
  "config": {
    "provider": "ollama",
    "model": "llama2",
    "settings": {
      "baseUrl": "http://localhost:11434",
      "temperature": 0.7,
      "maxTokens": 2048,
      "enabled": true
    }
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "error": "Invalid base URL format",
  "details": "baseUrl must be a valid HTTP(S) URL"
}
```

**Validation Rules**:
- `provider`: Must be "ollama", "lmstudio", or "localai"
- `model`: Must not be empty if provider is enabled
- `baseUrl`: Must be valid HTTP(S) URL
- `temperature`: Must be between 0.0 and 1.0
- `maxTokens`: Must be positive integer, typically 512-32768

**Implementation Notes**:
- Validate all input parameters
- Test connection to verify baseUrl is correct
- Store in database/config file
- Broadcast update to connected clients if needed
- Clear model list cache after update

### 5. POST /api/v1/local-models/test-connection

**Purpose**: Test connectivity to a specific provider

**Authentication**: Admin only

**Request**:
```bash
POST /api/v1/local-models/test-connection
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "ollama",
  "baseUrl": "http://localhost:11434"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Connected successfully",
  "responseTime": 45,
  "modelCount": 3,
  "version": "0.1.0"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Connection refused",
  "error": "ECONNREFUSED",
  "details": "Unable to reach http://localhost:11434"
}
```

**Implementation Notes**:
- Timeout connection attempt to 3-5 seconds
- Return helpful error messages
- Include response time and available model count
- Don't cache test connection results

## Provider Integration Details

### Ollama

**Health Check**:
```bash
GET http://localhost:11434/api/version
```

**List Models**:
```bash
GET http://localhost:11434/api/tags
```

**Response Format**:
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "modified_at": "2024-06-10T15:30:00Z",
      "size": 3825213440,
      "digest": "sha256:abcd1234..."
    }
  ]
}
```

### LM Studio

**Health Check**:
```bash
GET http://localhost:1234/api/v1/models
```

**List Models**:
```bash
GET http://localhost:1234/api/v1/models
```

**Response Format**:
```json
{
  "data": [
    {
      "id": "model-name",
      "object": "text_completion",
      "created": 1234567890,
      "owned_by": "lmstudio",
      "permission": [],
      "root": "model-name",
      "parent": null
    }
  ],
  "object": "list"
}
```

### LocalAI

**Health Check**:
```bash
GET http://localhost:8080/api/version
```

**List Models**:
```bash
GET http://localhost:8080/v1/models
```

**Response Format**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "model-name",
      "object": "model",
      "owned_by": "localai",
      "created": 1234567890
    }
  ]
}
```

## Error Handling

### Common Error Codes

| Status | Error | Meaning | Action |
|--------|-------|---------|--------|
| 400 | `INVALID_PROVIDER` | Unknown provider | Return list of valid providers |
| 400 | `INVALID_URL` | Bad base URL | Return URL format requirements |
| 400 | `INVALID_SETTINGS` | Settings validation failed | Return validation errors |
| 401 | `UNAUTHORIZED` | Not authenticated | Redirect to login |
| 403 | `FORBIDDEN` | Not admin | Return permission error |
| 500 | `INTERNAL_ERROR` | Server error | Log and return generic error |
| 503 | `PROVIDER_UNAVAILABLE` | Provider timeout/unreachable | Check provider is running |

### Error Response Format

```json
{
  "success": false,
  "error": "CONNECTION_TIMEOUT",
  "message": "Failed to connect to Ollama at http://localhost:11434",
  "details": "Connection timed out after 5 seconds",
  "statusCode": 503
}
```

## Implementation Checklist

- [ ] Create LocalModels model/service class
- [ ] Add database schema for local_model_config
- [ ] Implement health check endpoint
  - [ ] Ollama integration
  - [ ] LM Studio integration
  - [ ] LocalAI integration
  - [ ] Timeout handling
  - [ ] Caching
- [ ] Implement list models endpoint
  - [ ] Provider-specific API calls
  - [ ] Response normalization
  - [ ] Model parsing
  - [ ] Error handling
- [ ] Implement get config endpoint
- [ ] Implement save config endpoint
  - [ ] Input validation
  - [ ] Database persistence
  - [ ] Cache invalidation
- [ ] Implement test connection endpoint
- [ ] Add authentication/authorization
- [ ] Add error handling middleware
- [ ] Add logging
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add API documentation

## Environment Variables (Optional)

```
# Default base URLs for local model providers
LOCAL_MODELS_OLLAMA_URL=http://localhost:11434
LOCAL_MODELS_LMSTUDIO_URL=http://localhost:1234
LOCAL_MODELS_LOCALAI_URL=http://localhost:8080

# Health check settings
LOCAL_MODELS_HEALTH_CHECK_TIMEOUT=5000  # milliseconds
LOCAL_MODELS_HEALTH_CHECK_INTERVAL=30000  # milliseconds
LOCAL_MODELS_CACHE_TTL=600000  # milliseconds

# Model listing
LOCAL_MODELS_MAX_MODELS=100
LOCAL_MODELS_EXCLUDE_PATTERNS=  # comma-separated
```

## Security Considerations

1. **Authentication**: All endpoints require admin authentication
2. **Input Validation**: Validate all URL formats and parameters
3. **Rate Limiting**: Consider rate limiting health checks
4. **CORS**: Allow only local origins for provider communication
5. **Secrets**: Don't log sensitive URLs or credentials
6. **Timeout Protection**: Always set timeouts for provider calls

## Testing Strategy

### Unit Tests
- Validate input parameters
- Test URL validation
- Test settings validation
- Mock provider responses

### Integration Tests
- Test with actual local providers (if available)
- Test connection failures
- Test model parsing for each provider
- Test configuration persistence

### E2E Tests
- Full workflow from UI to provider
- Test all error scenarios
- Test concurrent requests
- Test cache invalidation

## Performance Optimization

1. **Caching**
   - Cache health check results for 10-30s
   - Cache model list for 5-10 minutes
   - Invalidate on config changes

2. **Concurrency**
   - Run provider health checks in parallel
   - Use Promise.all() to fetch health from all providers
   - Limit concurrent requests to providers

3. **Timeouts**
   - Set 3-5 second timeouts for all provider calls
   - Fail gracefully if provider is slow
   - Return partial results if some providers timeout

## Example Implementation (Node.js/Express)

```javascript
// /server/endpoints/api/v1/local-models.js

const Router = require("express").Router();
const { validAdmin } = require("../../middleware/adminAuth");
const LocalModelsService = require("../../services/localModels");

// Health check
Router.get("/health", validAdmin, async (req, res) => {
  try {
    const health = await LocalModelsService.checkHealth();
    res.json({ success: true, providers: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List models
Router.post("/list", validAdmin, async (req, res) => {
  try {
    const { provider } = req.body;
    const models = await LocalModelsService.listModels(provider);
    res.json({ success: true, models });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get config
Router.get("/config", validAdmin, async (req, res) => {
  try {
    const config = await LocalModelsService.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save config
Router.post("/config", validAdmin, async (req, res) => {
  try {
    const { provider, model, settings } = req.body;
    await LocalModelsService.saveConfig({ provider, model, settings });
    res.json({ success: true, message: "Configuration saved" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Test connection
Router.post("/test-connection", validAdmin, async (req, res) => {
  try {
    const { provider, baseUrl } = req.body;
    const result = await LocalModelsService.testConnection(provider, baseUrl);
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    res.status(503).json({ success: false, error: error.message });
  }
});

module.exports = Router;
```

---

**Status**: Design Complete - Ready for Backend Implementation  
**Last Updated**: June 17, 2026
