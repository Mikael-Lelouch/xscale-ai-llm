# Local Models Backend - Quick Start Guide

## Installation & Setup (5 minutes)

### 1. Run Database Migration

```bash
cd /home/user/xscale-ai-llm/server
yarn prisma:setup
```

This creates the `local_model_configs` table in your database.

### 2. Verify Backend is Working

Restart the server and verify endpoints are available:

```bash
# Check health of all providers
curl http://localhost:3001/api/v1/local-models/health

# Should return something like:
{
  "success": true,
  "providers": {
    "ollama": { "status": "disconnected", ... },
    "lmstudio": { "status": "disconnected", ... },
    "localai": { "status": "disconnected", ... }
  }
}
```

### 3. Access Frontend UI

Navigate to: `Settings > General Settings > Local Models`

You should see three cards for Ollama, LM Studio, and LocalAI.

## Configuration (10 minutes per provider)

### For Ollama

1. **Install Ollama** (https://ollama.ai)
2. **Start Ollama**: `ollama serve`
3. **In XSCALE AI UI**:
   - Click the Ollama card
   - Verify base URL is correct (default: http://localhost:11434)
   - Click "Test" to verify connection
   - Select a model from the dropdown
   - Save configuration

### For LM Studio

1. **Install LM Studio** (https://lmstudio.ai)
2. **Start LM Studio** and load a model
3. **Start local server**: Menu > Developer > Start Server (port 1234)
4. **In XSCALE AI UI**:
   - Click the LM Studio card
   - Change base URL to: http://localhost:1234/v1
   - Click "Test" to verify connection
   - Select a model from the dropdown
   - Save configuration

### For LocalAI

1. **Install LocalAI** (https://localai.io)
2. **Start LocalAI**: `./local-ai`
3. **In XSCALE AI UI**:
   - Click the LocalAI card
   - Change base URL to: http://localhost:8080/v1
   - Click "Test" to verify connection
   - Select a model from the dropdown
   - Save configuration

## API Endpoints Quick Reference

All endpoints are documented with the complete request/response formats in `LOCAL_MODELS_API_IMPLEMENTATION.md`.

### GET /v1/local-models/health
Check if providers are running. Returns status for each provider.

### GET /v1/local-models/list?provider=ollama
List available models. Add `?provider=ollama` to filter by provider.

### GET /v1/local-models/config
Get current configuration for all providers from database.

### POST /v1/local-models/config
Save or update configuration:
```json
{
  "providerId": "ollama",
  "baseUrl": "http://localhost:11434",
  "temperature": 0.7,
  "maxTokens": 2048,
  "defaultModel": "mistral"
}
```

### POST /v1/local-models/test-connection
Test connectivity:
```json
{
  "providerId": "ollama",
  "baseUrl": "http://localhost:11434"
}
```

## Database Schema

The system stores configs in the `local_model_configs` table:

```
id            | INTEGER PRIMARY KEY
providerId    | STRING UNIQUE (ollama, lmstudio, localai)
isEnabled     | BOOLEAN (default: false)
baseUrl       | STRING (e.g., http://localhost:11434)
temperature   | FLOAT 0-1 (default: 0.7)
maxTokens     | INTEGER (default: 2048)
defaultModel  | STRING (optional model name)
createdAt     | DATETIME
updatedAt     | DATETIME
```

## Configuration Priority

The system uses this order:
1. Database configuration (takes precedence)
2. Environment variables
3. Built-in defaults

## Files That Changed

- `server/prisma/schema.prisma` - Added model
- `server/prisma/migrations/20260620170000_add_local_model_configs/` - Migration SQL
- `server/models/localModelConfig.js` - New CRUD model
- `server/endpoints/api/localModels/index.js` - API endpoints

## Troubleshooting

### Models Not Appearing
- Verify provider is running: Use Health check endpoint
- Check base URL is correct: Update in UI and test connection
- Ensure provider is reachable from server: Test from server machine

### Connection Test Fails
- Is the provider running? Start Ollama/LM Studio/LocalAI
- Is it on the right port? Check default URLs in UI
- Firewall blocking? Ensure connectivity to localhost:port

### Configuration Not Saving
- Check browser console for errors
- Verify Prisma migration ran: `yarn prisma:studio`
- Check server logs for database errors

## Next: Integration with Chat

The chat system should be updated to:
1. Check `GET /v1/local-models/config` when user sends message
2. If local model is configured and enabled, use it instead of cloud API
3. Use the `defaultModel` from configuration
4. Pass `temperature` and `maxTokens` from config to the model

## Example Integration Code

```javascript
// In chat endpoint
const configs = await fetch('/api/v1/local-models/config').then(r => r.json());
const enabledProviders = Object.values(configs.data)
  .filter(c => c.isEnabled && c.defaultModel);

if (enabledProviders.length > 0) {
  // Use local model
  const config = enabledProviders[0];
  const response = await callLocalModel(config);
} else {
  // Use cloud API
  const response = await callCloudAPI();
}
```

## Support

For detailed API documentation, see: `LOCAL_MODELS_API_IMPLEMENTATION.md`

All endpoints are production-ready with:
- Input validation
- Error handling
- Timeout protection
- Swagger documentation
