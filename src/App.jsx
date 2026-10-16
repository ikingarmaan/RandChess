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
  BookOpen
} from 'lucide-react';

import { ChessBoard } from './components/ChessBoard';
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

export default function App() {
  // --- Game State ---
  const [chess, setChess] = useState(() => new Chess());
  const [boardFen, setBoardFen] = useState(chess.fen());
  const [evalScore, setEvalScore] = useState(0); // Live, instant evaluation in centipawns (+ = White advantage)
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play' | 'online'
  const [aiDifficulty, setAiDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard' | 'master'
  const [playerColor, setPlayerColor] = useState('w'); // 'w' or 'b' for human in AI mode
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewHistoryIndex, setViewHistoryIndex] = useState(-1);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
  const [materialScore, setMaterialScore] = useState(0); // + = White advantage
  const [gameOverResult, setGameOverResult] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // --- Clock / Timer State ---
  const [timeControl, setTimeControl] = useState(300); // 5 min default, null for unlimited
  const [timers, setTimers] = useState({ w: 300, b: 300 });
  const timerIntervalRef = useRef(null);

  // --- AI Coach Mode State ---
  const [coachEnabled, setCoachEnabled] = useState(true); // ON by default to showcase feature
  const [coachAnalysis, setCoachAnalysis] = useState(null);
  const [showCoachArrow, setShowCoachArrow] = useState(true);
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  // --- Settings State ---
  const [boardTheme, setBoardTheme] = useState('emerald');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showLegalDots, setShowLegalDots] = useState(true);
  const [autoQueen, setAutoQueen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Online Multiplayer State ---
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [onlineRoomCode, setOnlineRoomCode] = useState(null);
  const [isWaitingOnline, setIsWaitingOnline] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState('');
  const [onlineMyColor, setOnlineMyColor] = useState('w');

  // Sync sound settings with audio manager
  useEffect(() => {
    sound.enabled = soundEnabled;
    sound.voiceEnabled = voiceEnabled;
  }, [soundEnabled, voiceEnabled]);

  // Compute captured pieces and net material
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
      // Pieces White captured from Black
      const diffB = counts[p] - currentCounts.b[p];
      for (let i = 0; i < diffB; i++) capturedW.push(p);

      // Pieces Black captured from White
      const diffW = counts[p] - currentCounts.w[p];
      for (let i = 0; i < diffW; i++) capturedB.push(p.toUpperCase());

      scoreW += currentCounts.w[p] * pieceValues[p];
      scoreB += currentCounts.b[p] * pieceValues[p];
    });

    setCapturedPieces({ w: capturedW, b: capturedB });
    setMaterialScore(scoreW - scoreB);
  }, []);

  // Update AI Coach Analysis
  const runCoachAnalysis = useCallback((gameInstance) => {
    if (!coachEnabled || gameInstance.isGameOver()) {
      if (gameInstance.isGameOver()) {
        const res = analyzeAndExplain(gameInstance);
        setCoachAnalysis(res);
      }
      return;
    }

    // In single player AI mode, only advise when it's the human's turn!
    if (gameMode === 'ai' && gameInstance.turn() !== playerColor) {
      return;
    }

    setIsCoachThinking(true);
    // Asynchronous calculation so UI remains smooth and instant
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
    }, 60);
  }, [coachEnabled, gameMode, playerColor]);

  // Initial coach run on mount
  useEffect(() => {
    runCoachAnalysis(chess);
  }, [runCoachAnalysis]);

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
          // Time expired!
          const winner = turn === 'w' ? 'b' : 'w';
          setGameOverResult({
            type: 'timeout',
            winner,
            reason: `${turn === 'w' ? 'White' : 'Black'} ran out of time`
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
      // Check if pawn promotion
      const piece = chess.get(moveCandidate.from);
      if (piece && piece.type === 'p') {
        const targetRank = moveCandidate.to[1];
        if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
          if (!moveCandidate.promotion) {
            if (autoQueen) {
              moveCandidate.promotion = 'q';
            } else {
              setPendingPromotion(moveCandidate);
              return;
            }
          }
        }
      }

      // Clone chess to create an updated instance for React state
      const nextGame = new Chess(chess.fen());
      const moveResult = nextGame.move(moveCandidate);
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

      // Update state
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
      setHistory((prev) => {
        const next = [...prev, newHistoryItem];
        setViewHistoryIndex(next.length - 1);
        return next;
      });

      calculateMaterial(nextGame);
      setEvalScore(evaluateBoard(nextGame));

      // Check for Game Over conditions
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

      // If Online Mode, send move to socket
      if (gameMode === 'online' && socket && onlineRoomCode) {
        socket.emit('make_move', { roomId: onlineRoomCode, move: moveCandidate });
      }

      // Re-run AI Coach
      runCoachAnalysis(nextGame);

      return moveResult;
    } catch (err) {
      console.error('Error executing move:', err);
    }
  }, [chess, autoQueen, gameMode, socket, onlineRoomCode, calculateMaterial, runCoachAnalysis]);

  // Handle single player vs computer turn
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
      }, 150); // fast, snappy response

      return () => clearTimeout(timer);
    } else {
      setIsBotThinking(false);
    }
  }, [boardFen, gameMode, playerColor, aiDifficulty, gameOverResult, chess, executeMove]);

  // Setup Online Multiplayer Socket connection
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
    setSocket(newSocket);

    newSocket.on('opponent_move', ({ move, gameOver }) => {
      chess.move(move);
      setBoardFen(chess.fen());
      setLastMove({ from: move.from, to: move.to });
      setHistory((prev) => [
        ...prev,
        {
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          fen: chess.fen()
        }
      ]);
      calculateMaterial(chess);
      if (move.captured) sound.playCapture();
      else sound.playMove();

      if (chess.inCheck()) sound.playCheck();

      if (gameOver) {
        setGameOverResult(gameOver);
      }
      runCoachAnalysis(chess);
    });

    newSocket.on('game_started', ({ roomId, whitePlayer, timeControl: tc }) => {
      setOnlineRoomCode(roomId);
      setIsWaitingOnline(false);
      setIsOnlineModalOpen(false);
      setGameMode('online');
      const isWhite = newSocket.id === whitePlayer;
      const myColor = isWhite ? 'w' : 'b';
      setOnlineMyColor(myColor);
      setPlayerColor(myColor);
      setIsFlipped(!isWhite);
      if (tc) {
        setTimeControl(tc);
        setTimers({ w: tc, b: tc });
      }
      sound.playCheck();
    });

    newSocket.on('game_over', (res) => {
      setGameOverResult(res);
    });

    newSocket.on('opponent_disconnected', () => {
      setGameOverResult({
        type: 'resignation',
        winner: onlineMyColor,
        reason: 'Opponent disconnected. You win!'
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Check URL query parameters for ?room=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && socket) {
      socket.emit('join_room', { roomId: roomParam }, (res) => {
        if (res.success) {
          setOnlineRoomCode(roomParam);
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
  }, [socket]);

  // Restart / New Game
  const startNewGame = useCallback(() => {
    const newGame = new Chess();
    setChess(newGame);
    setBoardFen(newGame.fen());
    setLastMove(null);
    setHistory([]);
    setViewHistoryIndex(-1);
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

  // Jump to specific move in history preview
  const handleJumpToMove = useCallback((idx) => {
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
  }, [history, calculateMaterial]);

  const handleGoFirst = useCallback(() => {
    if (history.length === 0) return;
    handleJumpToMove(-1);
  }, [history.length, handleJumpToMove]);

  const handleGoPrev = useCallback(() => {
    if (history.length === 0) return;
    const current = viewHistoryIndex === -1 ? -1 : viewHistoryIndex;
    handleJumpToMove(Math.max(-1, current - 1));
  }, [history.length, viewHistoryIndex, handleJumpToMove]);

  const handleGoNext = useCallback(() => {
    if (history.length === 0) return;
    const current = viewHistoryIndex === -1 ? -1 : viewHistoryIndex;
    handleJumpToMove(Math.min(history.length - 1, current + 1));
  }, [history.length, viewHistoryIndex, handleJumpToMove]);

  const handleGoLast = useCallback(() => {
    if (history.length === 0) return;
    handleJumpToMove(history.length - 1);
  }, [history.length, handleJumpToMove]);

  const isLivePosition = history.length === 0 || viewHistoryIndex === history.length - 1;

  // Memoized board instance for display: shows exact historical position when reviewing
  const displayChess = useMemo(() => {
    if (history.length === 0) return chess;
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

  // Last move squares to highlight on board: updates when stepping backward/forward
  const displayLastMove = useMemo(() => {
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
      // In vs AI mode, undo twice so it is player's turn again
      newGame.undo();
      newGame.undo();
    } else {
      newGame.undo();
    }
    const newFen = newGame.fen();
    setChess(newGame);
    setBoardFen(newFen);
    setHistory((prev) => prev.slice(0, prev.length - (gameMode === 'ai' ? 2 : 1)));
    calculateMaterial(newGame);
    setEvalScore(evaluateBoard(newGame));
    runCoachAnalysis(newGame);
  };

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
        ? `Computer AI (${aiDifficulty.toUpperCase()})`
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
    <div className="relative min-h-screen bg-[#070708] text-neutral-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      {/* Floating Architectural Chess Pieces & Constellation Background */}
      <FloatingPiecesBackground />

      {/* Top Masthead & Atelier Navigation */}
      <header className="relative z-30 border-b border-neutral-800/80 bg-[#0d0d10]/90 backdrop-blur-2xl px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-500 flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/30">
            ♞
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif-master text-base sm:text-lg font-black tracking-[0.12em] uppercase text-white">
                Atelier Chess
              </h1>
              <span className="hidden sm:inline-block font-serif-master text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                Grandmaster Dossier
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans hidden sm:block tracking-wide">
              Handcrafted Salon • Stockfish-Calibrated Engine • Real-time Tactical Dossier
            </p>
          </div>
        </div>

        {/* Quick Mode Switches & Settings */}
        <div className="flex items-center gap-2.5">
          {/* Mode Selector */}
          <div className="hidden md:flex rounded-xl bg-black/60 border border-neutral-800 p-1 tray-inset">
            <button
              onClick={() => {
                setGameMode('ai');
                setIsFlipped(playerColor === 'b');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-serif-master text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              vs Computer
            </button>
            <button
              onClick={() => setGameMode('pass_play')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-serif-master text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                gameMode === 'pass_play'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              1v1 Local
            </button>
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-serif-master text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                gameMode === 'online'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              Online Match
            </button>
          </div>

          {/* Flip Board Button */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Invert Board Perspective"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Atelier Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* New Game Button */}
          <button
            onClick={startNewGame}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-serif-master font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Match</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-7">
        {/* Left Column: Evaluation Bar + Players + Chess Board + Step Navigation */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[min(90vw,540px)] sm:max-w-[min(90vw,580px)]">
          {/* Live Match Mode Dossier Banner */}
          <div className="w-full rounded-2xl p-3 bg-[#18181c] border-2 border-neutral-700 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                {gameMode === 'ai' ? <Bot className="w-5 h-5" /> : gameMode === 'online' ? <Wifi className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif-master text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    {gameMode === 'ai' ? 'Single Player vs Computer AI' : gameMode === 'online' ? 'Online Match' : '1 vs 1 Local Pass & Play'}
                  </span>
                  {gameMode === 'ai' && (
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400">
                      {aiDifficulty} (~{aiDifficulty === 'easy' ? '800' : aiDifficulty === 'medium' ? '1200' : aiDifficulty === 'hard' ? '1600' : '2100'} ELO)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-300 font-sans">
                  {gameMode === 'ai'
                    ? 'Instant computer move response • You are White'
                    : gameMode === 'online'
                    ? `Connected to room: ${onlineRoomCode || 'Lobby'}`
                    : 'Two players alternate moves on this device'}
                </p>
              </div>
            </div>

            {/* Quick AI Coach Status Pill */}
            <button
              onClick={() => setCoachEnabled(!coachEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 shadow-sm ${
                coachEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-600'
              }`}
              title="Click to toggle AI Coach ON or OFF"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>{coachEnabled ? 'Coach: ON' : 'Coach: OFF'}</span>
            </button>
          </div>

          {/* Top Player Card */}
          <PlayerCard
            player={topPlayer}
            timeRemaining={topPlayer.color === 'w' ? timers.w : timers.b}
            isCurrentTurn={chess.turn() === topPlayer.color}
            isThinking={topPlayer.type === 'bot' && isBotThinking}
            capturedPieces={topPlayer.color === 'w' ? capturedPieces.w : capturedPieces.b}
            materialAdvantage={topPlayer.color === 'w' ? Math.max(0, materialScore) : Math.max(0, -materialScore)}
          />

          {/* Chessboard with Evaluation Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full">
            {/* Dynamic Live Evaluation Bar */}
            <EvalBar evalScore={evalScore} isFlipped={isFlipped} />

            {/* Interactive Board */}
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

          {/* Prominent High-Contrast Step Navigation Bar (First, Back, Status, Forward, Last) */}
          <div className="w-full rounded-2xl p-3.5 bg-[#18181c] border-2 border-neutral-700 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoFirst}
                disabled={history.length === 0 || viewHistoryIndex === -1}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-neutral-600 text-white font-serif-master text-xs uppercase font-bold transition-all cursor-pointer shadow-sm"
                title="Jump to Initial Board (Move 0)"
              >
                <ChevronFirst className="w-4 h-4 text-emerald-400" />
                <span>Start</span>
              </button>
              <button
                onClick={handleGoPrev}
                disabled={history.length === 0 || viewHistoryIndex === -1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-emerald-500/80 text-white font-serif-master text-xs sm:text-sm font-black uppercase transition-all cursor-pointer shadow-md"
                title="Step Back one move"
              >
                <ChevronLeft className="w-5 h-5 text-emerald-300 stroke-[3]" />
                <span>◀ Back</span>
              </button>
            </div>

            {/* Current Move Status Pill */}
            <div className="flex items-center gap-2">
              {history.length === 0 ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-800 border-2 border-neutral-600 text-neutral-300 font-mono text-xs font-bold">
                  <span>Move 0 (Game Start)</span>
                </div>
              ) : isLivePosition ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-mono text-xs font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Live Match ({history.length} {history.length === 1 ? 'Move' : 'Moves'})</span>
                </div>
              ) : (
                <button
                  onClick={handleGoLast}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/25 border-2 border-amber-400 text-amber-200 font-mono text-xs font-black hover:bg-amber-500/35 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse"
                  title="Click to jump back to live match"
                >
                  <span>Move {viewHistoryIndex === -1 ? '0 (Start)' : `${viewHistoryIndex + 1} / ${history.length}`}</span>
                  <span className="text-[10px] uppercase font-serif-master text-white underline font-black">Jump Live ▶|</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGoNext}
                disabled={history.length === 0 || isLivePosition}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-emerald-500/80 text-white font-serif-master text-xs sm:text-sm font-black uppercase transition-all cursor-pointer shadow-md"
                title="Step Forward one move"
              >
                <span>Forward ▶</span>
                <ChevronRight className="w-5 h-5 text-emerald-300 stroke-[3]" />
              </button>
              <button
                onClick={handleGoLast}
                disabled={history.length === 0 || isLivePosition}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-neutral-600 text-white font-serif-master text-xs uppercase font-bold transition-all cursor-pointer shadow-sm"
                title="Jump to Latest Live Move"
              >
                <span>Live</span>
                <ChevronLast className="w-4 h-4 text-emerald-400" />
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

          {/* Mobile Game Mode Selector */}
          <div className="flex md:hidden w-full rounded-2xl bg-[#18181c] border-2 border-neutral-700 p-1.5">
            <button
              onClick={() => {
                setGameMode('ai');
                setIsFlipped(playerColor === 'b');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              vs Bot
            </button>
            <button
              onClick={() => setGameMode('pass_play')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                gameMode === 'pass_play'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              1v1 Local
            </button>
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                gameMode === 'online'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              Online
            </button>
          </div>
        </div>

        {/* Right Column: AI Coach Explainer & Move History Scoresheet (Both permanently visible!) */}
        <div className="w-full lg:max-w-md flex flex-col gap-5">
          {/* 1. THE AI COACH & MOVE ADVISOR (Explains Best Move & Why in Real-Time) */}
          <CoachAdvisor
            coachEnabled={coachEnabled}
            onToggleCoach={setCoachEnabled}
            analysis={coachAnalysis}
            onApplyBestMove={handleApplyBestMove}
            showArrow={showCoachArrow}
            onToggleArrow={() => setShowCoachArrow(!showCoachArrow)}
            turnColor={chess.turn() === 'w' ? 'White' : 'Black'}
            isThinking={isCoachThinking}
          />

          {/* 2. MOVE HISTORY & SCORESHEET (Always visible with Forward / Backward navigation) */}
          <MoveHistory
            history={history}
            currentMoveIndex={viewHistoryIndex}
            onJumpToMove={handleJumpToMove}
            fen={boardFen}
            pgn={chess.pgn()}
          />

          {/* 3. Computer AI Strength Settings (Visible in AI Mode) */}
          {gameMode === 'ai' && (
            <div className="p-4 rounded-2xl bg-[#18181c] border-2 border-neutral-700 space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-serif-master font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  Computer AI Strength
                </span>
                <span className="font-mono text-emerald-300 font-black uppercase text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border-2 border-emerald-400">
                  {aiDifficulty}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'easy', label: 'Novice', elo: '800' },
                  { id: 'medium', label: 'Club', elo: '1200' },
                  { id: 'hard', label: 'Expert', elo: '1600' },
                  { id: 'master', label: 'Master', elo: '2100' }
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setAiDifficulty(d.id)}
                    className={`flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition-all cursor-pointer ${
                      aiDifficulty === d.id
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-500 hover:text-white'
                    }`}
                  >
                    <span className="font-serif-master text-xs font-black">{d.label}</span>
                    <span className="text-[10px] font-mono text-neutral-300 mt-0.5 font-bold">~{d.elo}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Action Buttons: Takeback, Resign, Draw */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleUndoMove}
              disabled={history.length === 0 || gameMode === 'online'}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 border-2 border-neutral-600 text-white font-serif-master font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              Takeback
            </button>

            <button
              onClick={() => {
                const currentTurn = chess.turn();
                setGameOverResult({
                  type: 'resignation',
                  winner: currentTurn === 'w' ? 'b' : 'w',
                  reason: `${currentTurn === 'w' ? 'White' : 'Black'} surrendered the match`
                });
              }}
              disabled={Boolean(gameOverResult) || history.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-neutral-800 hover:bg-red-900/60 disabled:opacity-35 border-2 border-red-500/60 text-red-200 hover:text-white font-serif-master font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Flag className="w-4 h-4 text-red-400" />
              Resign
            </button>

            <button
              onClick={() => {
                setGameOverResult({
                  type: 'draw',
                  winner: null,
                  reason: 'Draw concluded by mutual consent'
                });
              }}
              disabled={Boolean(gameOverResult) || history.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 border-2 border-neutral-600 text-white font-serif-master font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Handshake className="w-4 h-4 text-neutral-300" />
              Offer Draw
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 py-3.5 text-center font-serif-master text-[11px] uppercase tracking-widest text-neutral-500">
        Atelier Grandmaster Chess • Bespoke Human-Crafted Aesthetic • Zero Blue Palette
      </footer>

      {/* Modals */}
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
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        boardTheme={boardTheme}
        onSelectTheme={setBoardTheme}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        voiceEnabled={voiceEnabled}
        onToggleVoice={setVoiceEnabled}
        showLegalDots={showLegalDots}
        onToggleLegalDots={setShowLegalDots}
        autoQueen={autoQueen}
        onToggleAutoQueen={setAutoQueen}
      />

      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onCreateRoom={({ timeControl: tc, preferredColor }) => {
          if (!socket) return;
          socket.emit('create_room', { timeControl: tc, preferredColor }, (res) => {
            if (res.success) {
              setOnlineRoomCode(res.roomId);
              setIsWaitingOnline(true);
              setOnlineMyColor(res.color);
              setPlayerColor(res.color);
              setIsFlipped(res.color === 'b');
              setTimeControl(res.timeControl);
              setTimers({ w: res.timeControl, b: res.timeControl });
            }
          });
        }}
        onJoinRoom={(code) => {
          if (!socket) return;
          socket.emit('join_room', { roomId: code }, (res) => {
            if (res.success) {
              setOnlineRoomCode(code);
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
              setOnlineStatus(res.error || 'Failed to join');
            }
          });
        }}
        roomCode={onlineRoomCode}
        isWaiting={isWaitingOnline}
        onlineStatus={onlineStatus}
      />
    </div>
  );
}
