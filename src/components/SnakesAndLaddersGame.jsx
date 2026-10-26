import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Bot,
  Users,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCw,
  HelpCircle,
  X as CloseIcon,
  Gamepad2,
  Crown,
  Dice5,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { sound } from '../utils/sound';
import { DiceFace } from './LudoGame';

const BOARD_CELLS = 100;

// Configurable Difficulty Board Presets
const DIFFICULTY_PRESETS = {
  easy: {
    label: 'SUNNY CLIMB',
    desc: '10 Ladders, 5 Snakes',
    ladders: { 4: 14, 9: 31, 20: 38, 28: 84, 36: 62, 40: 59, 51: 67, 63: 81, 71: 91, 78: 97 },
    snakes: { 17: 7, 54: 34, 64: 60, 87: 24, 95: 75 }
  },
  medium: {
    label: 'CLASSIC TRACK',
    desc: '8 Ladders, 8 Snakes',
    ladders: { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 },
    snakes: { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78 }
  },
  hard: {
    label: 'HAZARD PIT',
    desc: '6 Ladders, 12 Snakes',
    ladders: { 4: 14, 9: 31, 28: 84, 40: 59, 51: 67, 71: 91 },
    snakes: { 17: 7, 32: 10, 48: 26, 54: 34, 62: 19, 64: 60, 77: 42, 87: 24, 93: 73, 95: 75, 98: 40, 99: 78 }
  }
};

const PLAYER_COLORS = [
  { name: 'Red', hex: '#ef4444', borderHex: '#991b1b' },
  { name: 'Yellow', hex: '#facc15', borderHex: '#a16207' },
  { name: 'Green', hex: '#22c55e', borderHex: '#15803d' },
  { name: 'Orange', hex: '#f97316', borderHex: '#c2410c' }
];

// Helper to get 0-indexed [row, col] on a 10x10 boustrophedon board for number 1-100
// Tile 1 is bottom-left [9, 0], Tile 10 is bottom-right [9, 9], Tile 11 is [8, 9], etc.
function getTileCoord(num) {
  const index = num - 1; // 0 to 99
  const rowFromBottom = Math.floor(index / 10);
  const r = 9 - rowFromBottom;
  const rem = index % 10;
  const c = rowFromBottom % 2 === 0 ? rem : 9 - rem;
  return [r, c];
}

export const SnakesAndLaddersGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const [playerCount, setPlayerCount] = useState(2); // 2 | 3 | 4
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [positions, setPositions] = useState(() => Array(playerCount).fill(1));
  const [turn, setTurn] = useState(0); // 0 to playerCount - 1
  const [dice, setDice] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play'
  const [winner, setWinner] = useState(null);
  const [statusMessage, setStatusMessage] = useState('ROLL THE DICE TO CLIMB!');
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);

  const activeLadders = DIFFICULTY_PRESETS[difficulty].ladders;
  const activeSnakes = DIFFICULTY_PRESETS[difficulty].snakes;

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Reset when playerCount or difficulty changes
  useEffect(() => {
    setPositions(Array(playerCount).fill(1));
    setTurn(0);
    setDice(null);
    setDiceRolling(false);
    setWinner(null);
    setStatusMessage('ROUND RESET! ROLL THE DICE TO START.');
  }, [playerCount, difficulty]);

  // Roll Dice and Move
  const handleRollDice = useCallback(() => {
    if (diceRolling || winner !== null) return;
    setDiceRolling(true);
    sound.playDiceRoll();

    setTimeout(() => {
      const rolled = 1 + Math.floor(Math.random() * 6);
      setDice(rolled);
      setDiceRolling(false);

      sound.playMove();

      setPositions((prev) => {
        const nextPos = [...prev];
        let currentPos = nextPos[turn];
        let targetPos = currentPos + rolled;

        // Exact 100 bounce rule
        if (targetPos > 100) {
          const excess = targetPos - 100;
          targetPos = 100 - excess;
        }

        const pCfg = PLAYER_COLORS[turn];
        let extraTurn = rolled === 6;

        // Check Ladder
        if (activeLadders[targetPos]) {
          const newPos = activeLadders[targetPos];
          sound.playCheck();
          setStatusMessage(`🪜 LADDER! ${pCfg.name.toUpperCase()} CLIMBED FROM ${targetPos} TO ${newPos}!`);
          targetPos = newPos;
        } else if (activeSnakes[targetPos]) {
          const newPos = activeSnakes[targetPos];
          sound.playCapture();
          setStatusMessage(`🐍 HAZARD! ${pCfg.name.toUpperCase()} SLID FROM ${targetPos} DOWN TO ${newPos}!`);
          targetPos = newPos;
        } else {
          setStatusMessage(`${pCfg.name.toUpperCase()} ROLLED A ${rolled} AND MOVED TO TILE ${targetPos}.`);
        }

        nextPos[turn] = targetPos;

        // Check Victory
        if (targetPos === 100) {
          setWinner(turn);
          sound.playGameOver();
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
            colors: [pCfg.hex, '#ffffff', '#000000']
          });
          return nextPos;
        }

        // Advance turn if not 6
        if (!extraTurn) {
          setTurn((t) => (t + 1) % playerCount);
        } else {
          setStatusMessage(`ROLLED A 6! ${pCfg.name.toUpperCase()} ROLLS AGAIN!`);
        }

        return nextPos;
      });
    }, 400);
  }, [diceRolling, winner, turn, playerCount, activeLadders, activeSnakes]);

  // Bot automation
  useEffect(() => {
    if (gameMode !== 'ai' || winner !== null || diceRolling) return;
    const isBotTurn = turn !== 0; // Player 0 is Human
    if (!isBotTurn) return;

    const botTimer = setTimeout(() => {
      handleRollDice();
    }, 700);

    return () => clearTimeout(botTimer);
  }, [gameMode, turn, winner, diceRolling, handleRollDice]);

  const resetGame = () => {
    setPositions(Array(playerCount).fill(1));
    setTurn(0);
    setDice(null);
    setDiceRolling(false);
    setWinner(null);
    setStatusMessage('MATCH RESET! ROLL THE DICE TO CLIMB.');
  };

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#22c55e] border-2 border-black flex items-center justify-center font-black text-black text-base brutal-shadow-sm font-mono shrink-0">
            🪜
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Snakes & Ladders
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                100-TILE RACE • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              TACTILE 3D DICE SHAKER // GOLDEN LADDERS // SLITHER HAZARDS
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
            onClick={resetGame}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: 100-Tile Board */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[520px] shrink-0">
          
          {/* Status Pill */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border-2 border-black animate-pulse"
                style={{ backgroundColor: PLAYER_COLORS[turn]?.hex }}
              />
              <span className="font-brutal text-sm font-black uppercase">
                {winner !== null ? `${PLAYER_COLORS[winner].name.toUpperCase()} CLAIMS THE CROWN!` : statusMessage}
              </span>
            </div>
            {dice && (
              <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-white">
                DICE: {dice}
              </span>
            )}
          </div>

          {/* 10x10 Board Grid */}
          <div className="relative w-full aspect-square bg-black p-2 border-4 border-black brutal-shadow-xl select-none">
            <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-[1px] bg-black border-2 border-black">
              {Array.from({ length: 100 }).map((_, idx) => {
                const r = Math.floor(idx / 10);
                const c = idx % 10;
                // Determine tile number 1-100 based on row from bottom
                const rowFromBottom = 9 - r;
                const rem = rowFromBottom % 2 === 0 ? c : 9 - c;
                const tileNum = rowFromBottom * 10 + rem + 1;

                const isLadderStart = Boolean(activeLadders[tileNum]);
                const isSnakeStart = Boolean(activeSnakes[tileNum]);

                return (
                  <div
                    key={idx}
                    className={`relative flex flex-col items-center justify-between p-0.5 font-mono text-[9px] font-bold ${
                      tileNum === 100
                        ? 'bg-[#facc15]'
                        : isLadderStart
                        ? 'bg-[#22c55e]/30'
                        : isSnakeStart
                        ? 'bg-[#ef4444]/30'
                        : (r + c) % 2 === 0
                        ? 'bg-[#fafaf8]'
                        : 'bg-[#f4f4ec]'
                    }`}
                  >
                    {/* Tile Number */}
                    <span className="text-[8px] font-mono text-neutral-400 self-start leading-none font-bold">
                      {tileNum}
                    </span>

                    {/* Hazard / Ladder Indicator Icons */}
                    {isLadderStart && (
                      <span className="text-[10px] text-[#22c55e] font-black" title={`Ladder to ${activeLadders[tileNum]}`}>
                        🪜{activeLadders[tileNum]}
                      </span>
                    )}
                    {isSnakeStart && (
                      <span className="text-[10px] text-[#ef4444] font-black" title={`Snake to ${activeSnakes[tileNum]}`}>
                        🐍{activeSnakes[tileNum]}
                      </span>
                    )}
                    {tileNum === 100 && (
                      <Crown className="w-3.5 h-3.5 text-black fill-current animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* OVERLAY: Player Tokens */}
            {positions.map((pos, pIdx) => {
              const [r, c] = getTileCoord(pos);
              const topPercent = (r / 10) * 100;
              const leftPercent = (c / 10) * 100;
              const pCfg = PLAYER_COLORS[pIdx];

              const offset = pIdx * 2.5;

              return (
                <div
                  key={pIdx}
                  className="absolute w-[6.5%] h-[6.5%] rounded-full border-2 border-black flex items-center justify-center font-mono font-black text-[10px] text-black z-30 transition-all duration-300 brutal-shadow-xs"
                  style={{
                    top: `calc(${topPercent}% + ${0.8 + offset * 0.4}%)`,
                    left: `calc(${leftPercent}% + ${0.8 + offset * 0.4}%)`,
                    backgroundColor: pCfg.hex
                  }}
                  title={`${pCfg.name} on Tile ${pos}`}
                >
                  <span className="drop-shadow-sm font-black">{pIdx + 1}</span>
                </div>
              );
            })}
          </div>

          {/* TURN ACTION DOCK (Directly Under Board: Roll Dice & DiceFace) */}
          <div className="w-full bg-[#facc15] text-black border-3 border-black p-3 flex items-center justify-between gap-3 brutal-shadow select-none">
            <div className="flex items-center gap-3">
              <DiceFace value={dice} rolling={diceRolling} size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-black inline-block"
                    style={{ backgroundColor: PLAYER_COLORS[turn]?.hex }}
                  />
                  <span className="font-brutal text-sm font-black uppercase">
                    {PLAYER_COLORS[turn]?.name}'s Turn
                  </span>
                </div>
                <p className="font-mono text-[10px] text-neutral-800 font-bold">
                  Tile {positions[turn]} • Needs {100 - positions[turn]} to Win
                </p>
              </div>
            </div>

            <button
              onClick={handleRollDice}
              disabled={diceRolling || winner !== null || (gameMode === 'ai' && turn !== 0)}
              className="brutal-press px-6 py-2.5 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:cursor-not-allowed border-3 border-black text-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-2 animate-pulse"
            >
              <Dice5 className="w-4 h-4 stroke-[2.5]" />
              <span>{diceRolling ? 'ROLLING...' : 'ROLL DICE'}</span>
            </button>
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
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Autonomous Bots</span>
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
                <span className="font-brutal text-xs font-black">LOCAL PLAY</span>
                <span className="text-[9px] font-mono font-bold text-black opacity-80">2-4 Players</span>
              </button>
            </div>

            {/* Player Count Selector */}
            <div className="border-t-2 border-black pt-2 space-y-1.5">
              <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                Total Players:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setPlayerCount(cnt)}
                    className={`py-1 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer ${
                      playerCount === cnt ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    {cnt} PLAYERS
                  </button>
                ))}
              </div>
            </div>

            {/* Board Difficulty / Hazard Density Selector */}
            <div className="border-t-2 border-black pt-2 space-y-1.5">
              <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                Board Difficulty:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'easy', label: 'SUNNY', desc: '10 Ladders, 5 Snakes' },
                  { id: 'medium', label: 'CLASSIC', desc: '8 Ladders, 8 Snakes' },
                  { id: 'hard', label: 'HAZARD', desc: '6 Ladders, 12 Snakes' }
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setDifficulty(lvl.id)}
                    className={`py-1.5 px-1 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer text-center ${
                      difficulty === lvl.id ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                    title={lvl.desc}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons Strip */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={resetGame}
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
              <span>HOW TO PLAY</span>
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
                  🪜
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Snakes & Ladders Rules
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
                  1. The 100-Tile Race
                </strong>
                Roll the dice to advance across the 100 tiles from Tile 1 to Tile 100.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Golden Ladders & Hazard Snakes
                </strong>
                Landing at the bottom of a ladder climbs you directly to its peak! Landing on a snake's head slides you down to its tail.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Exact 100 Finish & 6s Extra Roll
                </strong>
                Rolling a 6 awards an extra roll. You must land on Tile 100 with an exact roll to win the crown!
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

