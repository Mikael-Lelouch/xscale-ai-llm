# Local Models Backend API Implementation - Complete Guide

## Overview

This document describes the complete implementation of the Local Models Backend API for XSCALE AI. This is Phase 0 of the "IA Souveraine" (Sovereign AI) feature, enabling organizations to run and manage local language models without cloud dependencies.

## What Was Implemented

### 1. Database Schema

**File**: `server/prisma/schema.prisma` (lines 448-458)

A new `local_model_configs` Prisma model was added to store provider configurations:

```prisma
model local_model_configs {
  id            Int      @id @default(autoincrement())
  providerId    String   @unique
  isEnabled     Boolean  @default(false)
  baseUrl       String
  temperature   Float    @default(0.7)
  maxTokens     Int      @default(2048)
  defaultModel  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Fields**:
- `id`: Primary key, auto-increment
- `providerId`: Unique identifier for the provider (ollama, lmstudio, localai)
- `isEnabled`: Boolean flag to enable/disable the provider
- `baseUrl`: URL where the provider is running (e.g., http://localhost:11434)
- `temperature`: Model temperature parameter (0-1, default 0.7)
- `maxTokens`: Maximum tokens to generate in responses (default 2048)
- `defaultModel`: Name of the default model to use (optional)
- `createdAt`: Timestamp when config was created
- `updatedAt`: Auto-updated timestamp

**Migration**: `server/prisma/migrations/20260620170000_add_local_model_configs/migration.sql`

### 2. Backend Model

**File**: `server/models/localModelConfig.js`

This module provides CRUD operations for managing local model configurations with built-in validation:

```javascript
const LocalModelConfig = {
  get: async (providerId) => // Fetch config for a specific provider
  all: async () => // Get all provider configurations
  upsert: async (providerId, data) => // Create or update config
  delete: async (providerId) => // Delete a provider config
  _validateData: (data) => // Validate and sanitize data
}
```

**Validation Rules**:
- `temperature`: Must be a number between 0 and 1
- `baseUrl`: Must be a valid URL format
- `maxTokens`: Must be a positive integer
- `isEnabled`: Coerced to boolean
- `defaultModel`: Trimmed string or null

### 3. API Endpoints

**File**: `server/endpoints/api/localModels/index.js`

Six fully implemented REST endpoints with proper error handling, validation, and timeouts:

#### GET /v1/local-models/health

**Purpose**: Check connectivity to all local model providers

**Query Parameters**: None

**Response**:
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
    "lmstudio": { ... },
    "localai": { ... }
  },
  "timestamp": "2026-06-20T17:11:00.000Z"
}
```

**Status Codes**:
- `connected`: Provider responded successfully
- `disconnected`: Cannot reach provider
- `error`: Provider returned error status
- `unknown`: Not checked yet

**Implementation Details**:
- 3-second timeout per provider
- Tries `/api/tags` first for Ollama, then `/models` as fallback
- Database configuration takes precedence over environment variables
- Uses AbortController for timeout handling

#### GET /v1/local-models/list

**Purpose**: List available models from local providers

**Query Parameters**:
- `provider` (optional): Filter by provider ID (ollama, lmstudio, localai)

**Response**:
```json
{
  "success": true,
  "models": {
    "ollama": [
      { "name": "mistral", "size": 3800000000, "modified": "2024-06-20T..." },
      { "name": "llama2", "size": 3800000000, "modified": "2024-06-20T..." }
    ],
    "lmstudio": [
      { "name": "model-id", "owned_by": "organization" }
    ],
    "localai": [
      { "name": "model-name" }
    ]
  },
  "recommendations": {
    "local": [
      { "name": "mistral", "source": "ollama", "size": "7b", "recommended": true }
    ]
  }
}
```

**Implementation Details**:
- Fetches from provider base URLs stored in database
- Falls back to environment variables if no database config
- Parses different model formats per provider
- Includes model recommendations for local deployment

#### GET /v1/local-models/config

**Purpose**: Fetch current configuration for all providers

**Query Parameters**: None

**Response**:
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
      "createdAt": "2026-06-20T...",
      "updatedAt": "2026-06-20T..."
    },
    "lmstudio": { ... },
    "localai": { ... }
  }
}
```

**Implementation Details**:
- Returns all configurations from database
- Keyed by providerId for easy access
- Includes all config fields with timestamps

#### POST /v1/local-models/config

**Purpose**: Save or update configuration for a provider

**Request Body**:
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

**Response**:
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
    "createdAt": "2026-06-20T...",
    "updatedAt": "2026-06-20T..."
  }
}
```

**Validation**:
- `providerId` (required): Must be one of: ollama, lmstudio, localai
- `baseUrl` (required): Must be valid URL format
- `temperature` (optional): 0-1 range
- `maxTokens` (optional): Positive integer
- All data validated before database persistence

**HTTP Status Codes**:
- `200`: Success
- `400`: Validation error (invalid providerId, missing required fields, invalid ranges)
- `500`: Server error

#### POST /v1/local-models/test-connection

**Purpose**: Test connectivity to a specific provider

**Request Body**:
```json
{
  "providerId": "ollama",
  "baseUrl": "http://localhost:11434"
}
```

**Response on Success**:
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

**Response on Timeout**:
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

**Implementation Details**:
- 3-second timeout for connection attempt
- Uses `/api/tags` for Ollama, `/models` for others
- Returns model count on successful connection
- Validates provider ID and URL format before attempting connection

#### GET /v1/system/deployment-mode

**Purpose**: Detect current deployment mode

**Query Parameters**: None

**Response**:
```json
{
  "success": true,
  "mode": "local|cloud-us|cloud-eu",
  "provider": "ollama|openai|etc",
  "isLocal": true|false
}
```

**Implementation Details**:
- Checks if LLM_PROVIDER is in local providers list
- Returns deployment mode for UI decisions
- Determines if system is in sovereign AI mode

### 4. Frontend Integration

The frontend already has complete UI components that call these endpoints:

**File**: `frontend/src/pages/GeneralSettings/LocalModels/index.jsx`
- Main page showing all three providers
- Displays provider cards with health status
- Periodic refresh of health checks

**File**: `frontend/src/pages/GeneralSettings/LocalModels/ProviderCard/index.jsx`
- Card for each provider
- Health status display with visual indicators
- Expansion to show settings and models
- Integration with all API endpoints

**File**: `frontend/src/pages/GeneralSettings/LocalModels/ProviderSettings/index.jsx`
- Configuration form for temperature, maxTokens, baseUrl
- Test connection button
- Save configuration button
- Real-time value display

**File**: `frontend/src/pages/GeneralSettings/LocalModels/ModelSelector/index.jsx`
- Dropdown to select which model to use
- Dynamic loading from provider
- Handles empty states

**Frontend Client**: `frontend/src/models/localModels.js`
- `health()`: Calls GET /v1/local-models/health
- `listModels(provider)`: Calls GET /v1/local-models/list
- `getConfig()`: Calls GET /v1/local-models/config
- `saveConfig(data)`: Calls POST /v1/local-models/config
- `testConnection(provider, baseUrl)`: Calls POST /v1/local-models/test-connection

## Configuration Priority

The system uses this priority order for configuration sources:

1. **Database** (LocalModelConfig): Takes precedence
2. **Environment Variables**: Fallback if no database config
3. **Defaults**: Built-in defaults if nothing else available

Example for base URL resolution:
```javascript
baseUrl = configMap.ollama?.baseUrl || 
          process.env.OLLAMA_BASE_PATH || 
          "http://localhost:11434"
```

## Environment Variables Reference

If no database configuration exists, these environment variables are used:

```bash
OLLAMA_BASE_PATH=http://localhost:11434
LMSTUDIO_BASE_PATH=http://localhost:1234/v1
LOCAL_AI_BASE_PATH=http://localhost:8080/v1
OLLAMA_MODEL_PREF=mistral
LMSTUDIO_MODEL_PREF=model-id
LOCAL_AI_MODEL_PREF=model-name
```

## Supported Providers

### Ollama
- **Default URL**: http://localhost:11434
- **Models Endpoint**: GET /api/tags
- **Expected Response**:
```json
{
  "models": [
    {
      "name": "mistral",
      "size": 3800000000,
      "modified_at": "2024-06-20T..."
    }
  ]
}
```

### LM Studio
- **Default URL**: http://localhost:1234/v1
- **Models Endpoint**: GET /models
- **Expected Response**:
```json
{
  "data": [
    {
      "id": "model-name",
      "owned_by": "lm-studio"
    }
  ]
}
```

### LocalAI
- **Default URL**: http://localhost:8080/v1
- **Models Endpoint**: GET /models
- **Expected Response**:
```json
{
  "data": [
    {
      "id": "model-name"
    }
  ]
}
```

## Error Handling

All endpoints follow consistent error handling patterns:

**Validation Error** (400):
```json
{
  "success": false,
  "error": "providerId and baseUrl are required"
}
```

**Server Error** (500):
```json
{
  "success": false,
  "error": "Failed to save configuration"
}
```

**Connection Test Errors** (200 with status field):
```json
{
  "success": true,
  "status": "disconnected|timeout|error",
  "message": "Human readable error message",
  "data": { "provider": "ollama", "connected": false, "error": "..." }
}
```

## Database Operations

The `LocalModelConfig` model provides these operations:

### Get Configuration
```javascript
const config = await LocalModelConfig.get("ollama");
// Returns: { id, providerId, baseUrl, temperature, ... } or null
```

### Get All Configurations
```javascript
const allConfigs = await LocalModelConfig.all();
// Returns: Array of all provider configurations
```

### Save/Update Configuration
```javascript
const config = await LocalModelConfig.upsert("ollama", {
  baseUrl: "http://localhost:11434",
  temperature: 0.7,
  maxTokens: 2048,
  defaultModel: "mistral",
  isEnabled: true
});
// Validates data and returns saved config or null on error
```

### Delete Configuration
```javascript
const deleted = await LocalModelConfig.delete("ollama");
// Returns: true if successful, false otherwise
```

## Integration with Chat System

To use local models for chat:

1. User configures a local provider (e.g., Ollama at http://localhost:11434)
2. User selects a model from that provider
3. Configuration is saved to database via POST /v1/local-models/config
4. Chat system reads configuration from GET /v1/local-models/config
5. When user sends a message, system uses local model instead of cloud API

The chat system can determine whether to use local or cloud models by:
1. Checking GET /v1/system/deployment-mode
2. Reading LocalModelConfig from database
3. Using the defaultModel or currently selected model

## Next Steps

1. **Run Migration**:
   ```bash
   cd server && yarn prisma:setup
   ```

2. **Start Server**: The API will be immediately available

3. **Test Endpoints**: Use the UI in Settings > General Settings > Local Models

4. **Configure Models**: Set base URLs and select models via the frontend

5. **Integrate with Chat**: Update chat endpoint to use LocalModelConfig

## Files Modified/Created

- ✅ `server/prisma/schema.prisma` - Added local_model_configs model
- ✅ `server/prisma/migrations/20260620170000_add_local_model_configs/` - Database migration
- ✅ `server/models/localModelConfig.js` - CRUD operations
- ✅ `server/endpoints/api/localModels/index.js` - 6 API endpoints
- ✅ `frontend/src/pages/GeneralSettings/LocalModels/` - UI components (already complete)
- ✅ `frontend/src/models/localModels.js` - Frontend client (already complete)

## Testing

Test each endpoint with these cURL commands:

```bash
# Health check
curl http://localhost:3001/api/v1/local-models/health

# List all models
curl http://localhost:3001/api/v1/local-models/list

# List Ollama models only
curl http://localhost:3001/api/v1/local-models/list?provider=ollama

# Get current config
curl http://localhost:3001/api/v1/local-models/config

# Save Ollama config
curl -X POST http://localhost:3001/api/v1/local-models/config \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "ollama",
    "baseUrl": "http://localhost:11434",
    "temperature": 0.7,
    "maxTokens": 2048,
    "defaultModel": "mistral"
  }'

# Test connection
curl -X POST http://localhost:3001/api/v1/local-models/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "ollama",
    "baseUrl": "http://localhost:11434"
  }'

# Deployment mode
curl http://localhost:3001/api/v1/system/deployment-mode
```

## Conclusion

The Local Models Backend API is now fully implemented and ready for integration with the chat system. The API provides:

- Database-backed configuration persistence
- Three-provider support (Ollama, LM Studio, LocalAI)
- Comprehensive validation and error handling
- Timeout protection for external calls
- Full frontend integration
- Production-ready code with documentation

This implementation unblocks the "IA Souveraine" feature and enables organizations to deploy XSCALE AI with complete local AI autonomy.
