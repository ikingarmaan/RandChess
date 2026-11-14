import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Flame,
  Wifi,
  Target,
  Crosshair,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Shield,
  Palette
} from 'lucide-react';
import { TimerSelector } from './TimerSelector';
import { OnlineLobbyModal } from './OnlineLobbyModal';
import { sound } from '../utils/sound';

// Table dimensions and geometry (2:1 classic tournament ratio)
const TABLE_WIDTH = 920;
const TABLE_HEIGHT = 480;
const RAIL_SIZE = 42;
const BALL_RADIUS = 12.5;

// Playing area felt bounds
const FELT_LEFT = RAIL_SIZE;
const FELT_RIGHT = TABLE_WIDTH - RAIL_SIZE;
const FELT_TOP = RAIL_SIZE;
const FELT_BOTTOM = TABLE_HEIGHT - RAIL_SIZE;

// 6 Table Pockets (4 Corners, 2 Side Pockets)
const POCKETS = [
  { id: 'tl', x: FELT_LEFT + 2, y: FELT_TOP + 2, radius: 24, isCorner: true },
  { id: 'tm', x: TABLE_WIDTH / 2, y: FELT_TOP - 4, radius: 21, isCorner: false },
  { id: 'tr', x: FELT_RIGHT - 2, y: FELT_TOP + 2, radius: 24, isCorner: true },
  { id: 'bl', x: FELT_LEFT + 2, y: FELT_BOTTOM - 2, radius: 24, isCorner: true },
  { id: 'bm', x: TABLE_WIDTH / 2, y: FELT_BOTTOM + 4, radius: 21, isCorner: false },
  { id: 'br', x: FELT_RIGHT - 2, y: FELT_BOTTOM - 2, radius: 24, isCorner: true }
];

// Color palette for 8-ball pool (Zero Blue Neo-Brutalism)
const BALL_CONFIGS = [
  // 0: Cue Ball
  { num: 0, type: 'cue', color: '#ffffff', textColor: '#000000', label: 'CUE' },
  // Solids (1 - 7)
  { num: 1, type: 'solid', color: '#facc15', textColor: '#000000', label: '1' },
  { num: 2, type: 'solid', color: '#4338ca', textColor: '#ffffff', label: '2' },
  { num: 3, type: 'solid', color: '#ef4444', textColor: '#ffffff', label: '3' },
  { num: 4, type: 'solid', color: '#7e22ce', textColor: '#ffffff', label: '4' },
  { num: 5, type: 'solid', color: '#f97316', textColor: '#ffffff', label: '5' },
  { num: 6, type: 'solid', color: '#22c55e', textColor: '#000000', label: '6' },
  { num: 7, type: 'solid', color: '#831843', textColor: '#ffffff', label: '7' },
  // 8: 8-Ball
  { num: 8, type: 'eight', color: '#000000', textColor: '#ffffff', label: '8' },
  // Stripes (9 - 15)
  { num: 9, type: 'stripe', color: '#facc15', textColor: '#000000', label: '9' },
  { num: 10, type: 'stripe', color: '#4338ca', textColor: '#ffffff', label: '10' },
  { num: 11, type: 'stripe', color: '#ef4444', textColor: '#ffffff', label: '11' },
  { num: 12, type: 'stripe', color: '#7e22ce', textColor: '#ffffff', label: '12' },
  { num: 13, type: 'stripe', color: '#f97316', textColor: '#ffffff', label: '13' },
  { num: 14, type: 'stripe', color: '#22c55e', textColor: '#000000', label: '14' },
  { num: 15, type: 'stripe', color: '#831843', textColor: '#ffffff', label: '15' }
];

export const FELT_THEMES = {
  emerald: {
    id: 'emerald',
    name: 'Neo-Emerald',
    felt: '#15803d',
    feltDark: '#166534',
    clothPattern: '#14532d',
    rail: '#18181b',
    railEdge: '#27272a'
  },
  ruby: {
    id: 'ruby',
    name: 'Crimson Velvet',
    felt: '#991b1b',
    feltDark: '#7f1d1d',
    clothPattern: '#450a0a',
    rail: '#18181b',
    railEdge: '#27272a'
  },
  slate: {
    id: 'slate',
    name: 'Midnight Slate',
    felt: '#1e293b',
    feltDark: '#0f172a',
    clothPattern: '#020617',
    rail: '#09090b',
    railEdge: '#18181b'
  },
  amber: {
    id: 'amber',
    name: 'Hazard Amber',
    felt: '#b45309',
    feltDark: '#92400e',
    clothPattern: '#78350f',
    rail: '#18181b',
    railEdge: '#27272a'
  }
};

// Standard 8-Ball Triangle Rack Setup
function createInitialBalls() {
  const balls = [];
  const r = BALL_RADIUS;

  // 1. Cue Ball placed behind headstring line
  balls.push({
    num: 0,
    type: 'cue',
    x: 230,
    y: TABLE_HEIGHT / 2,
    vx: 0,
    vy: 0,
    pocketed: false,
    scale: 1
  });

  // Triangle Rack positioning at foot spot
  const apexX = 660;
  const apexY = TABLE_HEIGHT / 2;
  const dx = r * Math.sqrt(3) + 0.6;
  const dy = r + 0.4;

  // 15-ball pattern according to standard 8-ball rules:
  // Row 1: 1 ball (Apex)
  // Row 2: 2 balls
  // Row 3: 3 balls (8-ball in center!)
  // Row 4: 4 balls
  // Row 5: 5 balls (Solid and Stripe on bottom opposite corners)
  const pattern = [
    [1],
    [9, 2],
    [3, 8, 10],
    [11, 4, 12, 5],
    [6, 13, 7, 14, 15]
  ];

  pattern.forEach((row, rowIdx) => {
    const startY = apexY - (row.length - 1) * dy;
    const rowX = apexX + rowIdx * dx;
    row.forEach((ballNum, colIdx) => {
      const cfg = BALL_CONFIGS[ballNum];
      balls.push({
        num: ballNum,
        type: cfg.type,
        x: rowX,
        y: startY + colIdx * (dy * 2),
        vx: 0,
        vy: 0,
        pocketed: false,
        scale: 1
      });
    });
  });

  return balls;
}

export const PoolGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue,
  socket = null,
  socketConnected = false,
  playerId = 'usr_guest'
}) => {
  // Game Setup State
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play' | 'online'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [feltTheme, setFeltTheme] = useState('emerald'); // 'emerald' | 'ruby' | 'slate' | 'amber'
  const [timeControl, setTimeControl] = useState(30); // 30s per shot default
  const [timer, setTimer] = useState(30);

  // Match State
  const [balls, setBalls] = useState(createInitialBalls);
  const [currentPlayer, setCurrentPlayer] = useState('p1'); // 'p1' | 'p2'
  const [playerGroups, setPlayerGroups] = useState({ p1: null, p2: null }); // 'solid' | 'stripe' | null (Open)
  const [isBreakShot, setIsBreakShot] = useState(true);
  const [isBallInHand, setIsBallInHand] = useState(false);
  const [isAiming, setIsAiming] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // 'p1' | 'p2' | null
  const [winReason, setWinReason] = useState('');
  const [statusMessage, setStatusMessage] = useState('BREAK SHOT — AIM & STRIKE CUE BALL');
  const [showRules, setShowRules] = useState(false);

  // Cue Stick Aim & Power
  const [aimAngle, setAimAngle] = useState(0); // in radians
  const [power, setPower] = useState(55); // 10 to 100 %
  const [isDraggingCue, setIsDraggingCue] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Online Multiplayer State
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState(null);
  const [onlineRole, setOnlineRole] = useState('p1'); // 'p1' or 'p2'
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState('');

  const canvasRef = useRef(null);
  const ballsRef = useRef(balls);
  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  const animationFrameRef = useRef(null);
  const shotEventsRef = useRef({ firstHit: null, pocketed: [], cueScratched: false });
  const turnTimerRef = useRef(null);

  // Sound effects wrapper
  const playSound = useCallback((fn, ...args) => {
    if (soundEnabled && sound[fn]) {
      try {
        sound[fn](...args);
      } catch (e) {}
    }
  }, [soundEnabled]);

  // Turn Countdown Timer
  useEffect(() => {
    if (gameOver || timeControl === null || isMoving || gameMode === 'online') {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      return;
    }

    turnTimerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Timeout = Foul! Give opponent ball in hand
          playSound('playFoul');
          setStatusMessage(`TIMEOUT FOUL! ${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} ran out of time!`);
          setIsBallInHand(true);
          setCurrentPlayer((p) => (p === 'p1' ? 'p2' : 'p1'));
          return timeControl;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(turnTimerRef.current);
  }, [gameOver, timeControl, isMoving, currentPlayer, gameMode, playSound]);

  // Reset / Re-rack game
  const resetGame = useCallback(() => {
    const freshBalls = createInitialBalls();
    setBalls(freshBalls);
    ballsRef.current = freshBalls;
    setCurrentPlayer('p1');
    setPlayerGroups({ p1: null, p2: null });
    setIsBreakShot(true);
    setIsBallInHand(false);
    setIsAiming(true);
    setIsMoving(false);
    setGameOver(false);
    setWinner(null);
    setWinReason('');
    setStatusMessage('BREAK SHOT — AIM & STRIKE CUE BALL');
    setAimAngle(0);
    setPower(55);
    setTimer(timeControl || 30);
    playSound('playMove');
  }, [timeControl, playSound]);

  // Calculate Ghost Ball & Collision Raycast for Laser Trajectory Guide
  const trajectoryGuide = useMemo(() => {
    const cueBall = balls.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall || isMoving) return null;

    const cos = Math.cos(aimAngle);
    const sin = Math.sin(aimAngle);

    // Raycast step along aiming vector
    let closestDist = Infinity;
    let targetBall = null;
    let collisionX = cueBall.x + cos * 600;
    let collisionY = cueBall.y + sin * 600;

    // Check collision against all other non-pocketed balls
    balls.forEach((b) => {
      if (b.num === 0 || b.pocketed) return;
      const vX = b.x - cueBall.x;
      const vY = b.y - cueBall.y;
      const proj = vX * cos + vY * sin;
      if (proj <= 0) return; // Behind cue ball

      const perpSq = vX * vX + vY * vY - proj * proj;
      const radiusSum = BALL_RADIUS * 2;
      if (perpSq <= radiusSum * radiusSum) {
        const d = proj - Math.sqrt(radiusSum * radiusSum - perpSq);
        if (d > 0 && d < closestDist) {
          closestDist = d;
          targetBall = b;
          collisionX = cueBall.x + cos * d;
          collisionY = cueBall.y + sin * d;
        }
      }
    });

    let targetAngle = null;
    let cueDeflectionAngle = null;
    if (targetBall) {
      // Normal vector from ghost ball to target ball
      targetAngle = Math.atan2(targetBall.y - collisionY, targetBall.x - collisionX);
      // Cue ball deflects perpendicular to normal
      const normalAngle = targetAngle;
      cueDeflectionAngle = aimAngle > normalAngle ? normalAngle - Math.PI / 2 : normalAngle + Math.PI / 2;
    }

    return {
      startX: cueBall.x,
      startY: cueBall.y,
      endX: collisionX,
      endY: collisionY,
      hasTarget: Boolean(targetBall),
      targetBall,
      targetAngle,
      cueDeflectionAngle
    };
  }, [balls, aimAngle, isMoving]);

  // Execute a Strike
  const strikeCueBall = useCallback((strikeAngle, strikePower, isRemote = false) => {
    const currentBalls = ballsRef.current;
    const cueBall = currentBalls.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall || isMoving) return;

    // Reset shot telemetry events
    shotEventsRef.current = { firstHit: null, pocketed: [], cueScratched: false };

    // Impulse magnitude
    const speed = (strikePower / 100) * 28 + 2;
    cueBall.vx = Math.cos(strikeAngle) * speed;
    cueBall.vy = Math.sin(strikeAngle) * speed;

    setIsMoving(true);
    setIsAiming(false);
    setIsBallInHand(false);
    playSound('playCueStrike', strikePower / 100);

    // Online emit
    if (gameMode === 'online' && socket && onlineRoomCode && !isRemote) {
      socket.emit('pool_shot', {
        roomId: onlineRoomCode,
        shot: {
          angle: strikeAngle,
          power: strikePower,
          cueBallPos: { x: cueBall.x, y: cueBall.y }
        }
      });
    }
  }, [isMoving, gameMode, socket, onlineRoomCode, playSound]);

  // Turn Evaluation when all balls come to a complete rest
  const handleShotFinished = useCallback(() => {
    setIsMoving(false);
    setIsAiming(true);
    const events = shotEventsRef.current;
    const currentBalls = ballsRef.current;
    const cueBall = currentBalls.find((b) => b.num === 0);

    const pocketedThisShot = events.pocketed;
    const eightSunk = pocketedThisShot.some((b) => b.num === 8);
    const cueSunk = events.cueScratched;

    const p1Group = playerGroups.p1;
    const p2Group = playerGroups.p2;
    const myGroup = currentPlayer === 'p1' ? p1Group : p2Group;
    const opponent = currentPlayer === 'p1' ? 'p2' : 'p1';

    // Count remaining balls for my group
    const remainingMyBalls = myGroup
      ? currentBalls.filter((b) => b.type === myGroup && !b.pocketed).length
      : 7;

    // 1. Eight-ball Sunk Evaluation
    if (eightSunk) {
      if (cueSunk || remainingMyBalls > 0 || isBreakShot) {
        // Premature 8-ball or Scratch on 8-ball = LOSS!
        setGameOver(true);
        setWinner(opponent);
        setWinReason(`${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} sunk the 8-Ball prematurely / scratched!`);
        playSound('playGameOver');
        return;
      } else {
        // Legal 8-ball win!
        setGameOver(true);
        setWinner(currentPlayer);
        setWinReason(`${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} legally pocketed the 8-Ball!`);
        playSound('playGameOver');
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#ffffff', '#facc15', '#f97316']
        });
        return;
      }
    }

    // 2. Scratch on Cue Ball
    if (cueSunk) {
      playSound('playFoul');
      setStatusMessage(`SCRATCH FOUL! Cue ball pocketed. ${opponent === 'p1' ? 'Player 1' : 'Player 2'} gets Ball in Hand!`);
      // Respawn cue ball behind headstring
      cueBall.x = 230;
      cueBall.y = TABLE_HEIGHT / 2;
      cueBall.vx = 0;
      cueBall.vy = 0;
      cueBall.pocketed = false;
      cueBall.scale = 1;

      setIsBallInHand(true);
      setCurrentPlayer(opponent);
      setTimer(timeControl || 30);
      setIsBreakShot(false);
      return;
    }

    // 3. Check Legal Contact
    let isFoul = false;
    let foulMsg = '';
    if (!events.firstHit) {
      isFoul = true;
      foulMsg = 'FOUL: Cue ball made no contact with any ball!';
    } else if (myGroup && events.firstHit.type !== myGroup) {
      if (remainingMyBalls > 0) {
        isFoul = true;
        foulMsg = `FOUL: Struck ${events.firstHit.type.toUpperCase()} ball first instead of your assigned ${myGroup.toUpperCase()}!`;
      } else if (events.firstHit.num !== 8) {
        isFoul = true;
        foulMsg = 'FOUL: Must strike the 8-Ball first once your group is cleared!';
      }
    }

    if (isFoul) {
      playSound('playFoul');
      setStatusMessage(`${foulMsg} ${opponent === 'p1' ? 'Player 1' : 'Player 2'} gets Ball in Hand.`);
      setIsBallInHand(true);
      setCurrentPlayer(opponent);
      setTimer(timeControl || 30);
      setIsBreakShot(false);
      return;
    }

    // 4. Open Table Group Assignment (Non-break shot)
    if (!p1Group && !isBreakShot && pocketedThisShot.length > 0) {
      const firstValid = pocketedThisShot.find((b) => b.type === 'solid' || b.type === 'stripe');
      if (firstValid) {
        const assigned = firstValid.type;
        const otherGroup = assigned === 'solid' ? 'stripe' : 'solid';
        const newGroups = currentPlayer === 'p1'
          ? { p1: assigned, p2: otherGroup }
          : { p1: otherGroup, p2: assigned };
        setPlayerGroups(newGroups);
        setStatusMessage(`TABLE ASSIGNED: ${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} is ${assigned.toUpperCase()}S!`);
      }
    }

    // 5. Turn Continuation
    const currentMyGroup = currentPlayer === 'p1'
      ? (playerGroups.p1 || (pocketedThisShot[0]?.type !== 'eight' ? pocketedThisShot[0]?.type : null))
      : (playerGroups.p2 || (pocketedThisShot[0]?.type !== 'eight' ? pocketedThisShot[0]?.type : null));

    const sunkLegalBall = pocketedThisShot.some((b) => {
      if (!currentMyGroup) return b.type === 'solid' || b.type === 'stripe';
      return b.type === currentMyGroup;
    });

    if (sunkLegalBall && !isFoul) {
      // Continue turn
      setStatusMessage(`${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} pocketed a ball — TAKE ANOTHER SHOT!`);
      setTimer(timeControl || 30);
    } else {
      // Switch turn
      setCurrentPlayer(opponent);
      setTimer(timeControl || 30);
      setStatusMessage(`${opponent === 'p1' ? 'Player 1' : 'Player 2'}'s turn to shoot.`);
    }

    setIsBreakShot(false);
  }, [currentPlayer, playerGroups, isBreakShot, timeControl, playSound]);

  // Main 60 FPS Physics Simulation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const updatePhysics = (now) => {
      const dt = Math.min(32, now - lastTime) / 1000;
      lastTime = now;

      const currentBalls = ballsRef.current;
      const SUB_STEPS = 8;
      const subDt = dt / SUB_STEPS;
      const friction = Math.pow(0.984, dt * 60);

      let anyBallMoving = false;

      for (let step = 0; step < SUB_STEPS; step++) {
        // 1. Move balls & apply friction
        for (let i = 0; i < currentBalls.length; i++) {
          const b = currentBalls[i];
          if (b.pocketed) continue;

          b.x += b.vx * subDt * 60;
          b.y += b.vy * subDt * 60;

          b.vx *= friction;
          b.vy *= friction;

          const speedSq = b.vx * b.vx + b.vy * b.vy;
          if (speedSq < 0.04) {
            b.vx = 0;
            b.vy = 0;
          } else {
            anyBallMoving = true;
          }

          // 2. Pocket capture suction
          for (const p of POCKETS) {
            const pDist = Math.hypot(b.x - p.x, b.y - p.y);
            if (pDist < p.radius) {
              // Pocketed!
              b.pocketed = true;
              b.vx = 0;
              b.vy = 0;
              playSound('playPocketDrop');
              if (b.num === 0) {
                shotEventsRef.current.cueScratched = true;
              } else {
                shotEventsRef.current.pocketed.push(b);
              }
              break;
            }
          }

          if (b.pocketed) continue;

          // 3. Rail / Cushion Bounces
          const r = BALL_RADIUS;
          const bounceDamping = 0.88;

          // Top rail
          if (b.y - r < FELT_TOP && Math.abs(b.x - TABLE_WIDTH / 2) > 28) {
            b.y = FELT_TOP + r;
            b.vy = Math.abs(b.vy) * bounceDamping;
            playSound('playCushionBounce', Math.abs(b.vy) / 15);
          }
          // Bottom rail
          if (b.y + r > FELT_BOTTOM && Math.abs(b.x - TABLE_WIDTH / 2) > 28) {
            b.y = FELT_BOTTOM - r;
            b.vy = -Math.abs(b.vy) * bounceDamping;
            playSound('playCushionBounce', Math.abs(b.vy) / 15);
          }
          // Left rail
          if (b.x - r < FELT_LEFT && (b.y > FELT_TOP + 28 && b.y < FELT_BOTTOM - 28)) {
            b.x = FELT_LEFT + r;
            b.vx = Math.abs(b.vx) * bounceDamping;
            playSound('playCushionBounce', Math.abs(b.vx) / 15);
          }
          // Right rail
          if (b.x + r > FELT_RIGHT && (b.y > FELT_TOP + 28 && b.y < FELT_BOTTOM - 28)) {
            b.x = FELT_RIGHT - r;
            b.vx = -Math.abs(b.vx) * bounceDamping;
            playSound('playCushionBounce', Math.abs(b.vx) / 15);
          }
        }

        // 4. Ball-to-Ball Elastic Collisions
        for (let i = 0; i < currentBalls.length; i++) {
          const b1 = currentBalls[i];
          if (b1.pocketed) continue;

          for (let j = i + 1; j < currentBalls.length; j++) {
            const b2 = currentBalls[j];
            if (b2.pocketed) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = BALL_RADIUS * 2;

            if (dist < minDist && dist > 0.001) {
              // Separate balls to prevent overlap
              const overlap = (minDist - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;

              b1.x -= nx * overlap;
              b1.y -= ny * overlap;
              b2.x += nx * overlap;
              b2.y += ny * overlap;

              // Record first contact of cue ball
              if ((b1.num === 0 || b2.num === 0) && !shotEventsRef.current.firstHit) {
                const target = b1.num === 0 ? b2 : b1;
                shotEventsRef.current.firstHit = target;
              }

              // Normal & tangent components
              const kx = b1.vx - b2.vx;
              const ky = b1.vy - b2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2; // Equal masses

              b1.vx -= p * nx * 0.98;
              b1.vy -= p * ny * 0.98;
              b2.vx += p * nx * 0.98;
              b2.vy += p * ny * 0.98;

              const relSpeed = Math.hypot(kx, ky);
              if (relSpeed > 0.8) {
                playSound('playBallHit', relSpeed / 20);
              }
            }
          }
        }
      }

      // Check if physics finished
      if (isMoving && !anyBallMoving) {
        handleShotFinished();
      }

      // Render Canvas Scene
      renderCanvas();
      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMoving, handleShotFinished, playSound]);

  // Canvas Drawing
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theme = FELT_THEMES[feltTheme] || FELT_THEMES.emerald;

    // Clear
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // 1. Table Rails & Wood Outer Border
    ctx.fillStyle = theme.rail;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Inner Rail Cushion Bevel
    ctx.fillStyle = theme.railEdge;
    ctx.fillRect(RAIL_SIZE - 6, RAIL_SIZE - 6, TABLE_WIDTH - (RAIL_SIZE - 6) * 2, TABLE_HEIGHT - (RAIL_SIZE - 6) * 2);

    // Diamond Sights on Wood Rails
    ctx.fillStyle = '#facc15';
    const sightsX = [TABLE_WIDTH * 0.25, TABLE_WIDTH * 0.5, TABLE_WIDTH * 0.75];
    const sightsY = [TABLE_HEIGHT * 0.33, TABLE_HEIGHT * 0.66];
    sightsX.forEach((x) => {
      ctx.fillRect(x - 2.5, 12, 5, 5);
      ctx.fillRect(x - 2.5, TABLE_HEIGHT - 17, 5, 5);
    });
    sightsY.forEach((y) => {
      ctx.fillRect(12, y - 2.5, 5, 5);
      ctx.fillRect(TABLE_WIDTH - 17, y - 2.5, 5, 5);
    });

    // 2. Felt Cloth Surface
    ctx.fillStyle = theme.felt;
    ctx.fillRect(FELT_LEFT, FELT_TOP, FELT_RIGHT - FELT_LEFT, FELT_BOTTOM - FELT_TOP);

    // Subtle cloth texture shadow
    ctx.fillStyle = theme.feltDark;
    ctx.fillRect(FELT_LEFT, FELT_TOP, FELT_RIGHT - FELT_LEFT, 6);
    ctx.fillRect(FELT_LEFT, FELT_TOP, 6, FELT_BOTTOM - FELT_TOP);

    // Headstring line & Foot spot marker
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(230, FELT_TOP);
    ctx.lineTo(230, FELT_BOTTOM);
    ctx.stroke();

    // Foot spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(660, TABLE_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. 6 Pockets (Cast shadow & metal rim)
    POCKETS.forEach((p) => {
      // Outer drop shadow
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
      ctx.fill();

      // Deep Leather Pocket Interior
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Metal rim accent
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 4. Laser Aiming Trajectory Guide (when aiming cue ball)
    const cueBall = ballsRef.current.find((b) => b.num === 0 && !b.pocketed);
    if (cueBall && isAiming && !isMoving && trajectoryGuide) {
      const { startX, startY, endX, endY, hasTarget, targetBall, targetAngle, cueDeflectionAngle } = trajectoryGuide;

      // Primary Aim Line (High-contrast Dashed Laser)
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Ghost Cue Ball at Impact Point
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(endX, endY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // If target ball hit, project target deflection & cue deflection
      if (hasTarget && targetBall) {
        // Target ball trajectory
        const tLen = 140;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(targetBall.x, targetBall.y);
        ctx.lineTo(targetBall.x + Math.cos(targetAngle) * tLen, targetBall.y + Math.sin(targetAngle) * tLen);
        ctx.stroke();

        // Target ball impact indicator
        ctx.setLineDash([]);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(targetBall.x + Math.cos(targetAngle) * tLen, targetBall.y + Math.sin(targetAngle) * tLen, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 5. Render Cue Stick
      const cueDist = 20 + (power / 100) * 45; // Pull back distance
      const stickLength = 320;
      const cueAngle = aimAngle + Math.PI; // Cue points backwards from aim
      const cueStartX = cueBall.x + Math.cos(cueAngle) * (BALL_RADIUS + cueDist);
      const cueStartY = cueBall.y + Math.sin(cueAngle) * (BALL_RADIUS + cueDist);
      const cueEndX = cueBall.x + Math.cos(cueAngle) * (BALL_RADIUS + cueDist + stickLength);
      const cueEndY = cueBall.y + Math.sin(cueAngle) * (BALL_RADIUS + cueDist + stickLength);

      ctx.save();
      // Cue stick shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cueStartX + 3, cueStartY + 3);
      ctx.lineTo(cueEndX + 3, cueEndY + 3);
      ctx.stroke();

      // Cue stick body (Maple wood gradient)
      const grad = ctx.createLinearGradient(cueStartX, cueStartY, cueEndX, cueEndY);
      grad.addColorStop(0, '#fef08a'); // Chalk tip ivory
      grad.addColorStop(0.15, '#d97706'); // Front maple
      grad.addColorStop(0.7, '#78350f'); // Dark wood
      grad.addColorStop(1, '#000000'); // Heavy butt wrap

      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cueStartX, cueStartY);
      ctx.lineTo(cueEndX, cueEndY);
      ctx.stroke();

      // Blue chalk tip
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cueStartX, cueStartY);
      ctx.lineTo(cueStartX + Math.cos(cueAngle) * 5, cueStartY + Math.sin(cueAngle) * 5);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Draw All 16 Billiard Balls
    const currentBalls = ballsRef.current;
    currentBalls.forEach((b) => {
      if (b.pocketed) return;

      const r = BALL_RADIUS * (b.scale || 1);
      const cfg = BALL_CONFIGS[b.num];

      ctx.save();

      // Ball Drop Shadow on Felt
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(b.x + 2, b.y + 2, r, 0, Math.PI * 2);
      ctx.fill();

      // Ball Base Outer Sphere
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);

      if (b.type === 'cue') {
        // Cue ball: pure white with glossy sheen & red spot
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'solid' || b.type === 'eight') {
        // Solid or 8-ball: solid color fill
        ctx.fillStyle = cfg.color;
        ctx.fill();

        // White center circle for number
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // Number text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.num), b.x, b.y + 0.5);
      } else if (b.type === 'stripe') {
        // Stripe ball: white base with wide center colored stripe
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.fillStyle = cfg.color;
        ctx.fillRect(b.x - r * 0.85, b.y - r * 0.5, r * 1.7, r);

        // White center badge
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // Number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.num), b.x, b.y + 0.5);
      }

      // High-Gloss Specular Reflection Dot (Makes them look 3D sphere)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(b.x - r * 0.35, b.y - r * 0.35, r * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Outer crisp black outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    });

    // 7. Ball-in-Hand Placement Ring
    if (isBallInHand && cueBall) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cueBall.x, cueBall.y, BALL_RADIUS + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [feltTheme, aimAngle, power, isAiming, isMoving, isBallInHand, trajectoryGuide]);

  // Pointer & Touch Controls on Table Canvas
  const handlePointerDown = (e) => {
    if (isMoving || gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'p2') return; // Bot turn
    if (gameMode === 'online' && onlineRole !== currentPlayer) return; // Opponent turn

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * TABLE_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * TABLE_HEIGHT;

    const cueBall = ballsRef.current.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall) return;

    if (isBallInHand) {
      // Place cue ball anywhere on valid felt
      const clampedX = Math.max(FELT_LEFT + BALL_RADIUS, Math.min(FELT_RIGHT - BALL_RADIUS, x));
      const clampedY = Math.max(FELT_TOP + BALL_RADIUS, Math.min(FELT_BOTTOM - BALL_RADIUS, y));
      cueBall.x = clampedX;
      cueBall.y = clampedY;
      setBalls([...ballsRef.current]);
      setIsBallInHand(false);
      playSound('playMove');
      return;
    }

    // Otherwise calculate aiming angle
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    setAimAngle(angle);
    setIsDraggingCue(true);
  };

  const handlePointerMove = (e) => {
    if (isMoving || !isDraggingCue) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * TABLE_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * TABLE_HEIGHT;

    const cueBall = ballsRef.current.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall) return;

    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    setAimAngle(angle);
  };

  const handlePointerUp = () => {
    setIsDraggingCue(false);
  };

  // Autonomous Smart AI Bot Turn
  useEffect(() => {
    if (gameMode !== 'ai' || currentPlayer !== 'p2' || isMoving || gameOver) {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);
    const botTimer = setTimeout(() => {
      try {
        const currentBalls = ballsRef.current;
        const cueBall = currentBalls.find((b) => b.num === 0 && !b.pocketed);
        if (!cueBall) return;

        const myGroup = playerGroups.p2;
        // Legal targets for bot
        let candidates = currentBalls.filter((b) => !b.pocketed && b.num !== 0);
        if (myGroup) {
          const myRemaining = candidates.filter((b) => b.type === myGroup);
          candidates = myRemaining.length > 0 ? myRemaining : candidates.filter((b) => b.num === 8);
        } else {
          // Open table: any ball except 8
          candidates = candidates.filter((b) => b.num !== 8);
        }

        if (candidates.length === 0) candidates = currentBalls.filter((b) => b.num === 8 && !b.pocketed);
        if (candidates.length === 0) return;

        // Pick best pocket for each target ball based on angle and distance
        let bestTarget = candidates[0];
        let bestAngle = 0;
        let bestScore = -Infinity;

        candidates.forEach((tb) => {
          POCKETS.forEach((p) => {
            const tToPx = p.x - tb.x;
            const tToPy = p.y - tb.y;
            const pocketDist = Math.hypot(tToPx, tToPy);
            const pocketAngle = Math.atan2(tToPy, tToPx);

            // Ghost ball position behind target ball
            const ghostX = tb.x - Math.cos(pocketAngle) * BALL_RADIUS * 2;
            const ghostY = tb.y - Math.sin(pocketAngle) * BALL_RADIUS * 2;

            const cueToGhostX = ghostX - cueBall.x;
            const cueToGhostY = ghostY - cueBall.y;
            const cueDist = Math.hypot(cueToGhostX, cueToGhostY);
            const shotAngle = Math.atan2(cueToGhostY, cueToGhostX);

            // Cut angle alignment between cue-ghost and target-pocket
            const cutAlignment = Math.cos(shotAngle - pocketAngle);

            // Difficulty heuristic weighting
            const score = cutAlignment * 100 - (pocketDist + cueDist) * 0.1;
            if (score > bestScore) {
              bestScore = score;
              bestTarget = tb;
              bestAngle = shotAngle;
            }
          });
        });

        // Add difficulty variance
        let noise = 0;
        let shotPwr = 60;
        if (difficulty === 'easy') {
          noise = (Math.random() - 0.5) * 0.12; // ±3.5 degrees
          shotPwr = 40 + Math.random() * 30;
        } else if (difficulty === 'medium') {
          noise = (Math.random() - 0.5) * 0.035; // ±1 degree
          shotPwr = 55 + Math.random() * 20;
        } else {
          // Hustler master bot: laser accurate!
          noise = 0;
          shotPwr = 68;
        }

        const finalAngle = bestAngle + noise;
        setAimAngle(finalAngle);
        setPower(Math.round(shotPwr));

        setTimeout(() => {
          strikeCueBall(finalAngle, shotPwr);
        }, 500);
      } catch (err) {
        console.error('Bot shot error:', err);
      } finally {
        setIsBotThinking(false);
      }
    }, 1100);

    return () => clearTimeout(botTimer);
  }, [gameMode, currentPlayer, isMoving, gameOver, difficulty, playerGroups, strikeCueBall]);

  // Online Multiplayer Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleOpponentShot = ({ shot }) => {
      if (shot) {
        setAimAngle(shot.angle);
        setPower(shot.power);
        strikeCueBall(shot.angle, shot.power, true);
      }
    };

    const handlePoolGameStarted = ({ roomId, p1, p1Id, p2, p2Id, timeControl: tc }) => {
      setOnlineRoomCode(roomId);
      setIsOnlineModalOpen(false);
      setIsSearchingQuickMatch(false);
      setGameMode('online');
      const myRole = (playerId === p1Id || socket.id === p1) ? 'p1' : 'p2';
      setOnlineRole(myRole);
      resetGame();
      if (tc) setTimeControl(tc);
      setStatusMessage(`ONLINE MATCH STARTED! You are ${myRole === 'p1' ? 'PLAYER 1 (BREAK)' : 'PLAYER 2'}.`);
      playSound('playMove');
    };

    const handleOpponentDisconnected = () => {
      setGameOver(true);
      setWinner(onlineRole);
      setWinReason('Opponent disconnected from pool room. You win by forfeit!');
      playSound('playGameOver');
    };

    socket.on('pool_opponent_shot', handleOpponentShot);
    socket.on('pool_game_started', handlePoolGameStarted);
    socket.on('pool_opponent_disconnected', handleOpponentDisconnected);

    return () => {
      socket.off('pool_opponent_shot', handleOpponentShot);
      socket.off('pool_game_started', handlePoolGameStarted);
      socket.off('pool_opponent_disconnected', handleOpponentDisconnected);
    };
  }, [socket, onlineRole, resetGame, strikeCueBall, playSound, playerId]);

  // Player Groups Progress Tracking
  const p1BallsRemaining = useMemo(() => {
    if (!playerGroups.p1) return 7;
    return balls.filter((b) => b.type === playerGroups.p1 && !b.pocketed).length;
  }, [balls, playerGroups.p1]);

  const p2BallsRemaining = useMemo(() => {
    if (!playerGroups.p2) return 7;
    return balls.filter((b) => b.type === playerGroups.p2 && !b.pocketed).length;
  }, [balls, playerGroups.p2]);

  return (
    <div className={`w-full flex-1 flex flex-col items-center select-none pb-8 ${isDarkTheme ? 'text-white' : 'text-black'}`}>
      
      {/* Top Station Command Bar */}
      <div className="w-full max-w-7xl px-2 sm:px-4 pt-2 sm:pt-4 pb-2 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black mb-3">
        {/* Left: Back to catalogue & Game Title */}
        <div className="flex items-center gap-2">
          {onOpenCatalogue && (
            <button
              onClick={onOpenCatalogue}
              className="brutal-press flex items-center gap-1.5 px-3 py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
              title="Return to Game Catalogue Hub"
            >
              <Gamepad2 className="w-4 h-4 text-black" />
              <span>ALL GAMES</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-1">
            <span className="font-brutal text-base sm:text-lg font-black uppercase tracking-tight">
              CYBER 8-BALL POOL
            </span>
            <span className="bg-black text-[#22c55e] px-1.5 py-0.5 border border-black font-mono text-[10px] font-black uppercase hidden sm:inline">
              PHYSICS v2.0
            </span>
          </div>
        </div>

        {/* Center: Mode Quick Select */}
        <div className="flex items-center gap-1 border-2 border-black bg-black p-0.5">
          <button
            onClick={() => {
              setGameMode('ai');
              resetGame();
            }}
            className={`px-2.5 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
              gameMode === 'ai' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
            }`}
          >
            vs BOT AI
          </button>
          <button
            onClick={() => {
              setGameMode('pass_play');
              resetGame();
            }}
            className={`px-2.5 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
              gameMode === 'pass_play' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
            }`}
          >
            1v1 LOCAL
          </button>
          <button
            onClick={() => setIsOnlineModalOpen(true)}
            className={`px-2.5 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
              gameMode === 'online' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
            }`}
          >
            ONLINE PvP
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Rules Guide */}
          <button
            onClick={() => setShowRules(true)}
            className="brutal-press p-1.5 bg-white hover:bg-neutral-100 text-black border-2 border-black cursor-pointer brutal-shadow-sm"
            title="8-Ball Rules & Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Re-rack / Reset Table */}
          <button
            onClick={resetGame}
            className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
            title="Re-rack Table & Start New Match"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RE-RACK TABLE</span>
          </button>
        </div>
      </div>

      {/* Main Pool Arena Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-5 min-h-0">
        
        {/* Left Column: Player Status HUD + Pool Canvas + Cue Stick Controls */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[960px] shrink-0">
          
          {/* Top Scoreboard & Player HUD */}
          <div className="w-full bg-[#f4f4eb] text-black border-3 border-black p-2.5 brutal-shadow flex items-center justify-between gap-2 flex-wrap">
            {/* Player 1 HUD */}
            <div className={`p-2 border-2 border-black flex items-center gap-2.5 transition-all ${
              currentPlayer === 'p1' ? 'bg-[#22c55e] text-black brutal-shadow-sm font-black' : 'bg-white text-black opacity-85'
            }`}>
              <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-mono font-black text-xs">
                P1
              </div>
              <div>
                <div className="text-xs font-black font-brutal leading-tight">
                  {gameMode === 'online' ? (onlineRole === 'p1' ? 'YOU (P1)' : 'OPPONENT') : 'PLAYER 1'}
                </div>
                <div className="text-[10px] font-mono font-bold">
                  {playerGroups.p1 ? `${playerGroups.p1.toUpperCase()}S (${p1BallsRemaining} left)` : 'OPEN TABLE'}
                </div>
              </div>
            </div>

            {/* Turn Announcement & Status Center Badge */}
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 bg-black text-[#facc15] border border-black mb-0.5">
                {isMoving ? 'BALLS IN MOTION...' : isBotThinking ? 'BOT CALCULATING...' : `${currentPlayer === 'p1' ? 'PLAYER 1' : 'PLAYER 2'} TO SHOOT`}
              </span>
              <div className="font-mono text-xs font-bold text-center max-w-xs truncate">
                {statusMessage}
              </div>
            </div>

            {/* Player 2 / Bot HUD */}
            <div className={`p-2 border-2 border-black flex items-center gap-2.5 transition-all ${
              currentPlayer === 'p2' ? 'bg-[#22c55e] text-black brutal-shadow-sm font-black' : 'bg-white text-black opacity-85'
            }`}>
              <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-mono font-black text-xs">
                {gameMode === 'ai' ? 'BOT' : 'P2'}
              </div>
              <div>
                <div className="text-xs font-black font-brutal leading-tight">
                  {gameMode === 'ai'
                    ? `BOT (${difficulty.toUpperCase()})`
                    : gameMode === 'online'
                    ? (onlineRole === 'p2' ? 'YOU (P2)' : 'OPPONENT')
                    : 'PLAYER 2'}
                </div>
                <div className="text-[10px] font-mono font-bold">
                  {playerGroups.p2 ? `${playerGroups.p2.toUpperCase()}S (${p2BallsRemaining} left)` : 'OPEN TABLE'}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Pool Table Canvas */}
          <div className="relative w-full aspect-[920/480] max-w-[920px] border-4 border-black bg-black brutal-shadow-xl overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full block select-none"
              style={{ touchAction: 'none' }}
            />

            {/* Ball-in-Hand Floating Alert */}
            {isBallInHand && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#facc15] text-black font-brutal text-xs font-black uppercase px-3 py-1.5 border-2 border-black brutal-shadow-sm animate-pulse pointer-events-none">
                📍 BALL IN HAND — TAP / DRAG ANYWHERE TO PLACE CUE BALL
              </div>
            )}
          </div>

          {/* Bottom Cue Stick Control Station (Fine Aim, Power Slider, Fire Button) */}
          <div className="w-full bg-[#f4f4eb] text-black border-3 border-black p-3 brutal-shadow flex items-center justify-between gap-3 flex-wrap">
            {/* Fine Aim Micro Adjusters */}
            <div className="flex items-center gap-1.5 font-mono text-xs font-black">
              <span className="uppercase text-[11px] mr-1 hidden sm:inline">FINE AIM:</span>
              <button
                onClick={() => setAimAngle((a) => a - 0.015)}
                disabled={isMoving || isBotThinking}
                className="brutal-press px-2.5 py-1.5 bg-white hover:bg-neutral-100 disabled:opacity-40 border-2 border-black font-bold cursor-pointer"
                title="Micro-adjust aim left"
              >
                ◀ -0.5°
              </button>
              <button
                onClick={() => setAimAngle((a) => a + 0.015)}
                disabled={isMoving || isBotThinking}
                className="brutal-press px-2.5 py-1.5 bg-white hover:bg-neutral-100 disabled:opacity-40 border-2 border-black font-bold cursor-pointer"
                title="Micro-adjust aim right"
              >
                +0.5° ▶
              </button>
            </div>

            {/* Power Slider */}
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <span className="font-mono text-xs font-black uppercase shrink-0">
                POWER: {power}%
              </span>
              <input
                type="range"
                min="10"
                max="100"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
                disabled={isMoving || isBotThinking}
                className="w-full accent-[#22c55e] cursor-pointer"
              />
            </div>

            {/* FIRE / STRIKE BUTTON */}
            <button
              onClick={() => strikeCueBall(aimAngle, power)}
              disabled={isMoving || isBotThinking || (gameMode === 'ai' && currentPlayer === 'p2') || (gameMode === 'online' && onlineRole !== currentPlayer)}
              className="brutal-press px-5 py-2.5 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-2 shrink-0"
            >
              <Crosshair className="w-4 h-4 stroke-[2.5]" />
              <span>STRIKE CUE BALL ▶</span>
            </button>
          </div>
        </div>

        {/* Right Column: Tactical Ball Racks, Match Settings, Felt Palette */}
        <div className="relative z-10 w-full xl:w-[320px] flex flex-col gap-3 shrink-0">
          
          {/* 1. Ball Racks & Sunk Status */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3 brutal-shadow space-y-2.5">
            <span className="font-brutal text-xs font-black uppercase tracking-wide block border-b-2 border-black pb-1">
              8-BALL SUITE // RACK TELEMETRY
            </span>

            {/* Solids Rack (1-7) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono font-black mb-1">
                <span>SOLIDS (1 - 7):</span>
                <span>{balls.filter((b) => b.type === 'solid' && !b.pocketed).length} REMAINING</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const b = balls.find((ball) => ball.num === num);
                  const isSunk = b?.pocketed;
                  const cfg = BALL_CONFIGS[num];
                  return (
                    <div
                      key={num}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs border-2 border-black transition-all ${
                        isSunk ? 'opacity-20 line-through bg-neutral-300' : 'brutal-shadow-xs'
                      }`}
                      style={{ backgroundColor: isSunk ? '#d4d4d8' : cfg.color, color: cfg.textColor }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The 8-Ball */}
            <div className="border-t border-black/30 pt-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-black mb-1">
                <span>THE 8-BALL:</span>
                <span className={balls.find((b) => b.num === 8)?.pocketed ? 'text-red-600' : 'text-green-700'}>
                  {balls.find((b) => b.num === 8)?.pocketed ? 'POCKETED' : 'ON FELT (TARGET)'}
                </span>
              </div>
              <div
                className={`w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-mono font-black text-sm border-2 border-black ${
                  balls.find((b) => b.num === 8)?.pocketed ? 'opacity-20' : 'brutal-shadow-xs'
                }`}
              >
                8
              </div>
            </div>

            {/* Stripes Rack (9-15) */}
            <div className="border-t border-black/30 pt-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-black mb-1">
                <span>STRIPES (9 - 15):</span>
                <span>{balls.filter((b) => b.type === 'stripe' && !b.pocketed).length} REMAINING</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[9, 10, 11, 12, 13, 14, 15].map((num) => {
                  const b = balls.find((ball) => ball.num === num);
                  const isSunk = b?.pocketed;
                  const cfg = BALL_CONFIGS[num];
                  return (
                    <div
                      key={num}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-[10px] border-2 border-black transition-all bg-white ${
                        isSunk ? 'opacity-20 line-through' : 'brutal-shadow-xs'
                      }`}
                      style={{
                        borderTop: isSunk ? 'none' : `3px solid ${cfg.color}`,
                        borderBottom: isSunk ? 'none' : `3px solid ${cfg.color}`,
                        color: '#000'
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Match Settings (AI Difficulty & Felt Theme) */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3 brutal-shadow space-y-2.5">
            <span className="font-brutal text-xs font-black uppercase tracking-wide block border-b-2 border-black pb-1">
              BATTLE ARENA SETTINGS
            </span>

            {/* Bot Difficulty (when in vs Bot mode) */}
            {gameMode === 'ai' && (
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-black uppercase text-neutral-700">BOT DIFFICULTY:</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'easy', label: 'CADET', desc: '~800' },
                    { id: 'medium', label: 'SHARK', desc: '~1400' },
                    { id: 'hard', label: 'HUSTLER', desc: '~2000' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`p-1.5 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer flex flex-col items-center ${
                        difficulty === d.id ? 'bg-[#22c55e] text-black brutal-shadow-xs' : 'bg-white hover:bg-neutral-100 text-black'
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className="text-[8px] opacity-80">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Table Felt Themes */}
            <div className="space-y-1 pt-1 border-t border-black/30">
              <span className="font-mono text-[10px] font-black uppercase text-neutral-700">TABLE FELT:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(FELT_THEMES).map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setFeltTheme(th.id)}
                    className={`flex items-center gap-1.5 p-1.5 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer ${
                      feltTheme === th.id ? 'bg-[#facc15] text-black brutal-shadow-xs' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 border border-black shrink-0" style={{ backgroundColor: th.felt }} />
                    <span className="truncate">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shot Clock Selector */}
            <div className="pt-1 border-t border-black/30">
              <TimerSelector
                value={timeControl}
                onChange={setTimeControl}
                label="Shot Clock Timer"
                compact={true}
              />
            </div>
          </div>

          {/* 3. Online Lobby Button (when online selected) */}
          {gameMode === 'online' && (
            <div className="bg-[#f4f4eb] text-black border-3 border-black p-3 brutal-shadow space-y-2">
              <span className="font-mono text-xs font-black uppercase block">
                ONLINE ROOM: {onlineRoomCode || 'LOBBY READY'}
              </span>
              <button
                onClick={() => setIsOnlineModalOpen(true)}
                className="brutal-press w-full py-2.5 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
              >
                <Wifi className="w-4 h-4 text-black" />
                <span>OPEN POOL LOBBY (INVITE FRIEND) ▶</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Game Over Modal */}
      {gameOver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 modal-backdrop-anim select-none"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="bg-white text-black border-4 border-black p-6 brutal-shadow-xl max-w-md w-full text-center space-y-4 relative modal-content-anim">
            <div className="w-14 h-14 mx-auto bg-[#facc15] border-3 border-black flex items-center justify-center brutal-shadow-sm">
              <Trophy className="w-8 h-8 text-black" />
            </div>

            <div>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-[#22c55e] border border-black mb-1 inline-block">
                8-BALL MATCH CONCLUDED
              </span>
              <h2 className="font-brutal text-2xl font-black uppercase tracking-tight">
                {winner === 'p1' ? 'PLAYER 1 VICTORIOUS!' : 'PLAYER 2 / BOT WINS!'}
              </h2>
              <p className="font-mono text-xs text-neutral-700 mt-1">
                {winReason}
              </p>
            </div>

            <button
              onClick={resetGame}
              className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-sm font-black uppercase border-3 border-black cursor-pointer brutal-shadow flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RE-RACK & PLAY AGAIN</span>
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 modal-backdrop-anim select-none"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="bg-white text-black border-4 border-black p-5 sm:p-7 brutal-shadow-xl max-w-lg w-full space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRules(false)}
              className="brutal-press absolute top-4 right-4 bg-black text-white hover:bg-neutral-800 p-1.5 border-2 border-black cursor-pointer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b-3 border-black pb-3">
              <span className="text-2xl">🎱</span>
              <h2 className="font-brutal text-xl font-black uppercase">
                CYBER 8-BALL POOL // RULES
              </h2>
            </div>

            <div className="space-y-3 font-mono text-xs text-neutral-800">
              <div className="p-3 bg-[#facc15] border-2 border-black">
                <span className="font-black text-black uppercase block mb-1">⚡ AIM & SHOOT CONTROLS:</span>
                <p>• <strong>Aim:</strong> Drag anywhere on the table canvas to direct the cue stick and laser trajectory guide.</p>
                <p>• <strong>Fine Aim:</strong> Use the <code>◀ -0.5°</code> and <code>+0.5° ▶</code> micro-adjuster buttons for pixel-perfect shots.</p>
                <p>• <strong>Power:</strong> Adjust the power slider, then hit <strong>STRIKE CUE BALL</strong>.</p>
              </div>

              <div className="p-3 bg-[#f4f4eb] border-2 border-black space-y-1">
                <span className="font-black text-black uppercase block mb-1">🎱 OFFICIAL 8-BALL RULES:</span>
                <p>• <strong>Break:</strong> Strike from behind the headstring line to shatter the 15-ball rack.</p>
                <p>• <strong>Group Assignment:</strong> The first legal ball pocketed after the break assigns <strong>Solids (1-7)</strong> or <strong>Stripes (9-15)</strong>.</p>
                <p>• <strong>Legal Contact:</strong> You must strike your own group's balls first.</p>
                <p>• <strong>Scratch:</strong> If the Cue Ball is pocketed, the opponent gets <strong>Ball in Hand</strong> (freely position the cue ball anywhere on table!).</p>
                <p>• <strong>Winning:</strong> Clear all 7 of your group balls, then legally pocket the black <strong>8-Ball</strong> to claim victory!</p>
                <p>• <strong>Loss:</strong> Pocketing the 8-Ball early or scratching on the 8-ball results in an immediate loss.</p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="brutal-press w-full py-2.5 bg-black text-[#22c55e] font-brutal text-sm font-black uppercase border-2 border-black cursor-pointer brutal-shadow"
            >
              GOT IT // RETURN TO TABLE
            </button>
          </div>
        </div>
      )}

      {/* Online Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onCreateRoom={({ timeControl: tc }) => {
          if (!socket || !socketConnected) {
            setOnlineStatus('Connecting to game server...');
            return;
          }
          socket.emit('create_pool_room', { timeControl: tc, playerId }, (res) => {
            if (res && res.success) {
              setOnlineRoomCode(res.roomId);
              setOnlineRole('p1');
              setTimeControl(res.timeControl);
              setIsOnlineModalOpen(false);
              setGameMode('online');
            }
          });
        }}
        onJoinRoom={(code) => {
          if (!socket || !socketConnected) return;
          socket.emit('join_pool_room', { roomId: code, playerId }, (res) => {
            if (res && res.success) {
              setOnlineRoomCode(code.toUpperCase());
              setOnlineRole(res.role);
              setTimeControl(res.timeControl);
              setIsOnlineModalOpen(false);
              setGameMode('online');
            } else {
              setOnlineStatus(res?.error || 'Room not found');
            }
          });
        }}
        onFindQuickMatch={({ timeControl: tc }) => {
          if (!socket || !socketConnected) return;
          setIsSearchingQuickMatch(true);
          socket.emit('find_pool_quick_match', { timeControl: tc, playerId }, (res) => {
            if (res && res.matched) {
              setIsSearchingQuickMatch(false);
              setOnlineRoomCode(res.roomId);
              setOnlineRole(res.role);
              setIsOnlineModalOpen(false);
              setGameMode('online');
            }
          });
        }}
        onCancelQuickMatch={() => {
          if (socket) socket.emit('cancel_pool_quick_match');
          setIsSearchingQuickMatch(false);
        }}
        isSearchingQuickMatch={isSearchingQuickMatch}
        roomCode={onlineRoomCode}
        onlineStatus={onlineStatus}
        isConnected={socketConnected}
      />
    </div>
  );
};
