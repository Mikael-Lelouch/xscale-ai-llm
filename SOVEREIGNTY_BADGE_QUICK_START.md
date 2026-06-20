# Sovereignty Badge - Quick Start Guide

## What Was Created?

A reusable **SovereigntyBadge** component that displays deployment mode across the XSCALE AI UI with visual indicators and helpful tooltips.

---

## Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SovereigntyBadge                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Three Deployment Modes:                                 │
│  • Local (Sovereign)    🇫🇷  ← Cyan, glowing          │
│  • EU Cloud             🇪🇺  ← Blue                   │
│  • Cloud US (default)   ☁️   ← Slate/Gray             │
│                                                           │
│  Three Sizes:                                            │
│  • sm  (small)  - For headers                           │
│  • md  (medium) - Standard                              │
│  • lg  (large)  - For prominence                        │
│                                                           │
│  Features:                                               │
│  ✓ Auto-detection of deployment mode                    │
│  ✓ Responsive (text hidden on mobile)                   │
│  ✓ Hover tooltips with explanations                     │
│  ✓ Dark/light mode support                              │
│  ✓ Configurable placement & styling                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1️⃣ Login Page (Top-Right Corner)

Users see deployment mode immediately when accessing the app.

```
┌──────────────────────────────────────────────┐
│            🇫🇷 Local (Sovereign)   ← Badge │
│                                              │
│        [XSCALE AI Logo]                     │
│                                              │
│    ┌──────────────────────────┐             │
│    │  Username or Email       │             │
│    ├──────────────────────────┤             │
│    │  Password                │             │
│    ├──────────────────────────┤             │
│    │  [Sign In]               │             │
│    └──────────────────────────┘             │
│                                              │
└──────────────────────────────────────────────┘
```

**File**: `/frontend/src/components/Modals/Password/index.jsx`

---

### 2️⃣ Sidebar (Bottom Footer)

Persistent indicator next to Footer component.

```
┌─────────────────────────┐
│    [Workspaces List]    │
│    ─────────────────    │
│    • Workspace 1        │
│    • Workspace 2        │
│    • + New Workspace    │
│                         │
├─────────────────────────┤
│  [Footer]  [Badge] ← Badge
└─────────────────────────┘
```

**File**: `/frontend/src/components/Sidebar/index.jsx`

---

### 3️⃣ Chat Workspace (Top-Right Header)

Shows alongside model selector during chat.

```
┌─────────────────────────────────────────────────────┐
│  [Model Selector] ........... 🇫🇷 Local ← Badge    │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Chat messages here...                      │  │
│  │                                             │  │
│  │                                             │  │
│  ├─────────────────────────────────────────────┤  │
│  │  [Message input box]                        │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**File**: `/frontend/src/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker/index.jsx`

---

### 4️⃣ Onboarding Home (Top-Right Corner)

Educates users about deployment options before setup.

```
┌──────────────────────────────────────────┐
│       🇫🇷 Local (Sovereign)   ← Badge  │
│                                          │
│       XSCALE AI                          │
│                                          │
│        [Welcome Icon]                    │
│                                          │
│          Welcome                         │
│                                          │
│      [Get Started Button]                │
│                                          │
└──────────────────────────────────────────┘
```

**File**: `/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx`

---

## Visual Styling

### Mode Colors & Icons

#### Local (Sovereign) - Cyan Theme
```
Badge: [🇫🇷 Local (Sovereign)]
Colors: Cyan/Teal
Background: bg-cyan-900/40
Border: border-cyan-400/50
Text: text-cyan-300
Glow: shadow with cyan hue
```
**Use Case**: For Ollama, LM Studio, LocalAI

#### EU Cloud - Blue Theme
```
Badge: [🇪🇺 EU Cloud]
Colors: Blue
Background: bg-blue-900/30
Border: border-blue-400/40
Text: text-blue-300
Glow: subtle shadow
```
**Use Case**: For EU-hosted services

#### Cloud US - Slate Theme
```
Badge: [☁️ Cloud US]
Colors: Slate/Gray
Background: bg-slate-700/30
Border: border-slate-400/40
Text: text-slate-300
Glow: subtle shadow
```
**Use Case**: For US cloud providers

---

## How It Detects Deployment Mode

```javascript
// The magic happens in useDeploymentMode()

1. Fetch system settings via System.keys()
2. Check the LLMProvider field
3. Match against known local providers:
   - "ollama"  → Local
   - "lmstudio" → Local
   - "localai"  → Local
4. Otherwise → Cloud US (default)

// Can be extended to detect EU cloud:
// Check API endpoint for "eu" or "europe" domain
```

---

## Usage Examples

### Simple (Manual Mode)
```jsx
<SovereigntyBadge 
  mode="local" 
  size="sm" 
  showTooltip={true} 
/>
```

### With Auto-Detection
```jsx
const [mode, setMode] = useState("cloud-us");

useEffect(() => {
  async function detectMode() {
    const detected = await useDeploymentMode();
    setMode(detected);
  }
  detectMode();
}, []);

<SovereigntyBadge mode={mode} size="sm" />
```

### Convenience Component
```jsx
// Auto-detects mode automatically
<AutoDetectSovereigntyBadge size="md" />
```

---

## Responsive Behavior

### Desktop (md and up)
```
[Badge with icon and text]
🇫🇷 Local (Sovereign)
```

### Mobile/Tablet (below md)
```
[Badge with icon only]
🇫🇷
```

The text label uses `hidden sm:inline` to hide on small screens while keeping the icon visible.

---

## Tooltip Content

Hover over the badge to see:

**Local Mode**:
> "Local Deployment: Your data stays on your infrastructure. Full GDPR compliance. Complete data sovereignty with Ollama, LM Studio, or Local AI."

**EU Cloud Mode**:
> "EU Cloud Deployment: Data processed within EU infrastructure. GDPR compliant with EU data centers."

**US Cloud Mode**:
> "US Cloud Deployment: Data processed in US cloud infrastructure."

---

## File Modifications Summary

| File | Change | Purpose |
|------|--------|---------|
| `/frontend/src/components/SovereigntyBadge/index.jsx` | Created | Main component + hooks |
| `/frontend/src/components/Modals/Password/index.jsx` | Updated | Added to login page |
| `/frontend/src/components/Sidebar/index.jsx` | Updated | Added to sidebar footer |
| `/frontend/src/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker/index.jsx` | Updated | Added to chat header |
| `/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx` | Updated | Added to onboarding |

---

## Testing the Badge

### Manual Testing Checklist

- [ ] **Local Setup**: Run with Ollama → Badge shows "Local (Sovereign)" in cyan
- [ ] **Cloud Setup**: Use cloud provider → Badge shows appropriate cloud mode
- [ ] **All Locations**: Badge appears in all 4 integration points
- [ ] **Tooltips**: Hover over badge → tooltip shows relevant text
- [ ] **Responsive**: Resize to mobile → text hides, icon remains
- [ ] **Themes**: Toggle dark/light mode → colors adapt correctly
- [ ] **Performance**: Page loads without lag → badge loads async
- [ ] **Accessibility**: Badge text is accessible to screen readers

---

## Customization Guide

### Add a New Deployment Mode

Edit `/frontend/src/components/SovereigntyBadge/index.jsx`:

```jsx
const config = {
  "my-cloud": {
    label: "My Cloud",
    icon: "🌐",
    bgColor: "bg-purple-900/40 dark:bg-purple-900/50",
    borderColor: "border-purple-400/50 dark:border-purple-400/60",
    textColor: "text-purple-300 dark:text-purple-200",
    glowColor: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
    tooltipText: "My custom deployment mode explanation...",
  },
  // ... existing modes ...
};
```

### Change Badge Styling

Update colors in the mode config object or add custom CSS classes:

```jsx
<SovereigntyBadge 
  mode="local" 
  className="ring-2 ring-offset-2 ring-cyan-400" 
/>
```

---

## Troubleshooting

### Badge Not Showing?

1. Check `z-index` is sufficient (20 or 30)
2. Verify parent has `position: relative`
3. Check browser console for errors
4. Ensure component path is correct in imports

### Wrong Deployment Mode?

1. Verify System.keys() returns LLMProvider
2. Check provider name spelling
3. Add console.log in useDeploymentMode() to debug
4. Check backend returns correct LLMProvider value

### Tooltip Not Working?

1. Verify `react-tooltip` is installed
2. Check browser console for warnings
3. Inspect generated ID (should be unique)
4. Verify no z-index conflicts hiding tooltip

---

## Future Enhancements

✨ **Planned features**:

1. **SovereigntyContext** - Global deployment mode state
2. **Settings Override** - Allow manual mode selection
3. **EU Detection** - Auto-detect EU vs US cloud
4. **Admin Controls** - Configure messaging per deployment
5. **Change Notifications** - Alert when deployment changes
6. **Mobile Experience** - Full badge with details on mobile
7. **Analytics** - Track deployment mode usage

---

## API Reference

### SovereigntyBadge Component

```typescript
interface SovereigntyBadgeProps {
  mode?: "local" | "cloud-eu" | "cloud-us";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}
```

### useDeploymentMode Hook

```typescript
async function useDeploymentMode(): Promise<"local" | "cloud-eu" | "cloud-us">
```

### AutoDetectSovereigntyBadge Component

```typescript
interface AutoDetectSovereigntyBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

---

## Support Resources

- **Component Source**: `/frontend/src/components/SovereigntyBadge/index.jsx`
- **Full Integration Guide**: `SOVEREIGNTY_BADGE_INTEGRATION.md`
- **Summary Overview**: `SOVEREIGNTY_BADGE_SUMMARY.txt`
- **System Model**: `/frontend/src/models/system.js`

---

## Next Steps

1. ✅ Test badge in all 4 integration points
2. ✅ Verify deployment mode detection works correctly
3. ✅ Check responsive behavior on mobile
4. ✅ Ensure tooltips display helpful information
5. 🔄 Monitor user feedback on badge placement
6. 🔄 Consider extending to more UI pages
7. 🔄 Plan context provider for global state management

---

**Ready to use!** The Sovereignty Badge component is fully integrated and ready for deployment.
