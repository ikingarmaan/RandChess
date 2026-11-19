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
  Palette,
  ArrowUp,
  ArrowDown,
  Compass,
  Zap,
  Check,
  Copy,
  Share2,
  LogOut
} from 'lucide-react';
import { TimerSelector } from './TimerSelector';
import { OnlineLobbyModal } from './OnlineLobbyModal';
import { sound } from '../utils/sound';

// Table dimensions and geometry (2:1 classic tournament ratio)
const TABLE_WIDTH = 960;
const TABLE_HEIGHT = 480;
const RAIL_SIZE = 40;
const BALL_RADIUS = 12.5;

// Playing area felt bounds
const FELT_LEFT = RAIL_SIZE;
const FELT_RIGHT = TABLE_WIDTH - RAIL_SIZE;
const FELT_TOP = RAIL_SIZE;
const FELT_BOTTOM = TABLE_HEIGHT - RAIL_SIZE;

// Pocket mouth margins for accurate cushion boundaries
const CORNER_MARGIN = 32;
const SIDE_MARGIN = 26;

// 6 Table Pockets (4 Corners with 45° mouths, 2 Side Pockets)
const POCKETS = [
  { id: 'tl', x: FELT_LEFT + 2, y: FELT_TOP + 2, radius: 26, isCorner: true },
  { id: 'tm', x: TABLE_WIDTH / 2, y: FELT_TOP - 4, radius: 24, isCorner: false },
  { id: 'tr', x: FELT_RIGHT - 2, y: FELT_TOP + 2, radius: 26, isCorner: true },
  { id: 'bl', x: FELT_LEFT + 2, y: FELT_BOTTOM - 2, radius: 26, isCorner: true },
  { id: 'bm', x: TABLE_WIDTH / 2, y: FELT_BOTTOM + 4, radius: 24, isCorner: false },
  { id: 'br', x: FELT_RIGHT - 2, y: FELT_BOTTOM - 2, radius: 26, isCorner: true }
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
    name: 'Tournament Green',
    felt: '#15803d',
    feltDark: '#14532d',
    rail: '#18181b',
    railEdge: '#27272a'
  },
  ruby: {
    id: 'ruby',
    name: 'Crimson Velvet',
    felt: '#991b1b',
    feltDark: '#7f1d1d',
    rail: '#18181b',
    railEdge: '#27272a'
  },
  slate: {
    id: 'slate',
    name: 'Midnight Slate',
    felt: '#1e293b',
    feltDark: '#0f172a',
    rail: '#09090b',
    railEdge: '#18181b'
  },
  amber: {
    id: 'amber',
    name: 'Classic Amber',
    felt: '#b45309',
    feltDark: '#78350f',
    rail: '#18181b',
    railEdge: '#27272a'
  }
};

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Standard 8-Ball Triangle Rack Setup
function createInitialBalls() {
  const balls = [];
  const r = BALL_RADIUS;

  // 1. Cue Ball placed behind headstring line
  balls.push({
    num: 0,
    type: 'cue',
    x: 240,
    y: TABLE_HEIGHT / 2,
    vx: 0,
    vy: 0,
    pocketed: false,
    falling: false,
    scale: 1
  });

  // Triangle Rack positioning at foot spot
  const apexX = 680;
  const apexY = TABLE_HEIGHT / 2;
  const dx = r * Math.sqrt(3) + 0.6;
  const dy = r + 0.4;

  // 15-ball pattern: 8-ball in center, solid and stripe on bottom opposite corners
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
        falling: false,
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
  const [feltTheme, setFeltTheme] = useState('emerald');
  const [timeControl, setTimeControl] = useState(30); // 30s per shot default
  const [timer, setTimer] = useState(30);

  // Match State
  const [balls, setBalls] = useState(createInitialBalls);
  const [currentPlayer, setCurrentPlayer] = useState('p1'); // 'p1' | 'p2'
  const [playerGroups, setPlayerGroups] = useState({ p1: null, p2: null }); // 'solid' | 'stripe' | null (Open)
  const [isBreakShot, setIsBreakShot] = useState(true);
  const [isBallInHand, setIsBallInHand] = useState(false);
  const [ballInHandHoverPos, setBallInHandHoverPos] = useState(null);
  const [isAiming, setIsAiming] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // 'p1' | 'p2' | null
  const [winReason, setWinReason] = useState('');
  const [statusMessage, setStatusMessage] = useState('BREAK SHOT — AIM & STRIKE CUE BALL');
  const [showRules, setShowRules] = useState(false);

  // Interactive Aim, Power & Spin Controls
  const [aimAngle, setAimAngle] = useState(0); // in radians
  const [power, setPower] = useState(55); // 10 to 100 %
  const [cueSpin, setCueSpin] = useState({ x: 0, y: 0 }); // -1 to +1 (x = english, y = top/backspin)
  const [isDraggingAim, setIsDraggingAim] = useState(false);
  const [isPullingCue, setIsPullingCue] = useState(false);
  const [isDraggingPowerRig, setIsDraggingPowerRig] = useState(false);
  const [isDraggingSpin, setIsDraggingSpin] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [opponentAim, setOpponentAim] = useState(null); // { angle, power, spin } for online live visual

  // Online Multiplayer State
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState(null);
  const [onlineRole, setOnlineRole] = useState('p1'); // 'p1' or 'p2'
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState('');
  const [rematchOffered, setRematchOffered] = useState(false);
  const [opponentOfferedRematch, setOpponentOfferedRematch] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef(null);
  const powerRigRef = useRef(null);
  const spinWidgetRef = useRef(null);
  const ballsRef = useRef(balls);
  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  const animationFrameRef = useRef(null);
  const shotEventsRef = useRef({ firstHit: null, pocketed: [], cueScratched: false });
  const turnTimerRef = useRef(null);
  const lastAimSyncTimeRef = useRef(0);

  // Sound effects wrapper
  const playSound = useCallback((fn, ...args) => {
    if (soundEnabled && sound[fn]) {
      try {
        sound[fn](...args);
      } catch (e) {}
    }
  }, [soundEnabled]);

  // Deep-link auto-join for ?pool_room=CODE
  useEffect(() => {
    if (!socket || !socketConnected) return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('pool_room');
    if (roomParam && !onlineRoomCode) {
      socket.emit('join_pool_room', { roomId: roomParam, playerId }, (res) => {
        if (res && res.success) {
          setOnlineRoomCode(roomParam.toUpperCase());
          setOnlineRole(res.role);
          if (res.timeControl) setTimeControl(res.timeControl);
          setGameMode('online');
          if (res.waiting) {
            setIsOnlineModalOpen(true);
          }
        } else {
          setOnlineStatus(res?.error || 'Failed to join room');
        }
      });
    }
  }, [socket, socketConnected, playerId, onlineRoomCode]);

  // Turn Countdown Timer
  useEffect(() => {
    if (gameOver || timeControl === null || isMoving) {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      return;
    }

    turnTimerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          playSound('playFoul');
          const opp = currentPlayer === 'p1' ? 'p2' : 'p1';
          setStatusMessage(`TIMEOUT FOUL! ${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} timed out.`);
          setIsBallInHand(true);
          setCurrentPlayer(opp);
          return timeControl;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(turnTimerRef.current);
  }, [gameOver, timeControl, isMoving, currentPlayer, playSound]);

  // Reset / Re-rack game
  const resetGame = useCallback(() => {
    const freshBalls = createInitialBalls();
    setBalls(freshBalls);
    ballsRef.current = freshBalls;
    setCurrentPlayer('p1');
    setPlayerGroups({ p1: null, p2: null });
    setIsBreakShot(true);
    setIsBallInHand(false);
    setBallInHandHoverPos(null);
    setIsAiming(true);
    setIsMoving(false);
    setIsPullingCue(false);
    setIsDraggingAim(false);
    setGameOver(false);
    setWinner(null);
    setWinReason('');
    setStatusMessage('BREAK SHOT — AIM & STRIKE CUE BALL');
    setAimAngle(0);
    setPower(55);
    setCueSpin({ x: 0, y: 0 });
    setOpponentAim(null);
    setTimer(timeControl || 30);
    setRematchOffered(false);
    setOpponentOfferedRematch(false);
    playSound('playMove');
  }, [timeControl, playSound]);

  // Broadcast live aim to opponent during online turns
  const broadcastAimSync = useCallback((angle, pwr, spin) => {
    if (gameMode !== 'online' || !socket || !onlineRoomCode) return;
    if (onlineRole !== currentPlayer) return;
    const now = Date.now();
    if (now - lastAimSyncTimeRef.current < 45) return;
    lastAimSyncTimeRef.current = now;
    socket.emit('pool_aim_sync', {
      roomId: onlineRoomCode,
      aim: { angle, power: pwr, spin }
    });
  }, [gameMode, socket, onlineRoomCode, onlineRole, currentPlayer]);

  // Update aim angle and broadcast
  const updateAimAngle = useCallback((newAngle) => {
    setAimAngle(newAngle);
    broadcastAimSync(newAngle, power, cueSpin);
  }, [power, cueSpin, broadcastAimSync]);

  // Update power and broadcast
  const updatePower = useCallback((newPower) => {
    const clamped = Math.max(10, Math.min(100, Math.round(newPower)));
    setPower(clamped);
    broadcastAimSync(aimAngle, clamped, cueSpin);
  }, [aimAngle, cueSpin, broadcastAimSync]);

  // Update spin and broadcast
  const updateSpin = useCallback((newSpin) => {
    setCueSpin(newSpin);
    broadcastAimSync(aimAngle, power, newSpin);
  }, [aimAngle, power, broadcastAimSync]);

  // Calculate Ghost Ball, Cushion Rebound & Trajectory Vector
  const trajectoryGuide = useMemo(() => {
    const activeAngle = (gameMode === 'online' && onlineRole !== currentPlayer && opponentAim)
      ? opponentAim.angle
      : aimAngle;

    const cueBall = balls.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall || isMoving) return null;

    const cos = Math.cos(activeAngle);
    const sin = Math.sin(activeAngle);

    // Raycast step along aiming vector
    let closestDist = Infinity;
    let targetBall = null;

    // Check collision against all other non-pocketed balls
    balls.forEach((b) => {
      if (b.num === 0 || b.pocketed) return;
      const vX = b.x - cueBall.x;
      const vY = b.y - cueBall.y;
      const proj = vX * cos + vY * sin;
      if (proj <= 0) return;

      const perpSq = vX * vX + vY * vY - proj * proj;
      const radiusSum = BALL_RADIUS * 2;
      if (perpSq <= radiusSum * radiusSum) {
        const d = proj - Math.sqrt(radiusSum * radiusSum - perpSq);
        if (d > 0 && d < closestDist) {
          closestDist = d;
          targetBall = b;
        }
      }
    });

    if (targetBall) {
      // Impact with an object ball
      const ghostX = cueBall.x + cos * closestDist;
      const ghostY = cueBall.y + sin * closestDist;

      // Normal unit vector from ghost ball to target ball
      const normX = (targetBall.x - ghostX) / (BALL_RADIUS * 2);
      const normY = (targetBall.y - ghostY) / (BALL_RADIUS * 2);
      const targetAngle = Math.atan2(normY, normX);

      // Cue ball velocity vector post-collision (tangent vector)
      const v0x = cos;
      const v0y = sin;
      const vDotN = v0x * normX + v0y * normY;
      const cueDeflectX = v0x - vDotN * normX;
      const cueDeflectY = v0y - vDotN * normY;
      const cueDeflectAngle = Math.atan2(cueDeflectY, cueDeflectX);
      const cutAlignment = Math.max(0, Math.min(1, vDotN));

      return {
        hasTarget: true,
        startX: cueBall.x,
        startY: cueBall.y,
        ghostX,
        ghostY,
        targetBall,
        targetAngle,
        cueDeflectAngle,
        cutAlignment,
        cushionHit: null
      };
    } else {
      // Cushion bank rebound
      let tMin = Infinity;
      let hitCushion = null;

      if (cos < -0.001) {
        const t = (FELT_LEFT + BALL_RADIUS - cueBall.x) / cos;
        if (t > 0 && t < tMin) {
          tMin = t;
          hitCushion = 'left';
        }
      }
      if (cos > 0.001) {
        const t = (FELT_RIGHT - BALL_RADIUS - cueBall.x) / cos;
        if (t > 0 && t < tMin) {
          tMin = t;
          hitCushion = 'right';
        }
      }
      if (sin < -0.001) {
        const t = (FELT_TOP + BALL_RADIUS - cueBall.y) / sin;
        if (t > 0 && t < tMin) {
          tMin = t;
          hitCushion = 'top';
        }
      }
      if (sin > 0.001) {
        const t = (FELT_BOTTOM - BALL_RADIUS - cueBall.y) / sin;
        if (t > 0 && t < tMin) {
          tMin = t;
          hitCushion = 'bottom';
        }
      }

      const wallX = cueBall.x + cos * tMin;
      const wallY = cueBall.y + sin * tMin;
      let reboundAngle = activeAngle;
      if (hitCushion === 'left' || hitCushion === 'right') {
        reboundAngle = Math.atan2(sin, -cos);
      } else if (hitCushion === 'top' || hitCushion === 'bottom') {
        reboundAngle = Math.atan2(-sin, cos);
      }

      return {
        hasTarget: false,
        startX: cueBall.x,
        startY: cueBall.y,
        wallX,
        wallY,
        reboundAngle,
        cushionHit: hitCushion
      };
    }
  }, [balls, aimAngle, isMoving, gameMode, onlineRole, currentPlayer, opponentAim]);

  // Execute a Strike
  const strikeCueBall = useCallback((strikeAngle, strikePower, spin = cueSpin, isRemote = false) => {
    const currentBalls = ballsRef.current;
    const cueBall = currentBalls.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall || isMoving) return;

    shotEventsRef.current = { firstHit: null, pocketed: [], cueScratched: false };

    const speed = (strikePower / 100) * 26 + 3;
    cueBall.vx = Math.cos(strikeAngle) * speed;
    cueBall.vy = Math.sin(strikeAngle) * speed;

    cueBall.spinX = spin?.x || 0;
    cueBall.spinY = spin?.y || 0;

    setIsMoving(true);
    setIsAiming(false);
    setIsPullingCue(false);
    setIsDraggingAim(false);
    setIsBallInHand(false);
    setBallInHandHoverPos(null);
    playSound('playCueStrike', strikePower / 100);

    if (gameMode === 'online' && socket && onlineRoomCode && !isRemote) {
      socket.emit('pool_shot', {
        roomId: onlineRoomCode,
        shot: {
          angle: strikeAngle,
          power: strikePower,
          spin,
          cueBallPos: { x: cueBall.x, y: cueBall.y }
        }
      });
    }
  }, [isMoving, cueSpin, gameMode, socket, onlineRoomCode, playSound]);

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

    const remainingMyBalls = myGroup
      ? currentBalls.filter((b) => b.type === myGroup && !b.pocketed).length
      : 7;

    let nextPlayer = currentPlayer;
    let nextGroups = { ...playerGroups };
    let nextBallInHand = false;
    let nextStatus = '';
    let isGameOver = false;
    let matchWinner = null;
    let matchReason = '';

    if (eightSunk) {
      isGameOver = true;
      if (cueSunk || remainingMyBalls > 0 || isBreakShot) {
        matchWinner = opponent;
        matchReason = `${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} sunk the 8-Ball prematurely or scratched!`;
        setGameOver(true);
        setWinner(opponent);
        setWinReason(matchReason);
        playSound('playGameOver');
      } else {
        matchWinner = currentPlayer;
        matchReason = `${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} legally pocketed the 8-Ball!`;
        setGameOver(true);
        setWinner(currentPlayer);
        setWinReason(matchReason);
        playSound('playGameOver');
        confetti({
          particleCount: 130,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#22c55e', '#ffffff', '#facc15', '#f97316']
        });
      }
    } else if (cueSunk) {
      playSound('playFoul');
      nextStatus = `SCRATCH FOUL! Cue ball pocketed. ${opponent === 'p1' ? 'Player 1' : 'Player 2'} gets Ball in Hand!`;
      cueBall.x = 240;
      cueBall.y = TABLE_HEIGHT / 2;
      cueBall.vx = 0;
      cueBall.vy = 0;
      cueBall.pocketed = false;
      cueBall.falling = false;
      cueBall.scale = 1;

      nextBallInHand = true;
      nextPlayer = opponent;
    } else {
      let isFoul = false;
      let foulMsg = '';
      if (!events.firstHit) {
        isFoul = true;
        foulMsg = 'FOUL: Cue ball struck no balls!';
      } else if (myGroup && events.firstHit.type !== myGroup) {
        if (remainingMyBalls > 0) {
          isFoul = true;
          foulMsg = `FOUL: Struck ${events.firstHit.type.toUpperCase()} ball first instead of ${myGroup.toUpperCase()}!`;
        } else if (events.firstHit.num !== 8) {
          isFoul = true;
          foulMsg = 'FOUL: Must strike the 8-Ball first once your group is cleared!';
        }
      }

      if (isFoul) {
        playSound('playFoul');
        nextStatus = `${foulMsg} ${opponent === 'p1' ? 'Player 1' : 'Player 2'} gets Ball in Hand.`;
        nextBallInHand = true;
        nextPlayer = opponent;
      } else {
        if (!p1Group && !isBreakShot && pocketedThisShot.length > 0) {
          const firstValid = pocketedThisShot.find((b) => b.type === 'solid' || b.type === 'stripe');
          if (firstValid) {
            const assigned = firstValid.type;
            const other = assigned === 'solid' ? 'stripe' : 'solid';
            nextGroups = currentPlayer === 'p1'
              ? { p1: assigned, p2: other }
              : { p1: other, p2: assigned };
            setPlayerGroups(nextGroups);
            nextStatus = `TABLE ASSIGNED: ${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} is ${assigned.toUpperCase()}S!`;
          }
        }

        const currentGroup = currentPlayer === 'p1' ? nextGroups.p1 : nextGroups.p2;
        const legalSunk = pocketedThisShot.some((b) => {
          if (!currentGroup) return b.type === 'solid' || b.type === 'stripe';
          return b.type === currentGroup;
        });

        if (legalSunk) {
          nextPlayer = currentPlayer;
          nextStatus = `${currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} pocketed a ball — TAKE ANOTHER SHOT!`;
        } else {
          nextPlayer = opponent;
          nextStatus = `${opponent === 'p1' ? 'Player 1' : 'Player 2'}'s turn to shoot.`;
        }
      }
    }

    setCurrentPlayer(nextPlayer);
    setIsBallInHand(nextBallInHand);
    setStatusMessage(nextStatus);
    setTimer(timeControl || 30);
    setIsBreakShot(false);

    if (gameMode === 'online' && socket && onlineRoomCode && onlineRole === currentPlayer) {
      socket.emit('pool_sync_state', {
        roomId: onlineRoomCode,
        state: {
          balls: currentBalls.map((b) => ({
            num: b.num,
            type: b.type,
            x: Math.round(b.x * 10) / 10,
            y: Math.round(b.y * 10) / 10,
            pocketed: b.pocketed
          })),
          currentPlayer: nextPlayer,
          playerGroups: nextGroups,
          isBallInHand: nextBallInHand,
          statusMessage: nextStatus,
          isBreakShot: false,
          gameOver: isGameOver,
          winner: matchWinner,
          winReason: matchReason
        }
      });
    }
  }, [currentPlayer, playerGroups, isBreakShot, timeControl, gameMode, socket, onlineRoomCode, onlineRole, playSound]);

  // Main 60 FPS Physics Simulation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const updatePhysics = (now) => {
      const dt = Math.min(32, now - lastTime) / 1000;
      lastTime = now;

      const currentBalls = ballsRef.current;
      const SUB_STEPS = 12;
      const subDt = dt / SUB_STEPS;
      const friction = Math.pow(0.985, dt * 60);

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
          if (speedSq < 0.04 && !b.falling) {
            b.vx = 0;
            b.vy = 0;
          } else {
            anyBallMoving = true;
          }

          // 2. Pocket capture suction & smooth drop animation
          for (const p of POCKETS) {
            const pDist = Math.hypot(b.x - p.x, b.y - p.y);
            if (pDist < p.radius) {
              if (!b.falling) {
                b.falling = true;
                playSound('playPocketDrop');
                if (b.num === 0) {
                  shotEventsRef.current.cueScratched = true;
                } else {
                  shotEventsRef.current.pocketed.push(b);
                }
              }
              // Smooth suction towards pocket center and scale down
              b.vx = (p.x - b.x) * 0.28;
              b.vy = (p.y - b.y) * 0.28;
              b.scale = Math.max(0, (b.scale || 1) - 0.08);
              if (b.scale <= 0.05) {
                b.pocketed = true;
                b.falling = false;
                b.vx = 0;
                b.vy = 0;
              }
              break;
            } else if (pDist < p.radius + 10 && !b.falling) {
              // Pocket mouth gravity funnel
              const pull = 0.08;
              b.vx += ((p.x - b.x) / pDist) * pull;
              b.vy += ((p.y - b.y) / pDist) * pull;
            }
          }

          if (b.pocketed || b.falling) continue;

          // 3. Rail / Cushion Bounces with accurate pocket mouth margins
          const r = BALL_RADIUS;
          const bounceDamping = 0.86;

          // Top rail cushions (left and right of side pocket)
          if (b.y - r < FELT_TOP) {
            if ((b.x > FELT_LEFT + CORNER_MARGIN && b.x < TABLE_WIDTH / 2 - SIDE_MARGIN) ||
                (b.x > TABLE_WIDTH / 2 + SIDE_MARGIN && b.x < FELT_RIGHT - CORNER_MARGIN)) {
              b.y = FELT_TOP + r;
              b.vy = Math.abs(b.vy) * bounceDamping;
              if (b.spinX) b.vx += b.spinX * 0.8;
              playSound('playCushionBounce', Math.abs(b.vy) / 15);
            }
          }
          // Bottom rail cushions (left and right of side pocket)
          if (b.y + r > FELT_BOTTOM) {
            if ((b.x > FELT_LEFT + CORNER_MARGIN && b.x < TABLE_WIDTH / 2 - SIDE_MARGIN) ||
                (b.x > TABLE_WIDTH / 2 + SIDE_MARGIN && b.x < FELT_RIGHT - CORNER_MARGIN)) {
              b.y = FELT_BOTTOM - r;
              b.vy = -Math.abs(b.vy) * bounceDamping;
              if (b.spinX) b.vx -= b.spinX * 0.8;
              playSound('playCushionBounce', Math.abs(b.vy) / 15);
            }
          }
          // Left rail cushion
          if (b.x - r < FELT_LEFT) {
            if (b.y > FELT_TOP + CORNER_MARGIN && b.y < FELT_BOTTOM - CORNER_MARGIN) {
              b.x = FELT_LEFT + r;
              b.vx = Math.abs(b.vx) * bounceDamping;
              if (b.spinX) b.vy -= b.spinX * 0.8;
              playSound('playCushionBounce', Math.abs(b.vx) / 15);
            }
          }
          // Right rail cushion
          if (b.x + r > FELT_RIGHT) {
            if (b.y > FELT_TOP + CORNER_MARGIN && b.y < FELT_BOTTOM - CORNER_MARGIN) {
              b.x = FELT_RIGHT - r;
              b.vx = -Math.abs(b.vx) * bounceDamping;
              if (b.spinX) b.vy += b.spinX * 0.8;
              playSound('playCushionBounce', Math.abs(b.vx) / 15);
            }
          }
        }

        // 4. Ball-to-Ball Elastic Collisions with Spin Transfer
        for (let i = 0; i < currentBalls.length; i++) {
          const b1 = currentBalls[i];
          if (b1.pocketed || b1.falling) continue;

          for (let j = i + 1; j < currentBalls.length; j++) {
            const b2 = currentBalls[j];
            if (b2.pocketed || b2.falling) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = BALL_RADIUS * 2;

            if (dist < minDist && dist > 0.001) {
              const overlap = (minDist - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;

              b1.x -= nx * overlap;
              b1.y -= ny * overlap;
              b2.x += nx * overlap;
              b2.y += ny * overlap;

              if ((b1.num === 0 || b2.num === 0) && !shotEventsRef.current.firstHit) {
                const target = b1.num === 0 ? b2 : b1;
                shotEventsRef.current.firstHit = target;

                const cue = b1.num === 0 ? b1 : b2;
                if (cue.spinY) {
                  const spinImpulse = cue.spinY * 3.5;
                  cue.vx += nx * spinImpulse;
                  cue.vy += ny * spinImpulse;
                  cue.spinY *= 0.3;
                }
              }

              const kx = b1.vx - b2.vx;
              const ky = b1.vy - b2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2;

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

      if (isMoving && !anyBallMoving) {
        handleShotFinished();
      }

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

    ctx.fillStyle = theme.feltDark;
    ctx.fillRect(FELT_LEFT, FELT_TOP, FELT_RIGHT - FELT_LEFT, 6);
    ctx.fillRect(FELT_LEFT, FELT_TOP, 6, FELT_BOTTOM - FELT_TOP);

    // Headstring line & Foot spot
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(240, FELT_TOP);
    ctx.lineTo(240, FELT_BOTTOM);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(680, TABLE_HEIGHT / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. 6 Pockets (Drop shadow & metal rim)
    POCKETS.forEach((p) => {
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 4. Laser Aiming Trajectory Guide
    const activeAngle = (gameMode === 'online' && onlineRole !== currentPlayer && opponentAim)
      ? opponentAim.angle
      : aimAngle;
    const activePower = (gameMode === 'online' && onlineRole !== currentPlayer && opponentAim)
      ? opponentAim.power
      : power;

    const cueBall = ballsRef.current.find((b) => b.num === 0 && !b.pocketed);
    if (cueBall && isAiming && !isMoving && trajectoryGuide) {
      ctx.save();

      if (trajectoryGuide.hasTarget) {
        const { startX, startY, ghostX, ghostY, targetBall, targetAngle, cueDeflectAngle, cutAlignment } = trajectoryGuide;

        // Primary Aim Laser Line (Neon green dashed)
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(ghostX, ghostY);
        ctx.stroke();

        // Ghost Cue Ball at Impact Point
        ctx.setLineDash([]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ghostX - 4, ghostY);
        ctx.lineTo(ghostX + 4, ghostY);
        ctx.moveTo(ghostX, ghostY - 4);
        ctx.lineTo(ghostX, ghostY + 4);
        ctx.stroke();

        // Target Ball Trajectory (Yellow laser)
        const tLen = 150 * cutAlignment + 45;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(targetBall.x, targetBall.y);
        ctx.lineTo(targetBall.x + Math.cos(targetAngle) * tLen, targetBall.y + Math.sin(targetAngle) * tLen);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(targetBall.x + Math.cos(targetAngle) * tLen, targetBall.y + Math.sin(targetAngle) * tLen, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Cue Ball Deflection Line (White dashed tangent line)
        const defLen = 75 * (1 - cutAlignment) + 25;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ghostX, ghostY);
        ctx.lineTo(ghostX + Math.cos(cueDeflectAngle) * defLen, ghostY + Math.sin(cueDeflectAngle) * defLen);
        ctx.stroke();
      } else {
        // Cushion Bank Raycast Guide
        const { startX, startY, wallX, wallY, reboundAngle } = trajectoryGuide;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(wallX, wallY);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(wallX, wallY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(wallX, wallY);
        ctx.lineTo(wallX + Math.cos(reboundAngle) * 90, wallY + Math.sin(reboundAngle) * 90);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Render 3D Cue Stick Pull-Back
      const cueDist = 20 + (activePower / 100) * 60;
      const stickLength = 340;
      const cueAngle = activeAngle + Math.PI;
      const cueStartX = cueBall.x + Math.cos(cueAngle) * (BALL_RADIUS + cueDist);
      const cueStartY = cueBall.y + Math.sin(cueAngle) * (BALL_RADIUS + cueDist);
      const cueEndX = cueBall.x + Math.cos(cueAngle) * (BALL_RADIUS + cueDist + stickLength);
      const cueEndY = cueBall.y + Math.sin(cueAngle) * (BALL_RADIUS + cueDist + stickLength);

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cueStartX + 6, cueStartY + 6);
      ctx.lineTo(cueEndX + 6, cueEndY + 6);
      ctx.stroke();

      const cueGrad = ctx.createLinearGradient(cueStartX, cueStartY, cueEndX, cueEndY);
      cueGrad.addColorStop(0, '#fef08a');
      cueGrad.addColorStop(0.15, '#d97706');
      cueGrad.addColorStop(0.55, '#92400e');
      cueGrad.addColorStop(1, '#18181b');

      ctx.strokeStyle = cueGrad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cueStartX, cueStartY);
      ctx.lineTo(cueEndX, cueEndY);
      ctx.stroke();

      // Blue chalk tip & brass ferrule
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cueStartX, cueStartY);
      ctx.lineTo(cueStartX + Math.cos(cueAngle) * 5, cueStartY + Math.sin(cueAngle) * 5);
      ctx.stroke();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(cueStartX + Math.cos(cueAngle) * 6, cueStartY + Math.sin(cueAngle) * 6);
      ctx.lineTo(cueStartX + Math.cos(cueAngle) * 11, cueStartY + Math.sin(cueAngle) * 11);
      ctx.stroke();

      // Power % label along stick
      if (activePower > 10) {
        const pColor = activePower > 75 ? '#ef4444' : activePower > 45 ? '#facc15' : '#22c55e';
        ctx.fillStyle = pColor;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        const labelX = cueBall.x + Math.cos(cueAngle) * (BALL_RADIUS + cueDist + 45);
        const labelY = cueBall.y + Math.sin(cueAngle) * (BALL_RADIUS + cueDist + 45) - 12;
        ctx.fillText(`${activePower}% PWR`, labelX, labelY);
      }
      ctx.restore();
    }

    // 6. Draw Pool Balls
    ballsRef.current.forEach((b) => {
      if (b.pocketed && !b.falling) return;
      const cfg = BALL_CONFIGS[b.num];
      const scale = b.scale !== undefined ? b.scale : 1;
      const r = BALL_RADIUS * scale;

      ctx.save();
      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(b.x + 2, b.y + 3, r, 0, Math.PI * 2);
      ctx.fill();

      // Ball Base Circle
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);

      if (b.type === 'cue') {
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'solid' || b.type === 'eight') {
        ctx.fillStyle = cfg.color;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 0.48, 0, Math.PI * 2);
        ctx.fill();

        if (scale > 0.4) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.round(9 * scale)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(b.num), b.x, b.y + 0.5);
        }
      } else if (b.type === 'stripe') {
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.fillStyle = cfg.color;
        ctx.fillRect(b.x - r * 0.85, b.y - r * 0.5, r * 1.7, r);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 0.48, 0, Math.PI * 2);
        ctx.fill();

        if (scale > 0.4) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.round(8 * scale)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(b.num), b.x, b.y + 0.5);
        }
      }

      // High-Gloss Specular Reflection Dot (Makes them look 3D sphere)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(b.x - r * 0.35, b.y - r * 0.35, r * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    });

    // 7. Ball-in-Hand Placement Ring
    if (isBallInHand && cueBall) {
      const pos = ballInHandHoverPos || { x: cueBall.x, y: cueBall.y };
      ctx.save();
      ctx.strokeStyle = pos.isValid !== false ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS + 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = pos.isValid !== false ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [feltTheme, aimAngle, power, isAiming, isMoving, isBallInHand, ballInHandHoverPos, trajectoryGuide, gameMode, onlineRole, currentPlayer, opponentAim]);

  // Pointer & Touch Controls on Table Canvas
  const handlePointerDown = (e) => {
    if (isMoving || gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'p2') return;
    if (gameMode === 'online' && onlineRole !== currentPlayer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * TABLE_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * TABLE_HEIGHT;

    const cueBall = ballsRef.current.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall) return;

    if (isBallInHand) {
      const clampedX = Math.max(FELT_LEFT + BALL_RADIUS + 4, Math.min(FELT_RIGHT - BALL_RADIUS - 4, x));
      const clampedY = Math.max(FELT_TOP + BALL_RADIUS + 4, Math.min(FELT_BOTTOM - BALL_RADIUS - 4, y));

      const overlaps = ballsRef.current.some((b) => {
        if (b.num === 0 || b.pocketed) return false;
        return Math.hypot(b.x - clampedX, b.y - clampedY) < BALL_RADIUS * 2;
      });

      if (!overlaps) {
        cueBall.x = clampedX;
        cueBall.y = clampedY;
        setBalls([...ballsRef.current]);
        setIsBallInHand(false);
        setBallInHandHoverPos(null);
        playSound('playMove');

        if (gameMode === 'online' && socket && onlineRoomCode) {
          socket.emit('pool_place_cue', {
            roomId: onlineRoomCode,
            pos: { x: clampedX, y: clampedY }
          });
        }
      }
      return;
    }

    // Check if clicking in the rear quadrant of the cue stick to pull back
    const clickDist = Math.hypot(x - cueBall.x, y - cueBall.y);
    const clickAngle = Math.atan2(y - cueBall.y, x - cueBall.x);
    const cueAngle = aimAngle + Math.PI;
    const angleDiff = Math.abs(normalizeAngle(clickAngle - cueAngle));

    if (angleDiff < 0.78 && clickDist > BALL_RADIUS) {
      setIsPullingCue(true);
      const pwr = Math.min(100, Math.max(10, Math.round(((clickDist - BALL_RADIUS) / 160) * 90 + 10)));
      updatePower(pwr);
    } else {
      const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
      updateAimAngle(angle);
      setIsDraggingAim(true);
    }
  };

  const handlePointerMove = (e) => {
    if (isMoving || gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'p2') return;
    if (gameMode === 'online' && onlineRole !== currentPlayer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * TABLE_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * TABLE_HEIGHT;

    const cueBall = ballsRef.current.find((b) => b.num === 0 && !b.pocketed);
    if (!cueBall) return;

    if (isBallInHand) {
      const clampedX = Math.max(FELT_LEFT + BALL_RADIUS + 4, Math.min(FELT_RIGHT - BALL_RADIUS - 4, x));
      const clampedY = Math.max(FELT_TOP + BALL_RADIUS + 4, Math.min(FELT_BOTTOM - BALL_RADIUS - 4, y));
      const overlaps = ballsRef.current.some((b) => {
        if (b.num === 0 || b.pocketed) return false;
        return Math.hypot(b.x - clampedX, b.y - clampedY) < BALL_RADIUS * 2;
      });
      setBallInHandHoverPos({ x: clampedX, y: clampedY, isValid: !overlaps });
      return;
    }

    if (isPullingCue) {
      const dx = x - cueBall.x;
      const dy = y - cueBall.y;
      const cueAngle = aimAngle + Math.PI;
      const proj = dx * Math.cos(cueAngle) + dy * Math.sin(cueAngle);
      const pwr = Math.min(100, Math.max(10, Math.round(((proj - BALL_RADIUS) / 160) * 90 + 10)));
      updatePower(pwr);
    } else if (isDraggingAim || (!isDraggingAim && !isPullingCue && e.buttons === 0)) {
      const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
      updateAimAngle(angle);
    }
  };

  const handlePointerUp = () => {
    if (isPullingCue) {
      setIsPullingCue(false);
      if (power >= 15) {
        strikeCueBall(aimAngle, power);
      }
    }
    setIsDraggingAim(false);
  };

  // Mouse Wheel Micro-Aim Stepper on Canvas
  const handleWheel = (e) => {
    if (isMoving || gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'p2') return;
    if (gameMode === 'online' && onlineRole !== currentPlayer) return;
    e.preventDefault();

    const step = e.shiftKey ? 0.002 : 0.008;
    const delta = e.deltaY > 0 ? step : -step;
    updateAimAngle(aimAngle + delta);
  };

  // Vertical Power Cue Rig Drag Handler (Miniclip style pull-down cue)
  const handlePowerRigPointerDown = (e) => {
    if (isMoving || gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'p2') return;
    if (gameMode === 'online' && onlineRole !== currentPlayer) return;

    setIsDraggingPowerRig(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePowerRigPointerMove(e);
  };

  const handlePowerRigPointerMove = (e) => {
    if (!isDraggingPowerRig) return;
    const rig = powerRigRef.current;
    if (!rig) return;
    const rect = rig.getBoundingClientRect();
    const clientY = e.clientY;
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const pct = Math.round((relY / rect.height) * 90 + 10);
    updatePower(pct);
  };

  const handlePowerRigPointerUp = (e) => {
    if (!isDraggingPowerRig) return;
    setIsDraggingPowerRig(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (power >= 15) {
      strikeCueBall(aimAngle, power);
    }
  };

  // 2D Spin Widget Drag Handler
  const handleSpinPointerDown = (e) => {
    if (isMoving || gameOver) return;
    setIsDraggingSpin(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSpinPointerMove(e);
  };

  const handleSpinPointerMove = (e) => {
    if (!isDraggingSpin) return;
    const widget = spinWidgetRef.current;
    if (!widget) return;
    const rect = widget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxR = radius * 0.75;
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * clampedDist) / maxR;
    const ny = (Math.sin(angle) * clampedDist) / maxR;

    updateSpin({
      x: Math.round(nx * 100) / 100,
      y: Math.round(ny * 100) / 100
    });
  };

  const handleSpinPointerUp = (e) => {
    setIsDraggingSpin(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Keyboard Shortcuts (Arrow keys to aim, Space to shoot)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isMoving || gameOver) return;
      if (gameMode === 'ai' && currentPlayer === 'p2') return;
      if (gameMode === 'online' && onlineRole !== currentPlayer) return;

      const step = e.shiftKey ? 0.002 : 0.015;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        updateAimAngle(aimAngle - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        updateAimAngle(aimAngle + step);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        updatePower(power + 2);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        updatePower(power - 2);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        strikeCueBall(aimAngle, power);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aimAngle, power, isMoving, gameOver, gameMode, currentPlayer, onlineRole, updateAimAngle, updatePower, strikeCueBall]);

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
        let candidates = currentBalls.filter((b) => !b.pocketed && b.num !== 0);
        if (myGroup) {
          const myRemaining = candidates.filter((b) => b.type === myGroup);
          candidates = myRemaining.length > 0 ? myRemaining : candidates.filter((b) => b.num === 8);
        }

        if (candidates.length === 0) candidates = currentBalls.filter((b) => !b.pocketed && b.num !== 0);

        let bestShot = null;
        let bestScore = -Infinity;

        candidates.forEach((target) => {
          POCKETS.forEach((pocket) => {
            const tX = pocket.x - target.x;
            const tY = pocket.y - target.y;
            const tDist = Math.hypot(tX, tY);
            if (tDist < 1) return;

            const tNormX = tX / tDist;
            const tNormY = tY / tDist;

            const impactX = target.x - tNormX * (BALL_RADIUS * 2);
            const impactY = target.y - tNormY * (BALL_RADIUS * 2);

            const cX = impactX - cueBall.x;
            const cY = impactY - cueBall.y;
            const cDist = Math.hypot(cX, cY);
            if (cDist < 1) return;

            const cNormX = cX / cDist;
            const cNormY = cY / cDist;

            const alignment = cNormX * tNormX + cNormY * tNormY;
            if (alignment > 0.15) {
              const score = alignment * 100 - (tDist + cDist) * 0.05;
              if (score > bestScore) {
                bestScore = score;
                const baseAngle = Math.atan2(cY, cX);
                const jitter = difficulty === 'easy' ? (Math.random() - 0.5) * 0.12 : difficulty === 'medium' ? (Math.random() - 0.5) * 0.04 : (Math.random() - 0.5) * 0.008;
                bestShot = {
                  angle: baseAngle + jitter,
                  power: Math.min(95, Math.max(35, Math.round((cDist + tDist) * 0.12 + 40)))
                };
              }
            }
          });
        });

        if (!bestShot) {
          const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];
          const angle = Math.atan2(randomTarget.y - cueBall.y, randomTarget.x - cueBall.x);
          bestShot = { angle, power: 55 };
        }

        setAimAngle(bestShot.angle);
        setPower(bestShot.power);
        setIsBotThinking(false);
        strikeCueBall(bestShot.angle, bestShot.power);
      } catch (err) {
        setIsBotThinking(false);
      }
    }, difficulty === 'easy' ? 900 : difficulty === 'medium' ? 1400 : 1800);

    return () => clearTimeout(botTimer);
  }, [gameMode, currentPlayer, isMoving, gameOver, difficulty, playerGroups, strikeCueBall]);

  // Online Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleOpponentAim = ({ aim }) => {
      if (aim) setOpponentAim(aim);
    };

    const handleOpponentShot = ({ shot }) => {
      if (!shot) return;
      setAimAngle(shot.angle);
      setPower(shot.power);
      if (shot.spin) setCueSpin(shot.spin);
      if (shot.cueBallPos) {
        const cue = ballsRef.current.find((b) => b.num === 0);
        if (cue) {
          cue.x = shot.cueBallPos.x;
          cue.y = shot.cueBallPos.y;
        }
      }
      strikeCueBall(shot.angle, shot.power, shot.spin, true);
    };

    const handleStateUpdated = ({ state }) => {
      if (!state) return;
      if (state.balls) {
        const currentBalls = ballsRef.current;
        state.balls.forEach((remote) => {
          const local = currentBalls.find((b) => b.num === remote.num);
          if (local) {
            local.x = remote.x;
            local.y = remote.y;
            local.pocketed = remote.pocketed;
            local.vx = 0;
            local.vy = 0;
          }
        });
        setBalls([...currentBalls]);
      }
      if (state.currentPlayer) setCurrentPlayer(state.currentPlayer);
      if (state.playerGroups) setPlayerGroups(state.playerGroups);
      if (state.isBallInHand !== undefined) setIsBallInHand(state.isBallInHand);
      if (state.statusMessage) setStatusMessage(state.statusMessage);
      if (state.isBreakShot !== undefined) setIsBreakShot(state.isBreakShot);
      if (state.gameOver) {
        setGameOver(true);
        setWinner(state.winner);
        setWinReason(state.winReason);
        playSound('playGameOver');
      }
      setTimer(timeControl || 30);
    };

    const handleCuePlaced = ({ pos }) => {
      if (!pos) return;
      const cueBall = ballsRef.current.find((b) => b.num === 0);
      if (cueBall) {
        cueBall.x = pos.x;
        cueBall.y = pos.y;
        setBalls([...ballsRef.current]);
      }
    };

    const handleRematchOffered = () => {
      setOpponentOfferedRematch(true);
      playSound('playMove');
    };

    const handleRematchAccepted = () => {
      resetGame();
      setRematchOffered(false);
      setOpponentOfferedRematch(false);
      setStatusMessage('REMATCH ACCEPTED — BREAK SHOT!');
      playSound('playMove');
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

    socket.on('pool_opponent_aim', handleOpponentAim);
    socket.on('pool_opponent_shot', handleOpponentShot);
    socket.on('pool_state_updated', handleStateUpdated);
    socket.on('pool_cue_placed', handleCuePlaced);
    socket.on('pool_rematch_offered', handleRematchOffered);
    socket.on('pool_rematch_accepted', handleRematchAccepted);
    socket.on('pool_game_started', handlePoolGameStarted);
    socket.on('pool_opponent_disconnected', handleOpponentDisconnected);

    return () => {
      socket.off('pool_opponent_aim', handleOpponentAim);
      socket.off('pool_opponent_shot', handleOpponentShot);
      socket.off('pool_state_updated', handleStateUpdated);
      socket.off('pool_cue_placed', handleCuePlaced);
      socket.off('pool_rematch_offered', handleRematchOffered);
      socket.off('pool_rematch_accepted', handleRematchAccepted);
      socket.off('pool_game_started', handlePoolGameStarted);
      socket.off('pool_opponent_disconnected', handleOpponentDisconnected);
    };
  }, [socket, onlineRole, resetGame, strikeCueBall, playSound, playerId, timeControl]);

  // Leave room helper
  const handleLeaveRoom = () => {
    if (socket && onlineRoomCode) {
      socket.emit('pool_leave_room', { roomId: onlineRoomCode });
    }
    setOnlineRoomCode(null);
    setOnlineRole('p1');
    setRematchOffered(false);
    setOpponentOfferedRematch(false);
    setOnlineStatus('');
    setGameMode('ai');
    resetGame();
    const url = new URL(window.location.href);
    if (url.searchParams.has('pool_room')) {
      url.searchParams.delete('pool_room');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleCopyLink = () => {
    if (!onlineRoomCode) return;
    const url = `${window.location.origin}?pool_room=${onlineRoomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!onlineRoomCode) return;
    navigator.clipboard.writeText(onlineRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Player Groups Progress Tracking
  const p1BallsRemaining = useMemo(() => {
    if (!playerGroups.p1) return 7;
    return balls.filter((b) => b.type === playerGroups.p1 && !b.pocketed).length;
  }, [balls, playerGroups.p1]);

  const p2BallsRemaining = useMemo(() => {
    if (!playerGroups.p2) return 7;
    return balls.filter((b) => b.type === playerGroups.p2 && !b.pocketed).length;
  }, [balls, playerGroups.p2]);

  const isMyTurn = (gameMode === 'ai' && currentPlayer === 'p1') ||
    (gameMode === 'pass_play') ||
    (gameMode === 'online' && onlineRole === currentPlayer);

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
              PRO RIG v2.5
            </span>
          </div>
        </div>

        {/* Center: Mode Quick Select (Matching Chess Layout) */}
        <div className="flex items-center gap-1 border-2 border-black bg-black p-0.5">
          <button
            onClick={() => {
              if (gameMode === 'online') handleLeaveRoom();
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
              if (gameMode === 'online') handleLeaveRoom();
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
            className={`px-2.5 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors flex items-center gap-1 ${
              gameMode === 'online' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>ONLINE PvP</span>
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {gameMode === 'online' && onlineRoomCode && (
            <>
              <button
                onClick={handleCopyLink}
                className="brutal-press flex items-center gap-1 px-2.5 py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
                title="Copy Match Invitation Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'COPIED' : 'INVITE LINK'}</span>
              </button>

              <button
                onClick={handleLeaveRoom}
                className="brutal-press flex items-center gap-1 px-2.5 py-1.5 bg-[#ef4444] hover:bg-red-500 text-white border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
                title="Leave Room"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LEAVE</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowRules(true)}
            className="brutal-press p-1.5 bg-white hover:bg-neutral-100 text-black border-2 border-black cursor-pointer brutal-shadow-sm"
            title="8-Ball Rules & Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {gameMode !== 'online' && (
            <button
              onClick={resetGame}
              className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
              title="Re-rack Table & Start New Match"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RE-RACK TABLE</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Pool Arena Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-5 min-h-0">
        
        {/* Left Column: Player Status HUD + Pool Canvas + Side Power Cue Stick */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[960px] shrink-0">
          
          {/* Top Scoreboard & Player HUD (CrazyGames Style) */}
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

            {/* Turn Announcement, Timer & Status Center Badge */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 bg-black text-[#facc15] border border-black">
                  {isMoving
                    ? 'BALLS IN MOTION...'
                    : isBotThinking
                    ? 'BOT CALCULATING...'
                    : gameMode === 'online' && onlineRole !== currentPlayer
                    ? 'OPPONENT AIMING...'
                    : `${currentPlayer === 'p1' ? 'PLAYER 1' : 'PLAYER 2'} TO SHOOT`}
                </span>
                {timeControl !== null && (
                  <span className={`font-mono text-[10px] font-black px-1.5 py-0.5 border border-black ${
                    timer <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black'
                  }`}>
                    ⏱ {timer}s
                  </span>
                )}
              </div>
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

          {/* Interactive Pool Table Canvas + Integrated Miniclip-Style Vertical Power Rig */}
          <div className="w-full flex items-stretch gap-2.5">
            
            {/* Main Pool Canvas */}
            <div className="relative flex-1 aspect-[960/480] border-4 border-black bg-black brutal-shadow-xl overflow-hidden cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={TABLE_WIDTH}
                height={TABLE_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
                className="w-full h-full block select-none"
                style={{ touchAction: 'none' }}
              />

              {/* Ball-in-Hand Floating Alert */}
              {isBallInHand && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#facc15] text-black font-brutal text-xs font-black uppercase px-3 py-1.5 border-2 border-black brutal-shadow-sm animate-pulse pointer-events-none">
                  📍 BALL IN HAND — CLICK ANYWHERE TO PLACE CUE BALL
                </div>
              )}

              {/* Opponent Aiming Visual Notice */}
              {gameMode === 'online' && onlineRole !== currentPlayer && (
                <div className="absolute bottom-3 left-4 bg-black/90 text-[#22c55e] font-mono text-[11px] font-black uppercase px-2.5 py-1 border border-[#22c55e] pointer-events-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
                  <span>OPPONENT AIMING LIVE...</span>
                </div>
              )}
            </div>

            {/* Miniclip / CrazyGames Style Vertical Power Cue Stick Rig */}
            <div className="w-14 sm:w-16 bg-[#f4f4eb] border-3 border-black brutal-shadow flex flex-col items-center justify-between p-1.5 shrink-0 select-none">
              <span className="font-mono text-[9px] font-black uppercase text-center leading-none py-0.5">
                CUE POWER
              </span>

              {/* Vertical Draggable Power Cue Track */}
              <div
                ref={powerRigRef}
                onPointerDown={handlePowerRigPointerDown}
                onPointerMove={handlePowerRigPointerMove}
                onPointerUp={handlePowerRigPointerUp}
                className="relative flex-1 w-9 bg-black border-2 border-black my-1 rounded-sm overflow-hidden cursor-ns-resize"
                title="Click and drag down to charge power — release to shoot!"
              >
                {/* Power Fill Meter */}
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-75"
                  style={{
                    height: `${power}%`,
                    background: power > 75 ? '#ef4444' : power > 45 ? '#facc15' : '#22c55e'
                  }}
                />

                {/* Cue Stick Graphic sliding downwards */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-[#d97706] via-[#fef08a] to-[#78350f] border-x border-black transition-transform"
                  style={{
                    top: `${Math.max(4, (power / 100) * 160)}px`,
                    bottom: '-120px'
                  }}
                >
                  <div className="w-full h-3 bg-[#22c55e] border-b border-black" />
                </div>

                {[25, 50, 75].map((tick) => (
                  <div
                    key={tick}
                    className="absolute left-0 right-0 border-b border-white/30 pointer-events-none"
                    style={{ bottom: `${tick}%` }}
                  />
                ))}
              </div>

              {/* Power % Label */}
              <div className="font-mono text-[10px] font-black bg-black text-[#22c55e] px-1 py-0.5 w-full text-center border border-black mb-1">
                {power}%
              </div>

              <span className="text-[8px] font-mono font-bold text-neutral-600 text-center leading-none">
                PULL & RELEASE
              </span>
            </div>
          </div>

          {/* Bottom Cue Stick Control Station */}
          <div className="w-full bg-[#f4f4eb] text-black border-3 border-black p-3 brutal-shadow flex items-center justify-between gap-3 flex-wrap">
            
            {/* Fine Aim Micro Adjusters */}
            <div className="flex items-center gap-1 font-mono text-xs font-black">
              <span className="uppercase text-[11px] mr-1 hidden sm:inline">FINE AIM:</span>
              <button
                onClick={() => updateAimAngle(aimAngle - 0.0175)}
                disabled={!isMyTurn || isMoving}
                className="brutal-press px-2 py-1.5 bg-white hover:bg-neutral-100 disabled:opacity-40 border-2 border-black font-bold cursor-pointer"
                title="Micro-adjust aim left 1 degree"
              >
                ◀ -1.0°
              </button>
              <button
                onClick={() => updateAimAngle(aimAngle - 0.002)}
                disabled={!isMyTurn || isMoving}
                className="brutal-press px-2 py-1.5 bg-white hover:bg-neutral-100 disabled:opacity-40 border-2 border-black font-bold cursor-pointer"
                title="Super-fine adjust left 0.1 degree"
              >
                -0.1°
              </button>
              <button
                onClick={() => updateAimAngle(aimAngle + 0.002)}
                disabled={!isMyTurn || isMoving}
                className="brutal-press px-2 py-1.5 bg-white hover:bg-neutral-100 disabled:opacity-40 border-2 border-black font-bold cursor-pointer"
                title="Super-fine adjust right 0.1 degree"
              >
                +0.1°
              </button>
              <button
                onClick={() => updateAimAngle(aimAngle + 0.0175)}
                disabled={!isMyTurn || isMoving}
                className="brutal-press px-2 py-1.5 bg-white hover:bg-neutral-100 disabled:opacity-40 border-2 border-black font-bold cursor-pointer"
                title="Micro-adjust aim right 1 degree"
              >
                +1.0° ▶
              </button>
            </div>

            {/* Cue Ball Spin / English Controller */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black uppercase hidden md:inline">SPIN:</span>
              <div
                ref={spinWidgetRef}
                onPointerDown={handleSpinPointerDown}
                onPointerMove={handleSpinPointerMove}
                onPointerUp={handleSpinPointerUp}
                className="relative w-9 h-9 rounded-full bg-white border-2 border-black shadow-inner cursor-pointer shrink-0"
                title="Drag red dot to apply cue ball spin (draw/backspin, follow/topspin, sidespin)"
              >
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-300" />
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-neutral-300" />
                <div
                  className="absolute w-3 h-3 rounded-full bg-red-600 border border-black -translate-x-1/2 -translate-y-1/2 shadow-xs"
                  style={{
                    left: `${50 + cueSpin.x * 35}%`,
                    top: `${50 + cueSpin.y * 35}%`
                  }}
                />
              </div>

              {(cueSpin.x !== 0 || cueSpin.y !== 0) && (
                <button
                  onClick={() => updateSpin({ x: 0, y: 0 })}
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-white border border-black hover:bg-neutral-100 cursor-pointer"
                  title="Reset cue ball spin to center stun shot"
                >
                  CENTER
                </button>
              )}
            </div>

            {/* Power Quick Presets */}
            <div className="hidden lg:flex items-center gap-1 font-mono text-[10px] font-bold">
              {[
                { label: '35%', val: 35 },
                { label: '60%', val: 60 },
                { label: '85%', val: 85 },
                { label: 'MAX', val: 100 }
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => updatePower(p.val)}
                  disabled={!isMyTurn || isMoving}
                  className={`px-1.5 py-1 border border-black cursor-pointer ${
                    power === p.val ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* STRIKE CUE BALL BUTTON */}
            <button
              onClick={() => strikeCueBall(aimAngle, power)}
              disabled={!isMyTurn || isMoving || isBotThinking}
              className="brutal-press px-5 py-2.5 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-2 shrink-0"
            >
              <Crosshair className="w-4 h-4 stroke-[2.5]" />
              <span>STRIKE CUE BALL ▶</span>
            </button>
          </div>
        </div>

        {/* Right Column: Tactical Command Station (Matching Chess Game UI Exactly) */}
        <div className="relative z-10 w-full xl:w-[340px] flex flex-col gap-3 shrink-0">
          
          {/* 1. MATCH OPPONENT & MULTIPLAYER SELECTOR (Exact layout as ChessGame.jsx) */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Match Opponent
              </span>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#facc15] text-black border border-black">
                {gameMode === 'ai' ? '🤖 vs COMPUTER' : gameMode === 'pass_play' ? '👥 1v1 LOCAL' : '⚡ ONLINE PvP'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  if (gameMode === 'online') handleLeaveRoom();
                  setGameMode('ai');
                  resetGame();
                }}
                className={`brutal-press py-2.5 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'ai'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Bot className="w-5 h-5 mb-0.5 text-black" />
                <span className="font-brutal text-xs font-black">vs BOT AI</span>
                <span className="text-[9px] font-mono font-black text-black opacity-80">Billiards Bot</span>
              </button>

              <button
                onClick={() => {
                  if (gameMode === 'online') handleLeaveRoom();
                  setGameMode('pass_play');
                  resetGame();
                }}
                className={`brutal-press py-2.5 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'pass_play'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Users className="w-5 h-5 mb-0.5 text-black" />
                <span className="font-brutal text-xs font-black">1v1 LOCAL</span>
                <span className="text-[9px] font-mono font-black text-black opacity-80">Pass & Play</span>
              </button>

              <button
                onClick={() => setIsOnlineModalOpen(true)}
                className={`brutal-press py-2.5 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'online'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Wifi className="w-5 h-5 mb-0.5 text-black animate-pulse" />
                <span className="font-brutal text-xs font-black">ONLINE</span>
                <span className="text-[9px] font-mono font-black text-black opacity-80">PvP Lobby</span>
              </button>
            </div>

            {/* AI Difficulty Sub-panel (When in vs AI mode) */}
            {gameMode === 'ai' && (
              <div className="border-t-2 border-black pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-black">
                  <span className="uppercase text-black">BOT DIFFICULTY:</span>
                  <span className="bg-black text-[#22c55e] px-2 py-0.5 border border-black font-mono font-black">
                    ~{difficulty === 'easy' ? '800' : difficulty === 'medium' ? '1400' : '2000'} ELO
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs font-black">
                  {[
                    { id: 'easy', label: 'CADET', desc: '~800' },
                    { id: 'medium', label: 'SHARK', desc: '~1400' },
                    { id: 'hard', label: 'HUSTLER', desc: '~2000' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setDifficulty(lvl.id)}
                      className={`brutal-press py-1.5 border-2 border-black cursor-pointer flex flex-col items-center ${
                        difficulty === lvl.id ? 'bg-[#22c55e] text-black brutal-shadow-sm' : 'bg-white hover:bg-neutral-100 text-black'
                      }`}
                    >
                      <span>{lvl.label}</span>
                      <span className="text-[9px] opacity-75">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated Online Multiplayer Card (When in online mode or ready to play online) */}
            {gameMode === 'online' ? (
              <div className="border-t-2 border-black pt-2 space-y-2">
                <div className="p-3 bg-black text-white border-2 border-black space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">POOL ROOM:</span>
                    <span className="font-black text-[#22c55e] tracking-widest text-sm">{onlineRoomCode || 'CONNECTING...'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-400">YOUR ROLE:</span>
                    <span className="font-bold text-[#facc15]">{onlineRole === 'p1' ? 'HOST (P1 - BREAK)' : 'GUEST (P2)'}</span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={handleCopyCode}
                      className="brutal-press flex-1 py-1.5 bg-white text-black font-mono text-[10px] font-black uppercase border border-white flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3 text-black" />}
                      <span>{copiedCode ? 'COPIED' : 'COPY CODE'}</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="brutal-press flex-1 py-1.5 bg-[#facc15] text-black font-mono text-[10px] font-black uppercase border border-black flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-black" /> : <Share2 className="w-3 h-3 text-black" />}
                      <span>{copiedLink ? 'LINK COPIED' : 'SHARE LINK'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsOnlineModalOpen(true)}
                  className="brutal-press w-full py-2 bg-white hover:bg-neutral-100 text-black font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Wifi className="w-4 h-4 text-black" />
                  <span>OPEN ONLINE LOBBY (CUSTOM ROOM / QUICK MATCH) ▶</span>
                </button>

                <button
                  onClick={handleLeaveRoom}
                  className="brutal-press w-full py-2 bg-[#ef4444] hover:bg-red-500 text-white font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LEAVE ONLINE MATCH</span>
                </button>
              </div>
            ) : (
              <div className="border-t-2 border-black pt-2">
                <button
                  onClick={() => setIsOnlineModalOpen(true)}
                  className="brutal-press w-full py-2.5 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Wifi className="w-4 h-4 text-black" />
                  <span>OPEN ONLINE MULTIPLAYER LOBBY ▶</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Ball Racks & Sunk Status */}
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

          {/* 3. Table Felt Themes & Shot Clock */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3 brutal-shadow space-y-2.5">
            <span className="font-brutal text-xs font-black uppercase tracking-wide block border-b-2 border-black pb-1">
              ARENA THEME & TIMER
            </span>

            {/* Table Felt Themes */}
            <div className="space-y-1">
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

            {gameMode === 'online' ? (
              <div className="space-y-2 pt-2">
                {opponentOfferedRematch ? (
                  <button
                    onClick={() => {
                      if (socket && onlineRoomCode) {
                        socket.emit('pool_accept_rematch', { roomId: onlineRoomCode });
                      }
                    }}
                    className="brutal-press w-full py-3 bg-[#facc15] hover:bg-yellow-400 text-black font-brutal text-xs font-black uppercase border-3 border-black cursor-pointer brutal-shadow flex items-center justify-center gap-2 animate-bounce"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ACCEPT OPPONENT'S REMATCH!</span>
                  </button>
                ) : rematchOffered ? (
                  <div className="p-2.5 bg-neutral-200 border-2 border-black font-mono text-xs font-black text-center">
                    WAITING FOR OPPONENT TO ACCEPT REMATCH...
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (socket && onlineRoomCode) {
                        socket.emit('pool_offer_rematch', { roomId: onlineRoomCode });
                        setRematchOffered(true);
                      }
                    }}
                    className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-xs font-black uppercase border-3 border-black cursor-pointer brutal-shadow flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>OFFER REMATCH ▶</span>
                  </button>
                )}

                <button
                  onClick={handleLeaveRoom}
                  className="brutal-press w-full py-2 bg-white text-black hover:bg-neutral-100 font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer"
                >
                  RETURN TO LOBBY
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={resetGame}
                  className="brutal-press flex-1 py-3 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-sm font-black uppercase border-3 border-black cursor-pointer brutal-shadow flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RE-RACK & PLAY AGAIN</span>
                </button>
                <button
                  onClick={() => setGameOver(false)}
                  className="brutal-press px-4 py-3 bg-white hover:bg-neutral-100 text-black font-brutal text-xs font-black uppercase border-3 border-black cursor-pointer"
                  title="Review table position"
                >
                  REVIEW FELT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs modal-backdrop-anim select-none"
          onClick={() => setShowRules(false)}
        >
          <div
            className={`w-full max-w-xl border-4 border-black p-5 sm:p-6 brutal-shadow-xl modal-content-anim ${
              isDarkTheme ? 'bg-[#18181b] text-white' : 'bg-white text-black'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-sm">
                  🎱
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Cyber 8-Ball Pool Rules & Controls
                </h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="brutal-press p-1 hover:bg-neutral-100 border-2 border-black cursor-pointer"
              >
                <CloseIcon className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs sm:text-sm max-h-[70vh] overflow-y-auto pr-1">
              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  1. Aiming & Power Controls (CrazyGames Style)
                </strong>
                • <strong>Aim:</strong> Move your mouse around the cue ball to rotate the cue stick and laser trajectory guide.<br/>
                • <strong>Pull-Back Shoot:</strong> Click and drag the cue stick backward on the table to charge power, then release to shoot!<br/>
                • <strong>Side Power Bar:</strong> You can also drag the vertical power cue bar on the side down and release to shoot.<br/>
                • <strong>Fine Aim:</strong> Use the <code>[-1.0°] [-0.1°] [+0.1°] [+1.0°]</code> buttons or mouse wheel for micro-adjustments.<br/>
                • <strong>Keyboard:</strong> Arrow Left/Right to aim, Arrow Up/Down for power, <code>Space</code> to strike.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. 8-Ball Game Objective
                </strong>
                Pocket all 7 balls of your assigned group (Solids 1–7 or Stripes 9–15), and then legally sink the 8-Ball (Black) to win the match.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Fouls & Ball in Hand
                </strong>
                • Scratching the cue ball, hitting the opponent's ball first, or failing to hit any ball results in a foul.<br/>
                • On a foul, the opponent receives <strong>Ball in Hand</strong> and can click anywhere on the felt to place the cue ball.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  4. Real-Time Online Multiplayer
                </strong>
                Click <strong>ONLINE PvP</strong> to match instantly via Quick Match or generate a custom 6-character room code to invite a friend with a direct shareable link!
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setShowRules(false)}
                className="brutal-press px-4 py-2 bg-[#22c55e] hover:bg-green-400 text-black font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm"
              >
                GOT IT // LET'S PLAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        roomParamKey="pool_room"
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
        onLeaveRoom={handleLeaveRoom}
        isSearchingQuickMatch={isSearchingQuickMatch}
        roomCode={onlineRoomCode}
        onlineStatus={onlineStatus}
        isConnected={socketConnected}
      />
    </div>
  );
};
