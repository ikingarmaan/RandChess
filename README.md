# 🎮 RandGames & RandChess — Neo-Brutalist Tactical Arcade Suite

A fast, high-contrast, zero-blue Neo-Brutalist gaming portal featuring 5 core playable tactical and arcade battlefields: **RandChess 2.0**, **Cyber 8-Ball Pool**, **Brutal Tic-Tac-Toe**, **Snake Arena Duel**, and **Cyber Pong 1v1**. Powered by intelligent bot AIs (Minimax, 2D vector pathfinding, heuristic autonomous navigators), real-time WebSockets online rooms, customizable match clocks, and native Web Audio sound synthesis.

---

## 🌟 The 5 Core Playable Arenas

### 1. ♞ RandChess 2.0 (Tactical 64-Square Battlefield)
- **Stockfish-Calibrated Minimax Engine**: 4 difficulty tiers from Novice (800 ELO) to Master (2100 ELO) with alpha-beta pruning and opening books.
- **AI Coach Explainer**: Real-time positional evaluation with pedagogical plain-English explanations, arrow indicators, and threat alerts.
- **Dynamic Centipawn EvalBar**: Instant advantage assessment.
- **Clocks & Multi-Mode**: 1v1 Local Pass & Play, customizable time controls (Blitz, Rapid, Custom), and live online multiplayer rooms with 6-character room codes.
- **Encapsulated Architecture**: Pure catalog game behavior with isolated timer logic, board step navigation dock (`START`, `BACK`, `LIVE`, `FWD`), and non-repeating game-over review modals.

### 2. 🎱 Cyber 8-Ball Pool (60 FPS 2D Vector Billiards Rig)
- **Authentic 16-Ball Physics**: Sub-stepped vector collision engine (elastic restitution, rotational roll, cushion banking, pocket suction).
- **Trajectory Raycaster & Ghost Ball**: Laser aim line projecting contact point and deflection angle on target balls.
- **Interactive Cue Stick & Power Slider**: Tactile mouse/touch dragging, fine `<` `>` degree micro-stepper buttons, and variable stroke power gauge.
- **Full 8-Ball Rules Engine**: Solids (1-7), Stripes (9-15), 8-Ball black pocketing logic, break shot handling, scratch detection, and ball-in-hand free placement.
- **3 Modes & Smart Bots**:
  - `vs Bot AI`: Cadet (~800 ELO), Shark (~1400 ELO), Hustler Master (~2000 ELO) with pocket targeting heuristics and cue-angle error modeling.
  - `1v1 Local`: Pass & play turn rotations with customizable shot clocks.
  - `Online Multiplayer`: Real-time WebSocket room codes, quick match queue, and synced state.
- **Customization**: 4 Felt themes (Emerald Classic, Ruby Velvet, Slate Charcoal, Amber Gold) and tactile Web Audio ball clacks.

### 3. ✕◯ Brutal Tic-Tac-Toe (Unbeatable Minimax)
- **100% Unbeatable AI**: Minimax engine calculating all terminal states (best possible outcome against Master bot is a draw!).
- **Streak Counter & Confetti**: Tracks consecutive player wins and triggers victory confetti.
- **Custom Match Clocks**: Configurable countdown turn timers with visual timeout warnings.
- **1v1 Pass & Play**: Local duel on the same screen with dynamic animated winning trajectory lines.

### 4. 🐍🍎 Snake Arena Duel (20x20 Grid Survival)
- **Solo High-Score Survival, vs AI Bot, & 1v1 Tron Duel**: Single-player arcade hunt, vs autonomous AI snake, or 2-player collision duel on the same board.
- **Speed Difficulties**: 3 difficulty tiers (Slither, Viper, Cobra) with responsive controls.
- **Apples & Bonus Golden Stars**: Red apples (+10 pts) and fleeting golden stars (+50 pts).
- **Persistent High Scores**: Preserved in browser `localStorage`.

### 5. 🏓⚡ Cyber Pong 1v1 (60 FPS Vector Arcade)
- **60 FPS Canvas Physics**: Smooth paddle and ball loop with accelerating ball velocity on each paddle hit.
- **Paddle Deflection Spin**: Ball trajectory angle depends on where on the paddle face the hit occurs.
- **3 Reaction Difficulties**: Novice, Tactical, and Brutal bot speeds.
- **1v1 Same-Keyboard Action**: Player 1 (`W`/`S`) vs Player 2 (`Up`/`Down`) or vs reactive AI bot.

---

## 🎨 Design Philosophy: Strict Zero-Blue Neo-Brutalism

- **Zero Blue Palette**: Pure Silk Paper (`#f4f4ec`), Emerald Green (`#22c55e`), Crimson Red (`#ef4444`), Warning Yellow (`#facc15`), Blaze Orange (`#f97316`), and Obsidian Charcoal (`#18181b` / `#000000`).
- **Neo-Brutalist Visuals**: Bold 3px and 4px black borders, hard offset drop shadows (`4px 4px 0 #000`), uppercase heavy typography, and high-contrast tactile button presses.
- **Consistent Catalog Hub**: Clean, uniform masthead across all games with 1-click access to the central catalogue hub.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Vite frontend + Socket.IO server
npm run dev
# or
node server/index.js
```
Visit `http://localhost:3000` (or the Vite dev server port) in your browser.
