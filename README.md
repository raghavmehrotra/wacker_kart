## Wacker Kart

A 2D, Chicago-themed kart racing game playable in the browser.

**Live app:** https://wacker-kart.vercel.app

---

## Features

### Tracks
Four procedurally-generated tile maps, each with a unique surface and feel:

| Track | Vibe | Music |
|---|---|---|
| Lake Shore Drive | Scenic lakefront out-and-back | Bouncy, beachy |
| Hyde Park / Main Quad | Rectangular campus loop around the Quad | Regal, flowing |
| O'Hare | Two straight runways connected by a terminal curve | Staccato, urgent |
| Lower Wacker | Winding tunnel loop with pothole surface hazards | Haunting, dark |

### Gameplay
- 3-lap races with a live timer
- Checkerboard finish line; must reach the south turnaround before each lap counts
- Speed varies by surface: asphalt (fast), shoulder (slow), grass/water (bounces you back)
- Malort Shot item pickups — activate with `X` to launch a pizza obstacle
- NPC traffic on Hyde Park, O'Hare, and Lower Wacker
- Pause with `Space` mid-race; restart with `R`

### Auth & Profiles
- Sign in via Google or GitHub (Supabase Auth)
- Guest mode — play Lake Shore Drive without an account
- Profile page with kart colour, avatar, and per-track personal records
- Run history (last 20 runs per track)

### Leaderboard
- Global leaderboard per track, showing top times with display names

### Audio
- Unique looping music per track plus a lobby theme
- SFX: item pickup jingle, item use blip, crash noise burst

---

## Controls

| Key | Action |
|---|---|
| `Arrow Up` | Accelerate |
| `Arrow Down` | Brake / reverse |
| `Arrow Left` | Steer left |
| `Arrow Right` | Steer right |
| `Space` | Start race / Pause |
| `X` | Use held item |
| `R` | Restart race |

---

## Run Locally

Requires Node 22 (use `nvm use 22`).

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.

---

## Stack

- **Phaser 3** — game engine (canvas rendering, input, tilemaps)
- **Vite** — dev server and bundler
- **Supabase** — auth, Postgres (profiles, track records, run history)
- **Vercel** — hosting with security headers (CSP, X-Frame-Options, etc.)

## Structure

```
src/
  main.js                  # lobby, auth boot, screen routing
  game/
    createGame.js          # Phaser bootstrap
    scenes/PrototypeScene.js
    entities/Car.js
    managers/
      RaceManager.js       # lap detection, timer
      TrackManager.js      # tilemap, surfaces, finish line
      ItemManager.js       # pickups, pizza obstacles
      NpcTrafficManager.js # NPC vehicles
      HudManager.js
  ui/                      # auth, leaderboard, profile, instructions screens
  lib/                     # supabase client, db helpers, audioManager, html escape
public/
  maps/                    # generated TMJ tilemaps (node scripts/generateMaps.mjs)
  audio/                   # music and SFX files
  tilesets/
scripts/
  generateMaps.mjs         # regenerates all four TMJ map files from coordinate data
```
