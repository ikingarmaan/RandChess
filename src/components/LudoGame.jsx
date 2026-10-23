import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  AlertCircle,
  Wifi,
  Copy,
  Check,
  Shield,
  ArrowRight,
  Crown
} from 'lucide-react';
import { sound } from '../utils/sound';

// 52-cell outer perimeter track coordinates [row, col] on a 15x15 board
const LUDO_TRACK = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];

// 8 Safe Squares on track (cannot be captured here)
const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Player color configurations (Zero Blue palette: Red, Green, Yellow, Orange)
const LUDO_CONFIGS = {
  2: [
    { name: 'Red', hex: '#ef4444', borderHex: '#991b1b', startIdx: 0, yardR: 1, yardC: 1, homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] },
    { name: 'Yellow', hex: '#facc15', borderHex: '#a16207', startIdx: 26, yardR: 10, yardC: 10, homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]] }
  ],
  3: [
    { name: 'Red', hex: '#ef4444', borderHex: '#991b1b', startIdx: 0, yardR: 1, yardC: 1, homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] },
    { name: 'Green', hex: '#22c55e', borderHex: '#15803d', startIdx: 13, yardR: 1, yardC: 10, homePath: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]] },
    { name: 'Yellow', hex: '#facc15', borderHex: '#a16207', startIdx: 26, yardR: 10, yardC: 10, homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]] }
  ],
  4: [
    { name: 'Red', hex: '#ef4444', borderHex: '#991b1b', startIdx: 0, yardR: 1, yardC: 1, homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] },
    { name: 'Green', hex: '#22c55e', borderHex: '#15803d', startIdx: 13, yardR: 1, yardC: 10, homePath: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]] },
    { name: 'Yellow', hex: '#facc15', borderHex: '#a16207', startIdx: 26, yardR: 10, yardC: 10, homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]] },
    { name: 'Orange', hex: '#f97316', borderHex: '#c2410c', startIdx: 39, yardR: 10, yardC: 1, homePath: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]] }
  ]
};

// Yard token slot positions inside each 6x6 base
const YARD_SLOTS = [
  [1.8, 1.8], [1.8, 3.8], [3.8, 1.8], [3.8, 3.8]
];

export const LudoGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue,
  socket,
  socketConnected,
  playerId
}) => {
  // Mode setup
  const [playerCount, setPlayerCount] = useState(4); // 2 | 3 | 4
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play' | 'online'
  const [selectedSeat, setSelectedSeat] = useState(0); // For vs Bot mode: human's seat

  // Local Game State
  const activeConfig = LUDO_CONFIGS[playerCount] || LUDO_CONFIGS[4];
  const [tokens, setTokens] = useState(() => Array.from({ length: playerCount }, () => [-1, -1, -1, -1]));
  const [turnIndex, setTurnIndex] = useState(0);
  const [dice, setDice] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceRolled, setDiceRolled] = useState(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [statusMessage, setStatusMessage] = useState('ROLL THE DICE TO BEGIN!');
  const [winner, setWinner] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [showRules, setShowRules] = useState(false);

  // Online Multiplayer State
  const [onlineRoomCode, setOnlineRoomCode] = useState('');
  const [onlineInputCode, setOnlineInputCode] = useState('');
  const [onlineSeatIndex, setOnlineSeatIndex] = useState(0);
  const [onlineRoom, setOnlineRoom] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Re-initialize tokens when player count changes in local mode
  useEffect(() => {
    if (gameMode !== 'online') {
      setTokens(Array.from({ length: playerCount }, () => [-1, -1, -1, -1]));
      setTurnIndex(0);
      setDice(null);
      setDiceRolled(false);
      setConsecutiveSixes(0);
      setWinner(null);
      setRankings([]);
      setStatusMessage('ROLL THE DICE TO BEGIN!');
    }
  }, [playerCount, gameMode]);

  // Compute legal moves for current player
  const getLegalTokens = useCallback((currentTokens, roll, pIdx) => {
    const legal = [];
    const pTokens = currentTokens[pIdx] || [];
    for (let t = 0; t < 4; t++) {
      const step = pTokens[t];
      if (step === -1) {
        if (roll === 6) legal.push(t);
      } else if (step >= 0 && step < 56) {
        if (step + roll <= 56) legal.push(t);
      }
    }
    return legal;
  }, []);

  const currentLegalTokens = useMemo(() => {
    if (!diceRolled || dice === null || winner !== null) return [];
    return getLegalTokens(tokens, dice, turnIndex);
  }, [diceRolled, dice, tokens, turnIndex, winner, getLegalTokens]);

  // Advance to next active player turn
  const advanceTurn = useCallback((currentTokens, currentTurn, currentRankings) => {
    let next = (currentTurn + 1) % playerCount;
    let attempts = 0;
    while (attempts < playerCount && (currentRankings.includes(next) || currentTokens[next]?.every(s => s === 56))) {
      next = (next + 1) % playerCount;
      attempts++;
    }
    setTurnIndex(next);
    setDice(null);
    setDiceRolled(false);
    setConsecutiveSixes(0);
    const nextPlayerName = activeConfig[next]?.name || `Player ${next + 1}`;
    setStatusMessage(`${nextPlayerName.toUpperCase()}'S TURN: ROLL THE DICE`);
  }, [playerCount, activeConfig]);

  // Execute Token Move (Local)
  const executeLocalMove = useCallback((tokenIdx) => {
    if (!diceRolled || dice === null || winner !== null) return;
    if (!currentLegalTokens.includes(tokenIdx)) return;

    sound.playMove();

    setTokens((prev) => {
      const nextTokens = prev.map((arr) => [...arr]);
      const currentStep = nextTokens[turnIndex][tokenIdx];
      const newStep = currentStep === -1 ? 0 : currentStep + dice;
      nextTokens[turnIndex][tokenIdx] = newStep;

      let extraTurn = dice === 6;

      // Check for Capture
      if (newStep < 51) {
        const myStart = activeConfig[turnIndex].startIdx;
        const myGlobalIdx = (myStart + newStep) % 52;

        if (!SAFE_TRACK_INDICES.includes(myGlobalIdx)) {
          for (let p = 0; p < playerCount; p++) {
            if (p === turnIndex) continue;
            const oppStart = activeConfig[p].startIdx;
            for (let t = 0; t < 4; t++) {
              const oppStep = nextTokens[p][t];
              if (oppStep >= 0 && oppStep < 51) {
                const oppGlobal = (oppStart + oppStep) % 52;
                if (oppGlobal === myGlobalIdx) {
                  // Capture!
                  nextTokens[p][t] = -1;
                  sound.playCapture();
                  extraTurn = true;
                  setStatusMessage(`STRIKE! ${activeConfig[turnIndex].name} CAPTURED ${activeConfig[p].name}! EXTRA TURN!`);
                }
              }
            }
          }
        }
      }

      // Check for reaching Home goal (56)
      if (newStep === 56) {
        sound.playCheck();
        extraTurn = true;
        setStatusMessage(`HOME RUN! ${activeConfig[turnIndex].name} GOT A TOKEN HOME!`);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });

        // Check if all 4 tokens finished
        if (nextTokens[turnIndex].every((s) => s === 56)) {
          setRankings((prevRank) => {
            const nextRank = [...prevRank, turnIndex];
            if (winner === null) {
              setWinner(turnIndex);
              confetti({
                particleCount: 120,
                spread: 90,
                origin: { y: 0.5 },
                colors: [activeConfig[turnIndex].hex, '#ffffff', '#000000']
              });
            }
            return nextRank;
          });
        }
      }

      // Process Turn Transition
      if (extraTurn) {
        setDice(null);
        setDiceRolled(false);
        if (dice === 6) {
          setStatusMessage(`ROLLED A 6! ${activeConfig[turnIndex].name} ROLLS AGAIN!`);
        }
      } else {
        advanceTurn(nextTokens, turnIndex, rankings);
      }

      return nextTokens;
    });
  }, [diceRolled, dice, winner, currentLegalTokens, turnIndex, activeConfig, playerCount, advanceTurn, rankings]);

  // Roll Dice (Local)
  const handleRollDice = useCallback(() => {
    if (diceRolling || diceRolled || winner !== null) return;

    // Check turn authorization in vs AI
    if (gameMode === 'ai' && turnIndex !== selectedSeat) return;

    setDiceRolling(true);
    sound.playDiceRoll();

    setTimeout(() => {
      const rolledValue = 1 + Math.floor(Math.random() * 6);
      setDice(rolledValue);
      setDiceRolling(false);
      setDiceRolled(true);

      const nextSixes = rolledValue === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixes);

      if (nextSixes >= 3) {
        setStatusMessage('3 CONSECUTIVE 6s! TURN FORFEITED!');
        setTimeout(() => {
          advanceTurn(tokens, turnIndex, rankings);
        }, 1200);
        return;
      }

      const legal = getLegalTokens(tokens, rolledValue, turnIndex);
      if (legal.length === 0) {
        setStatusMessage(`ROLLED A ${rolledValue}. NO LEGAL MOVES! PASSING TURN...`);
        setTimeout(() => {
          advanceTurn(tokens, turnIndex, rankings);
        }, 1200);
      } else {
        setStatusMessage(`ROLLED A ${rolledValue}! SELECT A HIGHLIGHTED TOKEN TO ADVANCE.`);
      }
    }, 450);
  }, [diceRolling, diceRolled, winner, gameMode, turnIndex, selectedSeat, consecutiveSixes, tokens, rankings, advanceTurn, getLegalTokens]);

  // Bot Turn Automation (Local AI Mode)
  useEffect(() => {
    if (gameMode !== 'ai' || winner !== null || diceRolling) return;
    if (turnIndex === selectedSeat) return; // Human turn

    const botTimer = setTimeout(() => {
      if (!diceRolled) {
        // Step 1: Bot rolls dice
        setDiceRolling(true);
        sound.playDiceRoll();

        setTimeout(() => {
          const rolled = 1 + Math.floor(Math.random() * 6);
          setDice(rolled);
          setDiceRolling(false);
          setDiceRolled(true);

          const nextSixes = rolled === 6 ? consecutiveSixes + 1 : 0;
          setConsecutiveSixes(nextSixes);

          if (nextSixes >= 3) {
            setStatusMessage(`BOT ${activeConfig[turnIndex].name} ROLLED THREE 6s! FORFEIT!`);
            setTimeout(() => {
              advanceTurn(tokens, turnIndex, rankings);
            }, 1000);
            return;
          }

          const legal = getLegalTokens(tokens, rolled, turnIndex);
          if (legal.length === 0) {
            setStatusMessage(`BOT ${activeConfig[turnIndex].name} ROLLED A ${rolled}. NO MOVES.`);
            setTimeout(() => {
              advanceTurn(tokens, turnIndex, rankings);
            }, 1000);
          } else {
            // Pick best legal token: capture > home > base exit > advance
            let bestToken = legal[0];
            let bestScore = -Infinity;

            const myStart = activeConfig[turnIndex].startIdx;

            for (const t of legal) {
              const currentStep = tokens[turnIndex][t];
              let score = 0;
              if (currentStep === -1) {
                score += 70; // Release from base
              } else {
                const nextStep = currentStep + rolled;
                if (nextStep === 56) score += 150; // Goal
                else if (nextStep >= 51) score += 80; // Home stretch
                else {
                  const nextGlobal = (myStart + nextStep) % 52;
                  if (SAFE_TRACK_INDICES.includes(nextGlobal)) score += 60; // Safe square

                  // Check if can capture opponent
                  for (let p = 0; p < playerCount; p++) {
                    if (p === turnIndex) continue;
                    const oppStart = activeConfig[p].startIdx;
                    for (let ot = 0; ot < 4; ot++) {
                      const oppStep = tokens[p][ot];
                      if (oppStep >= 0 && oppStep < 51) {
                        const oppGlobal = (oppStart + oppStep) % 52;
                        if (oppGlobal === nextGlobal) score += 120; // High priority capture!
                      }
                    }
                  }
                  score += nextStep * 1.5;
                }
              }

              if (score > bestScore) {
                bestScore = score;
                bestToken = t;
              }
            }

            // Step 2: Bot moves chosen token after short deliberation
            setTimeout(() => {
              executeLocalMove(bestToken);
            }, 600);
          }
        }, 400);
      }
    }, 700);

    return () => clearTimeout(botTimer);
  }, [gameMode, turnIndex, selectedSeat, diceRolled, diceRolling, winner, consecutiveSixes, activeConfig, advanceTurn, tokens, rankings, getLegalTokens, executeLocalMove, playerCount]);

  // ----------------------------------------------------
  // ONLINE MULTIPLAYER SOCKET INTEGRATION
  // ----------------------------------------------------
  useEffect(() => {
    if (!socket || gameMode !== 'online') return;

    const handleStateUpdate = (room) => {
      setOnlineRoom(room);
      setPlayerCount(room.maxPlayers);
      setTokens(room.tokens);
      setTurnIndex(room.turnIndex);
      setDice(room.dice);
      setDiceRolled(room.diceRolled);
      if (room.winner !== null) {
        setWinner(room.winner);
      }
    };

    const handleDiceRolled = ({ dice: rollVal, legalTokens: leg, turnIndex: tIdx, forfeit }) => {
      setDice(rollVal);
      setDiceRolled(true);
      sound.playDiceRoll();
      if (forfeit) {
        setStatusMessage('3 CONSECUTIVE 6s! TURN FORFEITED!');
      }
    };

    socket.on('ludo_state_update', handleStateUpdate);
    socket.on('ludo_dice_rolled', handleDiceRolled);

    return () => {
      socket.off('ludo_state_update', handleStateUpdate);
      socket.off('ludo_dice_rolled', handleDiceRolled);
    };
  }, [socket, gameMode]);

  // Online Create Room
  const handleCreateOnlineRoom = () => {
    if (!socket || !socketConnected) {
      setOnlineStatus('Connecting to game server...');
      return;
    }
    setOnlineStatus('Creating Ludo battlefield...');
    socket.emit(
      'ludo_create_room',
      { maxPlayers: playerCount, timeControl: 30, playerId, playerName: `Player 1` },
      (res) => {
        if (res && res.success) {
          setOnlineRoomCode(res.roomId);
          setOnlineSeatIndex(res.seatIndex);
          setOnlineRoom(res.room);
          setOnlineStatus('');
        } else {
          setOnlineStatus(res?.error || 'Failed to create room.');
        }
      }
    );
  };

  // Online Join Room
  const handleJoinOnlineRoom = () => {
    if (!socket || !socketConnected) {
      setOnlineStatus('Connecting to game server...');
      return;
    }
    const clean = onlineInputCode.trim().toUpperCase();
    if (!clean) return;

    setOnlineStatus('Joining battlefield...');
    socket.emit(
      'ludo_join_room',
      { roomId: clean, playerId, playerName: `Player` },
      (res) => {
        if (res && res.success) {
          setOnlineRoomCode(res.roomId);
          setOnlineSeatIndex(res.seatIndex);
          setOnlineRoom(res.room);
          setOnlineStatus('');
        } else {
          setOnlineStatus(res?.error || 'Room not found.');
        }
      }
    );
  };

  // Online Start Match with Bots
  const handleStartOnlineWithBots = () => {
    if (!socket || !onlineRoomCode) return;
    socket.emit('ludo_start_match', { roomId: onlineRoomCode, fillBots: true });
  };

  // Online Roll Dice
  const handleOnlineRollDice = () => {
    if (!socket || !onlineRoomCode || diceRolled) return;
    socket.emit('ludo_roll_dice', { roomId: onlineRoomCode });
  };

  // Online Move Token
  const handleOnlineMoveToken = (tokenIdx) => {
    if (!socket || !onlineRoomCode || !diceRolled) return;
    socket.emit('ludo_move_token', { roomId: onlineRoomCode, tokenIndex: tokenIdx });
  };

  // Helper to translate token position into board [row, col] coordinates
  const getTokenPositionCoord = (pIdx, tokenStep, tokenIdx) => {
    const config = activeConfig[pIdx] || activeConfig[0];
    if (tokenStep === -1) {
      // In base slot
      const [rOffset, cOffset] = YARD_SLOTS[tokenIdx];
      return [config.yardR + rOffset, config.yardC + cOffset];
    }
    if (tokenStep < 51) {
      // On outer track
      const trackIdx = (config.startIdx + tokenStep) % 52;
      return LUDO_TRACK[trackIdx];
    }
    // In Home Column or Goal
    const homeStep = tokenStep - 51;
    return config.homePath[homeStep] || [7, 7];
  };

  // Reset Match
  const resetMatch = () => {
    setTokens(Array.from({ length: playerCount }, () => [-1, -1, -1, -1]));
    setTurnIndex(0);
    setDice(null);
    setDiceRolled(false);
    setConsecutiveSixes(0);
    setWinner(null);
    setRankings([]);
    setStatusMessage('ROUND RESET! ROLL THE DICE TO START.');
  };

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f5f5f0] text-black'}`}>
      
      {/* Top Ludo Header & Masthead */}
      <div className={`border-b-3 border-black px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#f97316] border-2 border-black flex items-center justify-center font-black text-white text-base brutal-shadow-sm font-mono shrink-0">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Neo-Brutal Ludo
              </h2>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                {playerCount} PLAYERS • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              15x15 TACTICAL BOARD // SAFE ZONES // HOME RUNS // LIVE ONLINE ROOMS
            </p>
          </div>
        </div>

        {/* Header Right Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Guide / Rules Toggle */}
          <button
            onClick={() => setShowRules(true)}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Ludo Rules & Mechanics Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-black" />
            <span className="hidden md:inline">RULES</span>
          </button>

          {/* Game Catalogue Switcher */}
          <button
            onClick={onOpenCatalogue}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Browse All Games in the Catalogue"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CATALOGUE</span>
          </button>

          {/* Restart Round */}
          <button
            onClick={resetMatch}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Reset Board & Tokens"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-5 lg:p-7 flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT / CENTER: 15x15 Ludo Board (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col items-center w-full">
            
            {/* Status Turn Banner */}
            <div
              className={`w-full max-w-[560px] mb-3 px-3 py-2 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 transition-all ${
                isDarkTheme ? 'bg-[#18181b]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-black shrink-0 animate-pulse"
                  style={{ backgroundColor: activeConfig[turnIndex]?.hex || '#ef4444' }}
                />
                <span className="font-brutal font-black text-xs sm:text-sm uppercase tracking-wide">
                  {statusMessage}
                </span>
              </div>

              {dice !== null && (
                <div className="flex items-center gap-1 font-mono text-xs font-black px-2 py-0.5 bg-black text-white border border-black">
                  <span>DICE: {dice}</span>
                </div>
              )}
            </div>

            {/* 15x15 Authentic Neo-Brutalist Ludo Board */}
            <div className="relative w-full max-w-[560px] aspect-square p-2 bg-black border-4 border-black brutal-shadow-lg select-none">
              
              {/* 15x15 CSS Grid Container */}
              <div className="grid grid-cols-15 grid-rows-15 w-full h-full gap-[1px] bg-black">
                {Array.from({ length: 15 * 15 }).map((_, idx) => {
                  const r = Math.floor(idx / 15);
                  const c = idx % 15;

                  // 1. Check if cell is in one of the 4 corner bases (6x6)
                  // Red Base: r: 0-5, c: 0-5
                  const isRedBase = r <= 5 && c <= 5;
                  // Green Base: r: 0-5, c: 9-14
                  const isGreenBase = r <= 5 && c >= 9;
                  // Yellow Base: r: 9-14, c: 9-14
                  const isYellowBase = r >= 9 && c >= 9;
                  // Orange Base: r: 9-14, c: 0-5
                  const isOrangeBase = r >= 9 && c <= 5;

                  // Center Triangle Finish Goal: r: 6-8, c: 6-8
                  const isCenterGoal = r >= 6 && r <= 8 && c >= 6 && c <= 8;

                  // Home Columns
                  const isRedHomePath = r === 7 && c >= 1 && c <= 5;
                  const isGreenHomePath = c === 7 && r >= 1 && r <= 5;
                  const isYellowHomePath = r === 7 && c >= 9 && c <= 13;
                  const isOrangeHomePath = c === 7 && r >= 9 && r <= 13;

                  // Track Cells
                  const trackIdx = LUDO_TRACK.findIndex(([trR, trC]) => trR === r && trC === c);
                  const isSafeSquare = trackIdx !== -1 && SAFE_TRACK_INDICES.includes(trackIdx);

                  // Base Colors
                  let cellBg = isDarkTheme ? 'bg-[#18181b]' : 'bg-[#fafaf8]';
                  if (isRedBase) cellBg = 'bg-[#ef4444]/25';
                  else if (isGreenBase) cellBg = 'bg-[#22c55e]/25';
                  else if (isYellowBase) cellBg = 'bg-[#facc15]/30';
                  else if (isOrangeBase) cellBg = 'bg-[#f97316]/25';
                  else if (isRedHomePath) cellBg = 'bg-[#ef4444]';
                  else if (isGreenHomePath) cellBg = 'bg-[#22c55e]';
                  else if (isYellowHomePath) cellBg = 'bg-[#facc15]';
                  else if (isOrangeHomePath) cellBg = 'bg-[#f97316]';
                  else if (isCenterGoal) cellBg = 'bg-black';

                  // Safe square start marks
                  const isRedStart = r === 6 && c === 1;
                  const isGreenStart = r === 1 && c === 8;
                  const isYellowStart = r === 8 && c === 13;
                  const isOrangeStart = r === 13 && c === 6;

                  return (
                    <div
                      key={idx}
                      className={`relative flex items-center justify-center ${cellBg} transition-colors`}
                    >
                      {/* Safe Square Shield / Star Icons */}
                      {isSafeSquare && !isCenterGoal && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-70">
                          <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[2.5]" />
                        </div>
                      )}

                      {/* Start Square Arrow Markers */}
                      {isRedStart && <span className="text-[9px] font-black font-mono text-[#ef4444]">▶</span>}
                      {isGreenStart && <span className="text-[9px] font-black font-mono text-[#22c55e]">▼</span>}
                      {isYellowStart && <span className="text-[9px] font-black font-mono text-[#a16207]">◀</span>}
                      {isOrangeStart && <span className="text-[9px] font-black font-mono text-[#f97316]">▲</span>}

                      {/* Center Goal Trophy */}
                      {r === 7 && c === 7 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#facc15] border border-black">
                          <Crown className="w-4 h-4 text-black fill-current animate-pulse" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* OVERLAY: 4 Yard Inner Playpens with 4 Token Slots */}
              {activeConfig.map((cfg, pIdx) => {
                const isTop = cfg.yardR < 6;
                const isLeft = cfg.yardC < 6;

                return (
                  <div
                    key={pIdx}
                    className={`absolute w-[39.5%] h-[39.5%] p-2 sm:p-3 border-3 border-black flex flex-col justify-between ${
                      isTop ? 'top-[0.5%]' : 'bottom-[0.5%]'
                    } ${isLeft ? 'left-[0.5%]' : 'right-[0.5%]'}`}
                    style={{ backgroundColor: cfg.hex }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-brutal font-black text-[10px] sm:text-xs text-white bg-black px-1.5 py-0.5 border border-white">
                        {cfg.name.toUpperCase()} BASE
                      </span>
                      <span className="font-mono text-[9px] font-bold text-white bg-black/40 px-1">
                        {tokens[pIdx]?.filter((s) => s === 56).length}/4 HOME
                      </span>
                    </div>

                    {/* 4 Inner White Circles for Yard Tokens */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white border-2 border-black brutal-shadow-sm h-[75%] items-center justify-items-center">
                      {[0, 1, 2, 3].map((tIdx) => {
                        const step = tokens[pIdx]?.[tIdx];
                        const inBase = step === -1;
                        const isMovable = turnIndex === pIdx && currentLegalTokens.includes(tIdx);

                        return (
                          <div
                            key={tIdx}
                            onClick={() => {
                              if (isMovable) {
                                if (gameMode === 'online') handleOnlineMoveToken(tIdx);
                                else executeLocalMove(tIdx);
                              }
                            }}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-black flex items-center justify-center cursor-pointer transition-transform ${
                              inBase
                                ? 'bg-black text-white font-mono text-[10px] font-black'
                                : 'bg-neutral-100 border-dashed border-neutral-400'
                            } ${
                              isMovable
                                ? 'ring-4 ring-[#facc15] scale-110 animate-bounce brutal-shadow-sm cursor-pointer'
                                : ''
                            }`}
                            style={{ backgroundColor: inBase ? cfg.hex : undefined }}
                          >
                            {inBase && (
                              <span className="drop-shadow-sm text-black font-black text-xs">
                                {tIdx + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* OVERLAY: Dynamic Tokens Moving Across the 52 Track & Home Run */}
              {activeConfig.map((cfg, pIdx) => {
                return (tokens[pIdx] || []).map((step, tIdx) => {
                  if (step === -1) return null; // Rendered in Yard above

                  const [row, col] = getTokenPositionCoord(pIdx, step, tIdx);
                  const isMovable = turnIndex === pIdx && currentLegalTokens.includes(tIdx);

                  // Percentage placement inside the 15x15 board
                  const topPercent = (row / 15) * 100;
                  const leftPercent = (col / 15) * 100;

                  return (
                    <div
                      key={`token_${pIdx}_${tIdx}`}
                      onClick={() => {
                        if (isMovable) {
                          if (gameMode === 'online') handleOnlineMoveToken(tIdx);
                          else executeLocalMove(tIdx);
                        }
                      }}
                      className={`absolute w-[6%] h-[6%] rounded-full border-2 border-black flex items-center justify-center font-mono font-black text-[9px] sm:text-xs z-20 transition-all duration-200 select-none ${
                        isMovable
                          ? 'ring-3 ring-[#facc15] scale-125 animate-bounce cursor-pointer brutal-shadow-sm'
                          : 'cursor-default'
                      }`}
                      style={{
                        top: `calc(${topPercent}% + 0.3%)`,
                        left: `calc(${leftPercent}% + 0.3%)`,
                        backgroundColor: cfg.hex,
                        color: '#000000'
                      }}
                      title={`${cfg.name} Token ${tIdx + 1} (Step ${step})`}
                    >
                      <span className="font-black drop-shadow-sm">{tIdx + 1}</span>
                    </div>
                  );
                });
              })}
            </div>

            {/* Tactile 3D Dice Roller Controls */}
            <div className="w-full max-w-[560px] mt-4 flex items-center justify-between gap-3 p-3 border-3 border-black bg-white brutal-shadow-md">
              <div className="flex items-center gap-3">
                {/* 3D Interactive Dice Button */}
                <button
                  onClick={() => {
                    if (gameMode === 'online') handleOnlineRollDice();
                    else handleRollDice();
                  }}
                  disabled={diceRolling || (gameMode === 'ai' && turnIndex !== selectedSeat) || diceRolled}
                  className={`brutal-press relative w-14 h-14 sm:w-16 sm:h-16 border-3 border-black flex flex-col items-center justify-center font-mono font-black text-2xl sm:text-3xl transition-transform cursor-pointer select-none ${
                    diceRolling ? 'animate-spin bg-[#facc15]' : 'bg-[#fafaf8] hover:bg-neutral-100'
                  } ${!diceRolled && !diceRolling ? 'ring-4 ring-[#22c55e] scale-105' : ''}`}
                  title="Click to Roll Dice"
                >
                  {diceRolling ? (
                    '🎲'
                  ) : dice !== null ? (
                    <span className="font-brutal font-black text-black">{dice}</span>
                  ) : (
                    <span className="text-neutral-400 text-lg">ROLL</span>
                  )}
                </button>

                <div>
                  <div className="font-brutal font-black text-xs sm:text-sm uppercase tracking-tight">
                    {diceRolling
                      ? 'TUMBLING DICE...'
                      : diceRolled
                      ? `ROLLED A ${dice}!`
                      : 'TAP DICE TO ROLL'}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500">
                    {consecutiveSixes > 0 ? `Sixes streak: ${consecutiveSixes}/3` : 'Roll 6 for extra turn & base exit'}
                  </div>
                </div>
              </div>

              {/* Roll Dice Trigger Button */}
              <button
                onClick={() => {
                  if (gameMode === 'online') handleOnlineRollDice();
                  else handleRollDice();
                }}
                disabled={diceRolling || (gameMode === 'ai' && turnIndex !== selectedSeat) || diceRolled}
                className="brutal-press px-4 py-2.5 bg-[#22c55e] hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ROLL DICE</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Settings, Online Lobby & Player Stats (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-4 w-full">
            
            {/* PLAYER SEAT & TURN CARDS */}
            <div className={`p-4 border-3 border-black brutal-shadow-md ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
              <div className="font-brutal font-black text-xs uppercase tracking-wider mb-3 flex items-center justify-between pb-2 border-b-2 border-black">
                <span>BATTLE PARTICIPANTS</span>
                <span className="font-mono text-[10px] text-neutral-400">
                  {playerCount} PLAYERS ACTIVE
                </span>
              </div>

              <div className="space-y-2">
                {activeConfig.map((cfg, idx) => {
                  const isCurrent = turnIndex === idx;
                  const homeCount = tokens[idx]?.filter((s) => s === 56).length || 0;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 border-2 border-black flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-black text-white brutal-shadow-sm scale-[1.02]'
                          : 'bg-neutral-50 dark:bg-neutral-900 text-black dark:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-black shrink-0"
                          style={{ backgroundColor: cfg.hex }}
                        />
                        <div>
                          <div className="font-brutal font-black text-xs uppercase">
                            {cfg.name} {gameMode === 'ai' && idx !== selectedSeat ? '(BOT)' : ''}
                          </div>
                          <div className="font-mono text-[10px] opacity-75">
                            Tokens Home: {homeCount}/4
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-[#22c55e] text-black font-mono text-[9px] font-black border border-black animate-pulse">
                          ACTIVE TURN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MATCH CONFIGURATION / MODE SELECTOR */}
            <div className={`p-4 border-3 border-black brutal-shadow-md ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
              <div className="font-brutal font-black text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>SELECT GAME MODE</span>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[
                  { id: 'ai', label: 'vs BOT', icon: Bot },
                  { id: 'pass_play', label: 'PASS&PLAY', icon: Users },
                  { id: 'online', label: 'ONLINE PvP', icon: Wifi }
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setGameMode(mode.id)}
                      className={`py-2 px-1 border-2 border-black font-brutal text-[10px] font-black uppercase cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors ${
                        gameMode === mode.id
                          ? 'bg-[#22c55e] text-black brutal-shadow-sm'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Player Count Selector: 2, 3, or 4 Players */}
              <div className="pt-2 border-t border-black/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] font-bold uppercase text-neutral-500">
                    PLAYER COUNT:
                  </span>
                  <span className="font-mono text-xs font-black">
                    {playerCount} PLAYERS (MIN 2, MAX 4)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      disabled={gameMode === 'online' && Boolean(onlineRoom)}
                      className={`py-1.5 border-2 border-black font-brutal text-xs font-black cursor-pointer transition-colors ${
                        playerCount === count
                          ? 'bg-black text-white brutal-shadow-sm'
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      {count} PLAYERS
                    </button>
                  ))}
                </div>
              </div>

              {/* Online Multiplayer Controls (When mode === 'online') */}
              {gameMode === 'online' && (
                <div className="mt-3 pt-3 border-t-2 border-black space-y-3">
                  <div className="font-brutal font-black text-xs uppercase tracking-wider">
                    ONLINE ROOM LOBBY
                  </div>

                  {!onlineRoomCode ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleCreateOnlineRoom}
                        className="brutal-press w-full py-2.5 bg-[#f97316] hover:bg-orange-500 text-white font-brutal text-xs font-black uppercase border-2 border-black cursor-pointer brutal-shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        <span>CREATE LUDO ROOM</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={onlineInputCode}
                          onChange={(e) => setOnlineInputCode(e.target.value.toUpperCase())}
                          placeholder="ROOM CODE"
                          maxLength={10}
                          className="flex-1 py-1.5 px-2 bg-neutral-100 border-2 border-black font-mono text-xs uppercase font-bold focus:outline-none"
                        />
                        <button
                          onClick={handleJoinOnlineRoom}
                          className="brutal-press py-1.5 px-3 bg-[#22c55e] text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer"
                        >
                          JOIN
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-black space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-neutral-500">ROOM CODE:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm font-black text-black dark:text-white bg-white dark:bg-black px-2 py-0.5 border border-black">
                            {onlineRoomCode}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(onlineRoomCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="p-1 bg-white border border-black cursor-pointer hover:bg-neutral-200"
                            title="Copy code"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                        Players Joined: {onlineRoom?.players?.length || 1} / {playerCount}
                      </div>

                      {onlineRoom?.status === 'waiting' && (
                        <button
                          onClick={handleStartOnlineWithBots}
                          className="brutal-press w-full py-2 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>FILL BOTS & START MATCH</span>
                        </button>
                      )}
                    </div>
                  )}

                  {onlineStatus && (
                    <div className="font-mono text-[11px] text-red-500 font-bold">
                      {onlineStatus}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* WINNER / GAME OVER MODAL */}
      {winner !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs modal-backdrop-anim select-none"
        >
          <div
            className={`w-full max-w-md border-4 border-black p-6 brutal-shadow-xl modal-content-anim text-center space-y-4 ${
              isDarkTheme ? 'bg-[#18181b] text-white' : 'bg-white text-black'
            }`}
          >
            <div className="w-16 h-16 mx-auto bg-[#facc15] border-3 border-black flex items-center justify-center text-3xl font-black brutal-shadow-sm">
              👑
            </div>

            <div className="space-y-1">
              <h3 className="font-brutal text-2xl font-black uppercase tracking-tight">
                VICTORY! {activeConfig[winner]?.name} WINS!
              </h3>
              <p className="font-mono text-xs text-neutral-500">
                All 4 tokens safely reached the central home goal.
              </p>
            </div>

            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-black font-mono text-xs">
              <div className="font-bold mb-1 uppercase">PODIUM FINISHERS</div>
              <div className="flex justify-center gap-2">
                <span className="px-2 py-0.5 bg-[#facc15] text-black font-black border border-black">
                  1st: {activeConfig[winner]?.name}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={resetMatch}
                className="brutal-press flex-1 py-3 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={onOpenCatalogue}
                className="brutal-press flex-1 py-3 bg-white text-black hover:bg-neutral-100 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
              >
                CATALOGUE
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="w-7 h-7 bg-[#f97316] border-2 border-black flex items-center justify-center font-black text-white text-xs">
                  🎲
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Ludo Tactical Rules & Guide
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
                  1. Releasing Tokens (Roll a 6)
                </strong>
                Tokens start in your corner Yard. You must roll a <strong>6</strong> to exit the Yard onto your starting square. Rolling a 6 also grants an <strong>extra roll</strong>!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Capturing Opponents
                </strong>
                Landing on an opponent's token on any standard track square captures it, sending it back to their Yard! Capturing an opponent grants an <strong>extra bonus roll</strong>.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Safe Squares (Shields)
                </strong>
                Squares marked with a Shield icon (including all starting squares) are Safe Squares. Tokens of different players can coexist peacefully on Safe Squares without capture.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  4. Victory Condition
                </strong>
                Navigate around the entire 52-cell track and enter your colored Home Column. The first player to bring all 4 tokens into the central Goal wins!
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
    </div>
  );
};
