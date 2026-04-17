# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BirthdayQuest** is a full-stack web platform for creating personalized birthday experiences. A creator completes a 4-step wizard to configure a birthday game, shares a link, and the recipient plays through mini-games followed by a custom surprise finale. All configuration is Base64-encoded into the URL hash — no database is required.

## Development Commands

### Frontend (Vue 3 + Vite)
```bash
cd frontend
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend (Bun + Hono)
```bash
cd backend
bun install
bun run index.ts  # API server at http://localhost:3001
```

### Environment Setup
Copy `.env.example` to `.env` in each directory. Key variables:
- `VITE_BACKEND_URL` — leave empty for local dev (Vite proxies to backend)
- `PORT=3001`, `BASE_URL`, `FRONTEND_URL` — backend config

No lint, test, or type-check scripts are configured for the frontend. The backend uses TypeScript with strict mode via `tsconfig.json`.

## Architecture

### No-Database Config via URL Hash
All game configuration (recipient name, theme colors, music selection, custom messages) is stored in a single Base64-encoded JSON blob appended to the URL hash as `/#/play#<base64>`. The encode/decode logic lives entirely in `frontend/src/utils/config.js`. This means the sharing URL is self-contained; the backend is only needed for custom music file uploads.

### Routing
Two routes managed by Vue Router (`frontend/src/router/index.js`):
- `/` — `WizardView.vue`: the 4-step creator flow
- `/play` — `PlayView.vue`: the game experience (reads config from URL hash)

### Creator Wizard (`frontend/src/views/WizardView.vue`)
Orchestrates four step components in `frontend/src/components/wizard/`:
- `StepDetails.vue` — names and messages
- `StepTheme.vue` — 5 presets or custom color picker; presets defined in `utils/config.js`
- `StepMusic.vue` — 3 bundled tracks or MP3 upload via `POST /api/music`
- `StepShare.vue` — generates and displays the shareable URL

### Game Flow (`frontend/src/views/PlayView.vue`)
Manages two sequential phases:
1. **Adventure Map** (`AdventureMap.vue`) — optional tile-based Canvas game with NPCs and collectibles; 2 maps (Town 40×30, House 15×12); emits a `complete` event when 4 clues are found
2. **Clicker Levels** (`game/GameLevel.vue`) — 3 levels (Balloons → Gifts → Candles) each using GSAP tweens for object animation; uses sprite components in `game/sprites/`
3. **Finale** (`finale/FinaleScene.vue`) — sequential GSAP animation: cake entrance → candle blow → Canvas fireworks → confetti → custom message reveal

### Audio (`frontend/src/composables/useMusic.js`)
Single composable managing two audio strategies:
- **Web Audio API synthesis** for the 3 bundled tracks (synthesized programmatically, not streamed)
- **HTMLAudioElement** for user-uploaded MP3s served from `/uploads/*`

Autoplay is muted by default; unmuted on first user gesture. `MuteButton.vue` is globally visible.

### Theme System
CSS custom properties (`--bg`, `--accent`, `--text`, `--text-muted`, `--surface`, `--surface-hover`) applied in `App.vue` from decoded config. Luminance calculation auto-selects light or dark text. Five presets are defined in `utils/config.js`.

### Backend (`backend/index.ts`)
Single 54-line Hono file. Endpoints:
- `POST /api/music` — multipart upload, max 20 MB, `audio/*` only, saved to `backend/uploads/`
- `GET /uploads/*` — serves uploaded files
- `GET /health` — health check

## Key Conventions

- **Vue 3 `<script setup>` SFCs** throughout the frontend — no Options API
- **GSAP** for all non-trivial animations; import from `gsap` (already a dependency)
- **Canvas 2D API** used directly in `AdventureMap.vue` and `FinaleScene.vue` — no canvas library abstraction
- **Scoped CSS** in all components; global styles only in `frontend/src/style.css`
- The frontend is JavaScript (not TypeScript); only the backend uses TypeScript
- `AdventureMap.vue` is the most complex file (~444 lines) handling tile rendering, pathfinding, NPC AI, and item logic — edit carefully
