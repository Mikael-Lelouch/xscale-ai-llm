# Local Models Configuration

This directory contains the frontend implementation for the Local Models configuration section in XSCALE AI's AdminSettings.

## Component Structure

```
LocalModels/
├── index.jsx                    # Main page component with grid layout
├── ProviderCard/
│   └── index.jsx               # Card component for each local model provider
├── ProviderSettings/
│   └── index.jsx               # Settings form (base URL, temperature, max tokens)
├── ModelSelector/
│   └── index.jsx               # Dropdown selector for available models
└── README.md
```

## Features

- **Health Checks**: Real-time connection status for each provider
- **Model Discovery**: Automatically lists available models from connected providers
- **Dynamic Configuration**: Configure base URL, temperature, and max tokens per provider
- **Model Selection**: Select which model to use for XSCALE AI
- **Connection Testing**: Test connectivity to local model providers
- **Responsive Design**: Works on mobile, tablet, and desktop

## Supported Providers

The component currently supports three local model providers:

1. **Ollama** - Default base URL: `http://localhost:11434`
2. **LM Studio** - Default base URL: `http://localhost:1234`
3. **LocalAI** - Default base URL: `http://localhost:8080`

## API Endpoints

The component communicates with the following backend API endpoints:

### Health Check
- **Endpoint**: `GET /api/v1/local-models/health`
- **Response**: 
  ```json
  {
    "providers": {
      "ollama": {
        "status": "connected|error",
        "message": "string",
        "baseUrl": "http://localhost:11434"
      },
      ...
    }
  }
  ```

### List Models
- **Endpoint**: `POST /api/v1/local-models/list`
- **Request**: `{ "provider": "ollama" }`
- **Response**:
  ```json
  {
    "models": [
      { "name": "llama2", "size": "7b", "parameters": "..." },
      ...
    ],
    "error": null
  }
  ```

### Get Configuration
- **Endpoint**: `GET /api/v1/local-models/config`
- **Response**:
  ```json
  {
    "selectedProvider": "ollama",
    "selectedModel": "llama2",
    "settings": {
      "baseUrl": "http://localhost:11434",
      "temperature": 0.7,
      "maxTokens": 2048
    }
  }
  ```

### Save Configuration
- **Endpoint**: `POST /api/v1/local-models/config`
- **Request**:
  ```json
  {
    "provider": "ollama",
    "model": "llama2",
    "settings": {
      "baseUrl": "http://localhost:11434",
      "temperature": 0.7,
      "maxTokens": 2048
    }
  }
  ```

### Test Connection
- **Endpoint**: `POST /api/v1/local-models/test-connection`
- **Request**: `{ "provider": "ollama", "baseUrl": "http://localhost:11434" }`
- **Response**: `{ "success": true, "message": "Connected" }`

## Usage

The component is integrated into the settings sidebar under "AI Providers" > "Local Models".

### Route
- URL: `/settings/local-models`
- Requires: Admin role
- Protected by: `AdminRoute`

### Sidebar Navigation
The option appears in the SettingsSidebar under the "AI Providers" section.

## State Management

Each ProviderCard component manages:
- Health status polling
- Model list fetching
- Configuration state
- Save operations

The parent LocalModels component:
- Manages periodic refresh intervals
- Renders all provider cards in a responsive grid

## Styling

The component uses XSCALE theme CSS variables:

- `--theme-bg-container`: Page background
- `--theme-bg-secondary`: Main content area
- `--theme-bg-primary`: Card backgrounds
- `--theme-text-primary`: Primary text color
- `--theme-text-secondary`: Secondary text color
- `--theme-settings-input-bg`: Input field backgrounds
- `--theme-sidebar-border`: Border colors
- `--primary-button`: Button colors

## Responsive Behavior

- **Mobile** (< 768px): 1-column grid
- **Tablet** (768px - 1024px): 2-column grid
- **Desktop** (> 1024px): 3-column grid

## Error Handling

- Network errors are caught and displayed as toast notifications
- Connection test failures show helpful error messages
- Invalid configurations prevent saving with validation feedback
- Missing providers gracefully display "Not Connected" status

## Future Enhancements

- Add more local model providers (Kobold, Text-gen-webui, etc.)
- Provider auto-discovery
- Model filtering and search
- Performance benchmarking
- Model download/installation integration
- Fallback model configuration
