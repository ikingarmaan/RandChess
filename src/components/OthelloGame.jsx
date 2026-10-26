import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Bot,
  Users,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCw,
  HelpCircle,
  X as CloseIcon,
  Gamepad2,
  Sliders
} from 'lucide-react';
import { sound } from '../utils/sound';

const BOARD_SIZE = 8;
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// Strategic positional matrix
const POSITION_WEIGHTS = [
  [100, -20,  10,   5,   5,  10, -20, 100],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [ 10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
  [  5,  -2,  -1,   0,   0,  -1,  -2,   5],
  [  5,  -2,  -1,   0,   0,  -1,  -2,   5],
  [ 10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [100, -20,  10,   5,   5,  10, -20, 100]
];

function createInitialBoard() {
  const b = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  b[3][3] = 'W';
  b[3][4] = 'B';
  b[4][3] = 'B';
  b[4][4] = 'W';
  return b;
}

// Get flipped pieces if player places at (r, c)
function getFlippedPieces(board, r, c, player) {
  if (board[r][c] !== null) return [];
  const opponent = player === 'B' ? 'W' : 'B';
  const flipped = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let currR = r + dr;
    let currC = c + dc;

    while (currR >= 0 && currR < BOARD_SIZE && currC >= 0 && currC < BOARD_SIZE) {
      if (board[currR][currC] === opponent) {
        line.push([currR, currC]);
      } else if (board[currR][currC] === player) {
        if (line.length > 0) flipped.push(...line);
        break;
      } else {
        break;
      }
      currR += dr;
      currC += dc;
    }
  }

  return flipped;
}

// Get all legal moves for player
function getLegalMoves(board, player) {
  const legal = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const flips = getFlippedPieces(board, r, c, player);
      if (flips.length > 0) {
        legal.push({ r, c, flips });
      }
    }
  }
  return legal;
}

// Minimax evaluation for Othello
function evaluateOthello(board, player) {
  const opp = player === 'B' ? 'W' : 'B';
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) score += POSITION_WEIGHTS[r][c];
      else if (board[r][c] === opp) score -= POSITION_WEIGHTS[r][c];
    }
  }
  return score;
}

function minimaxOthello(board, depth, alpha, beta, isMaximizing, player) {
  const currentTurn = isMaximizing ? player : player === 'B' ? 'W' : 'B';
  const moves = getLegalMoves(board, currentTurn);

  if (moves.length === 0 || depth === 0) {
    return { score: evaluateOthello(board, player) };
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      const nextBoard = board.map((row) => [...row]);
      nextBoard[m.r][m.c] = currentTurn;
      m.flips.forEach(([fr, fc]) => { nextBoard[fr][fc] = currentTurn; });

      const evalRes = minimaxOthello(nextBoard, depth - 1, alpha, beta, false, player);
      if (evalRes.score > maxEval) {
        maxEval = evalRes.score;
        bestMove = m;
      }
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      const nextBoard = board.map((row) => [...row]);
      nextBoard[m.r][m.c] = currentTurn;
      m.flips.forEach(([fr, fc]) => { nextBoard[fr][fc] = currentTurn; });

      const evalRes = minimaxOthello(nextBoard, depth - 1, alpha, beta, true, player);
      if (evalRes.score < minEval) {
        minEval = evalRes.score;
        bestMove = m;
      }
      beta = Math.min(beta, minEval);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

export const OthelloGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const [board, setBoard] = useState(createInitialBoard);
  const [turn, setTurn] = useState('B'); // 'B' = Black (moves first), 'W' = White
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play'
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [humanColor, setHumanColor] = useState('B');
  const [hoverMove, setHoverMove] = useState(null);
  const [winner, setWinner] = useState(null); // 'B' | 'W' | 'draw' | null
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  const legalMoves = useMemo(() => {
    if (winner !== null) return [];
    return getLegalMoves(board, turn);
  }, [board, turn, winner]);

  // Disc count
  const counts = useMemo(() => {
    let b = 0, w = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell === 'B') b++;
        else if (cell === 'W') w++;
      })
    );
    return { B: b, W: w };
  }, [board]);

  // Execute move
  const executeMove = useCallback((m) => {
    sound.playMove();

    setBoard((prev) => {
      const nextBoard = prev.map((row) => [...row]);
      nextBoard[m.r][m.c] = turn;
      m.flips.forEach(([fr, fc]) => {
        nextBoard[fr][fc] = turn;
      });

      const nextTurn = turn === 'B' ? 'W' : 'B';
      const nextMoves = getLegalMoves(nextBoard, nextTurn);

      if (nextMoves.length === 0) {
        // Next player has no moves: check if current player can move again
        const currentMovesAgain = getLegalMoves(nextBoard, turn);
        if (currentMovesAgain.length === 0) {
          // Both players have no moves: game over!
          let bCount = 0, wCount = 0;
          nextBoard.forEach((row) =>
            row.forEach((c) => {
              if (c === 'B') bCount++;
              else if (c === 'W') wCount++;
            })
          );

          sound.playGameOver();
          if (bCount > wCount) setWinner('B');
          else if (wCount > bCount) setWinner('W');
          else setWinner('draw');

          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        } else {
          // Pass turn back to current player
          sound.playCapture();
        }
      } else {
        setTurn(nextTurn);
      }

      return nextBoard;
    });
  }, [turn]);

  // Cell click
  const handleCellClick = (r, c) => {
    if (winner !== null || isBotThinking) return;
    if (gameMode === 'ai' && turn !== humanColor) return;

    const matchedMove = legalMoves.find((m) => m.r === r && m.c === c);
    if (matchedMove) {
      executeMove(matchedMove);
    }
  };

  // Pass turn detection when current player has no legal moves
  useEffect(() => {
    if (winner !== null) return;
    const currentMoves = getLegalMoves(board, turn);
    if (currentMoves.length === 0) {
      const oppTurn = turn === 'B' ? 'W' : 'B';
      const oppMoves = getLegalMoves(board, oppTurn);
      if (oppMoves.length === 0) {
        // Both sides exhausted moves: match concluded
        let bCount = 0, wCount = 0;
        board.forEach((row) =>
          row.forEach((c) => {
            if (c === 'B') bCount++;
            else if (c === 'W') wCount++;
          })
        );
        sound.playGameOver();
        if (bCount > wCount) setWinner('B');
        else if (wCount > bCount) setWinner('W');
        else setWinner('draw');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } else {
        // Pass turn automatically with brief pause
        const passTimer = setTimeout(() => {
          sound.playCapture();
          setTurn(oppTurn);
        }, 900);
        return () => clearTimeout(passTimer);
      }
    }
  }, [board, turn, winner]);

  // Bot automation
  useEffect(() => {
    if (gameMode !== 'ai' || winner !== null) return;
    const isBotTurn = turn !== humanColor;
    if (!isBotTurn) return;

    setIsBotThinking(true);
    const delay = botDifficulty === 'easy' ? 400 : botDifficulty === 'medium' ? 650 : 850;

    const botTimer = setTimeout(() => {
      const moves = getLegalMoves(board, turn);
      if (moves.length > 0) {
        let chosenMove = moves[0];
        if (botDifficulty === 'easy') {
          chosenMove = moves[Math.floor(Math.random() * moves.length)];
        } else {
          const depth = botDifficulty === 'medium' ? 3 : 4;
          const clone = board.map((r) => [...r]);
          const result = minimaxOthello(clone, depth, -Infinity, Infinity, true, turn);
          chosenMove = result.move || moves[0];
        }
        executeMove(chosenMove);
      }
      setIsBotThinking(false);
    }, delay);

    return () => clearTimeout(botTimer);
  }, [board, turn, gameMode, humanColor, botDifficulty, winner, executeMove]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('B');
    setWinner(null);
    setHoverMove(null);
  };

  const previewFlips = useMemo(() => {
    if (!hoverMove) return [];
    return hoverMove.flips;
  }, [hoverMove]);

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black border-2 border-black flex items-center justify-center font-black text-white text-base brutal-shadow-sm font-mono shrink-0">
            ⚫
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Brutal Othello
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                8x8 DYNAMIC FLIPS • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              SANDWICH FLIP COMBOS // HEURISTIC POSITIONAL MINIMAX
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSoundActive(!soundActive)}
            className="brutal-press p-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-black" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-black" />
            <span className="hidden md:inline">RULES</span>
          </button>

          <button
            onClick={onOpenCatalogue}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>ALL GAMES</span>
          </button>

          <button
            onClick={resetGame}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESTART</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: Board & Ownership Gauge */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[500px] shrink-0">
          
          {/* Status Pill */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full border-2 border-black animate-pulse"
                style={{ backgroundColor: turn === 'B' ? '#171717' : '#ffffff' }}
              />
              <span className="font-brutal text-sm font-black uppercase">
                {winner
                  ? winner === 'draw'
                    ? 'DRAW MATCH!'
                    : `${winner === 'B' ? 'BLACK' : 'WHITE'} WINS!`
                  : legalMoves.length === 0
                  ? `NO FLIPS FOR ${turn === 'B' ? 'BLACK' : 'WHITE'} — PASSING TURN...`
                  : isBotThinking
                  ? 'BOT CALCULATING FLIPS...'
                  : `${turn === 'B' ? 'BLACK' : 'WHITE'}'S MOVE (${legalMoves.length} VALID)`}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs font-black">
              <span className="px-2 py-0.5 bg-black text-white border border-black">B: {counts.B}</span>
              <span className="px-2 py-0.5 bg-white text-black border border-black">W: {counts.W}</span>
            </div>
          </div>

          {/* Territory Tug-of-War Bar */}
          <div className="w-full h-4 border-2 border-black flex overflow-hidden brutal-shadow-xs">
            <div
              className="bg-black transition-all duration-300"
              style={{ width: `${(counts.B / (counts.B + counts.W || 1)) * 100}%` }}
            />
            <div
              className="bg-white transition-all duration-300"
              style={{ width: `${(counts.W / (counts.B + counts.W || 1)) * 100}%` }}
            />
          </div>

          {/* 8x8 Othello Board */}
          <div className="w-full aspect-square bg-[#22c55e] p-2 border-4 border-black brutal-shadow-xl select-none">
            <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-[1px] bg-black border-2 border-black">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const legalMove = legalMoves.find((m) => m.r === r && m.c === c);
                  const isFlippingPreview = previewFlips.some(([fr, fc]) => fr === r && fc === c);

                  return (
                    <div
                      key={`${r}_${c}`}
                      onClick={() => handleCellClick(r, c)}
                      onMouseEnter={() => setHoverMove(legalMove || null)}
                      onMouseLeave={() => setHoverMove(null)}
                      className={`relative bg-[#16a34a] flex items-center justify-center cursor-pointer transition-colors ${
                        legalMove ? 'hover:bg-[#15803d]' : ''
                      }`}
                    >
                      {/* Legal Move Marker */}
                      {legalMove && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black/40 border border-white/60 pointer-events-none animate-pulse" />
                      )}

                      {/* Disc Piece */}
                      {cell && (
                        <div
                          className={`w-[84%] h-[84%] rounded-full border-2 border-black brutal-shadow-sm flex items-center justify-center transition-transform ${
                            cell === 'B' ? 'bg-[#171717]' : 'bg-white'
                          } ${isFlippingPreview ? 'scale-110 ring-4 ring-[#facc15]' : ''}`}
                        >
                          <div className={`w-1/2 h-1/2 rounded-full border border-black/30 ${cell === 'B' ? 'bg-white/10' : 'bg-black/10'}`} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Command Station */}
        <div className="relative z-10 w-full lg:w-[380px] flex flex-col gap-3 shrink-0">
          
          {/* Opponent Selection Card */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Match Opponent
              </span>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#facc15] text-black border border-black">
                {gameMode === 'ai' ? '🤖 vs COMPUTER' : '👥 1v1 PASS & PLAY'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGameMode('ai')}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'ai'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Bot className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-xs font-black">vs BOT AI</span>
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Reversi Engine</span>
              </button>

              <button
                onClick={() => setGameMode('pass_play')}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'pass_play'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-xs font-black">1v1 LOCAL</span>
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Pass & Play</span>
              </button>
            </div>

            {/* AI Difficulty Selector */}
            {gameMode === 'ai' && (
              <div className="border-t-2 border-black pt-2 space-y-1.5">
                <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                  AI Difficulty:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'easy', label: 'EASY' },
                    { id: 'medium', label: 'MEDIUM' },
                    { id: 'hard', label: 'MASTER' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setBotDifficulty(lvl.id)}
                      className={`py-1 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer ${
                        botDifficulty === lvl.id ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Strip */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={resetGame}
              className="brutal-press py-2.5 bg-[#ef4444] hover:bg-red-500 text-white font-brutal text-xs font-black uppercase border-3 border-black brutal-shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>RESTART ROUND</span>
            </button>

            <button
              onClick={() => setShowRules(true)}
              className="brutal-press py-2.5 bg-white hover:bg-neutral-100 text-black font-brutal text-xs font-black uppercase border-3 border-black brutal-shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>HOW TO PLAY</span>
            </button>
          </div>

        </div>
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs modal-backdrop-anim"
          onClick={() => setShowRules(false)}
        >
          <div
            className={`w-full max-w-lg border-4 border-black p-5 sm:p-6 brutal-shadow-xl modal-content-anim ${
              isDarkTheme ? 'bg-[#18181b] text-white' : 'bg-white text-black'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black border-2 border-black flex items-center justify-center font-black text-white text-xs">
                  ⚫
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Brutal Othello / Reversi Rules
                </h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="brutal-press p-1 hover:bg-neutral-100 border-2 border-black cursor-pointer"
              >
                <CloseIcon className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  1. Sandwiching Opponent Discs
                </strong>
                Place your disc so that you trap one or more of your opponent's discs between two of yours along horizontal, vertical, or diagonal lines.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Dynamic Flipping
                </strong>
                All sandwiched opponent discs flip to your color. You must flip at least one disc on every legal move.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Corner & Edge Strategy
                </strong>
                Corners cannot be flipped once claimed, making them the most valuable tactical anchor points on the board!
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setShowRules(false)}
                className="brutal-press px-4 py-2 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm"
              >
                GOT IT // PLAY NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

