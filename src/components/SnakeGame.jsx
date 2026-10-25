import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Pause,
  RotateCw,
  HelpCircle,
  X as CloseIcon,
  Gamepad2,
  Flame
} from 'lucide-react';
import { sound } from '../utils/sound';

const GRID_SIZE = 20;

export const SnakeGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const [gameMode, setGameMode] = useState('solo'); // 'solo' | 'duel'
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // 'p1' | 'p2' | 'solo_dead' | null
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('randchess_snake_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);

  // Snake State in refs for interval loop
  const p1SnakeRef = useRef([{ r: 10, c: 5 }, { r: 10, c: 4 }, { r: 10, c: 3 }]);
  const p1DirRef = useRef({ r: 0, c: 1 }); // Moving right
  const p1NextDirRef = useRef({ r: 0, c: 1 });

  const p2SnakeRef = useRef([{ r: 10, c: 15 }, { r: 10, c: 16 }, { r: 10, c: 17 }]);
  const p2DirRef = useRef({ r: 0, c: -1 }); // Moving left
  const p2NextDirRef = useRef({ r: 0, c: -1 });

  const foodRef = useRef({ r: 5, c: 10, isGold: false });

  // Render trigger
  const [tick, setTick] = useState(0);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Spawn food safely
  const spawnFood = useCallback(() => {
    let r, c;
    let collision = true;
    while (collision) {
      r = Math.floor(Math.random() * GRID_SIZE);
      c = Math.floor(Math.random() * GRID_SIZE);
      const onP1 = p1SnakeRef.current.some((seg) => seg.r === r && seg.c === c);
      const onP2 = gameMode === 'duel' && p2SnakeRef.current.some((seg) => seg.r === r && seg.c === c);
      collision = onP1 || onP2;
    }
    const isGold = Math.random() < 0.2;
    foodRef.current = { r, c, isGold };
  }, [gameMode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Player 1 (WASD or Arrows in Solo)
      const d1 = p1DirRef.current;
      if ((e.key === 'w' || e.key === 'W' || (gameMode === 'solo' && e.key === 'ArrowUp')) && d1.r === 0) {
        p1NextDirRef.current = { r: -1, c: 0 };
      }
      if ((e.key === 's' || e.key === 'S' || (gameMode === 'solo' && e.key === 'ArrowDown')) && d1.r === 0) {
        p1NextDirRef.current = { r: 1, c: 0 };
      }
      if ((e.key === 'a' || e.key === 'A' || (gameMode === 'solo' && e.key === 'ArrowLeft')) && d1.c === 0) {
        p1NextDirRef.current = { r: 0, c: -1 };
      }
      if ((e.key === 'd' || e.key === 'D' || (gameMode === 'solo' && e.key === 'ArrowRight')) && d1.c === 0) {
        p1NextDirRef.current = { r: 0, c: 1 };
      }

      // Player 2 (Arrows in Duel)
      if (gameMode === 'duel') {
        const d2 = p2DirRef.current;
        if (e.key === 'ArrowUp' && d2.r === 0) p2NextDirRef.current = { r: -1, c: 0 };
        if (e.key === 'ArrowDown' && d2.r === 0) p2NextDirRef.current = { r: 1, c: 0 };
        if (e.key === 'ArrowLeft' && d2.c === 0) p2NextDirRef.current = { r: 0, c: -1 };
        if (e.key === 'ArrowRight' && d2.c === 0) p2NextDirRef.current = { r: 0, c: 1 };
      }

      if (e.key === ' ' && !gameOver) {
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, gameOver]);

  // Main game interval
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameSpeed = 100; // ms per tick

    const interval = setInterval(() => {
      // Step 1: Advance directions
      p1DirRef.current = p1NextDirRef.current;
      p2DirRef.current = p2NextDirRef.current;

      const p1Head = p1SnakeRef.current[0];
      const p1NewHead = { r: p1Head.r + p1DirRef.current.r, c: p1Head.c + p1DirRef.current.c };

      let p1Died = false;
      let p2Died = false;

      // Wall Collision P1
      if (p1NewHead.r < 0 || p1NewHead.r >= GRID_SIZE || p1NewHead.c < 0 || p1NewHead.c >= GRID_SIZE) {
        p1Died = true;
      }
      // Self Collision P1
      if (p1SnakeRef.current.some((seg) => seg.r === p1NewHead.r && seg.c === p1NewHead.c)) {
        p1Died = true;
      }

      let p2NewHead = null;
      if (gameMode === 'duel') {
        const p2Head = p2SnakeRef.current[0];
        p2NewHead = { r: p2Head.r + p2DirRef.current.r, c: p2Head.c + p2DirRef.current.c };

        // Wall Collision P2
        if (p2NewHead.r < 0 || p2NewHead.r >= GRID_SIZE || p2NewHead.c < 0 || p2NewHead.c >= GRID_SIZE) {
          p2Died = true;
        }
        // Self Collision P2
        if (p2SnakeRef.current.some((seg) => seg.r === p2NewHead.r && seg.c === p2NewHead.c)) {
          p2Died = true;
        }
        // P1 vs P2 Body Collision
        if (p2SnakeRef.current.some((seg) => seg.r === p1NewHead.r && seg.c === p1NewHead.c)) {
          p1Died = true;
        }
        if (p1SnakeRef.current.some((seg) => seg.r === p2NewHead.r && seg.c === p2NewHead.c)) {
          p2Died = true;
        }
      }

      // Check deaths
      if (p1Died || p2Died) {
        sound.playGameOver();
        setGameOver(true);
        setIsPlaying(false);
        if (gameMode === 'solo') {
          setWinner('solo_dead');
        } else {
          if (p1Died && p2Died) setWinner('draw');
          else if (p1Died) setWinner('p2');
          else setWinner('p1');
        }
        return;
      }

      // Move P1
      const p1FoodHit = p1NewHead.r === foodRef.current.r && p1NewHead.c === foodRef.current.c;
      const nextP1 = [p1NewHead, ...p1SnakeRef.current];
      if (p1FoodHit) {
        sound.playCapture();
        const pts = foodRef.current.isGold ? 50 : 10;
        setScore((s) => {
          const newS = s + pts;
          if (newS > highScore) {
            setHighScore(newS);
            try { localStorage.setItem('randchess_snake_highscore', String(newS)); } catch {}
          }
          return newS;
        });
        spawnFood();
      } else {
        nextP1.pop();
      }
      p1SnakeRef.current = nextP1;

      // Move P2 in Duel
      if (gameMode === 'duel' && p2NewHead) {
        const p2FoodHit = p2NewHead.r === foodRef.current.r && p2NewHead.c === foodRef.current.c;
        const nextP2 = [p2NewHead, ...p2SnakeRef.current];
        if (p2FoodHit) {
          sound.playCapture();
          spawnFood();
        } else {
          nextP2.pop();
        }
        p2SnakeRef.current = nextP2;
      }

      setTick((t) => t + 1);
    }, gameSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, gameMode, highScore, spawnFood]);

  const restartGame = () => {
    p1SnakeRef.current = [{ r: 10, c: 5 }, { r: 10, c: 4 }, { r: 10, c: 3 }];
    p1DirRef.current = { r: 0, c: 1 };
    p1NextDirRef.current = { r: 0, c: 1 };

    p2SnakeRef.current = [{ r: 10, c: 15 }, { r: 10, c: 16 }, { r: 10, c: 17 }];
    p2DirRef.current = { r: 0, c: -1 };
    p2NextDirRef.current = { r: 0, c: -1 };

    spawnFood();
    setScore(0);
    setGameOver(false);
    setWinner(null);
    setIsPlaying(true);
  };

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-base brutal-shadow-sm font-mono shrink-0">
            🐍
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Snake Arena Duel
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                GRID SURVIVAL • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              CLASSIC REFLEX ARCADE // 1v1 TRON DUEL MODE
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
            onClick={restartGame}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESTART</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: 20x20 Snake Arena */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[500px] shrink-0">
          
          {/* Status HUD */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <span className="font-brutal text-sm font-black uppercase">
              {gameOver ? (winner === 'p1' ? 'PLAYER 1 (EMERALD) WINS!' : winner === 'p2' ? 'PLAYER 2 (YELLOW) WINS!' : 'GAME OVER!') : isPlaying ? 'ARENA ACTIVE • EAT APPLES' : 'PRESS SPACE OR START TO SLITHER'}
            </span>
            <div className="flex items-center gap-2 font-mono text-xs font-black">
              <span className="px-2 py-0.5 bg-[#22c55e] text-black border border-black">SCORE: {score}</span>
              <span className="px-2 py-0.5 bg-black text-[#facc15] border border-black">HIGH: {highScore}</span>
            </div>
          </div>

          {/* 20x20 Grid Display */}
          <div className="w-full aspect-square bg-black p-2 border-4 border-black brutal-shadow-xl select-none">
            <div
              className="w-full h-full grid gap-[1px] bg-black border-2 border-black"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                const r = Math.floor(idx / GRID_SIZE);
                const c = idx % GRID_SIZE;

                const isP1Head = p1SnakeRef.current[0].r === r && p1SnakeRef.current[0].c === c;
                const isP1Body = p1SnakeRef.current.slice(1).some((s) => s.r === r && s.c === c);

                const isP2Head = gameMode === 'duel' && p2SnakeRef.current[0].r === r && p2SnakeRef.current[0].c === c;
                const isP2Body = gameMode === 'duel' && p2SnakeRef.current.slice(1).some((s) => s.r === r && s.c === c);

                const isFood = foodRef.current.r === r && foodRef.current.c === c;

                return (
                  <div
                    key={idx}
                    className={`aspect-square flex items-center justify-center ${
                      isP1Head
                        ? 'bg-[#22c55e] border-2 border-black z-20'
                        : isP1Body
                        ? 'bg-[#16a34a] border border-black z-10'
                        : isP2Head
                        ? 'bg-[#facc15] border-2 border-black z-20'
                        : isP2Body
                        ? 'bg-[#ca8a04] border border-black z-10'
                        : isFood
                        ? foodRef.current.isGold
                          ? 'bg-[#facc15] animate-ping'
                          : 'bg-[#ef4444] animate-bounce'
                        : isDarkTheme
                        ? 'bg-[#18181b]'
                        : 'bg-[#fafaf8]'
                    }`}
                  >
                    {isFood && (foodRef.current.isGold ? '⭐' : '🍎')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Play / Pause Toggle Button */}
          <div className="w-full">
            <button
              onClick={() => {
                if (gameOver) restartGame();
                else setIsPlaying(!isPlaying);
              }}
              className="brutal-press w-full py-2.5 bg-[#22c55e] hover:bg-green-400 border-2 border-black text-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
            >
              {gameOver ? <RotateCw className="w-4 h-4" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{gameOver ? 'PLAY AGAIN' : isPlaying ? 'PAUSE MATCH (SPACE)' : 'START GAME (SPACE)'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Tactical Command Station */}
        <div className="relative z-10 w-full lg:w-[360px] flex flex-col gap-3 shrink-0">
          
          {/* Opponent Selection Card */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Arena Mode
              </span>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#facc15] text-black border border-black">
                {gameMode === 'solo' ? 'SOLO SURVIVAL' : '👥 1v1 TRON DUEL'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setGameMode('solo'); restartGame(); }}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'solo'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Trophy className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-xs font-black">SOLO ARENA</span>
                <span className="text-[9px] font-mono font-bold text-black opacity-80">High-Score Hunt</span>
              </button>

              <button
                onClick={() => { setGameMode('duel'); restartGame(); }}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'duel'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-xs font-black">1v1 DUEL</span>
                <span className="text-[9px] font-mono font-bold text-black opacity-80">WASD vs Arrows</span>
              </button>
            </div>
          </div>

          {/* Action Buttons Strip */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={restartGame}
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
              <span>CONTROLS</span>
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
                <div className="w-7 h-7 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-xs">
                  🐍
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Snake Arena Controls
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
                  1. Player 1 (Emerald Snake)
                </strong>
                Use <strong>W, A, S, D</strong> (or Arrow Keys in Solo) to navigate.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Player 2 (Yellow Snake in 1v1 Duel)
                </strong>
                Use <strong>Arrow Keys</strong> to steer your snake and trap your opponent.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Apples & Golden Stars
                </strong>
                Red apples award 10 points. Golden stars award 50 points and rapid length growth!
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
