import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Shield,
  ArrowDown,
  Gamepad2,
  ChevronRight
} from 'lucide-react';
import { sound } from '../utils/sound';

const ROWS = 6;
const COLS = 7;

// Check 4 in a row in all directions
function checkConnectFourWin(board) {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p && p === board[r][c + 1] && p === board[r][c + 2] && p === board[r][c + 3]) {
        return { winner: p, line: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]] };
      }
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const p = board[r][c];
      if (p && p === board[r + 1][c] && p === board[r + 2][c] && p === board[r + 3][c]) {
        return { winner: p, line: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]] };
      }
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p && p === board[r + 1][c + 1] && p === board[r + 2][c + 2] && p === board[r + 3][c + 3]) {
        return { winner: p, line: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]] };
      }
    }
  }

  // Diagonal Down-Left
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const p = board[r][c];
      if (p && p === board[r + 1][c - 1] && p === board[r + 2][c - 2] && p === board[r + 3][c - 3]) {
        return { winner: p, line: [[r, c], [r + 1, c - 1], [r + 2, c - 2], [r + 3, c - 3]] };
      }
    }
  }

  // Check Draw
  const isFull = board.every((row) => row.every((cell) => cell !== null));
  if (isFull) {
    return { winner: 'draw', line: null };
  }

  return null;
}

// Find lowest available row in column
function getAvailableRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return -1;
}

// Heuristic Minimax Evaluation for Connect 4 AI
function evaluateWindow(window, piece) {
  const oppPiece = piece === 'R' ? 'Y' : 'R';
  let score = 0;
  const pCount = window.filter((c) => c === piece).length;
  const emptyCount = window.filter((c) => c === null).length;
  const oppCount = window.filter((c) => c === oppPiece).length;

  if (pCount === 4) score += 10000;
  else if (pCount === 3 && emptyCount === 1) score += 100;
  else if (pCount === 2 && emptyCount === 2) score += 10;

  if (oppCount === 3 && emptyCount === 1) score -= 800;
  else if (oppCount === 2 && emptyCount === 2) score -= 50;

  return score;
}

function scoreBoard(board, piece) {
  let score = 0;
  // Center column preference
  const centerArray = board.map((r) => r[3]);
  const centerCount = centerArray.filter((c) => c === piece).length;
  score += centerCount * 30;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], piece);
    }
  }

  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += evaluateWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], piece);
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]], piece);
    }
  }

  // Diagonal Down-Left
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      score += evaluateWindow([board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3]], piece);
    }
  }

  return score;
}

function minimaxConnectFour(board, depth, alpha, beta, isMaximizing, piece) {
  const winInfo = checkConnectFourWin(board);
  const oppPiece = piece === 'R' ? 'Y' : 'R';

  if (winInfo) {
    if (winInfo.winner === piece) return { score: 100000 + depth };
    if (winInfo.winner === oppPiece) return { score: -100000 - depth };
    return { score: 0 };
  }
  if (depth === 0) {
    return { score: scoreBoard(board, piece) };
  }

  // Ordered columns: center first
  const columnOrder = [3, 2, 4, 1, 5, 0, 6];
  const validCols = columnOrder.filter((c) => getAvailableRow(board, c) !== -1);

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestCol = validCols[0];
    for (const c of validCols) {
      const r = getAvailableRow(board, c);
      board[r][c] = piece;
      const evalResult = minimaxConnectFour(board, depth - 1, alpha, beta, false, piece);
      board[r][c] = null;
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestCol = c;
      }
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) break;
    }
    return { score: maxEval, col: bestCol };
  } else {
    let minEval = Infinity;
    let bestCol = validCols[0];
    for (const c of validCols) {
      const r = getAvailableRow(board, c);
      board[r][c] = oppPiece;
      const evalResult = minimaxConnectFour(board, depth - 1, alpha, beta, true, piece);
      board[r][c] = null;
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestCol = c;
      }
      beta = Math.min(beta, minEval);
      if (beta <= alpha) break;
    }
    return { score: minEval, col: bestCol };
  }
}

export const ConnectFourGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const [board, setBoard] = useState(() => Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
  const [turn, setTurn] = useState('R'); // 'R' = Red (Player 1), 'Y' = Yellow (Player 2 or Bot)
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play'
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [humanColor, setHumanColor] = useState('R');
  const [hoverCol, setHoverCol] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [winner, setWinner] = useState(null); // 'R' | 'Y' | 'draw' | null
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [scores, setScores] = useState({ R: 0, Y: 0, draws: 0 });

  // Timers
  const [timeControl, setTimeControl] = useState(30); // 15, 30, 60, null
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Turn timer countdown
  useEffect(() => {
    if (!timeControl || winner !== null || isBotThinking) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Timeout: switch turn or forfeit
          sound.playGameOver();
          const timedOutPlayer = turn;
          const otherPlayer = timedOutPlayer === 'R' ? 'Y' : 'R';
          setWinner(otherPlayer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeControl, winner, isBotThinking, turn]);

  // Reset clock on turn switch
  useEffect(() => {
    if (timeControl) {
      setTimerSeconds(timeControl);
    }
  }, [turn, timeControl]);

  // Drop chip into column
  const dropChip = useCallback((col) => {
    if (winner !== null || isBotThinking) return;
    const r = getAvailableRow(board, col);
    if (r === -1) return; // Column is full

    sound.playMove();

    const newBoard = board.map((row) => [...row]);
    newBoard[r][col] = turn;
    setBoard(newBoard);
    setMoveHistory((prev) => [...prev, { row: r, col, player: turn }]);

    const winInfo = checkConnectFourWin(newBoard);
    if (winInfo) {
      setWinner(winInfo.winner);
      setWinningLine(winInfo.line);
      if (winInfo.winner === 'draw') {
        sound.playGameOver();
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      } else {
        sound.playCheck();
        setScores((s) => ({ ...s, [winInfo.winner]: s[winInfo.winner] + 1 }));
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.5 },
          colors: [winInfo.winner === 'R' ? '#ef4444' : '#facc15', '#ffffff', '#000000']
        });
      }
    } else {
      setTurn((t) => (t === 'R' ? 'Y' : 'R'));
    }
  }, [board, turn, winner, isBotThinking]);

  // Bot automation
  useEffect(() => {
    if (gameMode !== 'ai' || winner !== null) return;
    const isBotTurn = turn !== humanColor;
    if (!isBotTurn) return;

    setIsBotThinking(true);
    const thinkingDelay = botDifficulty === 'easy' ? 400 : botDifficulty === 'medium' ? 650 : 850;

    const botTimer = setTimeout(() => {
      let chosenCol = -1;
      const validCols = [0, 1, 2, 3, 4, 5, 6].filter((c) => getAvailableRow(board, c) !== -1);

      if (validCols.length > 0) {
        if (botDifficulty === 'easy') {
          // Check for immediate win or block, else random
          for (const c of validCols) {
            const r = getAvailableRow(board, c);
            board[r][c] = turn;
            if (checkConnectFourWin(board)?.winner === turn) { chosenCol = c; board[r][c] = null; break; }
            board[r][c] = null;
          }
          if (chosenCol === -1) {
            chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
          }
        } else {
          const depth = botDifficulty === 'medium' ? 3 : 5;
          const result = minimaxConnectFour(board, depth, -Infinity, Infinity, true, turn);
          chosenCol = result.col ?? validCols[0];
        }
      }

      setIsBotThinking(false);
      if (chosenCol !== -1) {
        dropChip(chosenCol);
      }
    }, thinkingDelay);

    return () => clearTimeout(botTimer);
  }, [board, turn, gameMode, humanColor, botDifficulty, winner, dropChip]);

  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setTurn('R');
    setWinner(null);
    setWinningLine(null);
    setMoveHistory([]);
    setHoverCol(null);
    if (timeControl) setTimerSeconds(timeControl);
  };

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#ef4444] border-2 border-black flex items-center justify-center font-black text-white text-base brutal-shadow-sm font-mono shrink-0">
            🔴
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Gravity Connect 4
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                7x6 TACTICAL DROP • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              GRAVITY PHYSICS // MINIMAX AI ENGINE // 1v1 PASS & PLAY
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSoundActive(!soundActive)}
            className="brutal-press p-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title={soundActive ? 'Mute' : 'Unmute'}
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
        
        {/* Left Column: Connect 4 Grid & Drop Buttons */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[500px] shrink-0">
          
          {/* Turn Status Pill */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full border-2 border-black animate-pulse"
                style={{ backgroundColor: turn === 'R' ? '#ef4444' : '#facc15' }}
              />
              <span className="font-brutal text-sm font-black uppercase">
                {winner ? (winner === 'draw' ? 'DRAW MATCH!' : `${winner === 'R' ? 'RED' : 'YELLOW'} CLAIMS VICTORY!`) : isBotThinking ? 'BOT IS CALCULATING...' : `${turn === 'R' ? 'RED' : 'YELLOW'}'S TURN`}
              </span>
            </div>

            {timeControl && winner === null && (
              <div className={`flex items-center gap-1 font-mono text-xs font-black px-2 py-0.5 border border-black ${timerSeconds <= 5 ? 'bg-[#ef4444] text-white animate-bounce' : 'bg-black text-[#facc15]'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timerSeconds}s</span>
              </div>
            )}
          </div>

          {/* Connect 4 Vertical Board */}
          <div className="w-full bg-black p-3 border-4 border-black brutal-shadow-xl select-none">
            
            {/* Top Drop Indicators (Hover preview) */}
            <div className="grid grid-cols-7 gap-2 mb-2 px-1">
              {Array.from({ length: COLS }).map((_, col) => {
                const canDrop = getAvailableRow(board, col) !== -1 && winner === null && !isBotThinking;
                const isHovered = hoverCol === col && canDrop;

                return (
                  <button
                    key={col}
                    onClick={() => dropChip(col)}
                    onMouseEnter={() => setHoverCol(col)}
                    onMouseLeave={() => setHoverCol(null)}
                    disabled={!canDrop}
                    className={`h-7 border-2 border-black flex items-center justify-center transition-all ${
                      canDrop
                        ? isHovered
                          ? 'bg-[#22c55e] text-black cursor-pointer scale-105 brutal-shadow-xs'
                          : 'bg-white hover:bg-neutral-100 cursor-pointer'
                        : 'bg-neutral-800 border-neutral-700 opacity-40 cursor-not-allowed'
                    }`}
                    title={canDrop ? `Drop in Column ${col + 1}` : 'Column full'}
                  >
                    <ArrowDown className={`w-3.5 h-3.5 ${isHovered ? 'animate-bounce text-black' : 'text-neutral-500'}`} />
                  </button>
                );
              })}
            </div>

            {/* 7x6 Yellow/Black Cabinet Grid */}
            <div className="grid grid-cols-7 gap-2 bg-[#f4f4ec] p-2.5 border-3 border-black">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isWinningCell = winningLine?.some(([wr, wc]) => wr === r && wc === c);
                  const isHoverGhost = hoverCol === c && getAvailableRow(board, c) === r && winner === null && !isBotThinking;

                  return (
                    <div
                      key={`${r}_${c}`}
                      onClick={() => dropChip(c)}
                      onMouseEnter={() => setHoverCol(c)}
                      onMouseLeave={() => setHoverCol(null)}
                      className="aspect-square bg-black border-2 border-black rounded-full flex items-center justify-center cursor-pointer p-0.5 relative overflow-hidden"
                    >
                      {cell ? (
                        <div
                          className={`w-full h-full rounded-full border-2 border-black brutal-shadow-inner flex items-center justify-center transition-transform ${
                            cell === 'R' ? 'bg-[#ef4444]' : 'bg-[#facc15]'
                          } ${isWinningCell ? 'ring-4 ring-[#22c55e] scale-105 animate-pulse' : ''}`}
                        >
                          <div className="w-1/2 h-1/2 rounded-full border border-black/30 bg-white/20" />
                        </div>
                      ) : isHoverGhost ? (
                        <div
                          className="w-full h-full rounded-full border border-dashed border-white/50 opacity-40 animate-pulse"
                          style={{ backgroundColor: turn === 'R' ? '#ef4444' : '#facc15' }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-neutral-900 border border-neutral-800" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Score Counter Under Board */}
          <div className="w-full grid grid-cols-3 gap-2 font-mono text-xs text-center">
            <div className="p-1.5 bg-[#ef4444] text-white border-2 border-black font-black brutal-shadow-xs">
              RED: {scores.R} WINS
            </div>
            <div className="p-1.5 bg-white text-black border-2 border-black font-black brutal-shadow-xs">
              DRAWS: {scores.draws}
            </div>
            <div className="p-1.5 bg-[#facc15] text-black border-2 border-black font-black brutal-shadow-xs">
              YELLOW: {scores.Y} WINS
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
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Minimax Engine</span>
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

            {/* Turn Timer Selector */}
            <div className="border-t-2 border-black pt-2 space-y-1.5">
              <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                Turn Timer:
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { tc: 15, label: '15s' },
                  { tc: 30, label: '30s' },
                  { tc: 60, label: '60s' },
                  { tc: null, label: '∞' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setTimeControl(item.tc);
                      setTimerSeconds(item.tc || 0);
                    }}
                    className={`py-1 border border-black font-mono text-[10px] font-black cursor-pointer ${
                      timeControl === item.tc ? 'bg-black text-[#facc15]' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Move History Strip */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-1">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Move Log ({moveHistory.length} Moves)
              </span>
              <span className="font-mono text-[10px] text-neutral-500 font-bold">
                CHIP HISTORY
              </span>
            </div>

            <div className="h-28 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
              {moveHistory.length === 0 ? (
                <div className="text-neutral-500 italic p-1">No chips dropped yet.</div>
              ) : (
                moveHistory.map((m, idx) => (
                  <div key={idx} className="p-1 bg-white border border-black flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.player === 'R' ? 'bg-[#ef4444]' : 'bg-[#facc15]'}`} />
                      <span>Move {idx + 1}: {m.player === 'R' ? 'Red' : 'Yellow'}</span>
                    </span>
                    <span className="font-mono text-neutral-600 font-bold">Col {m.col + 1}, Row {6 - m.row}</span>
                  </div>
                ))
              )}
            </div>
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
                <div className="w-7 h-7 bg-[#ef4444] border-2 border-black flex items-center justify-center font-black text-white text-xs">
                  🔴
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Gravity Connect 4 Rules
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
                  1. Gravity Drop
                </strong>
                Choose any column (1-7). Your chip falls by gravity to the lowest unoccupied slot in that column.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Connect 4 To Win
                </strong>
                The first player to line up <strong>4 of their chips</strong> horizontally, vertically, or diagonally wins the match immediately!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Traps & Minimax AI
                </strong>
                Block your opponent before they complete 3-in-a-row traps. Play against the Minimax AI engine across 3 difficulty tiers!
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
