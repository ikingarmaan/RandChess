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
  Sliders,
  Wifi,
  Copy,
  Check,
  Zap,
  Share2,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { sound } from '../utils/sound';
import { OnlineLobbyModal } from './OnlineLobbyModal';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 70;
const BALL_SIZE = 10;

export const PongGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue,
  socket = null,
  socketConnected = false,
  playerId = null
}) => {
  const canvasRef = useRef(null);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play' | 'online'
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [targetScore, setTargetScore] = useState(5); // 5 | 7 | 10
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [winner, setWinner] = useState(null); // 'p1' | 'p2' | null
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);

  // Online Multiplayer State
  const [onlineRoomCode, setOnlineRoomCode] = useState(null);
  const [onlineRole, setOnlineRole] = useState(null); // 'p1' (Left Emerald) | 'p2' (Right Yellow)
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(null);
  const [rematchOffered, setRematchOffered] = useState(false);
  const [opponentOfferedRematch, setOpponentOfferedRematch] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const lastPaddleEmitRef = useRef(0);
  const lastEmittedYRef = useRef(-1);
  const lastBallSyncRef = useRef(0);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Deep-link auto-join for ?pong_room=CODE
  useEffect(() => {
    if (!socket || !socketConnected) return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('pong_room');
    if (roomParam && !onlineRoomCode) {
      socket.emit('join_pong_room', { roomId: roomParam, playerId }, (res) => {
        if (res && res.success) {
          setOnlineRoomCode(roomParam.toUpperCase());
          setOnlineRole(res.role);
          if (res.targetScore) setTargetScore(res.targetScore);
          setGameMode('online');
          if (res.waiting) {
            setIsOnlineModalOpen(true);
          } else {
            setIsPlaying(true);
          }
        } else {
          setOnlineStatus(res?.error || 'Failed to join match');
        }
      });
    }
  }, [socket, socketConnected, playerId, onlineRoomCode]);

  // Reset ball to center
  const resetBall = useCallback((towardPlayer = 1) => {
    stateRef.current.ballX = CANVAS_WIDTH / 2;
    stateRef.current.ballY = CANVAS_HEIGHT / 2;
    const baseSpeed = 5;
    stateRef.current.ballVX = towardPlayer === 1 ? -baseSpeed : baseSpeed;
    stateRef.current.ballVY = (Math.random() - 0.5) * 6;
  }, []);

  // Socket event listeners for Online Multiplayer
  useEffect(() => {
    if (!socket) return;

    const handlePongGameStarted = ({ roomId, p1, p1Id, p2, p2Id, targetScore: ts }) => {
      setOnlineRoomCode(roomId);
      if (ts) setTargetScore(ts);
      const myRole = playerId === p1Id ? 'p1' : socket.id === p1 ? 'p1' : 'p2';
      setOnlineRole(myRole);
      setScores({ p1: 0, p2: 0 });
      stateRef.current.p1Score = 0;
      stateRef.current.p2Score = 0;
      stateRef.current.p1Y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
      stateRef.current.p2Y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
      setWinner(null);
      setRematchOffered(false);
      setOpponentOfferedRematch(false);
      setOnlineStatus(null);
      setIsOnlineModalOpen(false);
      setIsSearchingQuickMatch(false);
      setGameMode('online');
      setIsPlaying(true);
      resetBall(1);
    };

    const handlePongOpponentPaddle = ({ y }) => {
      if (onlineRole === 'p1') {
        stateRef.current.p2Y = y;
      } else {
        stateRef.current.p1Y = y;
      }
    };

    const handlePongBallSynced = ({ ballX, ballY, ballVX, ballVY, scores: sc }) => {
      if (onlineRole === 'p2') {
        stateRef.current.ballX = ballX;
        stateRef.current.ballY = ballY;
        stateRef.current.ballVX = ballVX;
        stateRef.current.ballVY = ballVY;
        if (sc) {
          stateRef.current.p1Score = sc.p1;
          stateRef.current.p2Score = sc.p2;
          setScores({ p1: sc.p1, p2: sc.p2 });
        }
      }
    };

    const handlePongGoalScored = ({ scorer, scores: sc, winner: w }) => {
      if (sc) {
        stateRef.current.p1Score = sc.p1;
        stateRef.current.p2Score = sc.p2;
        setScores({ p1: sc.p1, p2: sc.p2 });
      }
      if (w) {
        setWinner(w);
        setIsPlaying(false);
        if (w === onlineRole) {
          sound.playCheck();
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#22c55e', '#ffffff', '#000000']
          });
        } else {
          sound.playGameOver();
        }
      } else {
        if (scorer === onlineRole) {
          sound.playCheck();
        } else {
          sound.playGameOver();
        }
        resetBall(scorer === 'p1' ? 2 : 1);
      }
    };

    const handlePongRematchOffered = () => {
      setOpponentOfferedRematch(true);
      sound.playCheck();
    };

    const handlePongOpponentDisconnected = () => {
      setOnlineStatus('Opponent disconnected from match.');
      setIsPlaying(false);
    };

    socket.on('pong_game_started', handlePongGameStarted);
    socket.on('pong_opponent_paddle', handlePongOpponentPaddle);
    socket.on('pong_ball_synced', handlePongBallSynced);
    socket.on('pong_goal_scored', handlePongGoalScored);
    socket.on('pong_rematch_offered', handlePongRematchOffered);
    socket.on('pong_opponent_disconnected', handlePongOpponentDisconnected);

    return () => {
      socket.off('pong_game_started', handlePongGameStarted);
      socket.off('pong_opponent_paddle', handlePongOpponentPaddle);
      socket.off('pong_ball_synced', handlePongBallSynced);
      socket.off('pong_goal_scored', handlePongGoalScored);
      socket.off('pong_rematch_offered', handlePongRematchOffered);
      socket.off('pong_opponent_disconnected', handlePongOpponentDisconnected);
    };
  }, [socket, playerId, onlineRole, resetBall]);

  // Mouse and touch paddle movement
  const handleCanvasPointer = useCallback((clientY) => {
    if (!isPlaying || winner !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const relativeY = clientY - rect.top;
    const targetY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, relativeY * scaleY - PADDLE_HEIGHT / 2));

    if (gameMode === 'online' && onlineRole === 'p2') {
      stateRef.current.p2Y = targetY;
    } else {
      stateRef.current.p1Y = targetY;
    }
  }, [isPlaying, winner, gameMode, onlineRole]);

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
      if (e.key === ' ' && winner === null && gameMode !== 'online') {
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
  }, [winner, gameMode]);

  // Broadcast Paddle Position (Throttled ~30ms)
  const maybeEmitPaddle = useCallback(() => {
    if (gameMode !== 'online' || !onlineRoomCode || !socket || !socketConnected) return;
    const now = Date.now();
    const myY = onlineRole === 'p2' ? stateRef.current.p2Y : stateRef.current.p1Y;
    if (Math.abs(myY - lastEmittedYRef.current) > 0.5 && now - lastPaddleEmitRef.current > 30) {
      lastPaddleEmitRef.current = now;
      lastEmittedYRef.current = myY;
      socket.emit('pong_paddle_move', { roomId: onlineRoomCode, y: myY });
    }
  }, [gameMode, onlineRoomCode, onlineRole, socket, socketConnected]);

  // Broadcast Ball Sync (Host Authoritative)
  const emitBallSync = useCallback((s) => {
    if (gameMode === 'online' && onlineRole === 'p1' && onlineRoomCode && socket && socketConnected) {
      socket.emit('pong_ball_sync', {
        roomId: onlineRoomCode,
        ballX: s.ballX,
        ballY: s.ballY,
        ballVX: s.ballVX,
        ballVY: s.ballVY,
        scores: { p1: s.p1Score, p2: s.p2Score }
      });
    }
  }, [gameMode, onlineRole, onlineRoomCode, socket, socketConnected]);

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

        if (gameMode === 'online') {
          // ONLINE MODE CONTROLS
          if (onlineRole === 'p2') {
            // Player 2 controls Right Paddle (Yellow)
            if (s.keys.w || s.keys.ArrowUp) {
              s.p2Y = Math.max(0, s.p2Y - paddleSpeed);
            }
            if (s.keys.s || s.keys.ArrowDown) {
              s.p2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.p2Y + paddleSpeed);
            }
          } else {
            // Player 1 controls Left Paddle (Emerald)
            if (s.keys.w || s.keys.ArrowUp) {
              s.p1Y = Math.max(0, s.p1Y - paddleSpeed);
            }
            if (s.keys.s || s.keys.ArrowDown) {
              s.p1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.p1Y + paddleSpeed);
            }
          }
          maybeEmitPaddle();

          if (onlineRole === 'p1') {
            // Host executes authoritative ball physics
            s.ballX += s.ballVX;
            s.ballY += s.ballVY;

            // Top/Bottom wall bounce
            if (s.ballY <= 0 || s.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
              s.ballVY = -s.ballVY;
              sound.playMove();
            }

            // Paddle 1 Collision (Left - Emerald)
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
              emitBallSync(s);
            }

            // Paddle 2 Collision (Right - Yellow)
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
              emitBallSync(s);
            }

            // Periodic Ball Sync (~30 FPS)
            const now = Date.now();
            if (now - lastBallSyncRef.current > 33) {
              lastBallSyncRef.current = now;
              emitBallSync(s);
            }

            // Left Goal (Player 2 scores)
            if (s.ballX < 0) {
              sound.playGameOver();
              s.p2Score++;
              setScores({ p1: s.p1Score, p2: s.p2Score });
              const isWin = s.p2Score >= targetScore;
              if (socket && socketConnected && onlineRoomCode) {
                socket.emit('pong_goal', {
                  roomId: onlineRoomCode,
                  scorer: 'p2',
                  scores: { p1: s.p1Score, p2: s.p2Score },
                  winner: isWin ? 'p2' : null
                });
              }
              if (isWin) {
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
              const isWin = s.p1Score >= targetScore;
              if (socket && socketConnected && onlineRoomCode) {
                socket.emit('pong_goal', {
                  roomId: onlineRoomCode,
                  scorer: 'p1',
                  scores: { p1: s.p1Score, p2: s.p2Score },
                  winner: isWin ? 'p1' : null
                });
              }
              if (isWin) {
                setWinner('p1');
                setIsPlaying(false);
                confetti({
                  particleCount: 110,
                  spread: 80,
                  origin: { y: 0.5 },
                  colors: ['#22c55e', '#ffffff', '#000000']
                });
              } else {
                resetBall(2);
              }
            }
          } else {
            // Player 2 Client: smooth forward motion between sync packets
            s.ballX += s.ballVX;
            s.ballY += s.ballVY;
            if (s.ballY <= 0 || s.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
              s.ballVY = -s.ballVY;
            }
          }
        } else {
          // LOCAL & AI BOT MODES
          if (s.keys.w || (gameMode === 'ai' && s.keys.ArrowUp)) {
            s.p1Y = Math.max(0, s.p1Y - paddleSpeed);
          }
          if (s.keys.s || (gameMode === 'ai' && s.keys.ArrowDown)) {
            s.p1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.p1Y + paddleSpeed);
          }

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
              confetti({
                particleCount: 110,
                spread: 80,
                origin: { y: 0.5 },
                colors: ['#22c55e', '#ffffff', '#000000']
              });
            } else {
              resetBall(2);
            }
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

      // Player Indicators on Court
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#22c55e';
      ctx.fillText(
        gameMode === 'online'
          ? (onlineRole === 'p1' ? 'YOU (P1)' : 'OPPONENT (P1)')
          : 'PLAYER 1',
        CANVAS_WIDTH / 4,
        85
      );

      ctx.fillStyle = '#facc15';
      ctx.fillText(
        gameMode === 'online'
          ? (onlineRole === 'p2' ? 'YOU (P2)' : 'OPPONENT (P2)')
          : (gameMode === 'ai' ? 'BOT AI' : 'PLAYER 2'),
        (3 * CANVAS_WIDTH) / 4,
        85
      );

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
  }, [
    isPlaying,
    winner,
    gameMode,
    botDifficulty,
    targetScore,
    resetBall,
    onlineRole,
    onlineRoomCode,
    socket,
    socketConnected,
    maybeEmitPaddle,
    emitBallSync
  ]);

  const restartMatch = () => {
    stateRef.current.p1Score = 0;
    stateRef.current.p2Score = 0;
    setScores({ p1: 0, p2: 0 });
    setWinner(null);
    resetBall(1);
    setIsPlaying(true);
  };

  const handleOfferRematch = () => {
    if (gameMode !== 'online' || !onlineRoomCode || !socket) return;
    setRematchOffered(true);
    socket.emit('pong_offer_rematch', { roomId: onlineRoomCode });
  };

  const handleAcceptRematch = () => {
    if (gameMode !== 'online' || !onlineRoomCode || !socket) return;
    socket.emit('pong_accept_rematch', { roomId: onlineRoomCode });
  };

  const handleLeaveRoom = () => {
    if (socket && onlineRoomCode) {
      socket.emit('pong_leave_room', { roomId: onlineRoomCode });
    }
    setOnlineRoomCode(null);
    setOnlineRole(null);
    setRematchOffered(false);
    setOpponentOfferedRematch(false);
    setOnlineStatus(null);
    setGameMode('ai');
    setIsPlaying(false);
    stateRef.current.p1Score = 0;
    stateRef.current.p2Score = 0;
    setScores({ p1: 0, p2: 0 });
    setWinner(null);
    resetBall(1);
    const url = new URL(window.location.href);
    if (url.searchParams.has('pong_room')) {
      url.searchParams.delete('pong_room');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleCopyLink = () => {
    if (!onlineRoomCode) return;
    const url = `${window.location.origin}?pong_room=${onlineRoomCode}`;
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
                {gameMode === 'online' ? 'ONLINE MULTIPLAYER' : '60 FPS ARCADE'} • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              {gameMode === 'online'
                ? `ROOM: ${onlineRoomCode || 'CONNECTING...'} // ROLE: ${onlineRole === 'p1' ? 'HOST (EMERALD)' : 'GUEST (YELLOW)'}`
                : 'VECTOR PADDLE PHYSICS // REACTIVE DEFLECTION // SPLIT-SECOND RALLIES'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {gameMode === 'online' && onlineRoomCode && (
            <>
              <button
                onClick={handleCopyLink}
                className="brutal-press px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
                title="Copy Match Invitation Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-black" /> : <Share2 className="w-3.5 h-3.5 text-black" />}
                <span className="hidden md:inline">{copiedLink ? 'LINK COPIED' : 'INVITE LINK'}</span>
              </button>

              <button
                onClick={handleLeaveRoom}
                className="brutal-press px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[#ef4444] hover:bg-red-500 text-white border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
                title="Leave Room"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">LEAVE</span>
              </button>
            </>
          )}

          <button
            onClick={() => setSoundActive(!soundActive)}
            className="brutal-press p-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="Toggle Sound"
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

          {gameMode !== 'online' && (
            <button
              onClick={restartMatch}
              className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: Canvas Court */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[660px] shrink-0">
          
          {/* Status Pill */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <span className="font-brutal text-xs sm:text-sm font-black uppercase truncate">
              {onlineStatus ? (
                <span className="text-[#ef4444]">{onlineStatus}</span>
              ) : winner ? (
                gameMode === 'online' ? (
                  winner === onlineRole ? (
                    <span className="text-[#22c55e]">👑 YOU WON THE MATCH! ({scores[winner]} - {scores[winner === 'p1' ? 'p2' : 'p1']})</span>
                  ) : (
                    <span className="text-[#ef4444]">OPPONENT WON THE MATCH ({scores[winner]} - {scores[winner === 'p1' ? 'p2' : 'p1']})</span>
                  )
                ) : (
                  `${winner === 'p1' ? 'PLAYER 1 (EMERALD)' : 'PLAYER 2 (YELLOW)'} WINS THE MATCH!`
                )
              ) : isPlaying ? (
                gameMode === 'online' ? (
                  onlineRole === 'p1' ? (
                    <span>YOU: <strong className="text-[#22c55e]">EMERALD PADDLE (LEFT)</strong> • OPPONENT: <strong className="text-[#facc15]">YELLOW</strong></span>
                  ) : (
                    <span>OPPONENT: <strong className="text-[#22c55e]">EMERALD</strong> • YOU: <strong className="text-[#facc15]">YELLOW PADDLE (RIGHT)</strong></span>
                  )
                ) : (
                  'MATCH IN PLAY • USE W/S OR ARROWS'
                )
              ) : (
                gameMode === 'online' ? 'WAITING FOR OPPONENT TO CONNECT...' : 'MATCH PAUSED • PRESS SPACE OR START'
              )}
            </span>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-white shrink-0">
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
            {gameMode !== 'online' ? (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="brutal-press flex-1 py-2.5 bg-[#22c55e] hover:bg-green-400 border-2 border-black text-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'PAUSE MATCH' : 'START / RESUME MATCH'}</span>
              </button>
            ) : (
              <div className="flex-1 py-2.5 px-3 bg-neutral-100 border-2 border-black font-mono text-xs font-black text-black flex items-center justify-between">
                <span>ONLINE PvP: {onlineRoomCode || 'CONNECTING'}</span>
                <span className="px-1.5 py-0.5 bg-[#22c55e] text-black border border-black text-[10px]">
                  {onlineRole === 'p1' ? 'YOU: EMERALD (LEFT)' : 'YOU: YELLOW (RIGHT)'}
                </span>
              </div>
            )}

            <div className="flex gap-1.5">
              <button
                onMouseDown={() => {
                  stateRef.current.keys.w = true;
                  stateRef.current.keys.ArrowUp = true;
                }}
                onMouseUp={() => {
                  stateRef.current.keys.w = false;
                  stateRef.current.keys.ArrowUp = false;
                }}
                onTouchStart={() => {
                  stateRef.current.keys.w = true;
                  stateRef.current.keys.ArrowUp = true;
                }}
                onTouchEnd={() => {
                  stateRef.current.keys.w = false;
                  stateRef.current.keys.ArrowUp = false;
                }}
                className="brutal-press px-4 py-2.5 bg-[#facc15] hover:bg-yellow-400 border-2 border-black text-black font-brutal text-xs font-black uppercase cursor-pointer select-none"
                title="Move Paddle Up"
              >
                ▲ UP
              </button>
              <button
                onMouseDown={() => {
                  stateRef.current.keys.s = true;
                  stateRef.current.keys.ArrowDown = true;
                }}
                onMouseUp={() => {
                  stateRef.current.keys.s = false;
                  stateRef.current.keys.ArrowDown = false;
                }}
                onTouchStart={() => {
                  stateRef.current.keys.s = true;
                  stateRef.current.keys.ArrowDown = true;
                }}
                onTouchEnd={() => {
                  stateRef.current.keys.s = false;
                  stateRef.current.keys.ArrowDown = false;
                }}
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
                {gameMode === 'online' ? '⚡ ONLINE PvP' : gameMode === 'ai' ? '🤖 vs COMPUTER' : '👥 1v1 LOCAL'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  if (gameMode === 'online') handleLeaveRoom();
                  setGameMode('ai');
                  restartMatch();
                }}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'ai'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-white hover:bg-neutral-100 text-black font-black brutal-shadow-sm'
                }`}
              >
                <Bot className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-[11px] font-black">BOT AI</span>
                <span className="text-[8px] font-mono font-bold text-black opacity-80">Solo</span>
              </button>

              <button
                onClick={() => {
                  if (gameMode === 'online') handleLeaveRoom();
                  setGameMode('pass_play');
                  restartMatch();
                }}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'pass_play'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-white hover:bg-neutral-100 text-black font-black brutal-shadow-sm'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-[11px] font-black">LOCAL 1v1</span>
                <span className="text-[8px] font-mono font-bold text-black opacity-80">Keyboard</span>
              </button>

              <button
                onClick={() => {
                  setIsOnlineModalOpen(true);
                }}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'online'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] hover:bg-yellow-400 text-black font-black brutal-shadow-sm'
                }`}
              >
                <Wifi className="w-4 h-4 mb-0.5 text-black animate-pulse" />
                <span className="font-brutal text-[11px] font-black">ONLINE PvP</span>
                <span className="text-[8px] font-mono font-bold text-black opacity-80">Multiplayer</span>
              </button>
            </div>

            {/* Online Match Active Status Card */}
            {gameMode === 'online' && onlineRoomCode && (
              <div className="p-3 bg-black text-white border-2 border-black space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">ROOM CODE:</span>
                  <span className="font-black text-[#22c55e] tracking-widest text-sm">{onlineRoomCode}</span>
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
            )}

            {/* Target Score Selector */}
            {gameMode !== 'online' && (
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
            )}

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

          {/* Match Conclusion / Rematch Panel */}
          {winner && (
            <div className="bg-[#22c55e] text-black border-3 border-black p-4 brutal-shadow space-y-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-black" />
                <h4 className="font-brutal text-sm font-black uppercase">
                  {gameMode === 'online'
                    ? (winner === onlineRole ? 'VICTORY ACHIEVED!' : 'MATCH CONCLUDED')
                    : 'MATCH CONCLUDED!'}
                </h4>
              </div>

              <p className="font-mono text-xs font-bold">
                {gameMode === 'online'
                  ? (winner === onlineRole
                      ? `You won the match ${scores[onlineRole]} - ${scores[onlineRole === 'p1' ? 'p2' : 'p1']}!`
                      : `Opponent won the match ${scores[winner]} - ${scores[winner === 'p1' ? 'p2' : 'p1']}.`)
                  : `${winner === 'p1' ? 'Player 1' : 'Player 2'} won the match!`}
              </p>

              {gameMode === 'online' ? (
                <div className="space-y-2 pt-1">
                  {opponentOfferedRematch ? (
                    <button
                      onClick={handleAcceptRematch}
                      className="brutal-press w-full py-2.5 bg-black text-[#22c55e] hover:bg-neutral-900 font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>ACCEPT REMATCH (OPPONENT WAITING)</span>
                    </button>
                  ) : rematchOffered ? (
                    <div className="p-2 bg-black text-white text-center font-mono text-xs font-bold border-2 border-black">
                      REMATCH OFFERED // WAITING FOR OPPONENT...
                    </div>
                  ) : (
                    <button
                      onClick={handleOfferRematch}
                      className="brutal-press w-full py-2.5 bg-black text-white hover:bg-neutral-900 font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>OFFER REMATCH ↺</span>
                    </button>
                  )}

                  <button
                    onClick={handleLeaveRoom}
                    className="brutal-press w-full py-2 bg-white text-black hover:bg-neutral-100 font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>RETURN TO LOBBY</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={restartMatch}
                  className="brutal-press w-full py-2.5 bg-black text-[#22c55e] hover:bg-neutral-900 font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>PLAY AGAIN ↺</span>
                </button>
              )}
            </div>
          )}

          {/* Action Buttons Strip */}
          <div className="grid grid-cols-2 gap-2">
            {gameMode !== 'online' ? (
              <button
                onClick={restartMatch}
                className="brutal-press py-2.5 bg-[#ef4444] hover:bg-red-500 text-white font-brutal text-xs font-black uppercase border-3 border-black brutal-shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span>RESTART ROUND</span>
              </button>
            ) : (
              <button
                onClick={handleLeaveRoom}
                className="brutal-press py-2.5 bg-[#ef4444] hover:bg-red-500 text-white font-brutal text-xs font-black uppercase border-3 border-black brutal-shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>LEAVE MATCH</span>
              </button>
            )}

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

      {/* Online Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        roomParamKey="pong_room"
        onCreateRoom={({ targetScore: ts }) => {
          if (!socket || !socketConnected) {
            setOnlineStatus('Connecting to game server...');
            return;
          }
          socket.emit('create_pong_room', { targetScore: ts, playerId }, (res) => {
            if (res && res.success) {
              setOnlineRoomCode(res.roomId);
              setOnlineRole('p1');
              setTargetScore(res.targetScore || 5);
              setGameMode('online');
            }
          });
        }}
        onJoinRoom={(code) => {
          if (!socket || !socketConnected) return;
          socket.emit('join_pong_room', { roomId: code, playerId }, (res) => {
            if (res && res.success) {
              setOnlineRoomCode(code.toUpperCase());
              setOnlineRole(res.role);
              if (res.targetScore) setTargetScore(res.targetScore);
              setIsOnlineModalOpen(false);
              setGameMode('online');
              if (!res.waiting) {
                setIsPlaying(true);
              }
            } else {
              setOnlineStatus(res?.error || 'Room not found');
            }
          });
        }}
        onFindQuickMatch={({ targetScore: ts }) => {
          if (!socket || !socketConnected) return;
          setIsSearchingQuickMatch(true);
          socket.emit('find_pong_quick_match', { targetScore: ts, playerId }, (res) => {
            if (res && res.matched) {
              setIsSearchingQuickMatch(false);
              setOnlineRoomCode(res.roomId);
              setOnlineRole(res.role);
              if (res.targetScore) setTargetScore(res.targetScore);
              setIsOnlineModalOpen(false);
              setGameMode('online');
              setIsPlaying(true);
            }
          });
        }}
        onCancelQuickMatch={() => {
          if (socket) socket.emit('cancel_pong_quick_match');
          setIsSearchingQuickMatch(false);
        }}
        onLeaveRoom={handleLeaveRoom}
        isSearchingQuickMatch={isSearchingQuickMatch}
        roomCode={onlineRoomCode}
        isWaiting={gameMode === 'online' && !isPlaying && winner === null && onlineRole === 'p1' && onlineRoomCode !== null}
        onlineStatus={onlineStatus}
        isConnected={socketConnected}
      />

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
                  Cyber Pong Controls & Multiplayer
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
                  1. Player 1 (Emerald Paddle - Left)
                </strong>
                Press <strong>W</strong> to move UP, <strong>S</strong> to move DOWN (or drag directly on the screen).
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Player 2 (Yellow Paddle - Right)
                </strong>
                In 1v1 Local mode, press <strong>UP ARROW</strong> and <strong>DOWN ARROW</strong>. In Online mode as Player 2, use W/S or Arrow keys or drag on your screen!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Online Multiplayer Matchmaking
                </strong>
                Click <strong>ONLINE PvP</strong> to find a match in 1-click Quick Match or generate a private 6-character room code to invite a friend directly!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  4. Edge Deflection Spin
                </strong>
                Striking the ball near the upper or lower tips of your paddle adds high-velocity deflection spin to fool your opponent.
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
