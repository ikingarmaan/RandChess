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
  Crown,
  ChevronRight,
  Sliders,
  Dice5,
  Gamepad2,
  FastForward,
  PlayCircle
} from 'lucide-react';
import { sound } from '../utils/sound';
import { LudoOnlineLobbyModal } from './LudoOnlineLobbyModal';

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
    { name: 'Red', hex: '#ef4444', borderHex: '#991b1b', corner: 'top-left', startIdx: 0, yardR: 1, yardC: 1, homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] },
    { name: 'Yellow', hex: '#facc15', borderHex: '#a16207', corner: 'bottom-right', startIdx: 26, yardR: 10, yardC: 10, homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]] }
  ],
  3: [
    { name: 'Red', hex: '#ef4444', borderHex: '#991b1b', corner: 'top-left', startIdx: 0, yardR: 1, yardC: 1, homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] },
    { name: 'Green', hex: '#22c55e', borderHex: '#15803d', corner: 'top-right', startIdx: 13, yardR: 1, yardC: 10, homePath: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]] },
    { name: 'Yellow', hex: '#facc15', borderHex: '#a16207', corner: 'bottom-right', startIdx: 26, yardR: 10, yardC: 10, homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]] }
  ],
  4: [
    { name: 'Red', hex: '#ef4444', borderHex: '#991b1b', corner: 'top-left', startIdx: 0, yardR: 1, yardC: 1, homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] },
    { name: 'Green', hex: '#22c55e', borderHex: '#15803d', corner: 'top-right', startIdx: 13, yardR: 1, yardC: 10, homePath: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]] },
    { name: 'Yellow', hex: '#facc15', borderHex: '#a16207', corner: 'bottom-right', startIdx: 26, yardR: 10, yardC: 10, homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]] },
    { name: 'Orange', hex: '#f97316', borderHex: '#c2410c', corner: 'bottom-left', startIdx: 39, yardR: 10, yardC: 1, homePath: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]] }
  ]
};

// Precise positions for the 4 token pockets inside each 6x6 base
const YARD_SLOT_OFFSETS = [
  [1.7, 1.7], [1.7, 3.7], [3.7, 1.7], [3.7, 3.7]
];

// Authentic 3D Neo-Brutalist Dice Face with actual dots/pips (1-6)
export const DiceFace = ({ value, rolling = false, size = 'md', className = '' }) => {
  const [displayVal, setDisplayVal] = useState(value || 6);

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setDisplayVal(1 + Math.floor(Math.random() * 6));
      }, 70);
      return () => clearInterval(interval);
    } else if (value !== null && value !== undefined) {
      setDisplayVal(value);
    }
  }, [rolling, value]);

  const pips = {
    1: [[1, 1]],
    2: [[0, 2], [2, 0]],
    3: [[0, 2], [1, 1], [2, 0]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
  }[displayVal] || [[1, 1]];

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-md p-1 border-2',
    md: 'w-11 h-11 rounded-lg p-1.5 border-3',
    lg: 'w-14 h-14 rounded-xl p-2 border-3'
  }[size] || 'w-11 h-11 rounded-lg p-1.5 border-3';

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size] || 'w-2 h-2';

  return (
    <div
      className={`relative bg-white text-black border-black brutal-shadow-sm flex items-center justify-center select-none transition-transform shrink-0 ${sizeClasses} ${
        rolling ? 'animate-bounce rotate-12 bg-[#facc15]' : ''
      } ${className}`}
    >
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const hasPip = pips.some(([pR, pC]) => pR === r && pC === c);
            return (
              <div key={`${r}_${c}`} className="w-full h-full flex items-center justify-center">
                {hasPip && (
                  <span className={`${dotSizes} rounded-full bg-black block shadow-xs`} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const LudoGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue,
  socket,
  socketConnected,
  playerId
}) => {
  // Mode setup
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play' | 'online'
  const [playerCount, setPlayerCount] = useState(4); // 2 | 3 | 4
  const [selectedSeat, setSelectedSeat] = useState(0); // For vs Bot mode: human's seat (0: Red)

  // Automation & Convenience Toggles
  const [autoRoll, setAutoRoll] = useState(false);
  const [autoMoveSingle, setAutoMoveSingle] = useState(true);
  const [botSpeed, setBotSpeed] = useState('normal'); // 'fast' | 'normal' | 'slow'
  const [soundActive, setSoundActive] = useState(soundEnabled);

  // Online Multiplayer State
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState('');
  const [onlineRoom, setOnlineRoom] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState('');
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [quickCountdown, setQuickCountdown] = useState(null);

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

  // Match Event Radar / Activity Feed
  const [eventLog, setEventLog] = useState([
    { id: 1, text: 'Battlefield initialized. Welcome to Neo-Brutal Ludo!', type: 'system', hex: '#facc15' }
  ]);

  const addEvent = useCallback((text, type = 'info', hex = '#000000') => {
    setEventLog((prev) => [
      { id: Date.now() + Math.random(), text, type, hex, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
      ...prev.slice(0, 19)
    ]);
  }, []);

  // Sync sound setting
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

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
      setStatusMessage('ROUND INITIALIZED! ROLL THE DICE TO START.');
      addEvent(`Switched to ${playerCount}-Player battlefield.`, 'system', '#facc15');
    }
  }, [playerCount, gameMode, addEvent]);

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
    while (attempts < playerCount && (currentRankings.includes(next) || currentTokens[next]?.every((s) => s === 56))) {
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

  // Helper to translate token position into board [row, col] coordinates
  const getTokenPositionCoord = useCallback((pIdx, tokenStep, tokenIdx) => {
    const config = activeConfig[pIdx] || activeConfig[0] || LUDO_CONFIGS[4][0];
    if (tokenStep === -1) {
      // In base slot
      const offset = (YARD_SLOT_OFFSETS && YARD_SLOT_OFFSETS[tokenIdx]) || [1.7, 1.7];
      return [(config.yardR ?? 1) + offset[0], (config.yardC ?? 1) + offset[1]];
    }
    if (tokenStep < 51) {
      // On outer track
      const trackIdx = ((config.startIdx ?? 0) + tokenStep) % 52;
      return LUDO_TRACK[trackIdx] || [7, 7];
    }
    // In Home Column or Goal
    const homeStep = tokenStep - 51;
    return (config.homePath && config.homePath[homeStep]) || [7, 7];
  }, [activeConfig]);

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

      const pCfg = activeConfig[turnIndex];
      let extraTurn = dice === 6;

      if (currentStep === -1) {
        addEvent(`🚩 ${pCfg.name} released Token ${tokenIdx + 1} onto the track!`, 'exit', pCfg.hex);
      } else {
        addEvent(`${pCfg.name} moved Token ${tokenIdx + 1} to Step ${newStep}.`, 'move', pCfg.hex);
      }

      // Check for Capture on main track
      if (newStep < 51) {
        const myStart = pCfg.startIdx;
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
                  setStatusMessage(`⚔️ STRIKE! ${pCfg.name} CAPTURED ${activeConfig[p].name}! EXTRA TURN!`);
                  addEvent(`⚔️ STRIKE! ${pCfg.name} captured ${activeConfig[p].name}'s Token ${t + 1}! Extra Turn!`, 'capture', '#ef4444');
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
        setStatusMessage(`👑 HOME RUN! ${pCfg.name} GOT A TOKEN HOME!`);
        addEvent(`👑 HOME RUN! ${pCfg.name} brought Token ${tokenIdx + 1} home! Extra Turn!`, 'home', '#facc15');
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
              addEvent(`🏆 VICTORY! ${pCfg.name} WON THE MATCH!`, 'win', pCfg.hex);
              confetti({
                particleCount: 130,
                spread: 90,
                origin: { y: 0.5 },
                colors: [pCfg.hex, '#ffffff', '#000000']
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
          setStatusMessage(`ROLLED A 6! ${pCfg.name} ROLLS AGAIN!`);
        }
      } else {
        advanceTurn(nextTokens, turnIndex, rankings);
      }

      return nextTokens;
    });
  }, [diceRolled, dice, winner, currentLegalTokens, turnIndex, activeConfig, playerCount, advanceTurn, rankings, addEvent]);

  // Roll Dice (Local)
  const handleRollDice = useCallback((requestingSeat = turnIndex) => {
    if (diceRolling || diceRolled || winner !== null) return;

    // Check turn authorization in vs AI
    if (gameMode === 'ai' && turnIndex !== selectedSeat) return;
    if (requestingSeat !== turnIndex) return;

    setDiceRolling(true);
    sound.playDiceRoll();

    setTimeout(() => {
      const rolledValue = 1 + Math.floor(Math.random() * 6);
      setDice(rolledValue);
      setDiceRolling(false);
      setDiceRolled(true);

      const pCfg = activeConfig[turnIndex];
      addEvent(`🎲 ${pCfg?.name} rolled a ${rolledValue}.`, 'roll', pCfg?.hex);

      const nextSixes = rolledValue === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixes);

      if (nextSixes >= 3) {
        setStatusMessage('3 CONSECUTIVE 6s! TURN FORFEITED!');
        addEvent(`⚠️ ${pCfg?.name} rolled three 6s in a row - turn forfeited!`, 'forfeit', '#ef4444');
        setTimeout(() => {
          advanceTurn(tokens, turnIndex, rankings);
        }, 1100);
        return;
      }

      const legal = getLegalTokens(tokens, rolledValue, turnIndex);
      if (legal.length === 0) {
        setStatusMessage(`ROLLED A ${rolledValue}. NO LEGAL MOVES! PASSING TURN...`);
        setTimeout(() => {
          advanceTurn(tokens, turnIndex, rankings);
        }, 1100);
      } else {
        setStatusMessage(`ROLLED A ${rolledValue}! CLICK A HIGHLIGHTED TOKEN.`);

        // Auto-move single legal token option
        if (legal.length === 1 && autoMoveSingle && (gameMode === 'pass_play' || (gameMode === 'ai' && turnIndex === selectedSeat))) {
          setTimeout(() => {
            executeLocalMove(legal[0]);
          }, 450);
        }
      }
    }, 380);
  }, [diceRolling, diceRolled, winner, gameMode, turnIndex, selectedSeat, consecutiveSixes, tokens, rankings, advanceTurn, getLegalTokens, activeConfig, addEvent, autoMoveSingle, executeLocalMove]);

  // Auto-Roll Trigger (When enabled for Human turn)
  useEffect(() => {
    if (!autoRoll || winner !== null || diceRolled || diceRolling) return;
    const isHumanTurn = (gameMode === 'ai' && turnIndex === selectedSeat) || gameMode === 'pass_play';
    if (!isHumanTurn) return;

    const autoRollTimer = setTimeout(() => {
      handleRollDice(turnIndex);
    }, 450);

    return () => clearTimeout(autoRollTimer);
  }, [autoRoll, turnIndex, selectedSeat, gameMode, diceRolled, diceRolling, winner, handleRollDice]);

  // Bot Turn Automation (Local AI Mode)
  useEffect(() => {
    if (gameMode !== 'ai' || winner !== null || diceRolling) return;
    if (turnIndex === selectedSeat) return; // Human turn

    const botDelay = botSpeed === 'fast' ? 180 : botSpeed === 'slow' ? 1100 : 550;

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

          const pCfg = activeConfig[turnIndex];
          addEvent(`🤖 Bot ${pCfg?.name} rolled a ${rolled}.`, 'roll', pCfg?.hex);

          const nextSixes = rolled === 6 ? consecutiveSixes + 1 : 0;
          setConsecutiveSixes(nextSixes);

          if (nextSixes >= 3) {
            setStatusMessage(`BOT ${pCfg?.name} ROLLED THREE 6s! FORFEIT!`);
            setTimeout(() => {
              advanceTurn(tokens, turnIndex, rankings);
            }, botDelay);
            return;
          }

          const legal = getLegalTokens(tokens, rolled, turnIndex);
          if (legal.length === 0) {
            setStatusMessage(`BOT ${pCfg?.name} ROLLED A ${rolled}. NO MOVES.`);
            setTimeout(() => {
              advanceTurn(tokens, turnIndex, rankings);
            }, botDelay);
          } else {
            // Pick best legal token: capture > home > base exit > advance
            let bestToken = legal[0];
            let bestScore = -Infinity;

            const myStart = pCfg?.startIdx ?? 0;

            for (const t of legal) {
              const currentStep = tokens[turnIndex][t];
              let score = 0;
              if (currentStep === -1) {
                score += 80; // Release from base
              } else {
                const nextStep = currentStep + rolled;
                if (nextStep === 56) score += 160; // Goal
                else if (nextStep >= 51) score += 90; // Home stretch
                else {
                  const nextGlobal = (myStart + nextStep) % 52;
                  if (SAFE_TRACK_INDICES.includes(nextGlobal)) score += 65; // Safe square

                  // Check if can capture opponent
                  for (let p = 0; p < playerCount; p++) {
                    if (p === turnIndex) continue;
                    const oppStart = activeConfig[p]?.startIdx ?? 0;
                    for (let ot = 0; ot < 4; ot++) {
                      const oppStep = tokens[p]?.[ot];
                      if (oppStep >= 0 && oppStep < 51) {
                        const oppGlobal = (oppStart + oppStep) % 52;
                        if (oppGlobal === nextGlobal) score += 140; // High priority capture!
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

            // Step 2: Bot moves chosen token
            setTimeout(() => {
              executeLocalMove(bestToken);
            }, botDelay);
          }
        }, 380);
      }
    }, botDelay + 100);

    return () => clearTimeout(botTimer);
  }, [gameMode, turnIndex, selectedSeat, diceRolled, diceRolling, winner, consecutiveSixes, activeConfig, advanceTurn, tokens, rankings, getLegalTokens, executeLocalMove, playerCount, botSpeed, addEvent]);

  // ----------------------------------------------------
  // ONLINE MULTIPLAYER SOCKET INTEGRATION
  // ----------------------------------------------------
  useEffect(() => {
    if (!socket) return;

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
      if (room.status === 'playing') {
        setIsOnlineModalOpen(false);
      }
    };

    const handleDiceRolled = ({ dice: rollVal, forfeit }) => {
      setDice(rollVal);
      setDiceRolled(true);
      sound.playDiceRoll();
      if (forfeit) {
        setStatusMessage('3 CONSECUTIVE 6s! TURN FORFEITED!');
      }
    };

    const handleCountdown = ({ seconds, playerCount: pCount }) => {
      setQuickCountdown({ seconds, playerCount: pCount });
    };

    socket.on('ludo_state_update', handleStateUpdate);
    socket.on('ludo_dice_rolled', handleDiceRolled);
    socket.on('ludo_quick_countdown', handleCountdown);

    return () => {
      socket.off('ludo_state_update', handleStateUpdate);
      socket.off('ludo_dice_rolled', handleDiceRolled);
      socket.off('ludo_quick_countdown', handleCountdown);
    };
  }, [socket]);

  // Online Actions
  const handleCreateOnlineRoom = ({ maxPlayers = 4, timeControl = 30 }) => {
    if (!socket || !socketConnected) {
      setOnlineStatus('Connecting to game server...');
      return;
    }
    setOnlineStatus('Creating Ludo battlefield...');
    socket.emit(
      'ludo_create_room',
      { maxPlayers, timeControl, playerId, playerName: 'You (Host)' },
      (res) => {
        if (res && res.success) {
          setOnlineRoomCode(res.roomId);
          setOnlineRoom(res.room);
          setOnlineStatus('');
          setGameMode('online');
          addEvent(`Created online room ${res.roomId}.`, 'system', '#22c55e');
        } else {
          setOnlineStatus(res?.error || 'Failed to create room.');
        }
      }
    );
  };

  const handleJoinOnlineRoom = (code) => {
    if (!socket || !socketConnected) {
      setOnlineStatus('Connecting to game server...');
      return;
    }
    setOnlineStatus('Joining battlefield...');
    socket.emit(
      'ludo_join_room',
      { roomId: code, playerId, playerName: 'You' },
      (res) => {
        if (res && res.success) {
          setOnlineRoomCode(res.roomId);
          setOnlineRoom(res.room);
          setOnlineStatus('');
          setGameMode('online');
          addEvent(`Joined online room ${res.roomId}.`, 'system', '#22c55e');
        } else {
          setOnlineStatus(res?.error || 'Room not found.');
        }
      }
    );
  };

  const handleStartOnlineMatch = ({ roomId, fillBots = false, targetCount }) => {
    if (!socket || !onlineRoomCode) return;
    socket.emit('ludo_start_match', { roomId, fillBots, targetCount });
  };

  const handleLeaveOnlineRoom = () => {
    if (socket && onlineRoomCode) {
      socket.emit('ludo_leave_room', { roomId: onlineRoomCode });
    }
    setOnlineRoomCode('');
    setOnlineRoom(null);
    setQuickCountdown(null);
    setIsSearchingQuickMatch(false);
    setGameMode('ai');
  };

  const handleFindQuickMatch = () => {
    if (!socket || !socketConnected) return;
    setIsSearchingQuickMatch(true);
    socket.emit('ludo_find_quick_match', { playerId, playerName: 'You' }, (res) => {
      if (res && res.success) {
        setOnlineRoomCode(res.roomId);
        setOnlineRoom(res.room);
        setGameMode('online');
      }
    });
  };

  const handleCancelQuickMatch = () => {
    if (socket) socket.emit('ludo_cancel_quick_match');
    setIsSearchingQuickMatch(false);
    setOnlineRoomCode('');
    setOnlineRoom(null);
    setQuickCountdown(null);
  };

  const handleOnlineRollDice = () => {
    if (!socket || !onlineRoomCode || diceRolled) return;
    socket.emit('ludo_roll_dice', { roomId: onlineRoomCode });
  };

  const handleOnlineMoveToken = (tokenIdx) => {
    if (!socket || !onlineRoomCode || !diceRolled) return;
    socket.emit('ludo_move_token', { roomId: onlineRoomCode, tokenIndex: tokenIdx });
  };

  // Reset Match (Local)
  const resetMatch = () => {
    setTokens(Array.from({ length: playerCount }, () => [-1, -1, -1, -1]));
    setTurnIndex(0);
    setDice(null);
    setDiceRolled(false);
    setConsecutiveSixes(0);
    setWinner(null);
    setRankings([]);
    setStatusMessage('MATCH RESET! ROLL THE DICE TO START.');
    addEvent('Match restarted from initial base positions.', 'system', '#facc15');
  };

  // Check if current user can roll or move
  const onlineMySeatIndex = onlineRoom?.players?.findIndex((p) => p.playerId === playerId || p.id === socket?.id);
  const isMyOnlineTurn = gameMode === 'online' && onlineMySeatIndex === turnIndex;
  const isHost = onlineRoom?.hostPlayerId === playerId || onlineRoom?.hostId === socket?.id;

  const canCurrentPlayerRoll = !diceRolled && !diceRolling && winner === null &&
    (gameMode !== 'ai' || selectedSeat === turnIndex) &&
    (gameMode !== 'online' || isMyOnlineTurn);

  // Clustered board tokens mapping to prevent overlap on shared cells
  const tokensOnBoard = useMemo(() => {
    const map = {};
    activeConfig.forEach((cfg, pIdx) => {
      (tokens[pIdx] || []).forEach((step, tIdx) => {
        if (step === -1) return; // In yard
        const [row, col] = getTokenPositionCoord(pIdx, step, tIdx);
        const key = `${row}_${col}`;
        if (!map[key]) map[key] = [];
        const isMovable = turnIndex === pIdx && currentLegalTokens.includes(tIdx) &&
          (gameMode !== 'online' || isMyOnlineTurn);
        map[key].push({ pIdx, tIdx, cfg, step, row, col, isMovable });
      });
    });
    return map;
  }, [tokens, activeConfig, turnIndex, currentLegalTokens, gameMode, isMyOnlineTurn, getTokenPositionCoord]);

  // Helper to get token action detail text and state for the Token Drawer
  const getTokenActionInfo = useCallback((pIdx, tIdx) => {
    const cfg = activeConfig[pIdx] || activeConfig[0];
    const step = tokens[pIdx]?.[tIdx] ?? -1;
    const isTurn = turnIndex === pIdx;
    const isLegal = isTurn && diceRolled && currentLegalTokens.includes(tIdx);

    if (step === -1) {
      return {
        statusText: 'In Yard',
        detail: dice === 6 ? 'Ready to Step Out! (Roll 6)' : 'Needs a 6 to enter track',
        isLegal,
        actionLabel: dice === 6 ? 'STEP OUT ➔' : 'LOCKED (NEED 6)',
        isHome: false,
        color: cfg.hex
      };
    }
    if (step === 56) {
      return {
        statusText: 'Home 👑',
        detail: 'Safely entered Goal',
        isLegal: false,
        actionLabel: 'COMPLETED 👑',
        isHome: true,
        color: '#22c55e'
      };
    }
    const nextStep = dice !== null ? step + dice : step;
    if (nextStep === 56) {
      return {
        statusText: `Step ${step}`,
        detail: '👑 Enters Central Goal!',
        isLegal,
        actionLabel: `ENTER GOAL 👑`,
        isHome: false,
        color: '#facc15'
      };
    }
    if (nextStep > 56) {
      return {
        statusText: `Step ${step}`,
        detail: `Overshoots goal (needs exact ${56 - step})`,
        isLegal: false,
        actionLabel: `CANNOT MOVE`,
        isHome: false,
        color: '#ef4444'
      };
    }
    if (nextStep >= 51) {
      return {
        statusText: `Home Path (${step - 50}/5)`,
        detail: `Advances to Home Step ${nextStep - 50}/5`,
        isLegal,
        actionLabel: `ADVANCE ${dice ?? 0} STEPS`,
        isHome: false,
        color: cfg.hex
      };
    }

    // Check if destination can capture
    let captureOpp = null;
    const myStart = cfg.startIdx;
    const targetGlobal = (myStart + nextStep) % 52;
    const isSafe = SAFE_TRACK_INDICES.includes(targetGlobal);

    if (!isSafe && diceRolled && dice !== null) {
      for (let p = 0; p < playerCount; p++) {
        if (p === pIdx) continue;
        const oppStart = activeConfig[p]?.startIdx ?? 0;
        for (let ot = 0; ot < 4; ot++) {
          const oppStep = tokens[p]?.[ot];
          if (oppStep >= 0 && oppStep < 51) {
            if ((oppStart + oppStep) % 52 === targetGlobal) {
              captureOpp = activeConfig[p]?.name;
            }
          }
        }
      }
    }

    return {
      statusText: `Track Step ${step}`,
      detail: captureOpp ? `⚔️ STRIKE! Captures ${captureOpp}!` : isSafe ? '🛡️ Safe Zone Destination' : `Advances to Step ${nextStep}`,
      isLegal,
      actionLabel: captureOpp ? `⚔️ CAPTURE ${captureOpp.toUpperCase()}!` : isSafe ? `ENTER SAFE ZONE 🛡️` : `MOVE ${dice ?? 0} STEPS ➔`,
      isHome: false,
      color: captureOpp ? '#ef4444' : isSafe ? '#facc15' : cfg.hex
    };
  }, [activeConfig, tokens, turnIndex, diceRolled, currentLegalTokens, dice, playerCount]);

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      
      {/* Top Ludo Header & Match Mode Switcher Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#f97316] border-2 border-black flex items-center justify-center font-black text-white text-base brutal-shadow-sm font-mono shrink-0">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Neo-Brutal Ludo
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                {playerCount} PLAYERS • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              15x15 BATTLEFIELD // SMART BOTS // DYNAMIC ONLINE ROOMS
            </p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex border-2 border-black bg-black p-0.5">
            <button
              onClick={() => {
                if (gameMode === 'online') handleLeaveOnlineRoom();
                setGameMode('ai');
              }}
              className={`px-3 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors flex items-center gap-1.5 ${
                gameMode === 'ai' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs BOT</span>
            </button>
            <button
              onClick={() => {
                if (gameMode === 'online') handleLeaveOnlineRoom();
                setGameMode('pass_play');
              }}
              className={`px-3 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors flex items-center gap-1.5 ${
                gameMode === 'pass_play' ? 'bg-[#22c55e] text-black' : 'bg-black text-white hover:text-[#22c55e]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>PASS & PLAY</span>
            </button>
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              className={`px-3 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors flex items-center gap-1.5 ${
                gameMode === 'online' ? 'bg-[#f97316] text-white' : 'bg-black text-white hover:text-[#f97316]'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>ONLINE</span>
            </button>
          </div>
        </div>

        {/* Header Right Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSoundActive(!soundActive)}
            className="brutal-press p-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black cursor-pointer brutal-shadow-sm"
            title={soundActive ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-black" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-white text-black hover:bg-neutral-100 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Ludo Rules & Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-black" />
            <span className="hidden md:inline">RULES</span>
          </button>

          <button
            onClick={onOpenCatalogue}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Browse All Games in the Catalogue"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>ALL GAMES</span>
          </button>

          <button
            onClick={resetMatch}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
            title="Reset Board & Tokens"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Two-Column Body */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 min-h-0 overflow-y-auto">
        
        {/* Left Column: Board + Turn Action Dock */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[min(94vw,540px)] shrink-0">
          
          {/* Active Turn Announcement Pill */}
          <div
            className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 transition-all ${
              isDarkTheme ? 'bg-[#18181b]' : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border-2 border-black shrink-0 animate-pulse"
                style={{ backgroundColor: activeConfig[turnIndex]?.hex || '#ef4444' }}
              />
              <span className="font-brutal font-black text-xs sm:text-sm uppercase tracking-wide">
                {statusMessage}
              </span>
            </div>

            {dice !== null && (
              <div className="flex items-center gap-1.5 font-mono text-xs font-black px-2 py-0.5 bg-black text-white border border-black shrink-0">
                <span>DICE: {dice}</span>
                {dice === 6 && <span className="text-[#22c55e]">+1 ROLL</span>}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 15x15 LUDO BOARD WITH CORNER PLAYER STATIONS (LUDO KING STYLE) */}
          {/* ============================================================== */}
          <div className="relative w-full aspect-square p-2 bg-black border-4 border-black brutal-shadow-lg select-none">
            
            {/* 15x15 CSS Grid Cells */}
            <div
              className="w-full h-full gap-[1px] bg-black"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
                gridTemplateRows: 'repeat(15, minmax(0, 1fr))'
              }}
            >
              {Array.from({ length: 15 * 15 }).map((_, idx) => {
                const r = Math.floor(idx / 15);
                const c = idx % 15;

                // 4 Corner Bases (6x6)
                const isRedBase = r <= 5 && c <= 5;
                const isGreenBase = r <= 5 && c >= 9;
                const isYellowBase = r >= 9 && c >= 9;
                const isOrangeBase = r >= 9 && c <= 5;

                // Center Home Goal: r: 6-8, c: 6-8
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
                else if (isGreenBase) cellBg = playerCount >= 3 ? 'bg-[#22c55e]/25' : 'bg-neutral-200/40';
                else if (isYellowBase) cellBg = 'bg-[#facc15]/30';
                else if (isOrangeBase) cellBg = playerCount === 4 ? 'bg-[#f97316]/25' : 'bg-neutral-200/40';
                else if (isRedHomePath) cellBg = 'bg-[#ef4444]';
                else if (isGreenHomePath) cellBg = playerCount >= 3 ? 'bg-[#22c55e]' : 'bg-neutral-200';
                else if (isYellowHomePath) cellBg = 'bg-[#facc15]';
                else if (isOrangeHomePath) cellBg = playerCount === 4 ? 'bg-[#f97316]' : 'bg-neutral-200';
                else if (isCenterGoal) cellBg = 'bg-black';

                // Start arrow markers
                const isRedStart = r === 6 && c === 1;
                const isGreenStart = r === 1 && c === 8 && playerCount >= 3;
                const isYellowStart = r === 8 && c === 13;
                const isOrangeStart = r === 13 && c === 6 && playerCount === 4;

                return (
                  <div
                    key={idx}
                    className={`relative flex items-center justify-center ${cellBg} transition-colors`}
                  >
                    {/* Safe Square Shield Icons */}
                    {isSafeSquare && !isCenterGoal && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-70">
                        <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[2.5]" />
                      </div>
                    )}

                    {/* Start Square Directional Arrow Markers */}
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

            {/* OVERLAY: 4 Corner Yards (Bases) with 4 Token Slots & Profile Dice */}
            {activeConfig.map((cfg, pIdx) => {
              const isTop = cfg.yardR < 6;
              const isLeft = cfg.yardC < 6;
              const isCurrentTurn = turnIndex === pIdx;
              const canThisPlayerRoll = isCurrentTurn && !diceRolled && !diceRolling &&
                (gameMode !== 'ai' || selectedSeat === pIdx) &&
                (gameMode !== 'online' || isMyOnlineTurn);

              return (
                <div
                  key={pIdx}
                  className={`absolute w-[39.5%] h-[39.5%] p-2 sm:p-2.5 border-3 border-black flex flex-col justify-between transition-all ${
                    isTop ? 'top-[0.5%]' : 'bottom-[0.5%]'
                  } ${isLeft ? 'left-[0.5%]' : 'right-[0.5%]'} ${
                    isCurrentTurn ? 'ring-4 ring-black brutal-shadow-md z-30' : 'opacity-95'
                  }`}
                  style={{ backgroundColor: cfg.hex }}
                >
                  {/* Base Header with Player Name & Tokens Home */}
                  <div className="flex items-center justify-between">
                    <span className="font-brutal font-black text-[10px] sm:text-xs text-white bg-black px-1.5 py-0.5 border border-white">
                      {cfg.name.toUpperCase()} {gameMode === 'ai' && pIdx !== selectedSeat ? '(BOT)' : ''}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-white bg-black/60 px-1 py-0.2">
                      {tokens[pIdx]?.filter((s) => s === 56).length}/4 HOME
                    </span>
                  </div>

                  {/* 4 Inner White Circles for Yard Tokens */}
                  <div className="relative grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white border-2 border-black brutal-shadow-sm h-[68%] items-center justify-items-center">
                    {[0, 1, 2, 3].map((tIdx) => {
                      const step = tokens[pIdx]?.[tIdx];
                      const inBase = step === -1;
                      const isMovable = isCurrentTurn && currentLegalTokens.includes(tIdx) &&
                        (gameMode !== 'online' || isMyOnlineTurn);

                      return (
                        <div
                          key={tIdx}
                          onClick={() => {
                            if (isMovable) {
                              if (gameMode === 'online') handleOnlineMoveToken(tIdx);
                              else executeLocalMove(tIdx);
                            }
                          }}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-black flex items-center justify-center transition-all ${
                            inBase
                              ? 'text-black font-mono text-[10px] sm:text-xs font-black'
                              : 'bg-neutral-100 border-dashed border-neutral-300'
                          } ${
                            isMovable
                              ? 'ring-4 ring-[#facc15] scale-125 animate-bounce brutal-shadow-sm cursor-pointer z-40'
                              : ''
                          }`}
                          style={{ backgroundColor: inBase ? cfg.hex : undefined }}
                        >
                          {inBase && (
                            <span className="drop-shadow-sm font-black">
                              {tIdx + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Integrated Corner Dice Roller */}
                    <button
                      onClick={() => {
                        if (canThisPlayerRoll) {
                          if (gameMode === 'online') handleOnlineRollDice();
                          else handleRollDice(pIdx);
                        }
                      }}
                      disabled={!canThisPlayerRoll}
                      className={`absolute inset-0 m-auto w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 border-black brutal-shadow-sm flex items-center justify-center font-mono font-black text-lg sm:text-xl transition-transform select-none ${
                        isCurrentTurn && !diceRolled && !diceRolling
                          ? 'ring-4 ring-[#22c55e] scale-110 cursor-pointer animate-pulse'
                          : 'cursor-default'
                      } ${diceRolling && isCurrentTurn ? 'animate-spin bg-[#facc15]' : ''}`}
                      title={canThisPlayerRoll ? 'Click to Roll Dice' : undefined}
                    >
                      {diceRolling && isCurrentTurn ? (
                        '🎲'
                      ) : isCurrentTurn && dice !== null ? (
                        <span className="font-brutal font-black text-black">{dice}</span>
                      ) : (
                        <Dice5 className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Inactive Base Overlays for 2-Player and 3-Player modes */}
            {playerCount === 2 && (
              <div className="absolute w-[39.5%] h-[39.5%] top-[0.5%] right-[0.5%] p-2.5 border-3 border-black bg-neutral-200/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center select-none pointer-events-none brutal-shadow-sm">
                <span className="font-brutal font-black text-xs text-neutral-600 uppercase tracking-tight">
                  GREEN // INACTIVE
                </span>
                <span className="font-mono text-[9px] text-neutral-500 font-bold uppercase mt-0.5">
                  2-PLAYER MATCH
                </span>
              </div>
            )}
            {playerCount <= 3 && (
              <div className="absolute w-[39.5%] h-[39.5%] bottom-[0.5%] left-[0.5%] p-2.5 border-3 border-black bg-neutral-200/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center select-none pointer-events-none brutal-shadow-sm">
                <span className="font-brutal font-black text-xs text-neutral-600 uppercase tracking-tight">
                  ORANGE // INACTIVE
                </span>
                <span className="font-mono text-[9px] text-neutral-500 font-bold uppercase mt-0.5">
                  {playerCount === 2 ? '2-PLAYER MATCH' : '3-PLAYER MATCH'}
                </span>
              </div>
            )}

            {/* OVERLAY: Dynamic Tokens Moving Across the 52 Track & Home Run with Clustering */}
            {Object.entries(tokensOnBoard).map(([cellKey, tokensInCell]) => {
              return tokensInCell.map((tok, idx) => {
                let offsetLeft = 0.33;
                let offsetTop = 0.33;
                if (tokensInCell.length === 2) {
                  offsetLeft = idx === 0 ? -0.8 : 1.4;
                } else if (tokensInCell.length >= 3) {
                  offsetLeft = idx % 2 === 0 ? -0.8 : 1.4;
                  offsetTop = idx < 2 ? -0.8 : 1.4;
                }

                const topPercent = (tok.row / 15) * 100 + offsetTop;
                const leftPercent = (tok.col / 15) * 100 + offsetLeft;

                return (
                  <div
                    key={`token_${tok.pIdx}_${tok.tIdx}`}
                    onClick={() => {
                      if (tok.isMovable) {
                        if (gameMode === 'online') handleOnlineMoveToken(tok.tIdx);
                        else executeLocalMove(tok.tIdx);
                      }
                    }}
                    className={`absolute w-[6%] h-[6%] rounded-full border-2 border-black flex items-center justify-center font-mono font-black text-[9px] sm:text-xs z-30 transition-all duration-200 select-none ${
                      tok.isMovable
                        ? 'ring-4 ring-[#facc15] scale-130 animate-bounce cursor-pointer brutal-shadow-sm'
                        : 'cursor-default'
                    }`}
                    style={{
                      top: `${topPercent}%`,
                      left: `${leftPercent}%`,
                      backgroundColor: tok.cfg.hex,
                      color: '#000000'
                    }}
                    title={`${tok.cfg.name} Token ${tok.tIdx + 1} (Step ${tok.step})`}
                  >
                    <span className="font-black drop-shadow-sm">{tok.tIdx + 1}</span>
                  </div>
                );
              });
            })}
          </div>

          {/* TURN ACTION DOCK (Directly Under Board: Roll Dice & Quick Toggles) */}
          <div className="w-full bg-[#facc15] text-black border-3 border-black p-3 flex flex-col sm:flex-row items-center justify-between gap-3 brutal-shadow select-none">
            
            {/* Left: Active Player Identity & 3D Dice Face */}
            <div className="flex items-center gap-3">
              <DiceFace value={dice} rolling={diceRolling} size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-black inline-block"
                    style={{ backgroundColor: activeConfig[turnIndex]?.hex }}
                  />
                  <span className="font-brutal text-sm font-black uppercase">
                    {activeConfig[turnIndex]?.name}'s Turn
                  </span>
                </div>
                <p className="font-mono text-[10px] text-neutral-800 font-bold">
                  {canCurrentPlayerRoll ? 'Ready to Roll' : diceRolling ? 'Rolling...' : diceRolled ? `Rolled ${dice}` : 'Waiting...'}
                </p>
              </div>
            </div>

            {/* Center/Right: Primary Roll Dice Button & Pass Turn Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* PRIMARY ROLL DICE BUTTON */}
              <button
                onClick={() => {
                  if (canCurrentPlayerRoll) {
                    if (gameMode === 'online') handleOnlineRollDice();
                    else handleRollDice(turnIndex);
                  }
                }}
                disabled={!canCurrentPlayerRoll}
                className={`brutal-press flex-1 sm:flex-initial px-5 py-2.5 border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2 transition-all ${
                  canCurrentPlayerRoll
                    ? 'bg-[#22c55e] hover:bg-green-400 text-black animate-pulse ring-2 ring-black'
                    : 'bg-neutral-200 text-neutral-500 border-neutral-400 shadow-none cursor-not-allowed'
                }`}
                title="Roll the dice"
              >
                <Dice5 className="w-4 h-4 stroke-[2.5]" />
                <span>{diceRolling ? 'ROLLING...' : 'ROLL DICE'}</span>
              </button>

              {/* Pass Turn Button (Available when rolled with 0 moves or 3 sixes) */}
              {diceRolled && currentLegalTokens.length === 0 && (
                <button
                  onClick={() => advanceTurn(tokens, turnIndex, rankings)}
                  className="brutal-press px-3 py-2.5 bg-black text-[#facc15] hover:bg-neutral-800 border-3 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
                  title="Pass turn to next player"
                >
                  <FastForward className="w-3.5 h-3.5 text-[#facc15]" />
                  <span>PASS</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Automation Toggles Row */}
          <div className="w-full flex items-center justify-between gap-2 px-1 text-xs font-mono">
            <button
              onClick={() => setAutoRoll(!autoRoll)}
              className={`brutal-press flex-1 py-1.5 px-2 border-2 border-black font-bold uppercase text-[11px] flex items-center justify-center gap-1.5 cursor-pointer ${
                autoRoll ? 'bg-[#22c55e] text-black font-black brutal-shadow-sm' : 'bg-white text-neutral-600'
              }`}
              title="Automatically roll dice on your turn"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>AUTO-ROLL: {autoRoll ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setAutoMoveSingle(!autoMoveSingle)}
              className={`brutal-press flex-1 py-1.5 px-2 border-2 border-black font-bold uppercase text-[11px] flex items-center justify-center gap-1.5 cursor-pointer ${
                autoMoveSingle ? 'bg-[#22c55e] text-black font-black brutal-shadow-sm' : 'bg-white text-neutral-600'
              }`}
              title="Automatically advance token when only 1 legal move is available"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AUTO-MOVE (1-MOVE): {autoMoveSingle ? 'ON' : 'OFF'}</span>
            </button>
          </div>

        </div>

        {/* Right Column: Tactical Command Station */}
        <div className="relative z-10 w-full lg:w-[410px] xl:w-[440px] flex flex-col gap-3 shrink-0">
          
          {/* 1. ACTIVE TURN COMMAND CENTER & TOKEN ACTION DRAWER */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black inline-block"
                  style={{ backgroundColor: activeConfig[turnIndex]?.hex }}
                />
                <span className="font-brutal text-xs font-black uppercase tracking-wide">
                  {activeConfig[turnIndex]?.name}'s Tokens ({tokens[turnIndex]?.filter(s => s === 56).length}/4 Goal)
                </span>
              </div>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                {gameMode === 'ai' && turnIndex === selectedSeat ? 'YOU (HUMAN)' : gameMode === 'ai' ? 'BOT PLAYER' : `PLAYER ${turnIndex + 1}`}
              </span>
            </div>

            {/* Token Action Cards (1 to 4) */}
            <div className="grid grid-cols-1 gap-2">
              {[0, 1, 2, 3].map((tIdx) => {
                const info = getTokenActionInfo(turnIndex, tIdx);
                const isOnlyMove = currentLegalTokens.length === 1 && currentLegalTokens[0] === tIdx;

                return (
                  <button
                    key={tIdx}
                    onClick={() => {
                      if (info.isLegal) {
                        if (gameMode === 'online') handleOnlineMoveToken(tIdx);
                        else executeLocalMove(tIdx);
                      }
                    }}
                    disabled={!info.isLegal}
                    className={`brutal-press w-full p-2.5 border-2 border-black flex items-center justify-between gap-2 text-left transition-all ${
                      info.isLegal
                        ? 'bg-white hover:bg-neutral-50 brutal-shadow-sm cursor-pointer'
                        : 'bg-neutral-100 opacity-60 cursor-not-allowed'
                    } ${isOnlyMove ? 'ring-3 ring-[#facc15] animate-pulse bg-yellow-50' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-mono font-black text-xs text-black shrink-0"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.isHome ? '👑' : tIdx + 1}
                      </div>
                      <div>
                        <div className="font-brutal text-xs font-black uppercase leading-tight">
                          Token {tIdx + 1} • <span className="font-mono text-[11px] font-bold text-neutral-600">{info.statusText}</span>
                        </div>
                        <p className="font-mono text-[10px] text-neutral-700 leading-tight">
                          {info.detail}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`font-brutal text-[10px] font-black px-2 py-1 border border-black uppercase ${
                          info.isLegal
                            ? 'bg-[#22c55e] text-black brutal-shadow-xs'
                            : 'bg-neutral-200 text-neutral-500'
                        }`}
                      >
                        {info.actionLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MATCH OPPONENT & GAME MODE (Prominent High-Contrast Buttons) */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Match Opponent
              </span>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-[#facc15] text-black border border-black">
                {gameMode === 'ai' ? '🤖 vs COMPUTER' : gameMode === 'online' ? '🌐 ONLINE MULTIPLAYER' : '👥 1v1 PASS & PLAY'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (gameMode === 'online') handleLeaveOnlineRoom();
                  setGameMode('ai');
                }}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'ai'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Bot className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-[11px] font-black">vs BOT</span>
                <span className="text-[9px] font-mono font-black text-black opacity-80">AI Opponents</span>
              </button>

              <button
                onClick={() => {
                  if (gameMode === 'online') handleLeaveOnlineRoom();
                  setGameMode('pass_play');
                }}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'pass_play'
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-[11px] font-black">1v1 LOCAL</span>
                <span className="text-[9px] font-mono font-black text-black opacity-80">Pass & Play</span>
              </button>

              <button
                onClick={() => setIsOnlineModalOpen(true)}
                className={`brutal-press py-2 px-1 border-3 border-black flex flex-col items-center justify-center cursor-pointer transition-all ${
                  gameMode === 'online'
                    ? 'bg-[#f97316] text-white font-black brutal-shadow'
                    : 'bg-[#facc15] text-black font-black hover:bg-yellow-400 brutal-shadow-sm'
                }`}
              >
                <Wifi className="w-4 h-4 mb-0.5 text-black" />
                <span className="font-brutal text-[11px] font-black">ONLINE</span>
                <span className="text-[9px] font-mono font-black text-black opacity-80">PvP Lobby</span>
              </button>
            </div>

            {/* Player Count Selector Buttons (2P, 3P, 4P) */}
            {gameMode !== 'online' && (
              <div className="border-t-2 border-black pt-2 space-y-1.5">
                <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                  Select Player Count:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setPlayerCount(cnt)}
                      className={`brutal-press py-1.5 border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer ${
                        playerCount === cnt
                          ? 'bg-black text-[#22c55e] brutal-shadow-xs'
                          : 'bg-white hover:bg-neutral-100 text-black'
                      }`}
                    >
                      {cnt === 2 ? '2P (1v1)' : `${cnt} PLAYERS`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Human Seat / Color Selector (when vs Bot mode) */}
            {gameMode === 'ai' && (
              <div className="border-t-2 border-black pt-2 space-y-1.5">
                <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                  Pick Your Color (vs Bots):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {activeConfig.map((cfg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSeat(idx)}
                      className={`brutal-press py-1 px-1.5 border-2 border-black font-brutal text-[10px] font-black uppercase cursor-pointer flex items-center justify-center gap-1 ${
                        selectedSeat === idx
                          ? 'ring-2 ring-black font-black'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: cfg.hex, color: '#000000' }}
                    >
                      <span>{selectedSeat === idx ? '★' : '•'}</span>
                      <span>{cfg.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bot Speed Control */}
            {gameMode === 'ai' && (
              <div className="border-t-2 border-black pt-2 flex items-center justify-between">
                <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase">
                  Bot Speed:
                </span>
                <div className="flex gap-1">
                  {[
                    { id: 'fast', label: '⚡ FAST' },
                    { id: 'normal', label: '▶ NORMAL' },
                    { id: 'slow', label: '🐢 SLOW' }
                  ].map((spd) => (
                    <button
                      key={spd.id}
                      onClick={() => setBotSpeed(spd.id)}
                      className={`px-2 py-0.5 border border-black font-mono text-[10px] font-bold cursor-pointer ${
                        botSpeed === spd.id ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. LIVE MATCH ACTIVITY FEED (EVENT RADAR) */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Match Activity Radar
              </span>
              <span className="font-mono text-[10px] text-neutral-500 font-bold">
                LIVE LOG
              </span>
            </div>

            <div className="h-36 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {eventLog.map((ev) => (
                <div
                  key={ev.id}
                  className="p-1.5 bg-white border border-black flex items-start gap-2 brutal-shadow-xs"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black shrink-0 mt-0.5"
                    style={{ backgroundColor: ev.hex }}
                  />
                  <div className="flex-1 leading-tight">
                    <span className="font-bold">{ev.text}</span>
                  </div>
                  {ev.time && <span className="text-[9px] text-neutral-400 shrink-0">{ev.time}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* 4. BOTTOM ACTION STRIP (Restart, Rules, Catalogue) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={resetMatch}
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
              <span>LUDO RULES</span>
            </button>
          </div>

        </div>
      </main>

      {/* DEDICATED LUDO ONLINE MULTIPLAYER MODAL */}
      <LudoOnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        onStartMatch={handleStartOnlineMatch}
        onLeaveRoom={handleLeaveOnlineRoom}
        onFindQuickMatch={handleFindQuickMatch}
        onCancelQuickMatch={handleCancelQuickMatch}
        isSearchingQuickMatch={isSearchingQuickMatch}
        quickCountdown={quickCountdown}
        room={onlineRoom}
        roomCode={onlineRoomCode}
        isHost={isHost}
        onlineStatus={onlineStatus}
        isConnected={socketConnected}
      />

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
                VICTORY! {activeConfig[winner]?.name.toUpperCase()} CLAIMS THE CROWN!
              </h3>
              <p className="font-mono text-xs text-neutral-500">
                All 4 tokens successfully entered the central home goal.
              </p>
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
                ALL GAMES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULES / GUIDE MODAL */}
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
                  Ludo Rules & Mechanics
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
                  1. Exit from Yard (Roll a 6)
                </strong>
                Tokens start in your corner Yard. You must roll a <strong>6</strong> to exit the Yard onto your starting track square. Rolling a 6 also gives you an <strong>extra roll</strong>!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Capturing Opponents
                </strong>
                Landing on an opponent's token on any standard track square captures it, sending it back to their Yard! Capturing an opponent awards an <strong>extra bonus roll</strong>.
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
                GOT IT // PLAY NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
