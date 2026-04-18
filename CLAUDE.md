# CLAUDE.md — BirthdayQuest Codebase Guide

## Project Overview

**BirthdayQuest** is a personalized birthday mini-game platform. A creator configures a personalized experience via a 4-step wizard (recipient details → theme → music → share). All config is encoded into a Base64 URL hash — no database required. The recipient visits the link and plays through 3 casual clicker-game levels, then unlocks a finale animation sequence.

---

## Repository Structure

```
Happy-birthday-/
├── backend/          # Bun + Hono server (file upload endpoint only)
├── frontend/         # Vue 3 + Vite + GSAP single-page app
├── .devcontainer/    # VS Code Dev Container config
├── .env.example      # Environment variable template
├── spec.md           # Full feature specification
└── README.md         # Quick start guide
```

### Backend (`backend/`)

```
backend/
├── index.ts          # Single POST /api/upload endpoint + CORS
├── package.json      # Bun + Hono dependencies
├── tsconfig.json     # TypeScript strict mode, ESNext, bundler resolution
├── Dockerfile        # oven/bun:latest image
├── bun.lock
└── uploads/          # Temporary audio file storage
```

### Frontend (`frontend/src/`)

```
src/
├── main.js                    # App entry: mounts Vue, registers router
├── App.vue                    # Root: applies CSS theme variables
├── style.css                  # Global retro pixel styles, CSS variables
├── router/index.js            # Hash-based routing: / and /play
├── utils/config.js            # URL config encode/decode, theme presets
├── composables/useMusic.js    # Web Audio API + HTML5 Audio composable
├── views/
│   ├── WizardView.vue         # 4-step creator wizard
│   └── PlayView.vue           # Game player view
└── components/
    ├── wizard/
    │   ├── StepDetails.vue    # Step 1: name & message input
    │   ├── StepTheme.vue      # Step 2: theme preset + color picker
    │   ├── StepMusic.vue      # Step 3: track selector / file upload
    │   └── StepShare.vue      # Step 4: URL display + copy button
    ├── game/
    │   ├── GameLevel.vue      # Level controller (3 level types)
    │   ├── LevelTransition.vue # Between-level pixel animation
    │   └── sprites/
    │       ├── BalloonSprite.vue
    │       ├── GiftSprite.vue
    │       └── CandleSprite.vue
    ├── finale/
    │   └── FinaleScene.vue    # Cake → candles → fireworks → confetti → message
    ├── AdventureMap.vue       # Exploration tile-map mini-game (1256 lines)
    └── MuteButton.vue         # Fixed mute/unmute button
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Bun | latest |
| Backend framework | Hono | ^4.12.12 |
| Frontend framework | Vue 3 | ^3.5.32 |
| Build tool | Vite | ^8.0.4 |
| Routing | Vue Router | ^4.6.4 |
| Animation | GSAP | ^3.15.0 |
| Language (backend) | TypeScript | ^5 |
| Language (frontend) | JavaScript (ESM) | — |
| Font | Press Start 2P | Google Fonts |

---

## Development Setup

### Prerequisites
- **Bun** (backend runtime)
- **Node.js + npm** (frontend)

### Local Development

```bash
# Terminal 1 — Backend
cd backend
bun run index.ts
# Runs on http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Vite proxies `/api` and `/uploads` → `http://localhost:3001` automatically.

### Environment Variables

Backend (copy from `/.env.example`):
```
PORT=3001
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
RENDER_EXTERNAL_URL=<set automatically on Render.com>
```

Frontend (`frontend/.env.production`):
```
VITE_BACKEND_URL=    # Leave empty in dev (proxy handles it)
```

### Build

```bash
cd frontend
npm run build    # Output: /frontend/dist
```

---

## Architecture

### No-Database Design

All creator configuration is JSON-encoded into a Base64 URL hash:

```
https://your-app.com/#/play#<base64-encoded-JSON>
```

Functions in `frontend/src/utils/config.js`:
- `encodeConfig(config)` — JSON → UTF-8 → Base64
- `decodeConfig(hash)` — Base64 → UTF-8 → JSON
- `buildShareUrl(config)` — Builds the full shareable URL

**Config shape**:
```json
{
  "name": "string",
  "message": "string",
  "recipientName": "string",
  "personalMessage": "string",
  "theme": {
    "preset": "classic | neon | pastel | galaxy | tropical | null",
    "bg": "#hex",
    "accent": "#hex"
  },
  "music": {
    "type": "bundled | upload",
    "src": "track1 | track2 | track3 | <upload-url>"
  }
}
```

### Theme System

Five built-in presets defined in `config.js`:

| Preset | Background | Accent |
|--------|-----------|--------|
| `classic` | `#1a1a2e` | `#e94560` |
| `neon` | `#0d0d0d` | `#39ff14` |
| `pastel` | `#fce4ec` | `#c2185b` |
| `galaxy` | `#0b0c2a` | `#a78bfa` |
| `tropical` | `#004d40` | `#ffab40` |

`App.vue` applies CSS custom properties to `#app` via `:style` binding:
- `--bg`, `--accent`, `--text`, `--text-muted`, `--surface`, `--surface-hover`
- Dark/light text is auto-selected via luminance calculation.

Custom colors override the preset; null preset = fully custom.

### Music System (`useMusic.js`)

**Bundled tracks** use the Web Audio API with synthesized oscillators — no MP3 files required:
- `track1`: Happy Birthday melody (sine wave)
- `track2`: Upbeat party riff (square wave)
- `track3`: Gentle celebration arpeggio

**Uploaded tracks** use an HTML5 `<audio>` element with CORS support.

**Autoplay policy**: Audio starts muted. The `MuteButton` component triggers unmute on first user gesture. `toggleMute()` syncs both the Web Audio `gainNode` and the `<audio>` element.

### Game Levels (`GameLevel.vue`)

Three sequential levels with increasing difficulty:

| Level | Objects | Count | Lifetime | Size |
|-------|---------|-------|---------|------|
| 1 | Balloons | 15 | 7s | 80px |
| 2 | Gifts | 20 | 5.5s | 72px |
| 3 | Candles | 25 | 4s | 64px |

- Objects spawn progressively (not all at once).
- Each object's GSAP tween is stored in `tweenMap` for individual on-pop kill.
- Win condition: `popped === total` (missed objects don't block completion).
- Progress bar: `(cleared / total) * 100`.

### Finale Sequence (`FinaleScene.vue`)

Sequential steps driven by GSAP timelines and Canvas:

1. **Cake entrance** — GSAP slide-in
2. **Candle blow** — 5 candles fade out (300ms stagger)
3. **Fireworks** — Canvas particle system, 14 bursts over 4 seconds
4. **Confetti** — CSS-based falling (60 pieces, randomized delay/duration)
5. **Message reveal** — GSAP text animation (name + custom message)

### AdventureMap (`AdventureMap.vue`)

Large component (1256 lines) implementing a tile-based exploration mini-game with NPCs, items, and clues. Uses TypeScript internally within the SFC.

---

## Key Conventions

### File Naming
- Vue components: `PascalCase.vue`
- Composables: `use<Name>.js` (e.g., `useMusic.js`)
- Views: `<Name>View.vue`
- Utilities: `camelCase.js`

### Vue Patterns
- Composition API (`<script setup>`) preferred.
- GSAP animations initiated in `onMounted`, cleaned up in `onUnmounted`.
- Scoped CSS (`<style scoped>`) on all components.
- CSS custom properties for theming — never hard-code colors in components.

### GSAP Usage
- Standard tweens and timelines only — ScrollTrigger plugin is **not** used.
- Store per-object tweens in a `Map` keyed by object ID to enable individual kill.
- Timeline `.kill()` in `onUnmounted` to prevent memory leaks.

### SVG Sprites
- Render with `shape-rendering: crispEdges` for pixel-art look.
- No external image assets — all sprites are inline SVG.

### Backend
- Single responsibility: the backend only handles file uploads.
- CORS is configured per `FRONTEND_URL` env var.
- Uploaded files are stored temporarily in `uploads/` — no persistence layer.

---

## Deployment

| Service | URL Pattern |
|---------|------------|
| Backend | Render.com (`https://happy-birthday-cevh.onrender.com`) |
| Frontend | Netlify or Render static site |

SPA redirect rule in `frontend/public/_redirects` ensures deep links work correctly.

**Docker** (backend only):
```bash
docker build -t birthday-backend ./backend
docker run -p 3001:3001 birthday-backend
```

**Render Blueprint**: Configured via `render.yaml` (environment variables set per `RENDER_EXTERNAL_URL`).

---

## Branch & Git Workflow

- Default branch: `main`
- Feature branches: `feat/<description>`
- Documentation branches: `claude/<description>`
- Active documentation branch: `claude/add-claude-documentation-wBo5W`

---

## Out-of-Scope for AI Assistants

- Do not add a database or session storage — the URL-hash design is intentional.
- Do not install ScrollTrigger or other GSAP plugins — standard GSAP only.
- Do not add authentication — the app is intentionally public/shareable.
- Do not modify `uploads/` contents — treat as ephemeral temp storage.
- MP3 files in `frontend/public/music/` are placeholders; bundled tracks use Web Audio API synthesis.
