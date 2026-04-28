## Wacker Kart

A 2D, Chicago-themed racing game prototype built toward a larger multiplayer browser game.

## Current Prototype

The repo is scaffolded for `Vite + Phaser` with a toy driving loop:
- one Phaser scene
- one controllable car
- arrow-key driving
- a stylized Lake Shore Drive out-and-back track
- camera follow
- 3-lap race loop with timer and restart
- game code isolated from the app shell for an easier future move to Next.js

Controls:
- `ArrowUp`: accelerate
- `ArrowDown`: brake / reverse
- `ArrowLeft`: steer left
- `ArrowRight`: steer right

## Run It

1. Install dependencies:
   - `npm install`
2. Start the dev server:
   - `npm run dev`
3. Open the local URL Vite prints in the terminal.

## Structure

- `src/main.js`: browser entry point
- `src/game/createGame.js`: Phaser bootstrap
- `src/game/scenes/PrototypeScene.js`: current toy driving scene
- `src/game/entities/Car.js`: reusable car movement logic

## Why This Structure

The game logic is intentionally kept under `src/game/` so it can later be mounted inside a Next.js client component when you add login, lobbies, and multiplayer shell pages.
