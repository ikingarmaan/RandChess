import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { io } from 'socket.io-client';
import {
  RotateCcw,
  Sparkles,
  Settings,
  Users,
  Bot,
  Wifi,
  Volume2,
  VolumeX,
  Flag,
  Handshake,
  Repeat,
  PlusCircle,
  HelpCircle,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  BookOpen,
  Sword,
  Sliders,
  Moon,
  Sun,
  Shield,
  Play,
  Lightbulb
} from 'lucide-react';

import { ChessBoard, BOARD_THEMES } from './components/ChessBoard';
import { EvalBar } from './components/EvalBar';
import { CoachAdvisor } from './components/CoachAdvisor';
import { PlayerCard } from './components/PlayerCard';
import { MoveHistory } from './components/MoveHistory';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { FloatingPiecesBackground } from './components/FloatingPiecesBackground';

import { getBestMove, evaluateBoard } from './engine/aiEngine';
import { analyzeAndExplain } from './engine/coachExplainer';
import { sound } from './utils/sound';

// Persistent client player identity for resilient room reconnection
const getPlayerId = () => {
  try {
    let id = localStorage.getItem('randchess_player_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('randchess_player_id', id);
    }
    return id;
  } catch (e) {
    return 'usr_' + Math.random().toString(36).substring(2, 11);
  }
};

export default function App() {
  // --- Game Engine State ---
  const [chess, setChess] = useState(() => new Chess());
  const [boardFen, setBoardFen] = useState(chess.fen());
  const [evalScore, setEvalScore] = useState(0); // Centipawns (+ = White advantage)
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play' | 'online'
  const [aiDifficulty, setAiDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard' | 'master'
  const [playerColor, setPlayerColor] = useState('w'); // 'w' or 'b'
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewHistoryIndex, setViewHistoryIndex] = useState(null); // null = Live match
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
  const [materialScore, setMaterialScore] = useState(0); // + = White advantage
  const [gameOverResult, setGameOverResult] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // --- Clock / Timer State ---
  const [timeControl, setTimeControl] = useState(300); // 5 min default, null for unlimited
  const [timers, setTimers] = useState({ w: 300, b: 300 });
  const timerIntervalRef = useRef(null);

  // --- AI Coach Mode State (Defaults to OFF per user preference) ---
  const [coachEnabled, setCoachEnabled] = useState(false);
  const [coachAnalysis, setCoachAnalysis] = useState(null);
  const [showCoachArrow, setShowCoachArrow] = useState(false);
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  // --- Neo-Brutalist Layout & Tabs State ---
  const [activeTab, setActiveTab] = useState('battle'); // 'battle' | 'scoresheet' | 'coach' | 'settings'
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // --- Settings State ---
  const [boardTheme, setBoardTheme] = useState('neo_emerald');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.7);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showLegalDots, setShowLegalDots] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showLastMoveHighlight, setShowLastMoveHighlight] = useState(true);
  const [autoQueen, setAutoQueen] = useState(false);
  const [blindfoldMode, setBlindfoldMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Online Multiplayer State ---
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState(null);
  const [isWaitingOnline, setIsWaitingOnline] = useState(false);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState('');
  const [onlineMyColor, setOnlineMyColor] = useState('w');
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [drawOfferSent, setDrawOfferSent] = useState(false);
  const [drawDeclinedNotice, setDrawDeclinedNotice] = useState(false);
  const [rematchOffered, setRematchOffered] = useState(false);
  const [rematchSent, setRematchSent] = useState(false);

  // Dynamic references to eliminate stale closures in socket event listeners
  const chessRef = useRef(chess);
  useEffect(() => {
    chessRef.current = chess;
  }, [chess]);

  const onlineMyColorRef = useRef(onlineMyColor);
  useEffect(() => {
    onlineMyColorRef.current = onlineMyColor;
  }, [onlineMyColor]);

  const onlineRoomCodeRef = useRef(onlineRoomCode);
  useEffect(() => {
    onlineRoomCodeRef.current = onlineRoomCode;
  }, [onlineRoomCode]);

  // Sync sound settings with audio manager
  useEffect(() => {
    sound.enabled = soundEnabled;
    sound.voiceEnabled = voiceEnabled;
    sound.setVolume(soundVolume);
  }, [soundEnabled, voiceEnabled, soundVolume]);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  // Compute captured pieces and material score
  const calculateMaterial = useCallback((game) => {
    const counts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const board = game.board();
    const currentCounts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== 'k') {
          currentCounts[piece.color][piece.type]++;
        }
      }
    }

    const capturedW = [];
    const capturedB = [];
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let scoreW = 0;
    let scoreB = 0;

    Object.keys(counts).forEach((p) => {
      const diffB = counts[p] - currentCounts.b[p];
      for (let i = 0; i < diffB; i++) capturedW.push(p);

      const diffW = counts[p] - currentCounts.w[p];
      for (let i = 0; i < diffW; i++) capturedB.push(p.toUpperCase());

      scoreW += currentCounts.w[p] * pieceValues[p];
      scoreB += currentCounts.b[p] * pieceValues[p];
    });

    setCapturedPieces({ w: capturedW, b: capturedB });
    setMaterialScore(scoreW - scoreB);
  }, []);

  // Update AI Coach Analysis
  const runCoachAnalysis = useCallback((gameInstance, isExplicit = false) => {
    if (!coachEnabled || gameInstance.isGameOver()) {
      if (gameInstance.isGameOver()) {
        try {
          const res = analyzeAndExplain(gameInstance);
          setCoachAnalysis(res);
        } catch (e) {}
      }
      return;
    }

    if (gameMode === 'ai' && gameInstance.turn() !== playerColor) {
      return;
    }

    // In online competitive multiplayer, do not block the JS thread / network packets with Minimax
    // unless the player explicitly asks for coach advice
    if (gameMode === 'online' && !isExplicit) {
      return;
    }

    setIsCoachThinking(true);
    setTimeout(() => {
      try {
        const analysis = analyzeAndExplain(gameInstance);
        setCoachAnalysis(analysis);
        sound.playCoachAdvice();
      } catch (err) {
        console.error('Coach analysis error:', err);
      } finally {
        setIsCoachThinking(false);
      }
    }, 25);
  }, [coachEnabled, gameMode, playerColor]);

  // Stable references to prevent socket disconnect on re-renders
  const calculateMaterialRef = useRef(calculateMaterial);
  useEffect(() => {
    calculateMaterialRef.current = calculateMaterial;
  }, [calculateMaterial]);

  const runCoachAnalysisRef = useRef(runCoachAnalysis);
  useEffect(() => {
    runCoachAnalysisRef.current = runCoachAnalysis;
  }, [runCoachAnalysis]);

  // Initial coach run on mount (only if coachEnabled is true)
  useEffect(() => {
    if (coachEnabled) {
      runCoachAnalysis(chess, true);
    }
  }, [coachEnabled, runCoachAnalysis]);

  // Clock countdown timer interval
  useEffect(() => {
    if (gameOverResult || timeControl === null) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const turn = chess.turn();
      setTimers((prev) => {
        if (!prev) return prev;
        const currentVal = prev[turn];
        if (currentVal <= 1) {
          const winner = turn === 'w' ? 'b' : 'w';
          setGameOverResult({
            type: 'timeout',
            winner,
            reason: `${turn === 'w' ? 'White' : 'Black'} ran out of time on clock`
          });
          clearInterval(timerIntervalRef.current);
          return { ...prev, [turn]: 0 };
        }
        return {
          ...prev,
          [turn]: currentVal - 1
        };
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [chess, gameOverResult, timeControl]);

  // Execute a move on the board
  const executeMove = useCallback((moveCandidate) => {
    try {
      // Pawn promotion check
      const piece = chess.get(moveCandidate.from);
      if (piece && piece.type === 'p') {
        const targetRank = moveCandidate.to[1];
        if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
          if (!moveCandidate.promotion) {
            // Always show promotion dialog - never auto-queen
            setPendingPromotion(moveCandidate);
            return;
          }
        }
      }

      // Clone chess instance
      const nextGame = new Chess(chess.fen());
      const movePayload = typeof moveCandidate === 'string'
        ? moveCandidate
        : {
            from: moveCandidate.from,
            to: moveCandidate.to,
            promotion: moveCandidate.promotion
          };
      const moveResult = nextGame.move(movePayload);
      if (!moveResult) return;

      // Audio feedback
      if (moveResult.captured) {
        sound.playCapture();
      } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
        sound.playCastle();
      } else {
        sound.playMove();
      }

      if (nextGame.inCheck()) {
        sound.playCheck();
      }

      const newFen = nextGame.fen();
      setChess(nextGame);
      setBoardFen(newFen);
      setLastMove({ from: moveResult.from, to: moveResult.to });

      const newHistoryItem = {
        san: moveResult.san,
        from: moveResult.from,
        to: moveResult.to,
        piece: moveResult.piece,
        color: moveResult.color,
        fen: newFen
      };

      setHistory((prev) => [...prev, newHistoryItem]);
      setViewHistoryIndex(null); // Return to live

      calculateMaterial(nextGame);
      setEvalScore(evaluateBoard(nextGame));

      // Game over checks
      if (nextGame.isGameOver()) {
        if (nextGame.isCheckmate()) {
          const winner = nextGame.turn() === 'w' ? 'b' : 'w';
          setGameOverResult({
            type: 'checkmate',
            winner,
            reason: `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins!`
          });
        } else if (nextGame.isStalemate()) {
          setGameOverResult({ type: 'stalemate', winner: null, reason: 'Draw by Stalemate' });
        } else if (nextGame.isThreefoldRepetition()) {
          setGameOverResult({ type: 'draw', winner: null, reason: 'Draw by Threefold Repetition' });
        } else if (nextGame.isInsufficientMaterial()) {
          setGameOverResult({ type: 'draw', winner: null, reason: 'Draw by Insufficient Material' });
        } else {
          setGameOverResult({ type: 'draw', winner: null, reason: 'Game Drawn' });
        }
      }

      // Online move emission with clean coordinates and server ack
      if (gameMode === 'online' && socket && onlineRoomCode) {
        const cleanPayload = {
          from: moveResult.from,
          to: moveResult.to,
          promotion: moveResult.promotion || undefined
        };
        socket.emit('make_move', {
          roomId: onlineRoomCode,
          move: cleanPayload,
          playerId: getPlayerId()
        }, (ack) => {
          if (ack && !ack.success) {
            console.error('Server rejected move:', ack.error);
            if (ack.fen) {
              const rollback = new Chess(ack.fen);
              setChess(rollback);
              setBoardFen(rollback.fen());
            }
          } else if (ack && ack.timers) {
            setTimers({ w: ack.timers.w, b: ack.timers.b });
          }
        });
      }

      runCoachAnalysis(nextGame);
      return moveResult;
    } catch (err) {
      console.error('Error executing move:', err);
    }
  }, [chess, autoQueen, gameMode, socket, onlineRoomCode, calculateMaterial, runCoachAnalysis]);

  // Computer AI turn calculation
  useEffect(() => {
    if (gameMode !== 'ai' || gameOverResult) {
      setIsBotThinking(false);
      return;
    }

    const currentTurn = chess.turn();
    const isBotTurn = currentTurn !== playerColor;

    if (isBotTurn) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        try {
          const result = getBestMove(chess, aiDifficulty);
          if (result && result.move) {
            executeMove(result.move);
          }
        } catch (err) {
          console.error('Bot move calculation error:', err);
        } finally {
          setIsBotThinking(false);
        }
      }, 120);

      return () => clearTimeout(timer);
    } else {
      setIsBotThinking(false);
    }
  }, [boardFen, gameMode, playerColor, aiDifficulty, gameOverResult, chess, executeMove]);

  // Online Multiplayer Socket
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      autoConnect: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setSocketConnected(true);
      // Check URL query parameters for ?room=XYZ
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        newSocket.emit('join_room', { roomId: roomParam.toUpperCase(), playerId: getPlayerId() }, (res) => {
          if (res && res.success) {
            setOnlineRoomCode(roomParam.toUpperCase());
            setGameMode('online');
            setOnlineMyColor(res.color);
            setPlayerColor(res.color);
            setIsFlipped(res.color === 'b');
            if (res.timeControl) {
              setTimeControl(res.timeControl);
              setTimers({ w: res.timeControl, b: res.timeControl });
            }
          }
        });
      }
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
      setIsSearchingQuickMatch(false);
    });

    newSocket.on('connect_error', () => {
      setSocketConnected(false);
    });

    newSocket.on('game_started', ({ roomId, whitePlayer, whitePlayerId, blackPlayer, blackPlayerId, timeControl: tc, fen }) => {
      setOnlineRoomCode(roomId);
      setIsWaitingOnline(false);
      setIsSearchingQuickMatch(false);
      setIsOnlineModalOpen(false);
      setGameMode('online');
      setDrawOfferReceived(false);
      setDrawOfferSent(false);
      setRematchOffered(false);
      setRematchSent(false);

      const myPlayerId = getPlayerId();
      let myColor = 'w';
      if (whitePlayerId && blackPlayerId) {
        myColor = myPlayerId === whitePlayerId ? 'w' : 'b';
      } else {
        myColor = newSocket.id === whitePlayer ? 'w' : 'b';
      }

      setOnlineMyColor(myColor);
      setPlayerColor(myColor);
      setIsFlipped(myColor === 'b');

      // Fresh game initialization
      const freshGame = fen ? new Chess(fen) : new Chess();
      setChess(freshGame);
      setBoardFen(freshGame.fen());
      setLastMove(null);
      setHistory([]);
      setViewHistoryIndex(null);
      setCapturedPieces({ w: [], b: [] });
      setMaterialScore(0);
      setEvalScore(0);
      setGameOverResult(null);
      setPendingPromotion(null);

      if (tc) {
        setTimeControl(tc);
        setTimers({ w: tc, b: tc });
      }
      sound.playCheck();
    });

    newSocket.on('opponent_move', ({ move, fen, timers: serverTimers, gameOver }) => {
      try {
        const currentChess = chessRef.current;
        const nextGame = fen ? new Chess(fen) : new Chess(currentChess.fen());
        if (!fen) {
          nextGame.move(move);
        }
        setChess(nextGame);
        setBoardFen(nextGame.fen());
        setLastMove({ from: move.from, to: move.to });
        setHistory((prev) => [
          ...prev,
          {
            san: move.san,
            from: move.from,
            to: move.to,
            piece: move.piece,
            color: move.color,
            fen: nextGame.fen()
          }
        ]);
        setViewHistoryIndex(null);
        if (calculateMaterialRef.current) {
          calculateMaterialRef.current(nextGame);
        }
        setEvalScore(evaluateBoard(nextGame));

        if (move.captured) {
          sound.playCapture();
        } else if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) {
          sound.playCastle();
        } else {
          sound.playMove();
        }

        if (nextGame.inCheck()) sound.playCheck();

        if (serverTimers) {
          setTimers({ w: serverTimers.w, b: serverTimers.b });
        }

        if (gameOver) {
          setGameOverResult(gameOver);
        } else if (nextGame.isGameOver()) {
          if (nextGame.isCheckmate()) {
            const winner = nextGame.turn() === 'w' ? 'b' : 'w';
            setGameOverResult({
              type: 'checkmate',
              winner,
              reason: `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins!`
            });
          } else if (nextGame.isDraw()) {
            setGameOverResult({ type: 'draw', winner: null, reason: 'Draw' });
          }
        }

        if (runCoachAnalysisRef.current) {
          runCoachAnalysisRef.current(nextGame);
        }
      } catch (err) {
        console.error('Error applying opponent move:', err);
      }
    });

    newSocket.on('draw_offered', () => {
      setDrawOfferReceived(true);
      sound.playCheck();
    });

    newSocket.on('draw_declined', () => {
      setDrawOfferSent(false);
      setDrawDeclinedNotice(true);
      setTimeout(() => setDrawDeclinedNotice(false), 4000);
    });

    newSocket.on('rematch_offered', () => {
      setRematchOffered(true);
      sound.playCheck();
    });

    newSocket.on('rematch_declined', () => {
      setRematchSent(false);
    });

    newSocket.on('game_over', (res) => {
      setGameOverResult(res);
      setDrawOfferReceived(false);
      setDrawOfferSent(false);
    });

    newSocket.on('opponent_disconnected', () => {
      setGameOverResult({
        type: 'resignation',
        winner: onlineMyColorRef.current,
        reason: 'Opponent disconnected. You win by forfeit!'
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Restart / New Game
  const startNewGame = useCallback(() => {
    const newGame = new Chess();
    setChess(newGame);
    setBoardFen(newGame.fen());
    setLastMove(null);
    setHistory([]);
    setViewHistoryIndex(null);
    setCapturedPieces({ w: [], b: [] });
    setMaterialScore(0);
    setEvalScore(0);
    setGameOverResult(null);
    setPendingPromotion(null);
    if (timeControl !== null) {
      setTimers({ w: timeControl, b: timeControl });
    }
    runCoachAnalysis(newGame);
    sound.playMove();
  }, [timeControl, runCoachAnalysis]);

  // Custom FEN Loader (New Feature!)
  const handleLoadCustomFen = useCallback((customFen) => {
    try {
      const loadedGame = new Chess(customFen);
      setChess(loadedGame);
      setBoardFen(loadedGame.fen());
      setLastMove(null);
      setHistory([]);
      setViewHistoryIndex(null);
      calculateMaterial(loadedGame);
      setEvalScore(evaluateBoard(loadedGame));
      setGameOverResult(null);
      runCoachAnalysis(loadedGame);
      sound.playCheck();
    } catch (e) {
      alert('Invalid FEN format: ' + e.message);
    }
  }, [calculateMaterial, runCoachAnalysis]);

  // Promotion Selection
  const handleSelectPromotion = (pieceType) => {
    if (!pendingPromotion) return;
    executeMove({ ...pendingPromotion, promotion: pieceType });
    setPendingPromotion(null);
  };

  // Play Best Move from Coach
  const handleApplyBestMove = () => {
    if (!coachAnalysis || !coachAnalysis.bestMove) return;
    executeMove({
      from: coachAnalysis.bestMove.from,
      to: coachAnalysis.bestMove.to
    });
  };

  // Online Rematch & Room Management Handlers
  const handleOfferRematch = useCallback(() => {
    if (socket && onlineRoomCode) {
      socket.emit('offer_rematch', { roomId: onlineRoomCode });
      setRematchSent(true);
    }
  }, [socket, onlineRoomCode]);

  const handleAcceptRematch = useCallback(() => {
    if (socket && onlineRoomCode) {
      socket.emit('accept_rematch', { roomId: onlineRoomCode });
      setRematchOffered(false);
      setGameOverResult(null);
    }
  }, [socket, onlineRoomCode]);

  const handleFindQuickMatch = useCallback(({ timeControl: tc, preferredColor }) => {
    if (!socket || !socketConnected) {
      setOnlineStatus('Game server is connecting. Please wait a moment...');
      return;
    }
    setOnlineStatus('');
    setIsSearchingQuickMatch(true);
    socket.emit('find_quick_match', { timeControl: tc, preferredColor, playerId: getPlayerId() }, (res) => {
      if (!res || !res.success) {
        setIsSearchingQuickMatch(false);
        setOnlineStatus('Failed to start quick match. Please try again.');
      } else if (res.matched) {
        setIsSearchingQuickMatch(false);
        setOnlineRoomCode(res.roomId);
        setIsOnlineModalOpen(false);
        setGameMode('online');
        setOnlineMyColor(res.color);
        setPlayerColor(res.color);
        setIsFlipped(res.color === 'b');
        if (res.timeControl) {
          setTimeControl(res.timeControl);
          setTimers({ w: res.timeControl, b: res.timeControl });
        }
      }
    });
  }, [socket, socketConnected]);

  const handleCancelQuickMatch = useCallback(() => {
    if (socket) {
      socket.emit('cancel_quick_match', () => {
        setIsSearchingQuickMatch(false);
      });
    } else {
      setIsSearchingQuickMatch(false);
    }
  }, [socket]);

  const handleLeaveRoom = useCallback(() => {
    if (socket && onlineRoomCode) {
      socket.emit('leave_room', { roomId: onlineRoomCode });
    }
    if (socket && isSearchingQuickMatch) {
      socket.emit('cancel_quick_match');
    }
    setIsSearchingQuickMatch(false);
    setOnlineRoomCode(null);
    setIsWaitingOnline(false);
    setIsOnlineModalOpen(false);
  }, [socket, onlineRoomCode, isSearchingQuickMatch]);

  // Jump to specific move in history preview (null = return to live match)
  const handleJumpToMove = useCallback((idx) => {
    if (idx === null || (history.length > 0 && idx >= history.length - 1)) {
      setViewHistoryIndex(null);
      calculateMaterial(chess);
      setEvalScore(evaluateBoard(chess));
      return;
    }
    if (idx < 0) {
      setViewHistoryIndex(-1);
      const startG = new Chess();
      calculateMaterial(startG);
      setEvalScore(0);
      return;
    }
    const safeIdx = Math.min(history.length - 1, Math.max(0, idx));
    setViewHistoryIndex(safeIdx);
    const targetMove = history[safeIdx];
    if (targetMove && targetMove.fen) {
      try {
        const previewGame = new Chess(targetMove.fen);
        calculateMaterial(previewGame);
        setEvalScore(evaluateBoard(previewGame));
      } catch (e) {
        console.error('Error previewing move fen:', e);
      }
    }
  }, [history, chess, calculateMaterial]);

  const handleGoFirst = useCallback(() => {
    if (history.length === 0) return;
    handleJumpToMove(-1);
  }, [history.length, handleJumpToMove]);

  const handleGoPrev = useCallback(() => {
    if (history.length === 0) return;
    const current = viewHistoryIndex === null ? history.length - 1 : viewHistoryIndex;
    handleJumpToMove(current - 1);
  }, [history.length, viewHistoryIndex, handleJumpToMove]);

  const handleGoNext = useCallback(() => {
    if (history.length === 0) return;
    if (viewHistoryIndex === null || viewHistoryIndex >= history.length - 1) return;
    const target = viewHistoryIndex + 1;
    if (target >= history.length - 1) {
      handleJumpToMove(null);
    } else {
      handleJumpToMove(target);
    }
  }, [history.length, viewHistoryIndex, handleJumpToMove]);

  const handleGoLast = useCallback(() => {
    handleJumpToMove(null);
  }, [handleJumpToMove]);

  const isLivePosition = viewHistoryIndex === null || history.length === 0 || viewHistoryIndex === history.length - 1;

  // Memoized board instance for display
  const displayChess = useMemo(() => {
    if (viewHistoryIndex === null || history.length === 0) return chess;
    if (viewHistoryIndex === -1) {
      return new Chess();
    }
    if (viewHistoryIndex >= 0 && viewHistoryIndex < history.length) {
      const histItem = history[viewHistoryIndex];
      if (histItem && histItem.fen) {
        try {
          return new Chess(histItem.fen);
        } catch (err) {
          return chess;
        }
      }
    }
    return chess;
  }, [chess, history, viewHistoryIndex]);

  // Last move squares to highlight on board
  const displayLastMove = useMemo(() => {
    if (viewHistoryIndex === null) return lastMove;
    if (viewHistoryIndex === -1) return null;
    if (viewHistoryIndex >= 0 && viewHistoryIndex < history.length) {
      const h = history[viewHistoryIndex];
      return { from: h.from, to: h.to };
    }
    return lastMove;
  }, [history, viewHistoryIndex, lastMove]);

  // Undo move
  const handleUndoMove = () => {
    if (gameMode === 'online' || isBotThinking) return;
    const newGame = new Chess(chess.fen());
    if (gameMode === 'ai') {
      newGame.undo();
      newGame.undo();
    } else {
      newGame.undo();
    }
    const newFen = newGame.fen();
    setChess(newGame);
    setBoardFen(newFen);
    setHistory((prev) => prev.slice(0, prev.length - (gameMode === 'ai' ? 2 : 1)));
    setViewHistoryIndex(null);
    calculateMaterial(newGame);
    setEvalScore(evaluateBoard(newGame));
    runCoachAnalysis(newGame);
  };

  // Keyboard Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        handleGoPrev();
      } else if (e.key === 'ArrowRight') {
        handleGoNext();
      } else if (e.key === 'ArrowDown') {
        handleGoFirst();
      } else if (e.key === 'ArrowUp') {
        handleGoLast();
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        handleUndoMove();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleApplyBestMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGoPrev, handleGoNext, handleGoFirst, handleGoLast]);

  // Find King square if in check for visual red pulse
  let kingInCheckSq = null;
  if (chess.inCheck()) {
    const board = chess.board();
    const turn = chess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          kingInCheckSq = `${String.fromCharCode(97 + c)}${8 - r}`;
          break;
        }
      }
    }
  }

  // Player details for cards
  const player1 = {
    name: gameMode === 'online' ? (onlineMyColor === 'w' ? 'You' : 'Opponent') : 'Player (White)',
    type: 'human',
    color: 'w',
    rating: gameMode === 'ai' ? 1500 : null
  };

  const player2 = {
    name:
      gameMode === 'ai'
        ? `Bot AI (${aiDifficulty.toUpperCase()})`
        : gameMode === 'online'
        ? onlineMyColor === 'b'
          ? 'You'
          : 'Opponent'
        : 'Player (Black)',
    type: gameMode === 'ai' ? 'bot' : gameMode === 'online' ? 'remote' : 'human',
    color: 'b',
    rating:
      gameMode === 'ai'
        ? aiDifficulty === 'easy'
          ? 800
          : aiDifficulty === 'medium'
          ? 1200
          : aiDifficulty === 'hard'
          ? 1600
          : 2100
        : null
  };

  const topPlayer = isFlipped ? player1 : player2;
  const bottomPlayer = isFlipped ? player2 : player1;

  return (
    <div className={`relative min-h-screen flex flex-col justify-between selection:bg-[#22c55e] selection:text-black font-brutal overflow-x-hidden ${isDarkTheme ? 'bg-[#0f0f12] text-white' : 'bg-[#f4f4ec] text-black'}`}>
      {/* Neo-Brutalist Grid Background */}
      <FloatingPiecesBackground isDark={isDarkTheme} />

      {/* Top Neo-Brutalist Masthead */}
      <header className={`relative z-30 border-b-3 border-black px-2.5 sm:px-5 py-2 flex items-center justify-between shadow-md shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-base sm:text-lg brutal-shadow-sm shrink-0">
            ♞
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-brutal text-xs sm:text-base font-black uppercase tracking-tight">
                RandChess
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1 py-0.2 bg-[#facc15] text-black border border-black hidden sm:inline">
                MINIMAX v2.0
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-neutral-500 hidden md:block">
              ZERO BLUE • STOCKFISH CALIBRATED • 100% TACTICAL
            </p>
          </div>
        </div>

        {/* Desktop Match Mode Switcher + Suggest Move (Hidden on mobile, shown in sub-bar below) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex border-2 border-black bg-black p-0.5">
            <button
              onClick={() => {
                setGameMode('ai');
                setIsFlipped(playerColor === 'b');
              }}
              className={`px-2.5 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
                gameMode === 'ai' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
              }`}
            >
              vs AI
            </button>
            <button
              onClick={() => setGameMode('pass_play')}
              className={`px-2.5 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
                gameMode === 'pass_play' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
              }`}
            >
              1v1
            </button>
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              className={`px-2.5 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
                gameMode === 'online' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
              }`}
            >
              ONLINE
            </button>
          </div>

          <button
            onClick={() => {
              const nextVal = !coachEnabled;
              setCoachEnabled(nextVal);
              if (nextVal) {
                runCoachAnalysis(chess, true);
              }
            }}
            className={`brutal-press flex items-center gap-1.5 px-2.5 py-1 font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm transition-all ${
              coachEnabled
                ? 'bg-[#22c55e] text-black hover:bg-green-400'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
            title="Turn Next Move Suggestions ON / OFF"
          >
            <Lightbulb className={`w-3.5 h-3.5 ${coachEnabled ? 'text-black fill-current' : 'text-[#facc15]'}`} />
            <span>SUGGEST MOVE: {coachEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Flip Board Button */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="brutal-press p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="Flip Board Perspective (HotKey: F)"
          >
            <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Quick Mute / Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="brutal-press p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e]" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ef4444]" />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="brutal-press p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="Toggle Dark / Light Brutalism"
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#facc15]" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="brutal-press p-1.5 sm:p-2 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title="System Preferences & Blindfold Mode"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* New Game Button */}
          <button
            onClick={startNewGame}
            className="brutal-press flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
            title="Start New Match"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">NEW MATCH</span>
            <span className="sm:hidden">NEW</span>
          </button>
        </div>
      </header>

      {/* Mobile Sub-Header Bar (Pivotal for Mobile UX: Mode Switcher & Suggest Move) */}
      <div className={`md:hidden border-b-2 border-black px-2 py-1.5 flex items-center justify-between gap-1.5 shrink-0 z-20 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-[#e5e5dc]'}`}>
        {/* Mobile Mode Switcher */}
        <div className="flex border-2 border-black bg-black p-0.5 shrink-0">
          <button
            onClick={() => {
              setGameMode('ai');
              setIsFlipped(playerColor === 'b');
            }}
            className={`px-2 py-0.5 font-brutal text-[11px] font-black uppercase cursor-pointer transition-colors ${
              gameMode === 'ai' ? 'bg-[#22c55e] text-black' : 'bg-black text-white'
            }`}
          >
            vs AI
          </button>
          <button
            onClick={() => setGameMode('pass_play')}
            className={`px-2 py-0.5 font-brutal text-[11px] font-black uppercase cursor-pointer transition-colors ${
              gameMode === 'pass_play' ? 'bg-[#22c55e] text-black' : 'bg-black text-white'
            }`}
          >
            1v1
          </button>
          <button
            onClick={() => setIsOnlineModalOpen(true)}
            className={`px-2 py-0.5 font-brutal text-[11px] font-black uppercase cursor-pointer transition-colors ${
              gameMode === 'online' ? 'bg-[#22c55e] text-black' : 'bg-black text-white'
            }`}
          >
            ONLINE
          </button>
        </div>

        {/* Mobile Suggest Next Move Toggle */}
        <button
          onClick={() => {
            const nextVal = !coachEnabled;
            setCoachEnabled(nextVal);
            if (nextVal) {
              runCoachAnalysis(chess, true);
            }
          }}
          className={`brutal-press flex items-center gap-1 px-2 py-1 font-brutal text-[11px] font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm shrink-0 transition-all ${
            coachEnabled
              ? 'bg-[#22c55e] text-black'
              : 'bg-black text-white'
          }`}
          title="Toggle Move Suggestion on Mobile"
        >
          <Lightbulb className={`w-3 h-3 ${coachEnabled ? 'text-black fill-current' : 'text-[#facc15]'}`} />
          <span>SUGGEST: {coachEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Body: Dashboard with Left Board and Right Always-Visible Controls */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 min-h-0">
        {/* Left Column: Top Player + Board with EvalBar + Bottom Player + Step Navigation */}
        <div className="flex flex-col items-center gap-2 w-full max-w-[min(94vw,540px)] shrink-0">
          {/* Top Player Card */}
          <PlayerCard
            player={topPlayer}
            timeRemaining={topPlayer.color === 'w' ? timers.w : timers.b}
            isCurrentTurn={chess.turn() === topPlayer.color}
            isThinking={topPlayer.type === 'bot' && isBotThinking}
            capturedPieces={topPlayer.color === 'w' ? capturedPieces.w : capturedPieces.b}
            materialAdvantage={topPlayer.color === 'w' ? Math.max(0, materialScore) : Math.max(0, -materialScore)}
          />

          {/* Chessboard + Dynamic Eval Bar */}
          <div className="flex items-center gap-2.5 w-full">
            <EvalBar evalScore={evalScore} isFlipped={isFlipped} />

            <div className="flex-1">
              <ChessBoard
                chess={displayChess}
                onMove={executeMove}
                isFlipped={isFlipped}
                boardTheme={boardTheme}
                lastMove={displayLastMove}
                coachMove={coachAnalysis?.bestMove}
                showCoachArrow={isLivePosition && coachEnabled && showCoachArrow}
                showLegalDots={isLivePosition && showLegalDots}
                showCoordinates={showCoordinates}
                showLastMoveHighlight={showLastMoveHighlight}
                blindfoldMode={blindfoldMode}
                interactive={
                  isLivePosition &&
                  !gameOverResult &&
                  !isBotThinking &&
                  (gameMode === 'pass_play' ||
                    (gameMode === 'ai' && chess.turn() === playerColor) ||
                    (gameMode === 'online' && chess.turn() === onlineMyColor))
                }
                kingInCheckSq={displayChess.inCheck() ? kingInCheckSq : null}
              />
            </div>
          </div>

          {/* Board Step Navigation Dock (Start, Back, Status, Fwd, Live) */}
          <div className="w-full bg-[#facc15] text-black border-3 border-black p-2 flex items-center justify-between gap-1.5 brutal-shadow select-none">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleGoFirst}
                disabled={history.length === 0 || viewHistoryIndex === -1}
                className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-white font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
                title="Jump to Initial Board (Move 0)"
              >
                <ChevronFirst className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">START</span>
              </button>
              <button
                onClick={handleGoPrev}
                disabled={history.length === 0 || viewHistoryIndex === -1}
                className="brutal-press flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-neutral-100 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-black font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
                title="Step Back one move"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3] text-black" />
                <span>BACK</span>
              </button>
            </div>

            {/* Current Move Status */}
            <div>
              {history.length === 0 ? (
                <div className="px-3 py-1 border-2 border-black font-mono text-xs font-black bg-black text-[#facc15]">
                  MOVE 0
                </div>
              ) : isLivePosition ? (
                <div className="flex items-center gap-1 px-3 py-1 border-2 border-black font-mono text-xs font-black bg-[#22c55e] text-black">
                  <span className="w-2 h-2 rounded-full bg-black animate-ping inline-block" />
                  <span>LIVE ({history.length}M)</span>
                </div>
              ) : (
                <button
                  onClick={handleGoLast}
                  className="brutal-press flex items-center gap-1 px-3 py-1 border-2 border-black font-mono text-xs font-black bg-black text-[#facc15] cursor-pointer animate-pulse"
                  title="Click to jump back to live match"
                >
                  <span>MOVE {viewHistoryIndex === -1 ? '0' : `${viewHistoryIndex + 1}/${history.length}`}</span>
                  <span className="underline font-black ml-1 text-[#22c55e]">LIVE ▶|</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleGoNext}
                disabled={history.length === 0 || isLivePosition}
                className="brutal-press flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-neutral-100 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-black font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
                title="Step Forward one move"
              >
                <span>FWD</span>
                <ChevronRight className="w-4 h-4 stroke-[3] text-black" />
              </button>
              <button
                onClick={handleGoLast}
                disabled={history.length === 0 || isLivePosition}
                className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-black font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
                title="Jump to Latest Live Move"
              >
                <span className="hidden sm:inline">LIVE</span>
                <ChevronLast className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>

          {/* Bottom Player Card */}
          <PlayerCard
            player={bottomPlayer}
            timeRemaining={bottomPlayer.color === 'w' ? timers.w : timers.b}
            isCurrentTurn={chess.turn() === bottomPlayer.color}
            isThinking={bottomPlayer.type === 'bot' && isBotThinking}
            capturedPieces={bottomPlayer.color === 'w' ? capturedPieces.w : capturedPieces.b}
            materialAdvantage={bottomPlayer.color === 'w' ? Math.max(0, materialScore) : Math.max(0, -materialScore)}
          />
        </div>

        {/* Right Column: Always-Visible High-Contrast Station */}
        <div className="relative z-10 w-full lg:w-[410px] xl:w-[440px] flex flex-col gap-3 shrink-0">
          {/* 1. MATCH OPPONENT & GAME MODE (Prominent High-Contrast Buttons) */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Match Opponent
              </span>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#facc15] text-black border border-black">
                {gameMode === 'ai' ? '🤖 vs COMPUTER' : gameMode === 'online' ? '🌐 ONLINE MULTIPLAYER' : '👥 1v1 PASS & PLAY'}
              </span>
            </div>

            {/* 3 Main Game Mode Buttons - High Contrast Solid Fills */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setGameMode('ai');
                  setIsFlipped(playerColor === 'b');
                }}
                className={`brutal-press py-2.5 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'ai'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Bot className="w-5 h-5 mb-0.5 text-black" />
                <span className="font-brutal text-xs font-black">vs BOT AI</span>
                <span className="text-[9px] font-mono font-black text-black opacity-80">Engine</span>
              </button>

              <button
                onClick={() => setGameMode('pass_play')}
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
                <Wifi className="w-5 h-5 mb-0.5 text-black" />
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
                    ~{aiDifficulty === 'easy' ? '800' : aiDifficulty === 'medium' ? '1200' : aiDifficulty === 'hard' ? '1600' : '2100'} ELO
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 font-mono text-xs font-black">
                  {[
                    { id: 'easy', label: 'NOVICE', elo: '800' },
                    { id: 'medium', label: 'CLUB', elo: '1200' },
                    { id: 'hard', label: 'EXPERT', elo: '1600' },
                    { id: 'master', label: 'MASTER', elo: '2100' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setAiDifficulty(d.id)}
                      className={`brutal-press py-1.5 border-2 border-black cursor-pointer flex flex-col items-center transition-all ${
                        aiDifficulty === d.id
                          ? 'bg-[#22c55e] text-black brutal-shadow font-black'
                          : 'bg-[#facc15] text-black hover:bg-yellow-400 font-black brutal-shadow-sm'
                      }`}
                    >
                      <span className="text-[10px] font-black">{d.label}</span>
                      <span className={`text-[9px] font-mono font-black px-1 mt-0.5 ${
                        aiDifficulty === d.id ? 'bg-black text-[#22c55e]' : 'bg-black text-[#facc15]'
                      }`}>
                        ~{d.elo}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Side Chooser */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-brutal text-xs font-black uppercase text-black">Play As:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPlayerColor('w');
                        setIsFlipped(false);
                        startNewGame();
                      }}
                      className={`brutal-press px-3.5 py-1.5 text-xs font-black uppercase border-3 border-black cursor-pointer transition-all ${
                        playerColor === 'w'
                          ? 'bg-white text-black brutal-shadow ring-2 ring-[#22c55e]'
                          : 'bg-[#facc15] text-black hover:bg-yellow-400'
                      }`}
                    >
                      ⚪ WHITE (1st)
                    </button>
                    <button
                      onClick={() => {
                        setPlayerColor('b');
                        setIsFlipped(true);
                        startNewGame();
                      }}
                      className={`brutal-press px-3.5 py-1.5 text-xs font-black uppercase border-3 border-black cursor-pointer transition-all ${
                        playerColor === 'b'
                          ? 'bg-black text-white brutal-shadow ring-2 ring-[#22c55e]'
                          : 'bg-neutral-900 text-white hover:bg-black'
                      }`}
                    >
                      ⚫ BLACK (2nd)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. MOVE SCORESHEET / HISTORY ("ai moves" - always visible!) */}
          <MoveHistory
            history={history}
            currentMoveIndex={viewHistoryIndex === null ? (history.length - 1) : viewHistoryIndex}
            isLive={isLivePosition}
            onJumpToMove={handleJumpToMove}
            onGoFirst={handleGoFirst}
            onGoPrev={handleGoPrev}
            onGoNext={handleGoNext}
            onGoLast={handleGoLast}
            fen={displayChess.fen()}
            pgn={chess.pgn()}
            onLoadFen={handleLoadCustomFen}
          />

          {/* 3. GRANDMASTER AI COACH & "PLAY BEST MOVE" BUTTON */}
          <CoachAdvisor
            coachEnabled={coachEnabled}
            onToggleCoach={(val) => {
              setCoachEnabled(val);
              if (val) runCoachAnalysis(chess, true);
            }}
            analysis={coachAnalysis}
            onApplyBestMove={handleApplyBestMove}
            showArrow={showCoachArrow}
            onToggleArrow={() => setShowCoachArrow(!showCoachArrow)}
            turnColor={chess.turn() === 'w' ? 'White' : 'Black'}
            isThinking={isCoachThinking}
            onAnalyzeNow={() => runCoachAnalysis(chess, true)}
          />

          {/* 4. MATCH ACTION BUTTONS (Takeback, Resign, Draw) - Ultra High Contrast */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleUndoMove}
              disabled={history.length === 0 || gameMode === 'online'}
              className="brutal-press flex items-center justify-center gap-1.5 py-3 bg-[#facc15] hover:bg-yellow-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-3 border-black text-black font-brutal text-xs font-black uppercase brutal-shadow cursor-pointer transition-colors"
              title="Take back last move (HotKey: Z)"
            >
              <RotateCcw className="w-4 h-4 text-black stroke-[2.5]" />
              TAKEBACK
            </button>

            <button
              onClick={() => {
                if (gameMode === 'online' && socket && onlineRoomCode) {
                  socket.emit('resign', { roomId: onlineRoomCode });
                  setGameOverResult({
                    type: 'resignation',
                    winner: onlineMyColor === 'w' ? 'b' : 'w',
                    reason: 'You surrendered the match'
                  });
                } else {
                  const currentTurn = chess.turn();
                  setGameOverResult({
                    type: 'resignation',
                    winner: currentTurn === 'w' ? 'b' : 'w',
                    reason: `${currentTurn === 'w' ? 'White' : 'Black'} surrendered the match`
                  });
                }
              }}
              disabled={Boolean(gameOverResult) || history.length === 0}
              className="brutal-press flex items-center justify-center gap-1.5 py-3 bg-[#ef4444] hover:bg-red-500 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-3 border-black text-white font-brutal text-xs font-black uppercase brutal-shadow cursor-pointer transition-colors"
              title="Resign current match"
            >
              <Flag className="w-4 h-4 text-white stroke-[2.5]" />
              RESIGN
            </button>

            <button
              onClick={() => {
                if (gameMode === 'online' && socket && onlineRoomCode) {
                  socket.emit('offer_draw', { roomId: onlineRoomCode });
                  setDrawOfferSent(true);
                  setTimeout(() => setDrawOfferSent(false), 5000);
                } else {
                  setGameOverResult({
                    type: 'draw',
                    winner: null,
                    reason: 'Draw concluded by mutual consent'
                  });
                }
              }}
              disabled={Boolean(gameOverResult) || history.length === 0 || drawOfferSent}
              className="brutal-press flex items-center justify-center gap-1.5 py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-3 border-black text-[#facc15] font-brutal text-xs font-black uppercase brutal-shadow cursor-pointer transition-colors"
              title="Offer match draw"
            >
              <Handshake className="w-4 h-4 text-[#facc15] stroke-[2.5]" />
              {drawOfferSent ? 'OFFERED...' : 'DRAW'}
            </button>
          </div>
        </div>
      </main>

      {/* Brutalist Footer Strip */}
      <footer className={`border-t-3 border-black py-1.5 px-4 flex items-center justify-between text-[10px] font-mono font-black uppercase tracking-widest shrink-0 ${isDarkTheme ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <span>RandChess v2.0 // HIGH-EFFICIENCY MINIMAX</span>
        <span className="hidden sm:inline">NO BLUE • 64 SQUARES • TACTICAL RADAR</span>
      </footer>

      {/* Draw Offer Banners */}
      {drawOfferReceived && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#facc15] text-black border-4 border-black p-4 brutal-shadow-xl max-w-sm w-[92vw] text-center space-y-2 select-none animate-bounce">
          <div className="font-brutal text-sm font-black uppercase">
            🤝 OPPONENT OFFERED A DRAW
          </div>
          <p className="text-xs font-mono text-neutral-800">
            Do you agree to conclude this match in a draw?
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (socket && onlineRoomCode) {
                  socket.emit('accept_draw', { roomId: onlineRoomCode });
                }
                setDrawOfferReceived(false);
              }}
              className="brutal-press flex-1 py-2 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
            >
              ACCEPT DRAW
            </button>
            <button
              onClick={() => {
                if (socket && onlineRoomCode) {
                  socket.emit('decline_draw', { roomId: onlineRoomCode });
                }
                setDrawOfferReceived(false);
              }}
              className="brutal-press flex-1 py-2 bg-white hover:bg-neutral-100 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
            >
              DECLINE
            </button>
          </div>
        </div>
      )}

      {drawDeclinedNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white border-2 border-white px-4 py-2 brutal-shadow-md font-mono text-xs font-black uppercase text-center select-none">
          Opponent declined the draw offer.
        </div>
      )}

      {drawOfferSent && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#facc15] text-black border-2 border-black px-4 py-2 brutal-shadow-md font-mono text-xs font-black uppercase text-center select-none">
          🤝 Draw offer sent to opponent...
        </div>
      )}

      {/* Modals with overscroll-behavior: contain per modern-web-guidance */}
      {pendingPromotion && (
        <PromotionModal
          color={chess.turn()}
          onSelectPiece={handleSelectPromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {gameOverResult && (
        <GameOverModal
          result={gameOverResult}
          onNewGame={startNewGame}
          onClose={() => setGameOverResult(null)}
          playerColor={playerColor}
          isOnline={gameMode === 'online'}
          onOfferRematch={handleOfferRematch}
          onAcceptRematch={handleAcceptRematch}
          rematchOffered={rematchOffered}
          rematchSent={rematchSent}
          onOpenOnlineLobby={() => setIsOnlineModalOpen(true)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        boardTheme={boardTheme}
        onSelectTheme={setBoardTheme}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        soundVolume={soundVolume}
        onChangeVolume={setSoundVolume}
        voiceEnabled={voiceEnabled}
        onToggleVoice={setVoiceEnabled}
        showLegalDots={showLegalDots}
        onToggleLegalDots={setShowLegalDots}
        showCoordinates={showCoordinates}
        onToggleCoordinates={setShowCoordinates}
        showLastMoveHighlight={showLastMoveHighlight}
        onToggleLastMoveHighlight={setShowLastMoveHighlight}
        autoQueen={autoQueen}
        onToggleAutoQueen={setAutoQueen}
        blindfoldMode={blindfoldMode}
        onToggleBlindfold={setBlindfoldMode}
        isDarkTheme={isDarkTheme}
        onToggleDarkTheme={setIsDarkTheme}
      />

      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => {
          if (isSearchingQuickMatch) handleCancelQuickMatch();
          setIsOnlineModalOpen(false);
        }}
        onFindQuickMatch={handleFindQuickMatch}
        onCancelQuickMatch={handleCancelQuickMatch}
        isSearchingQuickMatch={isSearchingQuickMatch}
        onCreateRoom={({ timeControl: tc, preferredColor }) => {
          if (!socket || !socketConnected) {
            setOnlineStatus('Connecting to game server... Please wait a moment.');
            return;
          }
          setOnlineStatus('');
          socket.emit('create_room', { timeControl: tc, preferredColor, playerId: getPlayerId() }, (res) => {
            if (res && res.success) {
              setOnlineRoomCode(res.roomId);
              setIsWaitingOnline(true);
              setOnlineMyColor(res.color);
              setPlayerColor(res.color);
              setIsFlipped(res.color === 'b');
              setTimeControl(res.timeControl);
              setTimers({ w: res.timeControl, b: res.timeControl });
            } else {
              setOnlineStatus(res?.error || 'Failed to create room');
            }
          });
        }}
        onJoinRoom={(code) => {
          if (!socket || !socketConnected) {
            setOnlineStatus('Connecting to game server... Please wait a moment.');
            return;
          }
          setOnlineStatus('');
          const clean = (code || '').trim().toUpperCase();
          socket.emit('join_room', { roomId: clean, playerId: getPlayerId() }, (res) => {
            if (res && res.success) {
              setOnlineRoomCode(clean);
              setIsOnlineModalOpen(false);
              setGameMode('online');
              setOnlineMyColor(res.color);
              setPlayerColor(res.color);
              setIsFlipped(res.color === 'b');
              if (res.timeControl) {
                setTimeControl(res.timeControl);
                setTimers({ w: res.timeControl, b: res.timeControl });
              }
            } else {
              setOnlineStatus(res?.error || 'Room not found. Check the code.');
            }
          });
        }}
        onLeaveRoom={handleLeaveRoom}
        roomCode={onlineRoomCode}
        isWaiting={isWaitingOnline}
        onlineStatus={onlineStatus}
        isConnected={socketConnected}
      />
    </div>
  );
}
