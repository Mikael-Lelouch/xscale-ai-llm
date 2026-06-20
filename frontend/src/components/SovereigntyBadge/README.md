# SovereigntyBadge Component

A reusable React component for displaying XSCALE AI deployment mode throughout the user interface, providing transparency about data sovereignty and processing location.

## Overview

The SovereigntyBadge component displays the current deployment mode with:
- Three deployment variants (Local, EU Cloud, US Cloud)
- Three size options (small, medium, large)
- Responsive design (text hidden on mobile, icon persistent)
- Built-in tooltips with helpful explanations
- XSCALE color theming with dark/light mode support

## Features

- **Automatic Detection**: Hook-based deployment mode detection from system settings
- **Responsive**: Mobile-friendly with hidden text on small screens
- **Accessible**: Color + icon indicators, semantic HTML, tooltip support
- **Themable**: Dark/light mode support with appropriate color adjustments
- **Lightweight**: ~180 lines of code, no external dependencies beyond react-tooltip
- **Configurable**: Props for mode, size, tooltip visibility, and custom classes

## Installation

The component is already integrated. Import directly:

```jsx
import SovereigntyBadge, { useDeploymentMode, AutoDetectSovereigntyBadge } from '@/components/SovereigntyBadge';
```

## Usage

### Basic Usage (Manual Mode)

```jsx
<SovereigntyBadge mode="local" size="md" showTooltip={true} />
```

### With Auto-Detection Hook

```jsx
import { useDeploymentMode } from '@/components/SovereigntyBadge';
import { useState, useEffect } from 'react';

export function MyComponent() {
  const [mode, setMode] = useState("cloud-us");

  useEffect(() => {
    async function detectMode() {
      const detected = await useDeploymentMode();
      setMode(detected);
    }
    detectMode();
  }, []);

  return <SovereigntyBadge mode={mode} size="sm" />;
}
```

### Using AutoDetect Component

```jsx
import { AutoDetectSovereigntyBadge } from '@/components/SovereigntyBadge';

// Component handles detection automatically
<AutoDetectSovereigntyBadge size="md" className="custom-class" />
```

## Props

```typescript
interface SovereigntyBadgeProps {
  /** Deployment mode: local, cloud-eu, or cloud-us */
  mode?: "local" | "cloud-eu" | "cloud-us";
  
  /** Badge size: sm, md, or lg */
  size?: "sm" | "md" | "lg";
  
  /** Whether to show hover tooltip */
  showTooltip?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}
```

## Deployment Modes

### Local (Sovereign)
- **Icon**: 🏠 (Home icon)
- **Security Icon**: 🛡️
- **Label**: "Local (Sovereign)"
- **Colors**: Emerald/Green theme (#10b981)
- **Glow**: Strong emerald shadow effect
- **Tooltip**: Explains GDPR compliance and local providers
- **Detected when**: LLMProvider contains "ollama", "lmstudio", or "localai"
- **Compliance**: Full data sovereignty

### EU Cloud
- **Icon**: 🇪🇺 (EU Flag)
- **Security Icon**: 🛡️
- **Label**: "EU Cloud"
- **Colors**: Teal theme (#14b8a6)
- **Glow**: Teal shadow effect
- **Tooltip**: Explains EU infrastructure, GDPR compliance, and Schrems II compliance
- **Detected when**:
  - Azure EU regions (westeurope, northeurope, swedencentral, uksouth, francecentral, germanywestcentral)
  - AWS EU regions (eu-west-1, eu-west-2, eu-west-3, eu-central-1, eu-north-1)
  - Mistral API (api.mistral.ai)
- **Compliance**: GDPR compliant with EU data residency

### Cloud US (Default)
- **Icon**: ☁️ (Cloud icon)
- **Security Icon**: 🌐
- **Label**: "Cloud US"
- **Colors**: Slate/Gray theme (#6b7280)
- **Glow**: Slate shadow effect
- **Tooltip**: Describes US cloud infrastructure and regulatory context
- **Default**: Used when no local indicators detected
- **Compliance**: Subject to US data regulations and FISA surveillance rules

## Sizes

| Size | Padding | Text Size | Icon Size | Use Case |
|------|---------|-----------|-----------|----------|
| sm | px-2 py-1 | text-xs | text-sm | Headers, compact spaces |
| md | px-3 py-1.5 | text-sm | text-base | Standard size |
| lg | px-4 py-2 | text-base | text-lg | Prominent display |

## Hooks

### useDeploymentMode()

Async hook that detects current deployment mode.

```jsx
const mode = await useDeploymentMode();
// Returns: "local" | "cloud-eu" | "cloud-us"
```

**How it works**:
1. Calls `System.keys()` to fetch system settings
2. Reads `LLMProvider` field from settings
3. Matches against known local provider names
4. Returns appropriate mode or defaults to "cloud-us"

**Usage**:
```jsx
useEffect(() => {
  async function detect() {
    const mode = await useDeploymentMode();
    setDeploymentMode(mode);
  }
  detect();
}, []);
```

### AutoDetectSovereigntyBadge

Convenience component that auto-detects mode without manual state management.

```jsx
interface AutoDetectSovereigntyBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Shows loading state while detecting
<AutoDetectSovereigntyBadge size="md" />
```

## Styling

### Colors by Mode

**Local (Emerald - Full Sovereignty)**
- Background: `bg-emerald-900/40 dark:bg-emerald-900/50`
- Border: `border-emerald-400/50 dark:border-emerald-400/60`
- Text: `text-emerald-300 dark:text-emerald-200`
- Glow: `shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(16,185,129,0.5)]`
- Hex: #10b981

**EU Cloud (Teal - GDPR Compliant)**
- Background: `bg-teal-900/40 dark:bg-teal-900/50`
- Border: `border-teal-400/50 dark:border-teal-400/60`
- Text: `text-teal-300 dark:text-teal-200`
- Glow: `shadow-[0_0_20px_rgba(20,184,166,0.3)] dark:shadow-[0_0_20px_rgba(20,184,166,0.5)]`
- Hex: #14b8a6

**US Cloud (Slate - Standard Cloud)**
- Background: `bg-slate-700/30 dark:bg-slate-700/40`
- Border: `border-slate-400/40 dark:border-slate-400/50`
- Text: `text-slate-300 dark:text-slate-200`
- Glow: `shadow-[0_0_15px_rgba(100,116,139,0.2)]`
- Hex: #6b7280

## Responsive Behavior

- **Text**: Hidden on small screens (`hidden sm:inline`)
- **Icon**: Always visible
- **Scaling**: Size variants scale appropriately across breakpoints
- **Integration**: All integration points use `md:block` to hide on mobile

## Accessibility

- **Color + Icon**: Not relying on color alone
- **High Contrast**: Text on badge backgrounds meets WCAG standards
- **Tooltips**: Descriptive text via react-tooltip
- **Semantic HTML**: Proper structure for screen readers
- **Keyboard**: Tooltip accessible via keyboard navigation

## Integration Points

The component is pre-integrated in 4 locations:

1. **Login Page** (`/frontend/src/components/Modals/Password/index.jsx`)
   - Top-right corner showing deployment at login

2. **Sidebar** (`/frontend/src/components/Sidebar/index.jsx`)
   - Footer position, persistent throughout app

3. **Chat Header** (`/frontend/src/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker/index.jsx`)
   - Top-right of chat workspace during active sessions

4. **Onboarding** (`/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx`)
   - Educates users about deployment options at setup

## Customization

### Add Custom CSS

```jsx
<SovereigntyBadge 
  mode="local" 
  className="ring-2 ring-offset-2 ring-cyan-400"
/>
```

### Create New Deployment Mode

Edit the `config` object in `index.jsx`:

```jsx
const config = {
  "custom-cloud": {
    label: "Custom Cloud",
    icon: "🌐",
    bgColor: "bg-purple-900/40 dark:bg-purple-900/50",
    borderColor: "border-purple-400/50 dark:border-purple-400/60",
    textColor: "text-purple-300 dark:text-purple-200",
    glowColor: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
    tooltipText: "Custom deployment explanation...",
  },
};
```

### Extend Detection Logic

Modify `useDeploymentMode()` to add EU detection:

```jsx
export async function useDeploymentMode() {
  const settings = await System.keys();
  if (!settings) return "cloud-us";

  const provider = settings?.LLMProvider || "";
  const endpoint = settings?.APIBase || "";

  // Local detection
  if (isLocalProvider(provider)) return "local";

  // EU detection
  if (endpoint.includes("eu") || endpoint.includes("europe")) {
    return "cloud-eu";
  }

  return "cloud-us";
}
```

## Tooltip Content

Hover tooltips display:

**Local**:
> "Local Deployment: Your data stays on your infrastructure. Full GDPR compliance. Complete data sovereignty with Ollama, LM Studio, or Local AI."

**EU Cloud**:
> "EU Cloud Deployment: Data processed within EU infrastructure. GDPR compliant with EU data centers."

**US Cloud**:
> "US Cloud Deployment: Data processed in US cloud infrastructure."

## Performance

- **Lightweight**: ~180 lines of code
- **Efficient**: Detection runs once on mount via `useEffect`
- **Minimal Renders**: Proper dependency arrays prevent unnecessary re-renders
- **No Bloat**: Uses existing `react-tooltip` library (already in project)

## Browser Support

- Modern browsers (ES2020+)
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- No polyfills required

## Troubleshooting

### Badge Not Displaying

1. Check z-index is sufficient (20-30)
2. Verify parent has `position: relative` or `position: absolute`
3. Ensure component import path is correct
4. Check for console errors

### Wrong Deployment Mode

1. Verify `System.keys()` returns `LLMProvider`
2. Check LLMProvider value matches detection logic
3. Add debugging: `console.log(settings)` in hook
4. Verify backend returns correct setting

### Tooltip Not Working

1. Confirm `react-tooltip` is installed
2. Check browser console for warnings
3. Verify generated ID is unique
4. Check z-index doesn't hide tooltip

## Future Enhancements

- [ ] SovereigntyContext for global state
- [ ] Admin settings panel
- [ ] EU cloud auto-detection
- [ ] Analytics tracking
- [ ] Mobile-specific experience
- [ ] System notifications
- [ ] Feature flags integration

## Related Files

- **Component**: `/frontend/src/components/SovereigntyBadge/index.jsx`
- **System Model**: `/frontend/src/models/system.js`
- **Integration Guide**: `/SOVEREIGNTY_BADGE_INTEGRATION.md`
- **Quick Start**: `/SOVEREIGNTY_BADGE_QUICK_START.md`

## License

Same as XSCALE AI project license.
