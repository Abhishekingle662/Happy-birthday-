# BirthdayQuest 🎂

A birthday mini-game platform. The creator sets up a personalized experience via a wizard, shares a link, and the recipient plays through 3 casual clicker levels before receiving a surprise finale animation.

## Structure

```
frontend/   Vue 3 + Vite + GSAP  (creator wizard + game)
backend/    Bun + Hono            (music file upload only)
```

## Quick Start

**Backend** (port 3001):
```bash
cd backend
bun run index.ts
```

**Frontend** (port 5173):
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 to create a birthday experience.

## How it works

1. **Creator** fills out a 4-step wizard: recipient name + message → theme → music → share link
2. All config is Base64-encoded into the URL hash — no database needed
3. **Player** opens the link and plays 3 levels:
   - Level 1: Pop balloons 🎈
   - Level 2: Catch falling gifts 🎁
   - Level 3: Tap candles 🕯️
4. After completing all levels, a sequential finale plays: animated cake → candle blow → fireworks → confetti → personal message reveal

## Music

Place royalty-free MP3 files in `frontend/public/music/`:
- `track1.mp3` — "Happy Vibes"
- `track2.mp3` — "Party Time"
- `track3.mp3` — "Celebration"

See `frontend/public/music/README.md` for sources.

## Environment

Copy `.env.example` and adjust for production deployments.