# Sovereignty Badge Component Integration Guide

## Overview

The **SovereigntyBadge** component is a reusable UI element that displays the current deployment mode (Local, EU Cloud, or US Cloud) with appropriate styling and tooltips. It's designed to give users visibility into where their data is being processed.

---

## Component Location

**File**: `/frontend/src/components/SovereigntyBadge/index.jsx`

---

## Component Features

### Three Deployment Modes

1. **`mode="local"`** - Local Deployment (Sovereign)
   - Icon: 🇫🇷 (French flag)
   - Label: "Local (Sovereign)"
   - Colors: Cyan/teal (CSS classes: `cyan-400`, `cyan-900`)
   - Glow effect for emphasis
   - Tooltip: Explains data sovereignty, GDPR compliance, and local providers (Ollama, LM Studio, Local AI)

2. **`mode="cloud-eu"`** - EU Cloud Deployment
   - Icon: 🇪🇺 (EU flag)
   - Label: "EU Cloud"
   - Colors: Blue (CSS classes: `blue-400`, `blue-900`)
   - Tooltip: Explains EU infrastructure and GDPR compliance

3. **`mode="cloud-us"`** - US Cloud Deployment (default)
   - Icon: ☁️ (cloud)
   - Label: "Cloud US"
   - Colors: Slate/gray (CSS classes: `slate-400`, `slate-700`)
   - Tooltip: Explains US cloud infrastructure

### Props

```typescript
interface SovereigntyBadgeProps {
  mode?: "local" | "cloud-eu" | "cloud-us";  // default: "local"
  size?: "sm" | "md" | "lg";                  // default: "md"
  showTooltip?: boolean;                      // default: true
  className?: string;                         // additional CSS classes
}
```

### Sizes

- **`sm`** (Small): `px-2 py-1`, `text-xs` - For compact header placement
- **`md`** (Medium): `px-3 py-1.5`, `text-sm` - Standard size
- **`lg`** (Large): `px-4 py-2`, `text-base` - For prominent display

---

## Helper Functions & Hooks

### `useDeploymentMode()` - Async Hook

Detects current deployment mode by analyzing system settings.

```jsx
import { useDeploymentMode } from '@/components/SovereigntyBadge';

const [deploymentMode, setDeploymentMode] = useState("cloud-us");

useEffect(() => {
  async function detectMode() {
    const detectedMode = await useDeploymentMode();
    setDeploymentMode(detectedMode);
  }
  detectMode();
}, []);
```

**How it works**:
- Calls `System.keys()` to fetch system settings
- Checks `LLMProvider` property
- If provider includes "ollama", "lmstudio", or "localai" → returns `"local"`
- Otherwise defaults to `"cloud-us"`
- (Can be extended for EU detection via API endpoint analysis)

### `AutoDetectSovereigntyBadge` - Component

Convenience component that auto-detects deployment mode without manual state management.

```jsx
import { AutoDetectSovereigntyBadge } from '@/components/SovereigntyBadge';

// Renders badge with loading state while fetching deployment mode
<AutoDetectSovereigntyBadge size="md" className="custom-class" />
```

---

## Integration Points

### 1. Login Page (Password Modal)

**File**: `/frontend/src/components/Modals/Password/index.jsx`

**Location**: Top-right corner of the login modal

**Code**:
```jsx
import SovereigntyBadge, { useDeploymentMode } from "../../SovereigntyBadge";

export default function PasswordModal({ mode = "single" }) {
  const { loginLogo, isCustomLogo } = useLogo();
  const [deploymentMode, setDeploymentMode] = useState("cloud-us");

  useEffect(() => {
    async function detectMode() {
      const detectedMode = await useDeploymentMode();
      setDeploymentMode(detectedMode);
    }
    detectMode();
  }, []);

  return (
    <div className="fixed inset-0 bg-login-gradient light:bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Sovereignty Badge - Top Right */}
      <div className="fixed top-6 right-6 z-20">
        <SovereigntyBadge mode={deploymentMode} size="sm" showTooltip={true} />
      </div>
      
      {/* ... rest of modal ... */}
    </div>
  );
}
```

**Features**:
- Shows on login screen before user is authenticated
- Small size to not clutter the login form
- Helps users understand data handling from the moment they access the UI

---

### 2. Sidebar Footer

**File**: `/frontend/src/components/Sidebar/index.jsx`

**Location**: Bottom of sidebar, next to Footer component

**Code**:
```jsx
import SovereigntyBadge, { useDeploymentMode } from "../SovereigntyBadge";

export default function Sidebar() {
  const [deploymentMode, setDeploymentMode] = useState("cloud-us");

  useEffect(() => {
    async function detectMode() {
      const detectedMode = await useDeploymentMode();
      setDeploymentMode(detectedMode);
    }
    detectMode();
  }, []);

  return (
    // ... sidebar structure ...
    <div className="absolute bottom-0 left-0 right-0 pb-3 px-3 rounded-b-[16px] bg-theme-bg-sidebar light:bg-slate-200 bg-opacity-80 backdrop-filter backdrop-blur-md z-10 flex items-center justify-between">
      <Footer />
      <div className={`transition-opacity duration-500 ${showSidebar ? "opacity-100" : "opacity-0"}`}>
        <SovereigntyBadge
          mode={deploymentMode}
          size="sm"
          showTooltip={true}
          className="flex-shrink-0"
        />
      </div>
    </div>
  );
}
```

**Features**:
- Always visible in sidebar footer
- Persistent indicator of deployment mode throughout the app
- Opacity transitions with sidebar visibility
- Small size to fit naturally in footer area

---

### 3. Workspace Chat Header (Top-Right)

**File**: `/frontend/src/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker/index.jsx`

**Location**: Top-right corner of chat interface, next to model selector

**Code**:
```jsx
import SovereigntyBadge, { useDeploymentMode } from "@/components/SovereigntyBadge";

export default function WorkspaceModelPicker({ workspaceSlug = null }) {
  const [deploymentMode, setDeploymentMode] = useState("cloud-us");

  useEffect(() => {
    async function detectMode() {
      const detectedMode = await useDeploymentMode();
      setDeploymentMode(detectedMode);
    }
    detectMode();
  }, []);

  return (
    <>
      {/* Model Picker Button */}
      <div className={`hidden md:block absolute top-2 z-30 transition-all duration-500 ${
        sidebarOpen ? "left-3" : "left-11"
      }`}>
        {/* ... model picker ... */}
      </div>

      {/* Sovereignty Badge - Top Right */}
      <div className="hidden md:block absolute top-2 right-3 z-30">
        <SovereigntyBadge
          mode={deploymentMode}
          size="sm"
          showTooltip={true}
        />
      </div>
    </>
  );
}
```

**Features**:
- Top-right of chat workspace
- Hidden on mobile (use responsive hiding)
- Close to model selector for context about data handling
- Visible during active chat sessions

---

### 4. Onboarding Home Page

**File**: `/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx`

**Location**: Top-right corner of onboarding screen

**Code**:
```jsx
import SovereigntyBadge, { useDeploymentMode } from "@/components/SovereigntyBadge";
import { useState, useEffect } from "react";

export default function OnboardingHome() {
  const [deploymentMode, setDeploymentMode] = useState("cloud-us");

  useEffect(() => {
    async function detectMode() {
      const detectedMode = await useDeploymentMode();
      setDeploymentMode(detectedMode);
    }
    detectMode();
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-xscale-night light:bg-slate-50">
      {/* Sovereignty Badge - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <SovereigntyBadge mode={deploymentMode} size="sm" showTooltip={true} />
      </div>

      {/* ... rest of onboarding ... */}
    </div>
  );
}
```

**Features**:
- Displayed at the start of onboarding flow
- Educates users about data sovereignty options
- Early transparency before they choose their deployment

---

## Styling Details

### Colors by Mode

**Local Mode**:
- Background: `bg-cyan-900/40 dark:bg-cyan-900/50`
- Border: `border-cyan-400/50 dark:border-cyan-400/60`
- Text: `text-cyan-300 dark:text-cyan-200`
- Glow: `shadow-[0_0_20px_rgba(6,182,212,0.3)]` (stronger glow for emphasis)

**EU Cloud Mode**:
- Background: `bg-blue-900/30 dark:bg-blue-900/40`
- Border: `border-blue-400/40 dark:border-blue-400/50`
- Text: `text-blue-300 dark:text-blue-200`
- Glow: `shadow-[0_0_15px_rgba(59,130,246,0.2)]`

**US Cloud Mode**:
- Background: `bg-slate-700/30 dark:bg-slate-700/40`
- Border: `border-slate-400/40 dark:border-slate-400/50`
- Text: `text-slate-300 dark:text-slate-200`
- Glow: `shadow-[0_0_15px_rgba(100,116,139,0.2)]`

### Responsive Behavior

- Text label hidden on mobile (display: `hidden sm:inline`)
- Only icon visible on small screens
- All integration points use `hidden md:block` to hide from mobile

---

## Extending the Component

### Adding More Deployment Modes

Edit the `config` object in `SovereigntyBadge/index.jsx`:

```jsx
const config = {
  "your-new-mode": {
    label: "Your Label",
    icon: "🌍",
    bgColor: "bg-color-900/40",
    borderColor: "border-color-400/50",
    textColor: "text-color-300",
    glowColor: "shadow-[...]",
    tooltipText: "Your tooltip explanation..."
  },
  // ... existing modes ...
};
```

### Improving Deployment Detection

Enhance `useDeploymentMode()` to detect EU cloud:

```jsx
export async function useDeploymentMode() {
  const settings = await System.keys();
  if (!settings) return "cloud-us";

  const provider = settings?.LLMProvider || "";
  const apiEndpoint = settings?.APIBase || "";

  // Local providers
  if (provider.toLowerCase().includes("ollama") || 
      provider.toLowerCase().includes("lmstudio") || 
      provider.toLowerCase().includes("localai")) {
    return "local";
  }

  // EU cloud detection (example - customize based on your setup)
  if (apiEndpoint.includes("eu") || apiEndpoint.includes("europe")) {
    return "cloud-eu";
  }

  return "cloud-us";
}
```

---

## Testing the Component

### Manual Testing

1. **Local Mode**: Set up with Ollama/LM Studio and verify badge shows "Local (Sovereign)" with cyan colors
2. **Cloud Modes**: Test with cloud-hosted providers to verify correct badge display
3. **Tooltips**: Hover over badges to verify tooltip content displays correctly
4. **Responsive**: Test on mobile devices to verify text hides and icon remains visible
5. **Dark/Light Modes**: Test in both themes to ensure colors are appropriate

### Integration Testing

```jsx
import SovereigntyBadge, { useDeploymentMode } from '@/components/SovereigntyBadge';

// Test the component directly
test('SovereigntyBadge renders with correct mode', () => {
  render(<SovereigntyBadge mode="local" size="md" />);
  expect(screen.getByText('Local (Sovereign)')).toBeInTheDocument();
});

// Test auto-detection
test('useDeploymentMode detects local setup', async () => {
  const mode = await useDeploymentMode();
  expect(mode).toBe('local'); // if running with Ollama
});
```

---

## Accessibility

- Badge uses semantic HTML with proper structure
- Tooltip via `react-tooltip` library provides accessible hover context
- Text hidden on mobile is semantic (not decorative)
- Color distinction combined with icons (not color-only)
- High contrast text on badge backgrounds

---

## Files Modified

1. ✅ Created: `/frontend/src/components/SovereigntyBadge/index.jsx`
2. ✅ Updated: `/frontend/src/components/Modals/Password/index.jsx`
3. ✅ Updated: `/frontend/src/components/Sidebar/index.jsx`
4. ✅ Updated: `/frontend/src/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker/index.jsx`
5. ✅ Updated: `/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx`

---

## Usage Examples

### Simple Usage with Manual Mode

```jsx
<SovereigntyBadge mode="local" size="md" showTooltip={true} />
```

### Auto-Detection Usage

```jsx
import { AutoDetectSovereigntyBadge } from '@/components/SovereigntyBadge';

<AutoDetectSovereigntyBadge size="sm" />
```

### Custom Styling

```jsx
<SovereigntyBadge 
  mode="local" 
  size="lg" 
  className="my-custom-class"
  showTooltip={false}
/>
```

---

## Troubleshooting

### Badge Not Showing

- Verify `z-index` is sufficient (integration examples use `z-20` or `z-30`)
- Check that parent container has `position: relative` or `position: absolute`
- Ensure `SovereigntyBadge` component import path is correct

### Tooltip Not Appearing

- Verify `react-tooltip` library is installed: `npm install react-tooltip`
- Check browser console for errors
- Ensure unique `anchorId` (automatically generated in component)

### Wrong Deployment Mode Detected

- Check `System.keys()` returns expected `LLMProvider` value
- Verify provider name matches detection logic in `useDeploymentMode()`
- Add debugging: `console.log(settings)` in the detection hook

---

## Future Enhancements

1. **Context Provider**: Create `SovereigntyContext` for global deployment mode state
2. **Analytics**: Track deployment mode changes for analytics
3. **Settings UI**: Add deployment mode to settings for manual override
4. **EU Expansion**: Improve EU cloud detection with IP geolocation
5. **Mobile Support**: Add full-featured badge for mobile with deployment details
6. **Notifications**: Alert users on deployment mode changes

---

## Support

For issues or questions about the Sovereignty Badge component, refer to:
- Component source: `/frontend/src/components/SovereigntyBadge/index.jsx`
- System model: `/frontend/src/models/system.js`
- Integration examples above
