# Birthday Mini-Game Platform — Specification

## Problem Statement

Build a web platform where a person ("creator") sets up a personalized birthday experience for someone else ("player"). The creator fills out a wizard with the player's name, a custom message, a visual theme, and background music, then receives a shareable link. The player opens the link and progresses through an NPC-driven adventure map experience. Completing the adventure triggers a sequential surprise finale animation (animated cake → fireworks + confetti + custom message).

---

## Architecture Overview

```
/
├── frontend/   Vue 3 + Vite + GSAP
└── backend/    Bun + Hono  (music file upload only)
```

- All game configuration (name, message, theme, music choice) is encoded as Base64 in the shareable URL — no database needed.
- The backend exists solely to accept music file uploads and return a temporary hosted URL that gets embedded in the shareable link.

---

## Requirements

### Creator Flow (Step-by-Step Wizard)

1. **Step 1 — Recipient details**: Enter the birthday person's name and a custom message (shown at the finale).
2. **Step 2 — Theme**: Choose from 5 preset themes (Classic, Neon, Pastel, Galaxy, Tropical) or open a color picker to set custom background and accent colors.
3. **Step 3 — Music**: Choose from 3 bundled birthday tracks, or upload an MP3 (uploaded to backend, URL returned and embedded in config).
4. **Step 4 — Preview & Share**: Show a summary card with a live mini-preview of the chosen theme. Generate and display the shareable URL (Base64-encoded config). Copy-to-clipboard button.

### Shareable URL

- Format: `https://<host>/play#<base64(JSON config)>`
- Config payload:
  ```json
  {
    "name": "string",
    "message": "string",
    "theme": { "preset": "string | null", "bg": "#hex", "accent": "#hex" },
    "music": { "type": "bundled | upload", "src": "string (track id or URL)" }
  }
  ```
- Config is Base64-encoded and placed in the URL hash (never sent to server).

### Game — NPC Adventure Map

Gameplay is centered on an exploration map with NPC interactions.

- The player navigates a tile-based adventure area and interacts with NPCs, clues, and map elements.
- Adventure progression is event-driven (objectives, discoveries, or interaction milestones).
- Completing the map objective emits completion and transitions directly into the finale sequence.
- The flow remains fully playable with mouse and touch input.

### Surprise Finale (after Adventure Completion)

Sequential GSAP-animated story:

1. **Cake entrance**: An animated birthday cake slides onto screen.
2. **Candle blow**: Candles animate out one by one (flame shrinks + smoke puff).
3. **Fireworks burst**: Full-screen canvas-based fireworks explosion.
4. **Confetti rain**: Continuous confetti falls from the top.
5. **Message reveal**: The custom message and birthday person's name animate in (text reveal effect).
6. Background music plays (or continues) throughout the finale.

### Animations

- Powered by **GSAP** for all UI/story animations (entrances, transitions, text reveals, object spawning).
- Canvas used for fireworks particle system.
- CSS used for confetti (performant, GPU-accelerated).

### Music

- 3 bundled tracks included in the frontend bundle (short loopable MP3s).
- Upload flow: frontend POSTs file to `POST /api/music` on the Bun/Hono backend → backend stores file temporarily (in-memory or temp dir) → returns a URL → frontend embeds URL in config.
- Music auto-plays (muted by default, unmuted on first user interaction to comply with browser autoplay policy). A mute/unmute toggle is always visible.

### Responsiveness & Input

- Fully responsive layout — works on mobile and desktop.
- All game interactions support both mouse click and touch events.
- Minimum tap target size: 44×44px (accessibility).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Vue 3 + Vite |
| Animation | GSAP (core + ScrollTrigger not needed) |
| Styling | CSS (scoped per component) + CSS custom properties for theming |
| Backend | Bun runtime + Hono framework |
| Music storage | Temporary in-memory / temp filesystem (no persistence) |

---

## Acceptance Criteria

- [ ] Creator wizard completes in 4 steps and produces a valid shareable URL.
- [ ] Shareable URL decodes correctly and loads the game with the right name, message, theme, and music.
- [ ] NPC adventure gameplay is fully playable and can be completed end-to-end.
- [ ] Completing the adventure transitions cleanly into the finale.
- [ ] Finale plays the full sequential story: cake → candles → fireworks → confetti → message.
- [ ] Custom name and message appear correctly in the finale.
- [ ] Theme (preset or custom colors) is applied consistently across the game and finale.
- [ ] Music plays during the game and finale; mute toggle works.
- [ ] Music upload via backend works; uploaded track plays in the game.
- [ ] Game is fully playable on mobile (touch) and desktop (mouse).
- [ ] No backend call is made during gameplay — only during music upload in the wizard.

---

## Implementation Steps

1. **Project scaffolding** — Initialize Vue 3 + Vite frontend and Bun + Hono backend in `/frontend` and `/backend` directories. Configure CORS between them.
2. **Routing** — Set up Vue Router with two routes: `/` (creator wizard) and `/play` (game view).
3. **URL encoding/decoding** — Implement `encodeConfig` / `decodeConfig` utilities (JSON → Base64 → URL hash and back).
4. **Creator wizard** — Build 4-step wizard component with form validation and live theme preview.
5. **Theme system** — Implement CSS custom properties for theming; wire up preset picker and color picker inputs.
6. **Music backend** — Implement `POST /api/music` endpoint in Hono; return hosted file URL.
7. **Music player** — Build a Vue composable for audio playback with autoplay policy handling and mute toggle.
8. **Adventure gameplay engine** — Build and refine the exploration map flow with NPC interactions, objective tracking, and completion emit.
9. **Adventure progression** — Implement milestones/clues/interactions that guide the player through the map toward completion.
10. **Adventure to finale transition** — Trigger finale start cleanly when the adventure completion event is emitted.
11. **Finale — Cake animation** — SVG/CSS cake component with GSAP entrance and candle-blow sequence.
12. **Finale — Fireworks** — Canvas particle system for fireworks bursts.
13. **Finale — Confetti + message reveal** — CSS confetti animation + GSAP text reveal for name and message.
14. **Shareable URL UI** — Copy-to-clipboard button and QR code (optional) on wizard step 4.
15. **Mobile polish** — Verify touch targets, test on small viewports, fix any layout issues.
16. **End-to-end test** — Full creator → share → play → finale flow verification.
