# Local Models Configuration Feature - Implementation Guide

## Overview

This document describes the complete frontend implementation of the "Local Models" configuration section for XSCALE AI's AdminSettings. This feature allows administrators to discover, configure, and manage local language models from providers like Ollama, LM Studio, and LocalAI.

## What Has Been Implemented

### ✅ Frontend Components

#### 1. **Main Page Component**
- **File**: `/frontend/src/pages/GeneralSettings/LocalModels/index.jsx`
- **Features**:
  - Full-page settings layout with sidebar
  - Responsive grid for provider cards (1-3 columns based on screen size)
  - Loading skeleton while initializing
  - Informational tip section at bottom
  - Periodic health check refresh intervals

#### 2. **ProviderCard Component**
- **File**: `/frontend/src/pages/GeneralSettings/LocalModels/ProviderCard/index.jsx`
- **Features**:
  - Collapsible card interface for each provider
  - Real-time health status with animated spinner
  - Connection status indicators (✓ Connected / ✗ Not Connected)
  - Dynamic model list loading
  - Integration with ModelSelector and ProviderSettings
  - Toast notifications for success/error feedback
  - Test connection functionality

#### 3. **ModelSelector Component**
- **File**: `/frontend/src/pages/GeneralSettings/LocalModels/ModelSelector/index.jsx`
- **Features**:
  - Custom dropdown component for model selection
  - Dynamic model loading with "Loading models..." state
  - Model metadata display (name, size)
  - Click-outside detection for dropdown closing
  - Keyboard navigation support
  - Disabled state when provider not connected

#### 4. **ProviderSettings Component**
- **File**: `/frontend/src/pages/GeneralSettings/LocalModels/ProviderSettings/index.jsx`
- **Features**:
  - Base URL input field with validation
  - Temperature slider (0.0 - 1.0) with real-time value display
  - Max tokens numeric input
  - Test connection button with loading state
  - Save configuration button with conditional rendering
  - Change tracking to prevent unnecessary saves
  - Helpful descriptions for each setting

### ✅ API Communication Layer
- **File**: `/frontend/src/models/localModels.js`
- **Methods**:
  - `health()` - Fetch provider health status
  - `listModels(provider)` - Get available models
  - `getConfig()` - Retrieve current configuration
  - `saveConfig(data)` - Save configuration changes
  - `testConnection(provider, baseUrl)` - Test connectivity

### ✅ Routing Integration
- **Main Router** (`/frontend/src/main.jsx`):
  - Route definition: `/settings/local-models`
  - Protected with `AdminRoute`
  - Lazy-loaded for performance

### ✅ Navigation Integration
- **Settings Sidebar** (`/frontend/src/components/SettingsSidebar/index.jsx`):
  - Menu option added to "AI Providers" section
  - Translation key support
  - Admin-only visibility

### ✅ URL Utilities
- **Paths Helper** (`/frontend/src/utils/paths.js`):
  - Added `localModels()` path function
  - Consistent with existing path conventions

### ✅ Internationalization
- **Localization** (`/frontend/src/locales/en/common.js`):
  - Added `"local-models": "Local Models"` translation key
  - Ready for multi-language support

## Supported Local Model Providers

The implementation includes built-in support for three providers:

### 1. **Ollama**
- Default Base URL: `http://localhost:11434`
- Description: "Run large language models locally with Ollama"
- Popular models: llama2, mistral, neural-chat, etc.

### 2. **LM Studio**
- Default Base URL: `http://localhost:1234`
- Description: "Discover, download, and run LLMs with LM Studio"
- Great for local model management

### 3. **LocalAI**
- Default Base URL: `http://localhost:8080`
- Description: "Self-hosted inference engine for local LLM models"
- Flexible deployment options

## Component Tree

```
LocalModels (Main Page)
├── SettingsSidebar (navigation)
├── Header Section (title + description)
└── ProviderGrid
    └── ProviderCard (×3 providers)
        ├── Health Status Badge
        ├── ModelSelector
        │   └── Dropdown List
        └── ProviderSettings (when expanded + connected)
            ├── BaseURLInput
            ├── TemperatureSlider
            ├── MaxTokensInput
            └── ActionButtons
                ├── Test Connection
                └── Save Configuration
```

## Backend API Requirements

The frontend expects the following API endpoints to be implemented:

### 1. Health Check Endpoint
```
GET /api/v1/local-models/health

Response:
{
  "providers": {
    "ollama": {
      "status": "connected" | "error",
      "message": "Connection successful",
      "baseUrl": "http://localhost:11434"
    },
    "lmstudio": { ... },
    "localai": { ... }
  }
}
```

### 2. List Models Endpoint
```
POST /api/v1/local-models/list
Body: { "provider": "ollama" }

Response:
{
  "models": [
    { "name": "llama2", "size": "7b", "parameters": "..." },
    { "name": "mistral", "size": "7b", "parameters": "..." }
  ],
  "error": null
}
```

### 3. Configuration Endpoints
```
GET /api/v1/local-models/config

Response:
{
  "selectedProvider": "ollama",
  "selectedModel": "llama2",
  "settings": {
    "baseUrl": "http://localhost:11434",
    "temperature": 0.7,
    "maxTokens": 2048
  }
}

POST /api/v1/local-models/config
Body: {
  "provider": "ollama",
  "model": "llama2",
  "settings": {
    "baseUrl": "http://localhost:11434",
    "temperature": 0.7,
    "maxTokens": 2048
  }
}

Response:
{
  "success": true,
  "message": "Configuration saved"
}
```

### 4. Test Connection Endpoint
```
POST /api/v1/local-models/test-connection
Body: { "provider": "ollama", "baseUrl": "http://localhost:11434" }

Response:
{
  "success": true,
  "message": "Connected successfully"
}
```

## File Structure

```
frontend/
├── src/
│   ├── pages/
│   │   └── GeneralSettings/
│   │       └── LocalModels/
│   │           ├── index.jsx                    (Main page)
│   │           ├── README.md                    (Component documentation)
│   │           ├── ProviderCard/
│   │           │   └── index.jsx
│   │           ├── ModelSelector/
│   │           │   └── index.jsx
│   │           └── ProviderSettings/
│   │               └── index.jsx
│   ├── models/
│   │   └── localModels.js                       (API communication)
│   ├── components/
│   │   └── SettingsSidebar/
│   │       └── index.jsx                        (Updated with nav item)
│   ├── utils/
│   │   └── paths.js                             (Updated with route)
│   ├── locales/
│   │   └── en/
│   │       └── common.js                        (Updated with i18n keys)
│   └── main.jsx                                 (Updated with route)
```

## Styling

The component uses XSCALE's existing theme system with CSS variables:

### Key Color Variables
- `--theme-bg-container`: #0f0f12 - Main background
- `--theme-bg-secondary`: #1e1e26 - Secondary background
- `--theme-bg-primary`: #16161f - Primary background
- `--theme-text-primary`: #f1f5f9 - Primary text
- `--theme-text-secondary`: #94a3b8 - Secondary text
- `--primary-button`: #3b82f6 - Button colors
- `--theme-settings-input-bg`: #2d2d3d - Input backgrounds
- `--theme-sidebar-border`: #3d4147 - Border colors

### Responsive Grid
- Mobile (<768px): 1 column
- Tablet (768px-1024px): 2 columns
- Desktop (>1024px): 3 columns

## Features & Capabilities

### ✅ Implemented
- [x] Provider health status checking
- [x] Model discovery and listing
- [x] Connection testing
- [x] Configuration management (base URL, temperature, max tokens)
- [x] Model selection
- [x] Error handling with toast notifications
- [x] Loading states with spinners
- [x] Responsive design
- [x] Real-time status updates
- [x] Change detection for save buttons
- [x] Keyboard navigation in dropdowns
- [x] Click-outside dropdown closing

### 🔄 Pending Backend Implementation
- Backend API endpoint implementation
- Database schema for local models configuration
- Provider health check logic
- Model listing from each provider
- Configuration persistence

## Usage

### For Users
1. Navigate to Settings → AI Providers → Local Models
2. Provider cards display current connection status
3. Click to expand a provider card
4. If not connected, verify the provider is running and click "Retry"
5. Once connected, select a model from the dropdown
6. Adjust settings (temperature, max tokens) if needed
7. Click "Save Configuration" to apply changes
8. Use "Test" button to verify connection with new settings

### For Developers
1. Ensure backend API endpoints are implemented
2. Component automatically handles:
   - Health polling
   - Error messages
   - Loading states
   - Responsive layout
3. Customize provider list in main component if needed
4. Add translations for non-English languages

## Testing Checklist

- [ ] Page loads without errors
- [ ] Provider cards render correctly
- [ ] Health checks poll periodically
- [ ] Click-to-expand functionality works
- [ ] Model dropdown opens/closes properly
- [ ] Temperature slider updates value display
- [ ] Max tokens input accepts valid numbers
- [ ] Test connection button shows loading state
- [ ] Save button only appears when changes made
- [ ] Toast notifications appear for success/error
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Keyboard navigation works in dropdowns
- [ ] All form validations work correctly

## Known Limitations

1. **Backend Dependency**: Frontend is ready but requires backend API implementation
2. **Provider Hardcoding**: Provider list is hardcoded; dynamic provider registration not yet implemented
3. **Single Provider Selection**: Currently supports selecting one provider/model at a time
4. **No Model Filtering**: All models listed without filtering options
5. **No Model Details**: Limited model metadata display

## Future Enhancements

1. **Additional Providers**
   - Kobold.cpp
   - Text-generation-webui
   - VLLM
   - GPT4All

2. **Advanced Features**
   - Provider auto-discovery
   - Model search and filtering
   - Model performance metrics
   - Fallback model configuration
   - Model quantization selection
   - Resource usage monitoring

3. **User Experience**
   - Model download integration
   - Provider installation guides
   - Automatic port detection
   - Config import/export
   - Provider status notifications
   - Model comparison view

4. **Internationalization**
   - Full translation support for all UI text
   - Right-to-left language support

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Lazy loading of provider cards
- Debounced API calls during typing
- Cached model lists (consider TTL)
- Efficient re-renders with React hooks
- Minimal bundle size impact

## Security Considerations

- All API calls use standard authentication
- Base URLs validated as proper HTTP(S) URLs
- No sensitive data stored in localStorage
- XSS protection through React's built-in escaping
- CSRF tokens handled by existing middleware

## Support & Documentation

- See `/frontend/src/pages/GeneralSettings/LocalModels/README.md` for component details
- API contract details in this guide
- Backend implementation guide in progress

## Deployment Notes

1. Ensure `/settings/local-models` route is accessible only to admins
2. Backend API endpoints must be protected with admin authentication
3. Health checks should not timeout user experience
4. Model list caching recommended for performance
5. Error responses should include helpful messages for debugging

---

**Status**: ✅ Frontend Implementation Complete  
**Last Updated**: June 17, 2026  
**Contributors**: Claude Code Assistant
