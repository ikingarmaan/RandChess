# ♟️ RandChess — Grandmaster Interactive Chess

A full-featured, bespoke online interactive chess platform crafted with human-designed aesthetics, a Stockfish-calibrated minimax engine, live WebSocket multiplayer, and a real-time Grandmaster AI Coach that explains the strategic rationale for the best move on every turn.

---

## 🌟 Key Features

### 1. ♚ Interactive Chessboard & Precision Piece Movement
- **Smooth Piece Dynamics**: Fluid Staunton vector pieces with specular rim lighting and physical drop shadows for crystal-clear readability across both light and dark squares.
- **Move Assist & Tactical Highlights**: Legal move target jewels, capture reticles, checkmate pulse, and king-in-check indicators.
- **Dynamic Centipawn Evaluation Bar**: Live vertical bar tracking advantage and momentum in centipawns.
- **Captured Pieces & Material Advantage**: Real-time tray tracking captured pieces and net material points.

### 2. 🤖 Single Player vs Computer AI
- Instantaneous move response calibrated across 4 difficulty tiers:
  - **Novice (~800 ELO)**: Casual play with tactical opportunities.
  - **Club (~1200 ELO)**: Solid fundamental positional play.
  - **Expert (~1600 ELO)**: Advanced tactical combinations and endgame technique.
  - **Master (~2100 ELO)**: Minimax search with alpha-beta pruning and deep opening books.

### 3. 🌐 Online Multiplayer & Local Pass & Play
- **Live Online Matches**: Room creation with 6-character room codes and one-click shareable URLs (`?room=XYZ`).
- **Full WebSockets Synchronization**: Real-time clocks, move validation, opponent connection handling, and resignation/draw offers.
- **1v1 Local Pass & Play**: Two players on the same screen with optional board flipping.

### 4. ✦ AI Coach & Move Explainer (With Dedicated Toggle Switch)
- **Real-Time Recommendation**: Computes the optimal candidate move after every turn with glowing directional vector arrows on the board.
- **Grandmaster "Why This Move?" Explanations**: Rich pedagogical commentary in plain English detailing:
  - *Center Control & Territorial Space*
  - *Development & King Safety / Castling*
  - *Tactical Motifs (Forks, Pins, Skewers, Discovered Attacks)*
  - *Piece Outposts & Open Files*
- **Checklist of Strategic Advantages**: Bullet points detailing concrete positional benefits.
- **Threat Alerts**: Ruby Red warnings when opponent threats are detected.
- **One-Click Actions**:
  - `[ Play Move ]`: Plays the coach's recommendation directly onto the board.
  - `[ Voice ]`: Speaks the explanation aloud using Web Speech Synthesis.
  - `[ Toggle Arrow ]`: Shows/hides board vector arrows.

### 5. 📜 Move History Scoresheet & Dual Step Navigation
- **FIDE Scoresheet**: Full two-column move list (`1. e4 e5`, `2. Nf3 Nc6`...) with clickable moves to jump back and inspect any past board state.
- **Dual Step Navigation Dock**:
  - Located directly beneath the chessboard and in the scoresheet card.
  - Buttons: `[ Start ]`, `[ ◀ Back ]`, `[ Move Status / Jump Live ]`, `[ Forward ▶ ]`, `[ Live ▶| ]`.
  - Copy FEN & Copy PGN functionality.

### 6. 🎨 High-Contrast Atelier Aesthetic
- Built with a strict **Silk Ivory, Master Emerald Green, and Crimson Ruby Red** palette over obsidian charcoal (`#141418` / `#18181c`) with zero blue/cyan.
- Ambient floating architectural chess piece background with interactive parallax.

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
│   └── index.js             # Express + Socket.IO server for online multiplayer & static hosting
├── src/
│   ├── components/
│   │   ├── ChessBoard.jsx   # 8x8 interactive board with SVG vector arrows & coordinates
│   │   ├── CoachAdvisor.jsx # AI Coach panel with ON/OFF switch & Grandmaster explanations
│   │   ├── MoveHistory.jsx  # FIDE notation scoresheet & step navigation controls
│   │   ├── PlayerCard.jsx   # High-contrast player badge, captured pieces tray & DGT clock
│   │   ├── EvalBar.jsx      # Dynamic centipawn evaluation bar
│   │   ├── FloatingPiecesBackground.jsx # Architectural canvas background with parallax
│   │   ├── OnlineLobbyModal.jsx # Multiplayer room creation & joining modal
│   │   ├── SettingsModal.jsx    # Themes, audio, and clock preferences
│   │   └── PromotionModal.jsx   # Pawn promotion selection
│   ├── engine/
│   │   ├── aiEngine.js      # Minimax engine with alpha-beta pruning & piece-square tables
│   │   ├── coachExplainer.js# Deep tactical analyzer and pedagogical explainer generator
│   │   └── openingBook.js   # Master opening book for standard chess variations
│   ├── utils/
│   │   ├── pieceSvgs.jsx    # High-definition Staunton vector chess pieces with specular rim
│   │   └── sound.js         # Web Audio API synthesizers & speech audio manager
│   ├── App.jsx              # Main orchestrator & responsive salon layout
│   └── main.jsx             # React entrypoint
├── package.json
└── vite.config.js
```

---

## 📄 License
ISC License. Crafted with pair programming on Antigravity.
