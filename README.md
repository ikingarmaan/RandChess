# 🎮 RandGames & RandChess — Neo-Brutalist Tactical Arcade Suite

A complete, high-contrast, zero-blue Neo-Brutalist gaming portal featuring 12 fully playable tactical board games, strategy challenges, and arcade duels. Powered by intelligent bot AIs (Minimax, heuristics, Hunt & Target), real-time WebSockets online rooms, customizable match clocks, and native Web Audio sound synthesis.

---

## 🌟 The 12 Playable Arenas

### 1. ♞ RandChess 2.0 (Tactical 64-Square Battlefield)
- **Stockfish-Calibrated Minimax Engine**: 4 difficulty tiers from Novice (800 ELO) to Master (2100 ELO) with alpha-beta pruning and opening books.
- **AI Coach Explainer**: Real-time positional evaluation with pedagogical plain-English explanations, arrow indicators, and threat alerts.
- **Dynamic Centipawn EvalBar**: Instant advantage assessment.
- **Clocks & Multi-Mode**: 1v1 Local Pass & Play, customizable time controls (Blitz, Rapid, Custom), and live online multiplayer rooms with 6-character room codes.

### 2. 🎲 Neo-Brutal Ludo (2-4 Players)
- **Dynamic 2 to 4 Players**: Seamlessly supports 2, 3, or 4 players in both online rooms and local pass & play.
- **Smart Autonomous Bots**: Autonomous tactical bot AI for solo or multi-bot battles with auto-takeover on disconnect.
- **Tactile 3D Dice Shaker**: Physics-animated dice with roll sound effects and roll bonus turns on 6s.
- **Authentic Rules**: 8 safe squares, piece capture collisions, token home stretch runs, and celebratory confetti.

### 3. ✕◯ Brutal Tic-Tac-Toe (Unbeatable Minimax)
- **100% Unbeatable AI**: Minimax engine calculating all terminal states (best possible outcome is a draw!).
- **Streak Counter & Confetti**: Tracks consecutive player wins and triggers victory confetti.
- **Match Clocks**: Configurable countdown turn timers.

### 4. 🔴🟡 Gravity Connect 4 (Vertical Drop 7x6)
- **Minimax Grid Engine**: 3 difficulty levels (Novice, Tactical, Master) with 4-in-a-row horizon checks.
- **Column Drop Hover Preview**: Visual indicators highlighting where tokens will fall.
- **Victory Trajectory Lines**: Glowing 4-in-a-row connections across horizontal, vertical, and diagonal lines.

### 5. ⚪⚫ Brutal Checkers (8x8 Draughts Warfare)
- **Mandatory Jumping Enforcements**: Strict official draughts rules requiring players to make available jumps.
- **Multi-Jump Chains**: Automatically chains double and triple jump captures in a single turn.
- **King Promotion 👑**: Back-rank crowning allowing bidirectional backward movements and jumps.
- **Minimax Draughts Bot**: Positional evaluation accounting for piece count, king status, and center advancement.

### 6. 🚢💥 Naval Battleship (Coordinate Artillery Radar)
- **10x10 Strike Radar**: Target and sink the enemy armada across Carrier (5), Battleship (4), Cruiser (3), Submarine (3), and Destroyer (2).
- **Fleet Placement Station**: Interactive grid deployment with 1-click rotation and 1-click auto-randomize.
- **Smart Hunt & Target Bot AI**: Switches dynamically from parity grid hunting to targeted adjacent probe shots upon scoring a hit.

### 7. 🚩💣 Minesweeper Tactical (Logic Deduction)
- **100% First-Click Safe Zone**: Guaranteed that the first click is never a mine and clears a starter opening.
- **3 Difficulty Tiers**: Beginner (9x9, 10 mines), Intermediate (16x16, 40 mines), and Expert (16x24, 99 mines).
- **Cascading Flood-Fill**: Automatic revelation of contiguous zero-mine islands.
- **Retro LED HUD**: Digital seven-segment bomb counter and running stopwatch with flagging controls.

### 8. ⚫⚪ Brutal Othello / Reversi (Dynamic Sandwich Flips)
- **8-Direction Sandwich Flips**: Traps opponent pieces in any direction and flips them simultaneously.
- **Live Flip Hover Preview**: Shows exactly how many and which opponent discs will flip before clicking.
- **Positional Corner AI**: Prioritizes corners and avoids dangerous X-squares and C-squares adjacent to corners.
- **Territory Tug-of-War Gauge**: Real-time percentage dominance bar.

### 9. ✏️⏹️ Dots & Boxes (Territory Capture)
- **Configurable Grids**: 3x3, 4x4, and 5x5 box configurations.
- **Bonus Turns & Chain Combos**: Completing the 4th line of any box scores the box and awards an immediate extra turn.
- **Corridor-Aware Heuristic Bot**: Minimizes handing over open chains while taking all available box captures.

### 10. 🏓⚡ Cyber Pong 1v1 (60 FPS Vector Arcade)
- **60 FPS Canvas Physics**: Smooth paddle and ball loop with accelerating ball velocity on each paddle hit.
- **Paddle Deflection Spin**: Ball trajectory angle depends on where on the paddle face the hit occurs.
- **1v1 Same-Keyboard Action**: Player 1 (`W`/`S`) vs Player 2 (`Up`/`Down`) or vs reactive AI bot.

### 11. 🐍🍎 Snake Arena Duel (20x20 Grid Survival)
- **Solo High-Score Survival & 1v1 Tron Duel**: Single-player arcade hunt or 2-player arena collision duel.
- **Apples & Bonus Golden Stars**: Red apples (+10 pts) and fleeting golden stars (+50 pts).
- **Persistent High Scores**: Preserved in browser `localStorage`.

### 12. 🪜🐍 Snakes & Ladders (100-Tile Race)
- **100-Tile Boustrophedon Grid**: Classic alternating zig-zag numbered track.
- **2 to 4 Players**: Local pass & play or autonomous bots.
- **Golden Ladders & Hazard Snakes**: Climb shortcuts and slide down hazards with tactile 3D dice rolls.
- **Exact 100 Bounce Rule**: Must roll the exact number required to reach 100.

---

## 🎨 Design Philosophy: Strict Zero-Blue Neo-Brutalism

- **Zero Blue Palette**: Pure Silk Paper (`#f4f4ec`), Emerald Green (`#22c55e`), Crimson Red (`#ef4444`), Warning Yellow (`#facc15`), Blaze Orange (`#f97316`), and Obsidian Charcoal (`#18181b` / `#000000`).
- **Neo-Brutalist Visuals**: Bold 3px and 4px black borders, hard offset drop shadows (`4px 4px 0 #000`), uppercase heavy typography, and high-contrast tactile button presses.
- **Web Audio FX**: Custom synthetic audio generation for moves, captures, rolls, dice, explosions, and fanfare without external audio files.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/ikingarmaan/RandChess.git
cd RandChess
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the frontend
```bash
npm run build
```

### 4. Start the server
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛠️ Development Mode (Hot Reloading)

To run the development server with instant hot module replacement:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📂 Project Architecture

```
RandChess/
├── server/
│   └── index.js                    # Express + Socket.IO server for Chess & Ludo rooms, static hosting
├── src/
│   ├── components/
│   │   ├── GameCatalogueHub.jsx    # Complete 12-game Neo-Brutalist browsing hub & filter station
│   │   ├── GameCatalogueModal.jsx  # Quick modal game switcher
│   │   ├── ChessBoard.jsx          # 8x8 interactive board with SVG vector arrows & coordinates
│   │   ├── CoachAdvisor.jsx        # AI Coach panel with ON/OFF switch & Grandmaster explanations
│   │   ├── LudoGame.jsx            # 15x15 Neo-Brutal Ludo (2-4 players, online rooms, 3D dice)
│   │   ├── TicTacToeGame.jsx       # 3x3 Brutal Tic-Tac-Toe with unbeatable Minimax AI
│   │   ├── ConnectFourGame.jsx     # 7x6 Gravity Connect 4 with Minimax bot & drop physics
│   │   ├── CheckersGame.jsx        # 8x8 Brutal Checkers with mandatory jumps & kinging
│   │   ├── BattleshipGame.jsx      # 10x10 Naval Battleship with Hunt & Target AI
│   │   ├── MinesweeperGame.jsx     # Tactical Minesweeper with 100% safe start & flood-fill
│   │   ├── OthelloGame.jsx         # 8x8 Brutal Othello with sandwich flips & live previews
│   │   ├── DotsAndBoxesGame.jsx    # Territory Dots & Boxes (3x3 to 5x5) with corridor AI
│   │   ├── PongGame.jsx            # 60 FPS Cyber Pong 1v1 with vector deflection spin
│   │   ├── SnakeGame.jsx           # 20x20 Snake Arena Duel with 1v1 Tron mode
│   │   ├── SnakesAndLaddersGame.jsx# 100-tile boustrophedon race with 3D dice shaker
│   │   ├── MoveHistory.jsx         # Chess scoresheet & step navigation controls
│   │   ├── PlayerCard.jsx          # Player status badge, captured pieces tray & clock
│   │   ├── EvalBar.jsx             # Dynamic centipawn evaluation bar
│   │   ├── FloatingPiecesBackground.jsx # Architectural canvas background with parallax
│   │   ├── OnlineLobbyModal.jsx    # Multiplayer room creation & joining modal
│   │   ├── SettingsModal.jsx       # Themes, audio, and clock preferences
│   │   └── PromotionModal.jsx      # Pawn promotion selection
│   ├── engine/
│   │   ├── aiEngine.js             # Minimax chess engine with alpha-beta pruning
│   │   ├── coachExplainer.js       # Tactical analyzer and pedagogical explainer generator
│   │   └── openingBook.js          # Master opening book for standard chess variations
│   ├── utils/
│   │   ├── pieceSvgs.jsx           # Staunton vector chess pieces with specular rim
│   │   └── sound.js                # Web Audio API synthesizers & sound manager
│   ├── App.jsx                     # Central orchestrator & responsive game layout
│   └── main.jsx                    # React entrypoint
├── package.json
└── vite.config.js
```

---

## 📄 License
ISC License. Crafted with pair programming on Antigravity.

---

## 📄 License
ISC License. Crafted with pair programming on Antigravity.
