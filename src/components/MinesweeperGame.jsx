import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Sparkles,
  Clock,
  Volume2,
  VolumeX,
  RotateCw,
  HelpCircle,
  X as CloseIcon,
  Flag,
  Flame,
  Gamepad2,
  Sliders
} from 'lucide-react';
import { sound } from '../utils/sound';

const PRESETS = {
  beginner: { name: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { name: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { name: 'Expert', rows: 16, cols: 24, mines: 65 }
};

// Generate mines ensuring first-click coordinate and surrounding 8 cells are safe
function initializeMinesweeperBoard(rows, cols, mineCount, safeR, safeC) {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0
    }))
  );

  // Exclude 3x3 zone around (safeR, safeC)
  const safeCells = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeR + dr;
      const nc = safeC + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        safeCells.add(`${nr}_${nc}`);
      }
    }
  }

  let placedMines = 0;
  while (placedMines < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = `${r}_${c}`;

    if (!board[r][c].isMine && !safeCells.has(key)) {
      board[r][c].isMine = true;
      placedMines++;
    }
  }

  // Calculate neighbor mine numbers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
            count++;
          }
        }
      }
      board[r][c].neighborMines = count;
    }
  }

  return board;
}

const NUMBER_COLORS = {
  1: 'text-[#22c55e]',
  2: 'text-[#eab308]',
  3: 'text-[#f97316]',
  4: 'text-[#ef4444]',
  5: 'text-purple-600',
  6: 'text-teal-600',
  7: 'text-black dark:text-white',
  8: 'text-neutral-500'
};

export const MinesweeperGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const [difficulty, setDifficulty] = useState('beginner');
  const cfg = PRESETS[difficulty];

  const [board, setBoard] = useState(() =>
    Array.from({ length: cfg.rows }, () =>
      Array.from({ length: cfg.cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    )
  );

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(false);
  const [flagMode, setFlagMode] = useState(false); // Mobile tap toggle for flagging
  const [timer, setTimer] = useState(0);
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);
  const timerRef = useRef(null);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Timer countdown
  useEffect(() => {
    if (gameStarted && !gameOver && !winner) {
      timerRef.current = setInterval(() => {
        setTimer((t) => Math.min(999, t + 1));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameStarted, gameOver, winner]);

  // Reset / Change difficulty
  const startNewGame = useCallback((diffKey = difficulty) => {
    const c = PRESETS[diffKey];
    clearInterval(timerRef.current);
    setBoard(
      Array.from({ length: c.rows }, () =>
        Array.from({ length: c.cols }, () => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        }))
      )
    );
    setGameStarted(false);
    setGameOver(false);
    setWinner(false);
    setTimer(0);
  }, [difficulty]);

  useEffect(() => {
    startNewGame(difficulty);
  }, [difficulty, startNewGame]);

  // Reveal cell with cascading flood fill
  const revealCell = (r, c) => {
    if (gameOver || winner) return;

    let currentBoard = board;

    // First click initialization
    if (!gameStarted) {
      currentBoard = initializeMinesweeperBoard(cfg.rows, cfg.cols, cfg.mines, r, c);
      setGameStarted(true);
    }

    const cell = currentBoard[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    // Hit Mine!
    if (cell.isMine) {
      sound.playGameOver();
      setGameOver(true);
      // Reveal all mines
      const revealedAll = currentBoard.map((row) =>
        row.map((item) => (item.isMine ? { ...item, isRevealed: true } : item))
      );
      setBoard(revealedAll);
      return;
    }

    sound.playMove();

    // Flood fill cascade
    const nextBoard = currentBoard.map((row) => row.map((item) => ({ ...item })));
    const queue = [[r, c]];
    nextBoard[r][c].isRevealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift();
      const currCell = nextBoard[currR][currC];

      if (currCell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
              const neighbor = nextBoard[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                if (neighbor.neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    setBoard(nextBoard);

    // Check Win: all non-mine cells revealed
    let unrevealedSafeCount = 0;
    for (let row = 0; row < cfg.rows; row++) {
      for (let col = 0; col < cfg.cols; col++) {
        if (!nextBoard[row][col].isMine && !nextBoard[row][col].isRevealed) {
          unrevealedSafeCount++;
        }
      }
    }

    if (unrevealedSafeCount === 0) {
      sound.playCheck();
      setWinner(true);
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 }, colors: ['#22c55e', '#facc15', '#ffffff'] });
    }
  };

  // Toggle flag
  const toggleFlag = (r, c, e) => {
    if (e) e.preventDefault();
    if (gameOver || winner || !gameStarted) return;
    const cell = board[r][c];
    if (cell.isRevealed) return;

    sound.playMove();
    setBoard((prev) => {
      const next = prev.map((row) => row.map((item) => ({ ...item })));
      next[r][c].isFlagged = !next[r][c].isFlagged;
      return next;
    });
  };

  // Cell click handler considering flagMode
  const handleCellClick = (r, c) => {
    if (flagMode) {
      toggleFlag(r, c);
    } else {
      revealCell(r, c);
    }
  };

  const flaggedCount = useMemo(() => {
    let count = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell.isFlagged) count++;
      })
    );
    return count;
  }, [board]);

  const remainingMines = Math.max(0, cfg.mines - flaggedCount);

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-base brutal-shadow-sm font-mono shrink-0">
            🚩
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Minesweeper Tactical
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                LOGIC DEDUCTION • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              FIRST-CLICK SAFETY // FLOOD-FILL CASCADE // PRECISION STOPWATCH
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
            onClick={() => startNewGame(difficulty)}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-center gap-4 min-h-0 overflow-y-auto">
        
        {/* Top Control HUD (Difficulty, Digital Mine Counter, Smiley Face, Timer) */}
        <div className="w-full max-w-xl bg-white p-3 border-4 border-black brutal-shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Difficulty Selector */}
          <div className="flex items-center gap-1">
            {Object.entries(PRESETS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setDifficulty(k)}
                className={`px-2.5 py-1 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
                  difficulty === k ? 'bg-black text-[#22c55e]' : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>

          {/* Retro LED Status Panel */}
          <div className="flex items-center gap-3">
            {/* Mines Left Counter */}
            <div className="bg-black text-[#ef4444] font-mono text-lg font-black px-2.5 py-0.5 border-2 border-black tracking-widest">
              💣 {String(remainingMines).padStart(3, '0')}
            </div>

            {/* Restart Smiley Face */}
            <button
              onClick={() => startNewGame(difficulty)}
              className="w-10 h-10 bg-[#facc15] hover:bg-yellow-400 border-2 border-black flex items-center justify-center text-xl cursor-pointer brutal-shadow-xs"
              title="Restart Board"
            >
              {winner ? '😎' : gameOver ? '💥' : '🙂'}
            </button>

            {/* Elapsed Stopwatch */}
            <div className="bg-black text-[#facc15] font-mono text-lg font-black px-2.5 py-0.5 border-2 border-black tracking-widest">
              ⏱️ {String(timer).padStart(3, '0')}
            </div>
          </div>
        </div>

        {/* Flag Mode Mobile Toggle */}
        <div className="w-full max-w-xl flex items-center justify-between gap-2 text-xs font-mono">
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`brutal-press flex-1 py-1.5 px-3 border-2 border-black font-bold uppercase flex items-center justify-center gap-2 cursor-pointer ${
              flagMode ? 'bg-[#ef4444] text-white font-black brutal-shadow-sm' : 'bg-white text-black'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>MODE: {flagMode ? 'FLAGGING (TAP TO PLACE FLAG)' : 'DIGGING (TAP TO REVEAL)'}</span>
          </button>
        </div>

        {/* Minesweeper Grid */}
        <div className="bg-black p-3 border-4 border-black brutal-shadow-xl overflow-x-auto max-w-full">
          <div
            className="grid gap-[2px] bg-black"
            style={{
              gridTemplateColumns: `repeat(${cfg.cols}, minmax(28px, 34px))`,
              gridTemplateRows: `repeat(${cfg.rows}, minmax(28px, 34px))`
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                return (
                  <button
                    key={`${r}_${c}`}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => toggleFlag(r, c, e)}
                    className={`aspect-square font-mono text-sm sm:text-base font-black flex items-center justify-center border transition-all ${
                      cell.isRevealed
                        ? cell.isMine
                          ? 'bg-[#ef4444] text-white border-black animate-pulse'
                          : 'bg-[#fafaf8] border-neutral-300 text-black shadow-inner'
                        : 'bg-[#e5e5dc] hover:bg-[#d4d4c8] border-white/50 border-r-black border-b-black cursor-pointer brutal-shadow-xs'
                    }`}
                  >
                    {cell.isRevealed ? (
                      cell.isMine ? (
                        '💣'
                      ) : cell.neighborMines > 0 ? (
                        <span className={NUMBER_COLORS[cell.neighborMines] || 'text-black'}>
                          {cell.neighborMines}
                        </span>
                      ) : (
                        ''
                      )
                    ) : cell.isFlagged ? (
                      <span className="text-[#ef4444]">🚩</span>
                    ) : (
                      ''
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="font-mono text-xs font-bold text-neutral-500 uppercase">
          {winner ? '🏆 CLEARED! ALL MINES DEFUSED IN ' + timer + ' SECONDS!' : gameOver ? '💥 DETONATION! BETTER LUCK NEXT SWEEP.' : 'TIP: RIGHT-CLICK TO PLACE A FLAG ON DESKTOP'}
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
                <div className="w-7 h-7 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-xs">
                  🚩
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Minesweeper Tactical Rules
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
                  1. First-Click Safety Guarantee
                </strong>
                Your very first click is 100% guaranteed safe and opens up an initial clearing.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Number Clues
                </strong>
                A revealed number indicates how many mines are adjacent in the 8 neighboring squares.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Flagging & Victory
                </strong>
                Right-click (or toggle Flag Mode) to plant flags on suspected mines. Reveal every non-mine tile to win!
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
