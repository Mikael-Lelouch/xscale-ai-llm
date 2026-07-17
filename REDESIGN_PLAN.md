# PLAN DE REFONTE GLOBALE — XSCALE AI LLM Frontend
## Branding XSCALE TECHNOLOGIES appliqué à AnythingLLM v1.14.2

---

## 1. VISION

Transformer le frontend AnythingLLM générique en une **console XSCALE AI** — une interface qui respire la souveraineté, la maîtrise technique et l'ambition cinématique de XSCALE TECHNOLOGIES. L'utilisateur doit sentir qu'il opère dans un **SOC souverain français**, pas dans un outil open-source blanchi.

---

## 2. DESIGN SYSTEM — TOKENS XSCALE

### Palette (alignée sur DESIGN.md du site marketing)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--xscale-primary` | `#0b7bff` | Actions principales, liens, focus rings |
| `--xscale-primary-dark` | `#0058e0` | Hover sur actions principales |
| `--xscale-cyan` | `#06b6d4` | Accent secondaire, gradients cyber |
| `--xscale-teal` | `#14b8a6` | Accent infrastructure/cloud |
| `--xscale-violet` | `#8b5cf6` | Accent AI (section XAI) |
| `--xscale-emerald` | `#10b981` | Accent cyber/sécurité |
| `--xscale-night` | `#0a0e1a` | Background principal (navy, jamais noir pur) |
| `--xscale-night-raised` | `#0f1422` | Surfaces élevées (sidebar, modals) |
| `--xscale-night-soft` | `#0d1320` | Chat background |
| `--xscale-hero` | `#0a1040` | Gradient hero (dégradé cinématique) |
| `--xscale-border` | `rgba(148,163,184,0.14)` | Bordures par défaut |
| `--xscale-border-active` | `rgba(34,211,238,0.42)` | Bordures actives/focus |
| `--xscale-glow` | `rgba(6,182,212,0.18)` | Effets de glow |

### Gradients signature

```css
--grad-brand-diag: linear-gradient(135deg, #2563eb, #06b6d4, #14b8a6);
--grad-ai: linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6);
--grad-cyber: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4);
--grad-hero: linear-gradient(180deg, #0a1040 0%, #0a0e1a 100%);
```

### Typographie

- **Display** : Poppins 700-900, `letter-spacing: -0.02em to -0.035em` — headings hero, titres sections
- **Body** : Inter 400-600 — texte courant, labels, métadonnées
- **Mono/eyebrow** : Inter 500, `text-transform: uppercase`, `letter-spacing: 0.18em`, 11-13px

### Élévation (ombres)

| Niveau | Ombre |
|--------|-------|
| `xs` | `0 1px 2px rgba(0,0,0,0.08)` |
| `sm` | `0 4px 12px rgba(0,0,0,0.12)` |
| `md` | `0 12px 40px rgba(0,0,0,0.22)` |
| `lg` | `0 20px 70px rgba(0,0,0,0.30)` |
| `glow` | `0 0 24px rgba(6,182,212,0.15)` |

---

## 3. REFONTE PAR COMPOSANT

### 3.1 Layout global (`App.jsx`, `main.jsx`)

- **Background** : `var(--xscale-night)` avec grid pattern subtil `32px` cyan à 2% d'opacité
- **Scrollbar** : fine, cyan-500 sur navy-900, `border-radius: 4px`
- **Selection** : `rgba(6,182,212,0.28)` background, `#f8fafc` text
- **Focus visible** : `2px solid rgba(34,211,238,0.72)`, offset 2px

### 3.2 Sidebar (`Sidebar/index.jsx`, `ActiveWorkspaces/`, `SearchBox/`)

**État actuel** : border 2px solide, items gris, pas de hiérarchie visuelle.

**Refonte** :
- Container : `backdrop-blur-xl`, `border: 1px solid rgba(148,163,184,0.08)`, `border-radius: 20px`
- Logo : max-height 28px, centré, margin 20px top/bottom
- Search box : input glassmorphique (`rgba(15,20,34,0.6)` bg, `border: 1px solid rgba(148,163,184,0.1)`)
- Workspace item :
  - Default : `padding: 10px 12px`, `border-radius: 12px`, `border-left: 3px solid transparent`
  - Hover : `background: rgba(34,211,238,0.06)`, `border-left-color: rgba(34,211,238,0.3)`
  - Active : `background: rgba(6,182,212,0.08)`, `border-left-color: #22d3ee`, `box-shadow: inset 0 0 18px rgba(6,182,212,0.06)`
- Thread item : même pattern, plus compact, indentation 16px
- Footer : séparé par `border-top: 1px solid rgba(148,163,184,0.08)`, icônes avec hover glow cyan
- **Nouveau** : badge "SOUVEREIGN" en bas de sidebar (pill, emerald accent, `letter-spacing: 0.15em`)

### 3.3 DefaultChat / Hero (`DefaultChat/index.jsx`)

**État actuel** : logo basique, texte simple, bouton plat.

**Refonte** :
- Background : `.xscale-grid-bg` + radial gradient `radial-gradient(circle at 50% 30%, rgba(6,182,212,0.08), transparent 60%)`
- Logo : container `.xscale-glass` (glassmorphique, `border-radius: 20px`, padding 20px)
- Badge eyebrow : pill avec `border: 1px solid rgba(34,211,238,0.2)`, `bg: rgba(6,182,212,0.06)`, `color: #22d3ee`, `letter-spacing: 0.22em`, text "XSCALE AI — SOUVEREIGN"
- Heading : `.xscale-gradient-text` (Poppins 700, `clamp(2rem, 4vw, 3rem)`)
- Subtitle : `color: var(--theme-text-secondary)`, `max-width: 480px`, `line-height: 1.7`
- CTA button : `.xscale-gradient-button` (gradient brand-diag, `height: 48px`, `border-radius: 9999px`, `font-weight: 600`, `padding: 0 32px`)
- **Nouveau** : 3 quick-action cards en bas (Create Agent / Edit Workspace / Upload Document)
  - `.xscale-card` (glass, hover lift + cyan glow)
  - Icône Phosphor 20px + label Inter 500
  - Grid 3-col desktop → 1-col mobile

### 3.4 WorkspaceChat (`WorkspaceChat/ChatContainer/index.jsx`)

**État actuel** : container gris zinc-900, border none, pas de personnalité.

**Refonte** :
- Container : `border-radius: 20px`, `.xscale-grid-bg`, `border: 1px solid rgba(148,163,184,0.06)`, `box-shadow: 0 16px 50px rgba(0,0,0,0.2)`
- Header bar : minimal, `border-bottom: 1px solid rgba(148,163,184,0.06)`, `backdrop-blur-md`
- Model picker : `.xscale-pill` (pill cyan, hover border bright)
- Heading greeting : `.xscale-gradient-text` (Poppins 600)
- Messages area : `padding: 24px`, `max-width: 800px` centré
- **Nouveau** : séparateur visuel entre messages (ligne `1px` gradient cyan à 10% d'opacité)

### 3.5 PromptInput (`ChatContainer/PromptInput/index.jsx`)

**État actuel** : zinc-800 basique, border none, send button blanc.

**Refonte** :
- Container : `.xscale-composer` (glassmorphique, `border-radius: 24px`, `backdrop-blur: 20px`)
  - `border: 1px solid rgba(148,163,184,0.12)`
  - `background: linear-gradient(145deg, rgba(15,20,34,0.92), rgba(10,14,26,0.9))`
  - Focus : `border-color: rgba(34,211,238,0.45)`, `box-shadow: 0 0 0 3px rgba(6,182,212,0.08), 0 0 24px rgba(6,182,212,0.1)`
- Textarea : `color: #f1f5f9`, `placeholder: rgba(148,163,184,0.5)`, Inter 400
- Send button :
  - Enabled : `background: linear-gradient(135deg, #06b6d4, #14b8a6)`, `border-radius: 50%`, `width: 36px`, `height: 36px`
  - Hover : `filter: brightness(1.1)`, `transform: scale(1.05)`
  - Icon : ArrowUp `weight="bold"`, `color: #0a0e1a`
- Tools button : pill avec `border: 1px solid rgba(148,163,184,0.1)`, hover cyan
- Attachment icon : Paperclip, hover cyan

### 3.6 Chat Messages (`ChatHistory/HistoricalMessage/`, `PromptReply/`)

**État actuel** : bubbles zinc-800, pas de distinction visuelle.

**Refonte** :
- **User message** :
  - `background: linear-gradient(135deg, rgba(6,182,212,0.12), rgba(20,184,166,0.08))`
  - `border: 1px solid rgba(6,182,212,0.15)`
  - `border-radius: 20px 20px 4px 20px` (rounded-br-none)
  - `padding: 14px 18px`
- **AI message** :
  - `background: rgba(15,20,34,0.6)`
  - `border: 1px solid rgba(148,163,184,0.08)`
  - `border-radius: 20px 20px 20px 4px` (rounded-bl-none)
  - `backdrop-blur: 8px`
- **Avatar** : 32px, `border-radius: 10px`, border `1px solid rgba(148,163,184,0.1)`
- **Timestamp** : `color: var(--theme-text-secondary)`, `font-size: 11px`, Inter 400
- **Code blocks** : `background: rgba(10,14,26,0.8)`, `border: 1px solid rgba(148,163,184,0.08)`, `border-radius: 12px`, syntax highlighting cyan

### 3.7 Settings (`SettingsSidebar/`, `SettingsButton/`, `MenuOption/`)

**Refonte** :
- SettingsSidebar : même glassmorphisme que la sidebar principale
- MenuOption :
  - Default : `border-left: 3px solid transparent`
  - Hover : `background: rgba(34,211,238,0.04)`
  - Active : `background: rgba(6,182,212,0.08)`, `border-left-color: #22d3ee`, `color: #22d3ee`
- SettingsButton : `border-radius: 12px`, `border: 1px solid rgba(148,163,184,0.08)`, hover `border-color: rgba(34,211,238,0.3)` + glow

### 3.8 UserMenu (`UserMenu/`, `UserButton/`)

**Refonte** :
- Button : avatar 32px, `border-radius: 10px`, hover ring `2px rgba(34,211,238,0.3)`
- Dropdown : `.xscale-glass`, `border-radius: 16px`, `padding: 8px`
- Items : `border-radius: 10px`, hover `background: rgba(34,211,238,0.06)`

### 3.9 Modals (`ModalWrapper/`)

**Refonte** :
- Overlay : `backdrop-blur-md`, `background: rgba(10,14,26,0.7)`
- Container : `.xscale-glass`, `border-radius: 20px`, `border: 1px solid rgba(148,163,184,0.1)`
- Header : `border-bottom: 1px solid rgba(148,163,184,0.08)`, `padding: 20px 24px`
- Close button : hover `background: rgba(34,211,238,0.1)`, `border-radius: 10px`

### 3.10 Onboarding / Login (`Login/`, `OnboardingFlow/`)

**Refonte** :
- Background : `.xscale-shell` (radial gradients + navy)
- Card : `.xscale-glass`, `border-radius: 24px`, `max-width: 420px`
- Input : `.xscale-composer` style (glass, focus cyan border)
- Button : `.xscale-gradient-button`
- Logo : centré, max-height 40px, margin-bottom 32px

---

## 4. NOUVELLES FONCTIONNALITÉS UX

### 4.1 Micro-interactions

| Élément | Animation |
|---------|-----------|
| Page load | `.animate-xscale-fade-in` (300ms) |
| Hero content | `.animate-xscale-slide-up` (450ms, stagger 100ms) |
| Card hover | `transform: translateY(-2px)` + shadow glow |
| Button hover | `filter: brightness(1.08)` + `transform: translateY(-1px)` |
| Sidebar item | `border-left` slide + `background` fade (200ms) |
| Message send | Fade in from bottom (150ms) |
| Modal open | Scale from 0.95 + fade (200ms) |

### 4.2 États vides

- **No workspaces** : illustration SVG XSCALE + texte "Aucun workspace configuré" + CTA "Créer votre premier workspace"
- **No messages** : icône ChatCircleDots + "Commencez une conversation" + suggestions de prompts
- **Loading** : skeleton avec pulse cyan (`.animate-pulse` avec `bg-cyan-400/10`)

### 4.3 Badges & indicateurs

- **Sovereignty badge** : pill emerald, `letter-spacing: 0.15em`, "SOUVEREIGN"
- **Model badge** : pill cyan, nom du modèle actif
- **Agent mode** : pill violet, "AGENT"
- **Status** : dot vert (online), amber (processing), rouge (error)

---

## 5. RESPONSIVE

| Breakpoint | Changement |
|------------|-----------|
| `< 720px` | Sidebar full-screen overlay, hero compact, quick actions 1-col |
| `720-1024px` | Sidebar collapsible, chat max-width 100%, quick actions 2-col |
| `> 1024px` | Sidebar fixed 292px, chat max-width 800px centré, quick actions 3-col |

---

## 6. FICHIERS À MODIFIER

| Priorité | Fichier | Changement |
|----------|---------|-----------|
| P0 | `frontend/src/index.css` | Design system complet (tokens, layers, utilities, keyframes) |
| P0 | `frontend/src/components/DefaultChat/index.jsx` | Hero premium avec branding XSCALE |
| P0 | `frontend/src/components/Sidebar/index.jsx` | Glassmorphic sidebar |
| P0 | `frontend/src/components/WorkspaceChat/ChatContainer/PromptInput/index.jsx` | Composer glassmorphique |
| P1 | `frontend/src/components/WorkspaceChat/ChatContainer/index.jsx` | Container avec grid bg |
| P1 | `frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/HistoricalMessage/index.jsx` | Message bubbles |
| P1 | `frontend/src/components/WorkspaceChat/ChatContainer/WorkspaceModelPicker/index.jsx` | Pill cyan |
| P1 | `frontend/src/components/lib/QuickActions/index.jsx` | Glass cards |
| P2 | `frontend/src/components/SettingsSidebar/index.jsx` | Settings glass |
| P2 | `frontend/src/components/SettingsButton/index.jsx` | Cyan glow hover |
| P2 | `frontend/src/components/UserMenu/UserButton/index.jsx` | Avatar + dropdown glass |
| P2 | `frontend/src/components/ModalWrapper/index.jsx` | Modal glass |
| P3 | `frontend/src/pages/Login/index.jsx` | Login page branding |
| P3 | `frontend/src/components/Footer/index.jsx` | Footer avec badges |
| P3 | `frontend/tailwind.config.js` | Keyframes + animations |

---

## 7. VALIDATION

1. `npm run build` — 0 erreurs, 0 warnings critiques
2. Test visuel sur http://localhost:3001 (dev server)
3. Test responsive (375px, 768px, 1440px)
4. Push → Coolify rebuild → test sur URL production
5. Vérifier : glassmorphism, gradients, glow effects, hover states, animations

---

*Plan rédigé le 2026-07-17 — XSCALE TECHNOLOGIES branding appliqué à AnythingLLM v1.14.2*
