import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Flame,
  Bot,
  Users,
  Sparkles,
  Clock,
  Volume2,
  VolumeX,
  Play,
  RotateCw,
  Zap,
  Award,
  HelpCircle,
  X as CloseIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TimerSelector } from './TimerSelector';
import { sound } from '../utils/sound';

const WINNING_COMBOS = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diagonal TL to BR
  [2, 4, 6]  // Diagonal TR to BL
];

// Determine winner and winning combo line
function checkWinner(board) {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', line: null };
  }
  return null;
}

// Minimax algorithm with depth-weighting for optimal play
function minimax(board, depth, isMaximizing, botSymbol, humanSymbol) {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === botSymbol) return 10 - depth;
    if (result.winner === humanSymbol) return depth - 10;
    if (result.winner === 'draw') return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = botSymbol;
        const score = minimax(board, depth + 1, false, botSymbol, humanSymbol);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanSymbol;
        const score = minimax(board, depth + 1, true, botSymbol, humanSymbol);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

// Select best move according to difficulty level
function getAiMove(board, botSymbol, humanSymbol, difficulty) {
  const emptyIndices = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) emptyIndices.push(i);
  }
  if (emptyIndices.length === 0) return -1;

  // Easy / Novice: 70% random
  if (difficulty === 'easy') {
    if (Math.random() < 0.7) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
  }

  // Medium / Tactical: Seize wins, block losses, 35% random
  if (difficulty === 'medium') {
    // 1. Can bot win on this move?
    for (const idx of emptyIndices) {
      board[idx] = botSymbol;
      if (checkWinner(board)?.winner === botSymbol) {
        board[idx] = null;
        return idx;
      }
      board[idx] = null;
    }
    // 2. Must bot block human win?
    for (const idx of emptyIndices) {
      board[idx] = humanSymbol;
      if (checkWinner(board)?.winner === humanSymbol) {
        board[idx] = null;
        return idx;
      }
      board[idx] = null;
    }
    // 3. Otherwise 35% random fallback
    if (Math.random() < 0.35) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
  }

  // Hard / Unbeatable Minimax
  // If first move on an empty board, take center or a corner
  if (emptyIndices.length === 9) {
    const openers = [4, 0, 2, 6, 8];
    return openers[Math.floor(Math.random() * openers.length)];
  }

  let bestScore = -Infinity;
  let bestMoves = [];

  for (const idx of emptyIndices) {
    board[idx] = botSymbol;
    const score = minimax(board, 0, false, botSymbol, humanSymbol);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [idx];
    } else if (score === bestScore) {
      bestMoves.push(idx);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export const TicTacToeGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  // Game Setup
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play'
  const [aiDifficulty, setAiDifficulty] = useState('hard'); // 'easy' | 'medium' | 'hard'
  const [playerSide, setPlayerSide] = useState('X'); // 'X' | 'O' (in vs AI)
  const botSide = playerSide === 'X' ? 'O' : 'X';

  // Board State
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X'); // X always goes first
  const [moveHistory, setMoveHistory] = useState([]); // Array of board snapshots
  const [gameResult, setGameResult] = useState(null); // { winner: 'X'|'O'|'draw', line: [...], timeout?: boolean }
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Clocks / Timers
  const [timeControl, setTimeControl] = useState(60); // 60s default, or null for unlimited
  const [timers, setTimers] = useState({ X: 60, O: 60 });
  const timerIntervalRef = useRef(null);

  // Scoreboard & Win Streaks (Stored in LocalStorage)
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('randchess_tictactoe_stats');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { xWins: 0, oWins: 0, draws: 0, currentStreak: 0, bestStreak: 0 };
  });

  // Help / Rules drawer toggle
  const [showRules, setShowRules] = useState(false);

  // Save stats to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('randchess_tictactoe_stats', JSON.stringify(stats));
    } catch (e) {
      // ignore
    }
  }, [stats]);

  // Handle Game Over effects (confetti, audio)
  const triggerGameOverEffects = useCallback((res) => {
    if (res.winner === 'draw') {
      sound.playCapture();
      setStats((prev) => ({
        ...prev,
        draws: prev.draws + 1,
        currentStreak: 0
      }));
    } else {
      sound.playCheck();
      // Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: res.winner === 'X' ? ['#ef4444', '#ffffff', '#000000', '#facc15'] : ['#22c55e', '#ffffff', '#000000', '#facc15']
      });

      setStats((prev) => {
        const isX = res.winner === 'X';
        const isUserWinner = gameMode === 'pass_play' || res.winner === playerSide;
        const newStreak = isUserWinner ? prev.currentStreak + 1 : 0;
        return {
          ...prev,
          xWins: isX ? prev.xWins + 1 : prev.xWins,
          oWins: !isX ? prev.oWins + 1 : prev.oWins,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak)
        };
      });
    }
  }, [gameMode, playerSide]);

  // Clock countdown tick
  useEffect(() => {
    if (gameResult || timeControl === null) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const activeTimer = prev[turn];
        if (activeTimer <= 1) {
          clearInterval(timerIntervalRef.current);
          const winner = turn === 'X' ? 'O' : 'X';
          const timeoutResult = { winner, line: null, timeout: true };
          setGameResult(timeoutResult);
          triggerGameOverEffects(timeoutResult);
          sound.playGameOver();
          return { ...prev, [turn]: 0 };
        }
        return { ...prev, [turn]: activeTimer - 1 };
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [turn, gameResult, timeControl, triggerGameOverEffects]);

  // Start new round / reset board
  const startNewRound = useCallback(() => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setGameResult(null);
    setMoveHistory([]);
    setIsBotThinking(false);
    if (timeControl !== null) {
      setTimers({ X: timeControl, O: timeControl });
    }
  }, [timeControl]);

  // Reset entire scoreboard
  const resetStats = () => {
    const fresh = { xWins: 0, oWins: 0, draws: 0, currentStreak: 0, bestStreak: 0 };
    setStats(fresh);
    try {
      localStorage.setItem('randchess_tictactoe_stats', JSON.stringify(fresh));
    } catch (e) {
      // ignore
    }
  };

  // Bot Turn Trigger
  useEffect(() => {
    if (gameMode !== 'ai' || gameResult) return;

    if (turn === botSide) {
      setIsBotThinking(true);
      // Realistic brief delay for natural gameplay feeling
      const thinkTimer = setTimeout(() => {
        setBoard((currentBoard) => {
          const resCheck = checkWinner(currentBoard);
          if (resCheck) return currentBoard;

          const targetMove = getAiMove(currentBoard, botSide, playerSide, aiDifficulty);
          if (targetMove === -1) return currentBoard;

          const nextBoard = [...currentBoard];
          nextBoard[targetMove] = botSide;

          sound.playMove();

          // Push to history
          setMoveHistory((prev) => [...prev, currentBoard]);

          const afterResult = checkWinner(nextBoard);
          if (afterResult) {
            setGameResult(afterResult);
            triggerGameOverEffects(afterResult);
          } else {
            setTurn(playerSide);
          }

          setIsBotThinking(false);
          return nextBoard;
        });
      }, 350);

      return () => clearTimeout(thinkTimer);
    }
  }, [turn, gameMode, botSide, playerSide, aiDifficulty, gameResult, triggerGameOverEffects]);

  // Handle cell click by human player
  const handleCellClick = (index) => {
    if (board[index] !== null || gameResult || isBotThinking) return;

    // In AI mode, check if it's player's turn
    if (gameMode === 'ai' && turn !== playerSide) return;

    sound.playMove();

    const nextBoard = [...board];
    nextBoard[index] = turn;
    setBoard(nextBoard);
    setMoveHistory((prev) => [...prev, board]);

    const result = checkWinner(nextBoard);
    if (result) {
      setGameResult(result);
      triggerGameOverEffects(result);
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  };

  // Undo / Takeback move
  const handleTakeback = () => {
    if (moveHistory.length === 0 || isBotThinking) return;

    if (gameMode === 'ai') {
      // In AI mode, if human made a move and bot replied, undo 2 moves back to human's turn
      if (moveHistory.length >= 2) {
        const targetState = moveHistory[moveHistory.length - 2];
        setBoard(targetState);
        setMoveHistory(moveHistory.slice(0, -2));
        setTurn(playerSide);
        setGameResult(null);
      } else if (moveHistory.length === 1 && turn === botSide) {
        // Human just moved, bot hasn't moved yet
        const targetState = moveHistory[0];
        setBoard(targetState);
        setMoveHistory([]);
        setTurn(playerSide);
        setGameResult(null);
      }
    } else {
      // 1v1 mode: undo 1 move
      const targetState = moveHistory[moveHistory.length - 1];
      setBoard(targetState);
      setMoveHistory(moveHistory.slice(0, -1));
      setTurn(turn === 'X' ? 'O' : 'X');
      setGameResult(null);
    }
  };

  // Handle Time Control changes
  const handleUpdateTimeControl = (newSecs) => {
    setTimeControl(newSecs);
    if (newSecs !== null) {
      setTimers({ X: newSecs, O: newSecs });
    }
  };

  // Format timer seconds (MM:SS or SS.S)
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return '∞';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Strike line coordinates calculation for the winning line
  const getStrikeLineCoords = () => {
    if (!gameResult || !gameResult.line) return null;
    const line = gameResult.line;

    // Rows
    if (line[0] === 0 && line[2] === 2) return { x1: '8%', y1: '16.66%', x2: '92%', y2: '16.66%' };
    if (line[0] === 3 && line[2] === 5) return { x1: '8%', y1: '50%', x2: '92%', y2: '50%' };
    if (line[0] === 6 && line[2] === 8) return { x1: '8%', y1: '83.33%', x2: '92%', y2: '83.33%' };

    // Columns
    if (line[0] === 0 && line[2] === 6) return { x1: '16.66%', y1: '8%', x2: '16.66%', y2: '92%' };
    if (line[0] === 1 && line[2] === 7) return { x1: '50%', y1: '8%', x2: '50%', y2: '92%' };
    if (line[0] === 2 && line[2] === 8) return { x1: '83.33%', y1: '8%', x2: '83.33%', y2: '92%' };

    // Diagonals
    if (line[0] === 0 && line[2] === 8) return { x1: '10%', y1: '10%', x2: '90%', y2: '90%' };
    if (line[0] === 2 && line[2] === 6) return { x1: '90%', y1: '10%', x2: '10%', y2: '90%' };

    return null;
  };

  const strikeLine = getStrikeLineCoords();

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f5f5f0] text-black'}`}>
      {/* Top Banner / Mode Bar */}
      <div className={`border-b-3 border-black px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#facc15] border-2 border-black flex items-center justify-center font-black text-black text-sm sm:text-base brutal-shadow-sm font-mono shrink-0">
            ✕◯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Brutal Tic-Tac-Toe
              </h2>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#22c55e] text-black border border-black hidden sm:inline">
                MINIMAX POWERED
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              NEO-BRUTALIST TACTICAL GRID // UNBEATABLE AI // FAST ACTION
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Rules Toggle */}
          <button
            onClick={() => setShowRules(!showRules)}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="How to Play & Minimax Explainer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-black" />
            <span className="hidden md:inline">GUIDE</span>
          </button>

          {/* Game Catalogue Switcher shortcut */}
          <button
            onClick={onOpenCatalogue}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Open Game Catalogue"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CATALOGUE</span>
          </button>

          {/* Reset / New Round */}
          <button
            onClick={startNewRound}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Reset Grid & Start Fresh Round"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">NEW ROUND</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: 3x3 Arena & Clocks (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Player Clocks & Indicators Bar */}
            <div className="w-full max-w-[420px] mb-4 grid grid-cols-2 gap-3">
              {/* Player X Card */}
              <div
                className={`p-2.5 sm:p-3 border-3 border-black transition-all ${
                  turn === 'X' && !gameResult
                    ? 'bg-[#ef4444] text-white brutal-shadow-md scale-[1.02]'
                    : isDarkTheme
                    ? 'bg-[#18181b] text-neutral-300'
                    : 'bg-white text-black'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-brutal font-black text-lg text-white bg-black px-1.5 py-0.2 border border-white">
                      ✕
                    </span>
                    <span className="font-brutal font-black text-xs uppercase tracking-wider">
                      {gameMode === 'ai'
                        ? playerSide === 'X'
                          ? 'YOU (X)'
                          : 'BOT (X)'
                        : 'PLAYER 1 (X)'}
                    </span>
                  </div>
                  {turn === 'X' && !gameResult && (
                    <span className="animate-pulse flex h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-xs opacity-75 font-bold uppercase">CLOCK:</span>
                  <span className="font-mono text-lg sm:text-xl font-black">
                    {formatTime(timers.X)}
                  </span>
                </div>
              </div>

              {/* Player O Card */}
              <div
                className={`p-2.5 sm:p-3 border-3 border-black transition-all ${
                  turn === 'O' && !gameResult
                    ? 'bg-[#22c55e] text-black brutal-shadow-md scale-[1.02]'
                    : isDarkTheme
                    ? 'bg-[#18181b] text-neutral-300'
                    : 'bg-white text-black'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-brutal font-black text-lg text-black bg-white px-1.5 py-0.2 border border-black">
                      ◯
                    </span>
                    <span className="font-brutal font-black text-xs uppercase tracking-wider">
                      {gameMode === 'ai'
                        ? playerSide === 'O'
                          ? 'YOU (O)'
                          : 'BOT (O)'
                        : 'PLAYER 2 (O)'}
                    </span>
                  </div>
                  {turn === 'O' && !gameResult && (
                    <span className="animate-pulse flex h-2 w-2 rounded-full bg-black" />
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-xs opacity-75 font-bold uppercase">CLOCK:</span>
                  <span className="font-mono text-lg sm:text-xl font-black">
                    {formatTime(timers.O)}
                  </span>
                </div>
              </div>
            </div>

            {/* Turn Status Message */}
            <div className="w-full max-w-[420px] mb-3 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase text-neutral-500">
                  ROUND STATUS:
                </span>
                <span className="font-brutal text-xs sm:text-sm font-black uppercase">
                  {gameResult ? (
                    gameResult.winner === 'draw' ? (
                      <span className="text-[#facc15] bg-black px-1.5 py-0.5 border border-black">
                        CAT'S GAME / DRAW
                      </span>
                    ) : gameResult.timeout ? (
                      <span className="text-white bg-[#ef4444] px-1.5 py-0.5 border border-black">
                        TIMEOUT! {gameResult.winner} WINS
                      </span>
                    ) : (
                      <span className="text-black bg-[#facc15] px-1.5 py-0.5 border border-black">
                        VICTORY! {gameResult.winner} CLAIMS THE GRID
                      </span>
                    )
                  ) : isBotThinking ? (
                    <span className="text-amber-500 animate-pulse font-mono flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> BOT COMPUTING MOVE...
                    </span>
                  ) : (
                    <span className="font-bold">
                      {turn === 'X' ? '✕ Turn to Move' : '◯ Turn to Move'}
                    </span>
                  )}
                </span>
              </div>

              {/* Move Counter */}
              <div className="font-mono text-xs font-bold text-neutral-400">
                MOVE {board.filter(Boolean).length}/9
              </div>
            </div>

            {/* 3x3 Tic Tac Toe Grid with Brutalist Framing */}
            <div className="relative w-full max-w-[420px] aspect-square p-3 sm:p-4 bg-black border-4 border-black brutal-shadow-lg">
              <div className="grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3 w-full h-full">
                {board.map((cellValue, idx) => {
                  const isWinningSquare = gameResult?.line?.includes(idx);
                  const isAvailable = cellValue === null && !gameResult && !isBotThinking;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleCellClick(idx)}
                      onMouseEnter={() => setHoveredCell(idx)}
                      onMouseLeave={() => setHoveredCell(null)}
                      disabled={!isAvailable}
                      className={`relative flex items-center justify-center font-brutal font-black transition-all select-none border-3 border-black text-4xl sm:text-6xl md:text-7xl ${
                        isWinningSquare
                          ? 'bg-[#facc15] text-black scale-[0.98] shadow-inner animate-pulse'
                          : cellValue
                          ? isDarkTheme
                            ? 'bg-[#27272a]'
                            : 'bg-white'
                          : isDarkTheme
                          ? 'bg-[#18181b] hover:bg-[#27272a] cursor-pointer'
                          : 'bg-[#fafaf8] hover:bg-[#eaeae2] cursor-pointer'
                      } ${isAvailable ? 'brutal-press' : ''}`}
                      aria-label={`Cell ${idx + 1}: ${cellValue || 'Empty'}`}
                    >
                      {cellValue === 'X' && (
                        <span className="text-[#ef4444] drop-shadow-sm font-black">
                          ✕
                        </span>
                      )}
                      {cellValue === 'O' && (
                        <span className="text-[#22c55e] drop-shadow-sm font-black">
                          ◯
                        </span>
                      )}

                      {/* Ghost mark preview on hover */}
                      {!cellValue && hoveredCell === idx && isAvailable && (
                        <span className="opacity-25 text-neutral-400 text-3xl sm:text-5xl font-black">
                          {turn}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Animated SVG Strike Line on Victory */}
              {strikeLine && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  style={{ overflow: 'visible' }}
                >
                  <line
                    x1={strikeLine.x1}
                    y1={strikeLine.y1}
                    x2={strikeLine.x2}
                    y2={strikeLine.y2}
                    stroke="#000000"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="drop-shadow-md"
                  />
                  <line
                    x1={strikeLine.x1}
                    y1={strikeLine.y1}
                    x2={strikeLine.x2}
                    y2={strikeLine.y2}
                    stroke={gameResult.winner === 'X' ? '#ef4444' : '#22c55e'}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* Quick Action Buttons Under Board */}
            <div className="w-full max-w-[420px] mt-3 flex items-center justify-between gap-2">
              <button
                onClick={handleTakeback}
                disabled={moveHistory.length === 0 || isBotThinking}
                className="brutal-press flex-1 py-2 px-3 bg-white text-black hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                title="Undo Previous Move"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>TAKEBACK MOVE</span>
              </button>

              <button
                onClick={startNewRound}
                className="brutal-press flex-1 py-2 px-3 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                title="Restart Board"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>RESTART</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Settings, Stats & Difficulty Panel (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-4 w-full">
            
            {/* SCOREBOARD CARD */}
            <div className={`p-4 border-3 border-black brutal-shadow-md ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#facc15]" />
                  <h3 className="font-brutal font-black text-xs uppercase tracking-wider">
                    BATTLE SCOREBOARD
                  </h3>
                </div>
                {/* Win Streak Indicator */}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-[#facc15] text-black border border-black font-mono text-[11px] font-black">
                  <Flame className="w-3.5 h-3.5 fill-current text-red-600" />
                  <span>STREAK: {stats.currentStreak}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="p-2 border-2 border-black bg-[#ef4444]/15">
                  <div className="font-brutal font-black text-lg text-[#ef4444]">
                    {stats.xWins}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-neutral-500 uppercase">
                    X WINS
                  </div>
                </div>
                <div className="p-2 border-2 border-black bg-neutral-200/50">
                  <div className="font-brutal font-black text-lg text-black">
                    {stats.draws}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-neutral-500 uppercase">
                    DRAWS
                  </div>
                </div>
                <div className="p-2 border-2 border-black bg-[#22c55e]/15">
                  <div className="font-brutal font-black text-lg text-[#22c55e]">
                    {stats.oWins}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-neutral-500 uppercase">
                    O WINS
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/20 text-xs">
                <span className="font-mono text-neutral-500">Record Streak: <strong className="text-black">{stats.bestStreak} wins</strong></span>
                <button
                  onClick={resetStats}
                  className="text-[10px] font-mono text-neutral-400 hover:text-red-500 underline uppercase cursor-pointer"
                >
                  Reset Record
                </button>
              </div>
            </div>

            {/* MATCH MODE SELECTOR */}
            <div className={`p-4 border-3 border-black brutal-shadow-md ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
              <div className="font-brutal font-black text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>SELECT MATCH MODE</span>
                <span className="font-mono text-[10px] text-neutral-400">PVP OR BOT</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setGameMode('ai');
                    startNewRound();
                  }}
                  className={`brutal-press py-2 px-3 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                    gameMode === 'ai'
                      ? 'bg-[#22c55e] text-black brutal-shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>vs AI BOT</span>
                </button>
                <button
                  onClick={() => {
                    setGameMode('pass_play');
                    startNewRound();
                  }}
                  className={`brutal-press py-2 px-3 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                    gameMode === 'pass_play'
                      ? 'bg-[#22c55e] text-black brutal-shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>1v1 LOCAL</span>
                </button>
              </div>

              {/* Bot Difficulty Settings (Visible when gameMode === 'ai') */}
              {gameMode === 'ai' && (
                <div className="mt-3 pt-3 border-t-2 border-black">
                  <div className="font-brutal font-black text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>BOT DIFFICULTY</span>
                    <span className="font-mono text-[9px] px-1 bg-[#facc15] text-black border border-black font-bold">
                      {aiDifficulty === 'hard' ? 'UNBEATABLE' : aiDifficulty.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'easy', label: 'NOVICE', desc: 'Relaxed moves' },
                      { id: 'medium', label: 'EXPERT', desc: 'Blocks & strikes' },
                      { id: 'hard', label: 'MASTER', desc: 'Minimax 100%' }
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => {
                          setAiDifficulty(lvl.id);
                          startNewRound();
                        }}
                        className={`py-1.5 px-2 border-2 border-black font-brutal text-[11px] font-black uppercase cursor-pointer text-center transition-colors ${
                          aiDifficulty === lvl.id
                            ? 'bg-black text-white brutal-shadow-sm'
                            : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>

                  {/* Play as Symbol */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-neutral-500">
                      PLAY AS:
                    </span>
                    <div className="flex border-2 border-black bg-black p-0.5">
                      <button
                        onClick={() => {
                          setPlayerSide('X');
                          startNewRound();
                        }}
                        className={`px-3 py-0.5 font-brutal text-xs font-black cursor-pointer ${
                          playerSide === 'X' ? 'bg-[#ef4444] text-white' : 'bg-black text-white'
                        }`}
                      >
                        ✕ (First)
                      </button>
                      <button
                        onClick={() => {
                          setPlayerSide('O');
                          startNewRound();
                        }}
                        className={`px-3 py-0.5 font-brutal text-xs font-black cursor-pointer ${
                          playerSide === 'O' ? 'bg-[#22c55e] text-black' : 'bg-black text-white'
                        }`}
                      >
                        ◯ (Second)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOMIZABLE TIMER SETTINGS */}
            <div className={`p-4 border-3 border-black brutal-shadow-md ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
              <div className="font-brutal font-black text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-black" />
                <span>MATCH CLOCK SETTINGS</span>
              </div>
              <TimerSelector
                value={timeControl}
                onChange={handleUpdateTimeControl}
                label="Tic-Tac-Toe Round Clock"
                compact={true}
              />
            </div>

          </div>
        </div>
      </div>

      {/* HOW TO PLAY / RULES MODAL */}
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
                <div className="w-7 h-7 bg-[#facc15] border-2 border-black flex items-center justify-center font-black text-black text-xs">
                  ✕◯
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Tic-Tac-Toe Guide & AI
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
              <div className="p-3 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  1. Objective
                </strong>
                Place 3 of your marks in a continuous horizontal, vertical, or diagonal row before your opponent.
              </div>

              <div className="p-3 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Unbeatable Minimax AI
                </strong>
                On Master difficulty, the bot computes the complete minimax game tree. It evaluates all 255,168 possible game states. Under optimal play by both sides, Tic-Tac-Toe is a mathematical draw — try to achieve a tie!
              </div>

              <div className="p-3 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Clock & Forfeit
                </strong>
                If match timers are active, you must make a move before your clock strikes 0:00, or you forfeit on time!
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setShowRules(false)}
                className="brutal-press px-4 py-2 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm"
              >
                UNDERSTOOD // PLAY NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
