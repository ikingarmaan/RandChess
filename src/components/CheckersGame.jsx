import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Bot,
  Users,
  Sparkles,
  Clock,
  Volume2,
  VolumeX,
  Play,
  RotateCw,
  Zap,
  HelpCircle,
  X as CloseIcon,
  Crown,
  Gamepad2,
  ArrowRight
} from 'lucide-react';
import { sound } from '../utils/sound';

// 8x8 Checkers board.
// Pieces:
// 'r' = Red regular, 'R' = Red King (moves down towards row 7)
// 'b' = Black regular, 'B' = Black King (moves up towards row 0)
const BOARD_SIZE = 8;

function createInitialBoard() {
  const b = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) b[r][c] = 'r'; // Red at top
        else if (r > 4) b[r][c] = 'b'; // Black at bottom
      }
    }
  }
  return b;
}

// Get all legal jumps for a piece
function getJumpsForPiece(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const isRed = piece.toLowerCase() === 'r';
  const isKing = piece === 'R' || piece === 'B';
  const jumps = [];

  const directions = [];
  if (isRed || isKing) {
    directions.push([1, -1], [1, 1]); // Moving down
  }
  if (!isRed || isKing) {
    directions.push([-1, -1], [-1, 1]); // Moving up
  }

  for (const [dr, dc] of directions) {
    const midR = r + dr;
    const midC = c + dc;
    const destR = r + dr * 2;
    const destC = c + dc * 2;

    if (destR >= 0 && destR < BOARD_SIZE && destC >= 0 && destC < BOARD_SIZE) {
      const midPiece = board[midR][midC];
      const destPiece = board[destR][destC];

      if (midPiece && destPiece === null) {
        const isMidOpponent = isRed ? midPiece.toLowerCase() === 'b' : midPiece.toLowerCase() === 'r';
        if (isMidOpponent) {
          jumps.push({
            from: [r, c],
            to: [destR, destC],
            captured: [midR, midC]
          });
        }
      }
    }
  }
  return jumps;
}

// Get standard 1-step moves for a piece (non-captures)
function getStepsForPiece(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const isRed = piece.toLowerCase() === 'r';
  const isKing = piece === 'R' || piece === 'B';
  const steps = [];

  const directions = [];
  if (isRed || isKing) {
    directions.push([1, -1], [1, 1]);
  }
  if (!isRed || isKing) {
    directions.push([-1, -1], [-1, 1]);
  }

  for (const [dr, dc] of directions) {
    const destR = r + dr;
    const destC = c + dc;
    if (destR >= 0 && destR < BOARD_SIZE && destC >= 0 && destC < BOARD_SIZE) {
      if (board[destR][destC] === null) {
        steps.push({
          from: [r, c],
          to: [destR, destC],
          captured: null
        });
      }
    }
  }
  return steps;
}

// Get all legal moves for current player with mandatory jump rule
function getAllLegalMoves(board, turn) {
  const isRedTurn = turn === 'r';
  const jumps = [];
  const steps = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p && (isRedTurn ? p.toLowerCase() === 'r' : p.toLowerCase() === 'b')) {
        const pieceJumps = getJumpsForPiece(board, r, c);
        if (pieceJumps.length > 0) jumps.push(...pieceJumps);
        else steps.push(...getStepsForPiece(board, r, c));
      }
    }
  }

  // Mandatory jump rule: if jumps exist, only jumps are legal!
  if (jumps.length > 0) return jumps;
  return steps;
}

// Checkers AI Evaluation
function evaluateCheckersBoard(board, player) {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const isRed = p.toLowerCase() === 'r';
      const isKing = p === 'R' || p === 'B';
      let value = isKing ? 30 : 10;
      // Positional: advancement & center control
      if (!isKing) {
        value += isRed ? r * 1.5 : (7 - r) * 1.5;
      }
      if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
        value += 2; // Center
      }

      if (player === 'r') {
        score += isRed ? value : -value;
      } else {
        score += isRed ? -value : value;
      }
    }
  }
  return score;
}

function minimaxCheckers(board, depth, alpha, beta, isMaximizing, player) {
  const currentTurn = isMaximizing ? player : player === 'r' ? 'b' : 'r';
  const moves = getAllLegalMoves(board, currentTurn);

  if (moves.length === 0) {
    return { score: isMaximizing ? -10000 : 10000 };
  }
  if (depth === 0) {
    return { score: evaluateCheckersBoard(board, player) };
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestMove = moves[0];
    for (const m of moves) {
      const [fromR, fromC] = m.from;
      const [toR, toC] = m.to;
      const piece = board[fromR][fromC];
      board[fromR][fromC] = null;
      board[toR][toC] = piece;
      let capPiece = null;
      if (m.captured) {
        capPiece = board[m.captured[0]][m.captured[1]];
        board[m.captured[0]][m.captured[1]] = null;
      }

      // Check kinging
      const isKinged = (piece === 'r' && toR === 7) || (piece === 'b' && toR === 0);
      if (isKinged) board[toR][toC] = piece.toUpperCase();

      const evalRes = minimaxCheckers(board, depth - 1, alpha, beta, false, player);

      // Undo
      board[fromR][fromC] = piece;
      board[toR][toC] = null;
      if (m.captured) {
        board[m.captured[0]][m.captured[1]] = capPiece;
      }

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
      const [fromR, fromC] = m.from;
      const [toR, toC] = m.to;
      const piece = board[fromR][fromC];
      board[fromR][fromC] = null;
      board[toR][toC] = piece;
      let capPiece = null;
      if (m.captured) {
        capPiece = board[m.captured[0]][m.captured[1]];
        board[m.captured[0]][m.captured[1]] = null;
      }

      const isKinged = (piece === 'r' && toR === 7) || (piece === 'b' && toR === 0);
      if (isKinged) board[toR][toC] = piece.toUpperCase();

      const evalRes = minimaxCheckers(board, depth - 1, alpha, beta, true, player);

      board[fromR][fromC] = piece;
      board[toR][toC] = null;
      if (m.captured) {
        board[m.captured[0]][m.captured[1]] = capPiece;
      }

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

export const CheckersGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const [board, setBoard] = useState(createInitialBoard);
  const [turn, setTurn] = useState('b'); // Black moves first (bottom)
  const [selectedPiece, setSelectedPiece] = useState(null); // [r, c]
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play'
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [humanColor, setHumanColor] = useState('b');
  const [winner, setWinner] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [scores, setScores] = useState({ b: 0, r: 0 });

  // Sync sound setting
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  const allLegalMoves = useMemo(() => {
    if (winner !== null) return [];
    return getAllLegalMoves(board, turn);
  }, [board, turn, winner]);

  // Moves available for currently selected piece
  const selectedLegalMoves = useMemo(() => {
    if (!selectedPiece) return [];
    const [selR, selC] = selectedPiece;
    return allLegalMoves.filter((m) => m.from[0] === selR && m.from[1] === selC);
  }, [selectedPiece, allLegalMoves]);

  // Execute move
  const executeMove = useCallback((move) => {
    const { from, to, captured } = move;
    const [fromR, fromC] = from;
    const [toR, toC] = to;

    sound.playMove();

    setBoard((prev) => {
      const nextBoard = prev.map((row) => [...row]);
      let piece = nextBoard[fromR][fromC];
      nextBoard[fromR][fromC] = null;

      if (captured) {
        nextBoard[captured[0]][captured[1]] = null;
        sound.playCapture();
      }

      // Check Kinging
      let kinged = false;
      if (piece === 'b' && toR === 0) {
        piece = 'B';
        kinged = true;
        sound.playCheck();
      } else if (piece === 'r' && toR === 7) {
        piece = 'R';
        kinged = true;
        sound.playCheck();
      }
      nextBoard[toR][toC] = piece;

      // Check multi-jump continuation: only if captured, piece was not just kinged, and more jumps exist
      if (captured && !kinged) {
        const furtherJumps = getJumpsForPiece(nextBoard, toR, toC);
        if (furtherJumps.length > 0) {
          // Keep turn with same piece!
          setSelectedPiece([toR, toC]);
          setMoveHistory((h) => [...h, { from, to, captured: true, multi: true }]);
          return nextBoard;
        }
      }

      // Turn complete
      setSelectedPiece(null);
      const nextTurn = turn === 'b' ? 'r' : 'b';
      setMoveHistory((h) => [...h, { from, to, captured: Boolean(captured) }]);

      // Check win/loss for next turn
      const nextMoves = getAllLegalMoves(nextBoard, nextTurn);
      if (nextMoves.length === 0) {
        const winningColor = turn;
        setWinner(winningColor);
        sound.playCheck();
        setScores((s) => ({ ...s, [winningColor]: s[winningColor] + 1 }));
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.5 },
          colors: [winningColor === 'r' ? '#ef4444' : '#171717', '#ffffff']
        });
      } else {
        setTurn(nextTurn);
      }

      return nextBoard;
    });
  }, [turn]);

  // Handle cell click
  const handleCellClick = (r, c) => {
    if (winner !== null || isBotThinking) return;
    if (gameMode === 'ai' && turn !== humanColor) return;

    const clickedPiece = board[r][c];

    // If clicking one of the legal destinations for the selected piece
    const matchedMove = selectedLegalMoves.find((m) => m.to[0] === r && m.to[1] === c);
    if (matchedMove) {
      executeMove(matchedMove);
      return;
    }

    // Select piece of current turn
    if (clickedPiece) {
      const isMyPiece = turn === 'b' ? clickedPiece.toLowerCase() === 'b' : clickedPiece.toLowerCase() === 'r';
      if (isMyPiece) {
        // Only allow selecting pieces that actually have legal moves (respecting mandatory jumps)
        const pieceHasMoves = allLegalMoves.some((m) => m.from[0] === r && m.from[1] === c);
        if (pieceHasMoves) {
          setSelectedPiece([r, c]);
        }
      }
    } else {
      setSelectedPiece(null);
    }
  };

  // Bot automation
  useEffect(() => {
    if (gameMode !== 'ai' || winner !== null) return;
    const isBotTurn = turn !== humanColor;
    if (!isBotTurn) return;

    setIsBotThinking(true);
    const delay = botDifficulty === 'easy' ? 400 : botDifficulty === 'medium' ? 650 : 850;

    const botTimer = setTimeout(() => {
      // If continuing a multi-jump chain, only that piece can jump
      let legal = [];
      if (selectedPiece) {
        legal = getJumpsForPiece(board, selectedPiece[0], selectedPiece[1]);
      } else {
        legal = getAllLegalMoves(board, turn);
      }

      if (legal.length > 0) {
        let chosenMove = legal[0];
        if (botDifficulty === 'easy') {
          chosenMove = legal[Math.floor(Math.random() * legal.length)];
        } else {
          const depth = botDifficulty === 'medium' ? 3 : 4;
          const clone = board.map((r) => [...r]);
          const result = minimaxCheckers(clone, depth, -Infinity, Infinity, true, turn);
          chosenMove = result.move || legal[0];
        }
        executeMove(chosenMove);
      }
      setIsBotThinking(false);
    }, delay);

    return () => clearTimeout(botTimer);
  }, [board, turn, selectedPiece, gameMode, humanColor, botDifficulty, winner, executeMove]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('b');
    setSelectedPiece(null);
    setWinner(null);
    setMoveHistory([]);
  };

  const pieceCount = useMemo(() => {
    let b = 0, r = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const p = board[row][col];
        if (p) {
          if (p.toLowerCase() === 'b') b++;
          else r++;
        }
      }
    }
    return { b, r };
  }, [board]);

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black border-2 border-black flex items-center justify-center font-black text-white text-base brutal-shadow-sm font-mono shrink-0">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Brutal Checkers
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                8x8 DRAUGHTS • MANDATORY JUMPS
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              DIAGONAL WARFARE // MULTI-CAPTURE CHAINS // CROWN KINGING
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

      {/* Main Two-Column Battlefield */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: Checkers Board */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[500px] shrink-0">
          
          {/* Status Pill */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full border-2 border-black animate-pulse"
                style={{ backgroundColor: turn === 'b' ? '#171717' : '#ef4444' }}
              />
              <span className="font-brutal text-sm font-black uppercase">
                {winner ? `${winner === 'b' ? 'BLACK' : 'RED'} HAS WON THE WAR!` : isBotThinking ? 'BOT CALCULATING JUMPS...' : `${turn === 'b' ? 'BLACK' : 'RED'}'S MOVE`}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs font-black">
              <span className="px-1.5 py-0.5 bg-black text-white border border-black">B: {pieceCount.b}</span>
              <span className="px-1.5 py-0.5 bg-[#ef4444] text-white border border-black">R: {pieceCount.r}</span>
            </div>
          </div>

          {/* 8x8 Board */}
          <div className="w-full aspect-square bg-black p-2 border-4 border-black brutal-shadow-xl select-none">
            <div className="w-full h-full grid grid-cols-8 grid-rows-8 border-2 border-black">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isDarkSquare = (r + c) % 2 === 1;
                  const isSelected = selectedPiece && selectedPiece[0] === r && selectedPiece[1] === c;
                  const isLegalDest = selectedLegalMoves.some((m) => m.to[0] === r && m.to[1] === c);
                  const isMustJumpFrom = allLegalMoves.some((m) => m.captured && m.from[0] === r && m.from[1] === c);

                  return (
                    <div
                      key={`${r}_${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center transition-colors ${
                        isDarkSquare ? 'bg-[#262626]' : 'bg-[#f4f4ec]'
                      } ${isSelected ? 'ring-4 ring-[#facc15] z-20' : ''}`}
                    >
                      {/* Legal Move Glowing Destination Dot */}
                      {isLegalDest && (
                        <div className="w-4 h-4 rounded-full bg-[#22c55e] border-2 border-black animate-ping z-30 pointer-events-none" />
                      )}

                      {/* Piece */}
                      {cell && (
                        <div
                          className={`w-[82%] h-[82%] rounded-full border-3 border-black brutal-shadow-sm flex items-center justify-center cursor-pointer transition-all ${
                            cell.toLowerCase() === 'b' ? 'bg-[#171717] text-white' : 'bg-[#ef4444] text-white'
                          } ${isMustJumpFrom ? 'ring-3 ring-[#ef4444] animate-bounce' : ''}`}
                        >
                          {/* Inner Ring Detail */}
                          <div className="w-2/3 h-2/3 rounded-full border border-black/40 flex items-center justify-center">
                            {(cell === 'B' || cell === 'R') && (
                              <Crown className="w-4 h-4 text-[#facc15] fill-current drop-shadow-sm" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Score Counter */}
          <div className="w-full grid grid-cols-2 gap-2 font-mono text-xs text-center">
            <div className="p-1.5 bg-black text-white border-2 border-black font-black brutal-shadow-xs">
              BLACK WINS: {scores.b}
            </div>
            <div className="p-1.5 bg-[#ef4444] text-white border-2 border-black font-black brutal-shadow-xs">
              RED WINS: {scores.r}
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
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Checkers Engine</span>
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
                  👑
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Brutal Checkers Rules
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
                  1. Diagonal Movement & Mandatory Jumps
                </strong>
                Regular pieces move 1 square forward diagonally. If an opponent piece can be jumped, <strong>jumping is mandatory</strong>!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Multi-Jump Chains
                </strong>
                If landing on a jump immediately enables another jump, your piece continues jumping until all consecutive captures are complete.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. King Promotion 👑
                </strong>
                When a piece reaches the opponent's back rank, it is crowned King and can move and jump both forwards and backwards!
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

