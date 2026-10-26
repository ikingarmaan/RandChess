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
  Sliders
} from 'lucide-react';
import { sound } from '../utils/sound';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 70;
const BALL_SIZE = 10;

export const PongGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const canvasRef = useRef(null);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play'
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [targetScore, setTargetScore] = useState(5); // 5 | 7 | 10
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [winner, setWinner] = useState(null); // 'p1' | 'p2' | null
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);

  // Mutable game state in ref for 60fps loop
  const stateRef = useRef({
    p1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    p2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVX: 5,
    ballVY: 3,
    keys: { w: false, s: false, ArrowUp: false, ArrowDown: false },
    p1Score: 0,
    p2Score: 0
  });

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Mouse and touch paddle movement
  const handleCanvasPointer = useCallback((clientY) => {
    if (!isPlaying || winner !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const relativeY = clientY - rect.top;
    const targetY = relativeY * scaleY - PADDLE_HEIGHT / 2;
    stateRef.current.p1Y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, targetY));
  }, [isPlaying, winner]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'w' || e.key === 'W') stateRef.current.keys.w = true;
      if (e.key === 's' || e.key === 'S') stateRef.current.keys.s = true;
      if (e.key === 'ArrowUp') stateRef.current.keys.ArrowUp = true;
      if (e.key === 'ArrowDown') stateRef.current.keys.ArrowDown = true;
      if (e.key === ' ' && winner === null) {
        setIsPlaying((p) => !p);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'w' || e.key === 'W') stateRef.current.keys.w = false;
      if (e.key === 's' || e.key === 'S') stateRef.current.keys.s = false;
      if (e.key === 'ArrowUp') stateRef.current.keys.ArrowUp = false;
      if (e.key === 'ArrowDown') stateRef.current.keys.ArrowDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [winner]);

  // Reset ball to center
  const resetBall = useCallback((towardPlayer = 1) => {
    stateRef.current.ballX = CANVAS_WIDTH / 2;
    stateRef.current.ballY = CANVAS_HEIGHT / 2;
    const baseSpeed = 5;
    stateRef.current.ballVX = towardPlayer === 1 ? -baseSpeed : baseSpeed;
    stateRef.current.ballVY = (Math.random() - 0.5) * 6;
  }, []);

  // Main 60 FPS animation loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const s = stateRef.current;

      if (isPlaying && winner === null) {
        const paddleSpeed = 6;

        // Player 1 movement (W/S or Arrow keys if 1v1)
        if (s.keys.w || (gameMode === 'ai' && s.keys.ArrowUp)) {
          s.p1Y = Math.max(0, s.p1Y - paddleSpeed);
        }
        if (s.keys.s || (gameMode === 'ai' && s.keys.ArrowDown)) {
          s.p1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.p1Y + paddleSpeed);
        }

        // Player 2 / Bot movement
        if (gameMode === 'pass_play') {
          if (s.keys.ArrowUp) s.p2Y = Math.max(0, s.p2Y - paddleSpeed);
          if (s.keys.ArrowDown) s.p2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.p2Y + paddleSpeed);
        } else {
          // AI Bot tracking
          const botCenter = s.p2Y + PADDLE_HEIGHT / 2;
          const aiSpeed = botDifficulty === 'easy' ? 3.5 : botDifficulty === 'medium' ? 5 : 6.8;
          if (s.ballX > CANVAS_WIDTH * 0.25) {
            if (s.ballY < botCenter - 10) s.p2Y = Math.max(0, s.p2Y - aiSpeed);
            else if (s.ballY > botCenter + 10) s.p2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.p2Y + aiSpeed);
          }
        }

        // Move Ball
        s.ballX += s.ballVX;
        s.ballY += s.ballVY;

        // Top/Bottom wall bounce
        if (s.ballY <= 0 || s.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
          s.ballVY = -s.ballVY;
          sound.playMove();
        }

        // Paddle 1 Collision (Left)
        if (
          s.ballX <= 25 + PADDLE_WIDTH &&
          s.ballX >= 25 &&
          s.ballY + BALL_SIZE >= s.p1Y &&
          s.ballY <= s.p1Y + PADDLE_HEIGHT &&
          s.ballVX < 0
        ) {
          sound.playCapture();
          const hitOffset = (s.ballY + BALL_SIZE / 2 - (s.p1Y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          s.ballVX = Math.min(11, -s.ballVX * 1.05);
          s.ballVY = hitOffset * 7;
        }

        // Paddle 2 Collision (Right)
        if (
          s.ballX + BALL_SIZE >= CANVAS_WIDTH - 25 - PADDLE_WIDTH &&
          s.ballX + BALL_SIZE <= CANVAS_WIDTH - 25 &&
          s.ballY + BALL_SIZE >= s.p2Y &&
          s.ballY <= s.p2Y + PADDLE_HEIGHT &&
          s.ballVX > 0
        ) {
          sound.playCapture();
          const hitOffset = (s.ballY + BALL_SIZE / 2 - (s.p2Y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          s.ballVX = Math.max(-11, -s.ballVX * 1.05);
          s.ballVY = hitOffset * 7;
        }

        // Left Goal (Player 2 scores)
        if (s.ballX < 0) {
          sound.playGameOver();
          s.p2Score++;
          setScores({ p1: s.p1Score, p2: s.p2Score });
          if (s.p2Score >= targetScore) {
            setWinner('p2');
            setIsPlaying(false);
          } else {
            resetBall(1);
          }
        }

        // Right Goal (Player 1 scores)
        if (s.ballX > CANVAS_WIDTH) {
          sound.playCheck();
          s.p1Score++;
          setScores({ p1: s.p1Score, p2: s.p2Score });
          if (s.p1Score >= targetScore) {
            setWinner('p1');
            setIsPlaying(false);
            confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 }, colors: ['#22c55e', '#ffffff', '#000000'] });
          } else {
            resetBall(2);
          }
        }
      }

      // Render Canvas
      ctx.fillStyle = '#0f0f12';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dashed net
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Scores Display on Court
      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = '#22c55e';
      ctx.textAlign = 'center';
      ctx.fillText(s.p1Score, CANVAS_WIDTH / 4, 60);

      ctx.fillStyle = '#facc15';
      ctx.fillText(s.p2Score, (3 * CANVAS_WIDTH) / 4, 60);

      // Paddle 1 (Left - Emerald)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(25, s.p1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Paddle 2 (Right - Yellow)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(CANVAS_WIDTH - 25 - PADDLE_WIDTH, s.p2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.ballX, s.ballY, BALL_SIZE, BALL_SIZE);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, winner, gameMode, botDifficulty, targetScore, resetBall]);

  const restartMatch = () => {
    stateRef.current.p1Score = 0;
    stateRef.current.p2Score = 0;
    setScores({ p1: 0, p2: 0 });
    setWinner(null);
    resetBall(1);
    setIsPlaying(true);
  };

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-base brutal-shadow-sm font-mono shrink-0">
            🏓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Cyber Pong 1v1
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                60 FPS ARCADE • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              VECTOR PADDLE PHYSICS // REACTIVE DEFLECTION // SPLIT-SECOND RALLIES
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
            onClick={restartMatch}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: Canvas Court */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[660px] shrink-0">
          
          {/* Status Pill */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <span className="font-brutal text-sm font-black uppercase">
              {winner ? `${winner === 'p1' ? 'PLAYER 1 (EMERALD)' : 'PLAYER 2 (YELLOW)'} WINS THE MATCH!` : isPlaying ? 'MATCH IN PLAY • USE W/S OR ARROWS' : 'MATCH PAUSED • PRESS SPACE OR START'}
            </span>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-white">
              FIRST TO {targetScore}
            </span>
          </div>

          {/* Canvas Viewport */}
          <div className="w-full bg-black p-2 border-4 border-black brutal-shadow-xl select-none flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseMove={(e) => handleCanvasPointer(e.clientY)}
              onTouchMove={(e) => {
                if (e.touches[0]) handleCanvasPointer(e.touches[0].clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) handleCanvasPointer(e.touches[0].clientY);
              }}
              className="w-full max-w-[640px] aspect-[16/10] bg-black border-2 border-black cursor-ns-resize touch-none"
            />
          </div>

          {/* Touch / Quick Play / Pause Button & On-Screen Paddle Steer */}
          <div className="w-full flex items-center justify-between gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="brutal-press flex-1 py-2.5 bg-[#22c55e] hover:bg-green-400 border-2 border-black text-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE MATCH' : 'START / RESUME MATCH'}</span>
            </button>

            <div className="flex gap-1.5">
              <button
                onMouseDown={() => { stateRef.current.keys.w = true; }}
                onMouseUp={() => { stateRef.current.keys.w = false; }}
                onTouchStart={() => { stateRef.current.keys.w = true; }}
                onTouchEnd={() => { stateRef.current.keys.w = false; }}
                className="brutal-press px-4 py-2.5 bg-[#facc15] hover:bg-yellow-400 border-2 border-black text-black font-brutal text-xs font-black uppercase cursor-pointer select-none"
                title="Move Paddle Up"
              >
                ▲ UP
              </button>
              <button
                onMouseDown={() => { stateRef.current.keys.s = true; }}
                onMouseUp={() => { stateRef.current.keys.s = false; }}
                onTouchStart={() => { stateRef.current.keys.s = true; }}
                onTouchEnd={() => { stateRef.current.keys.s = false; }}
                className="brutal-press px-4 py-2.5 bg-[#facc15] hover:bg-yellow-400 border-2 border-black text-black font-brutal text-xs font-black uppercase cursor-pointer select-none"
                title="Move Paddle Down"
              >
                ▼ DOWN
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Command Station */}
        <div className="relative z-10 w-full lg:w-[360px] flex flex-col gap-3 shrink-0">
          
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
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Reactive Paddle</span>
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
                <span className="text-[9px] font-mono font-bold text-black opacity-80">W/S vs Arrows</span>
              </button>
            </div>

            {/* Target Score Selector */}
            <div className="border-t-2 border-black pt-2 space-y-1.5">
              <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                Target Score to Win:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 7, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => setTargetScore(score)}
                    className={`py-1 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer ${
                      targetScore === score ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    {score} POINTS
                  </button>
                ))}
              </div>
            </div>

            {/* AI Difficulty Selector */}
            {gameMode === 'ai' && (
              <div className="border-t-2 border-black pt-2 space-y-1.5">
                <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                  AI Reflex Speed:
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
              onClick={restartMatch}
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
                  🏓
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Cyber Pong Controls
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
                  1. Player 1 Controls (Emerald Paddle)
                </strong>
                Press <strong>W</strong> to move UP, <strong>S</strong> to move DOWN.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Player 2 Controls (Yellow Paddle)
                </strong>
                In 1v1 Local mode, press <strong>UP ARROW</strong> and <strong>DOWN ARROW</strong>.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Deflection Spin
                </strong>
                Hitting the ball with the outer edges of your paddle deflects the ball at sharp angles to outwit your opponent!
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

