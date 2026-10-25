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
  Play,
  RotateCw,
  Zap,
  HelpCircle,
  X as CloseIcon,
  Shield,
  Crosshair,
  Flame,
  Gamepad2,
  Shuffle
} from 'lucide-react';
import { sound } from '../utils/sound';

const GRID_SIZE = 10;
const ROWS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const SHIPS_CONFIG = [
  { id: 'carrier', name: 'Aircraft Carrier', size: 5, icon: '🚢' },
  { id: 'battleship', name: 'Battleship', size: 4, icon: '🛳️' },
  { id: 'cruiser', name: 'Cruiser', size: 3, icon: '🚤' },
  { id: 'submarine', name: 'Submarine', size: 3, icon: '⚓' },
  { id: 'destroyer', name: 'Destroyer', size: 2, icon: '🛥️' }
];

// Helper to check if ship can be placed
function canPlaceShip(grid, r, c, size, orientation) {
  for (let i = 0; i < size; i++) {
    const checkR = orientation === 'H' ? r : r + i;
    const checkC = orientation === 'H' ? c + i : c;
    if (checkR < 0 || checkR >= GRID_SIZE || checkC < 0 || checkC >= GRID_SIZE) return false;
    if (grid[checkR][checkC] !== null) return false;
  }
  return true;
}

// Generate legal random fleet placement
function generateRandomFleet() {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const ships = [];

  for (const ship of SHIPS_CONFIG) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const orientation = Math.random() < 0.5 ? 'H' : 'V';
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);

      if (canPlaceShip(grid, r, c, ship.size, orientation)) {
        const coords = [];
        for (let i = 0; i < ship.size; i++) {
          const shipR = orientation === 'H' ? r : r + i;
          const shipC = orientation === 'H' ? c + i : c;
          grid[shipR][shipC] = ship.id;
          coords.push([shipR, shipC]);
        }
        ships.push({ ...ship, coords, hits: 0, sunk: false, orientation });
        placed = true;
      }
    }
  }
  return { grid, ships };
}

export const BattleshipGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  // Phase: 'placement' | 'battle' | 'gameover'
  const [phase, setPhase] = useState('placement');
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState('H'); // 'H' | 'V'
  const [hoverPlacement, setHoverPlacement] = useState(null); // [r, c]

  // Player Fleet
  const [playerGrid, setPlayerGrid] = useState(() => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
  const [playerShips, setPlayerShips] = useState([]);
  const [playerIncomingShots, setPlayerIncomingShots] = useState(() => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))); // null | 'hit' | 'miss'

  // Enemy Bot Fleet
  const [botGrid, setBotGrid] = useState(() => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
  const [botShips, setBotShips] = useState([]);
  const [playerRadarShots, setPlayerRadarShots] = useState(() => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))); // null | 'hit' | 'miss'

  // Turn & Status
  const [turn, setTurn] = useState('player'); // 'player' | 'bot'
  const [winner, setWinner] = useState(null); // 'player' | 'bot'
  const [statusMessage, setStatusMessage] = useState('PLACE YOUR SHIPS TO BEGIN DEPLOYMENT');
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);

  // Bot Hunt & Target AI Memory
  const botTargetQueueRef = useRef([]);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Handle ship placement on click
  const handlePlacementClick = (r, c) => {
    if (phase !== 'placement') return;
    if (currentShipIndex >= SHIPS_CONFIG.length) return;

    const shipConfig = SHIPS_CONFIG[currentShipIndex];
    if (canPlaceShip(playerGrid, r, c, shipConfig.size, orientation)) {
      sound.playMove();
      const coords = [];
      const newGrid = playerGrid.map((row) => [...row]);
      for (let i = 0; i < shipConfig.size; i++) {
        const shipR = orientation === 'H' ? r : r + i;
        const shipC = orientation === 'H' ? c + i : c;
        newGrid[shipR][shipC] = shipConfig.id;
        coords.push([shipR, shipC]);
      }
      setPlayerGrid(newGrid);
      setPlayerShips((prev) => [...prev, { ...shipConfig, coords, hits: 0, sunk: false, orientation }]);

      const nextIndex = currentShipIndex + 1;
      setCurrentShipIndex(nextIndex);
      if (nextIndex < SHIPS_CONFIG.length) {
        setStatusMessage(`PLACED ${shipConfig.name.toUpperCase()}! NEXT: PLACE ${SHIPS_CONFIG[nextIndex].name.toUpperCase()} (${SHIPS_CONFIG[nextIndex].size} CELLS)`);
      } else {
        setStatusMessage('ALL FLEET SHIPS DEPLOYED! CLICK "START BATTLE" TO COMMENCE COMBAT!');
      }
    }
  };

  // Auto-Randomize Player Fleet
  const randomizePlayerFleet = () => {
    const { grid, ships } = generateRandomFleet();
    setPlayerGrid(grid);
    setPlayerShips(ships);
    setCurrentShipIndex(SHIPS_CONFIG.length);
    setStatusMessage('FLEET AUTOMATICALLY POSITIONED! CLICK "START BATTLE" TO COMMENCE COMBAT!');
  };

  // Reset Placement
  const resetPlacement = () => {
    setPlayerGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
    setPlayerShips([]);
    setCurrentShipIndex(0);
    setStatusMessage('FLEET RESET. SELECT ORIENTATION AND PLACE YOUR AIRCRAFT CARRIER (5 CELLS).');
  };

  // Start Battle
  const startBattle = () => {
    const { grid, ships } = generateRandomFleet();
    setBotGrid(grid);
    setBotShips(ships);
    setPhase('battle');
    setTurn('player');
    setStatusMessage('ARTILLERY ACTIVE! TARGET ENEMY RADAR TO CALL A STRIKE!');
  };

  // Fire on Enemy Radar (Player Action)
  const firePlayerShot = (r, c) => {
    if (phase !== 'battle' || turn !== 'player' || winner !== null) return;
    if (playerRadarShots[r][c] !== null) return; // Already shot here

    const hitShipId = botGrid[r][c];
    const isHit = hitShipId !== null;

    const newShots = playerRadarShots.map((row) => [...row]);
    newShots[r][c] = isHit ? 'hit' : 'miss';
    setPlayerRadarShots(newShots);

    if (isHit) {
      sound.playCapture();
      // Check if ship sunk
      let sunkName = null;
      setBotShips((prev) => {
        const nextShips = prev.map((ship) => {
          if (ship.id === hitShipId) {
            const nextHits = ship.hits + 1;
            const sunk = nextHits >= ship.size;
            if (sunk) sunkName = ship.name;
            return { ...ship, hits: nextHits, sunk };
          }
          return ship;
        });

        // Check overall victory
        if (nextShips.every((s) => s.sunk)) {
          setWinner('player');
          setPhase('gameover');
          sound.playGameOver();
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors: ['#22c55e', '#ef4444', '#facc15'] });
        }
        return nextShips;
      });

      if (sunkName) {
        setStatusMessage(`💥 DIRECT HIT! YOU SUNK ENEMY ${sunkName.toUpperCase()}! FIRE AGAIN!`);
      } else {
        setStatusMessage('💥 DIRECT HIT ON ENEMY VESSEL! EXTRA ARTILLERY VOLLEY!');
      }
      // Direct hit grants extra shot
      return;
    } else {
      sound.playMove();
      setStatusMessage(`SPLASH! MISS AT ${ROWS_LETTERS[r]}${c + 1}. ENEMY FIRING COUNTER-BATTERY...`);
      setTurn('bot');
    }
  };

  // Bot Turn Automation (Hunt & Target Algorithm)
  useEffect(() => {
    if (phase !== 'battle' || turn !== 'bot' || winner !== null) return;

    const botTimer = setTimeout(() => {
      let targetR = -1, targetC = -1;

      // Probe targets in queue from previous hits
      while (botTargetQueueRef.current.length > 0) {
        const candidate = botTargetQueueRef.current.shift();
        if (candidate && playerIncomingShots[candidate[0]][candidate[1]] === null) {
          targetR = candidate[0];
          targetC = candidate[1];
          break;
        }
      }

      // If queue is empty, random search
      if (targetR === -1) {
        const validCoords = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (playerIncomingShots[r][c] === null) validCoords.push([r, c]);
          }
        }
        if (validCoords.length > 0) {
          const picked = validCoords[Math.floor(Math.random() * validCoords.length)];
          targetR = picked[0];
          targetC = picked[1];
        }
      }

      if (targetR !== -1) {
        const hitShipId = playerGrid[targetR][targetC];
        const isHit = hitShipId !== null;

        const nextIncoming = playerIncomingShots.map((row) => [...row]);
        nextIncoming[targetR][targetC] = isHit ? 'hit' : 'miss';
        setPlayerIncomingShots(nextIncoming);

        if (isHit) {
          sound.playCapture();
          // Add adjacent 4 directions to target queue (Hunt mode)
          [[targetR - 1, targetC], [targetR + 1, targetC], [targetR, targetC - 1], [targetR, targetC + 1]].forEach(([ar, ac]) => {
            if (ar >= 0 && ar < GRID_SIZE && ac >= 0 && ac < GRID_SIZE && nextIncoming[ar][ac] === null) {
              botTargetQueueRef.current.push([ar, ac]);
            }
          });

          // Check if player ship sunk
          let sunkName = null;
          setPlayerShips((prev) => {
            const nextShips = prev.map((s) => {
              if (s.id === hitShipId) {
                const nextHits = s.hits + 1;
                const sunk = nextHits >= s.size;
                if (sunk) sunkName = s.name;
                return { ...s, hits: nextHits, sunk };
              }
              return s;
            });

            if (nextShips.every((s) => s.sunk)) {
              setWinner('bot');
              setPhase('gameover');
              sound.playGameOver();
            }
            return nextShips;
          });

          if (sunkName) {
            setStatusMessage(`⚠️ ENEMY SUNK YOUR ${sunkName.toUpperCase()}! BOT TAKES ANOTHER SHOT!`);
          } else {
            setStatusMessage(`⚠️ ENEMY HIT YOUR SHIP AT ${ROWS_LETTERS[targetR]}${targetC + 1}! BOT TAKES ANOTHER SHOT!`);
          }
          // Bot fires again on hit
        } else {
          sound.playMove();
          setStatusMessage(`ENEMY MISSED AT ${ROWS_LETTERS[targetR]}${targetC + 1}! YOUR TURN TO STRIKE!`);
          setTurn('player');
        }
      }
    }, 700);

    return () => clearTimeout(botTimer);
  }, [phase, turn, winner, playerIncomingShots, playerGrid]);

  const restartAll = () => {
    setPhase('placement');
    setCurrentShipIndex(0);
    setOrientation('H');
    setHoverPlacement(null);
    setPlayerGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
    setPlayerShips([]);
    setPlayerIncomingShots(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
    setBotGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
    setBotShips([]);
    setPlayerRadarShots(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)));
    setTurn('player');
    setWinner(null);
    botTargetQueueRef.current = [];
    setStatusMessage('DEPLOY YOUR FLEET TO COMMENCE COMBAT!');
  };

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#f97316] border-2 border-black flex items-center justify-center font-black text-white text-base brutal-shadow-sm font-mono shrink-0">
            🚢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Naval Battleship
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                10x10 COORDINATE RADAR • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              TACTICAL FLEET ARTILLERY // HUNT & TARGET AI
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
            onClick={restartAll}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column View */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: Tactical Grids (Deployment or Split Ocean/Radar) */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[540px] shrink-0">
          
          {/* Status Banner */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full border border-black ${turn === 'player' ? 'bg-[#22c55e] animate-pulse' : 'bg-[#ef4444]'}`} />
              <span className="font-brutal text-xs sm:text-sm font-black uppercase">
                {statusMessage}
              </span>
            </div>
            {phase === 'battle' && (
              <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-white">
                {turn === 'player' ? 'YOUR STRIKE' : 'ENEMY FIRING'}
              </span>
            )}
          </div>

          {/* Grids Display */}
          {phase === 'placement' ? (
            /* Fleet Placement Grid */
            <div className="w-full bg-white p-3 border-4 border-black brutal-shadow-lg select-none">
              <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-black font-mono text-xs font-bold uppercase">
                <span>Ocean Deployment Grid (10x10)</span>
                <span className="text-[#f97316]">
                  {currentShipIndex < SHIPS_CONFIG.length ? `Placing: ${SHIPS_CONFIG[currentShipIndex].name} (${SHIPS_CONFIG[currentShipIndex].size})` : 'All Ships Positioned'}
                </span>
              </div>

              {/* 10x10 Placement Grid */}
              <div className="grid grid-cols-11 gap-1 bg-[#f4f4ec] p-2 border-2 border-black">
                {/* Header Row */}
                <div className="w-full aspect-square flex items-center justify-center font-mono text-[10px] font-black text-neutral-400">#</div>
                {Array.from({ length: GRID_SIZE }).map((_, c) => (
                  <div key={c} className="w-full aspect-square flex items-center justify-center font-mono text-xs font-black">{c + 1}</div>
                ))}

                {/* 10 Rows */}
                {Array.from({ length: GRID_SIZE }).map((_, r) => (
                  <React.Fragment key={r}>
                    <div className="w-full aspect-square flex items-center justify-center font-mono text-xs font-black">{ROWS_LETTERS[r]}</div>
                    {Array.from({ length: GRID_SIZE }).map((_, c) => {
                      const shipId = playerGrid[r][c];
                      const isHovered = hoverPlacement && (() => {
                        const [hr, hc] = hoverPlacement;
                        const currShip = SHIPS_CONFIG[currentShipIndex];
                        if (!currShip) return false;
                        for (let i = 0; i < currShip.size; i++) {
                          const checkR = orientation === 'H' ? hr : hr + i;
                          const checkC = orientation === 'H' ? hc + i : hc;
                          if (checkR === r && checkC === c) return true;
                        }
                        return false;
                      })();

                      return (
                        <div
                          key={c}
                          onClick={() => handlePlacementClick(r, c)}
                          onMouseEnter={() => setHoverPlacement([r, c])}
                          onMouseLeave={() => setHoverPlacement(null)}
                          className={`aspect-square border border-black flex items-center justify-center font-mono text-xs font-black cursor-pointer transition-colors ${
                            shipId
                              ? 'bg-black text-white'
                              : isHovered
                              ? 'bg-[#22c55e]/60 border-2 border-black'
                              : 'bg-white hover:bg-neutral-100'
                          }`}
                        >
                          {shipId && '■'}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Deployment Action Bar */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setOrientation(orientation === 'H' ? 'V' : 'H')}
                  className="brutal-press py-2 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer"
                >
                  ROTATE: {orientation === 'H' ? 'HORIZONTAL' : 'VERTICAL'}
                </button>
                <button
                  onClick={randomizePlayerFleet}
                  className="brutal-press py-2 bg-white hover:bg-neutral-100 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>RANDOMIZE</span>
                </button>
                <button
                  onClick={resetPlacement}
                  className="brutal-press py-2 bg-white hover:bg-neutral-100 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer"
                >
                  RESET
                </button>
              </div>

              {/* Start Battle Trigger */}
              <div className="mt-2.5">
                <button
                  onClick={startBattle}
                  disabled={currentShipIndex < SHIPS_CONFIG.length}
                  className="brutal-press w-full py-3 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-300 disabled:shadow-none disabled:cursor-not-allowed border-3 border-black text-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow"
                >
                  ⚔️ COMMENCE NAVAL BATTLE
                </button>
              </div>
            </div>
          ) : (
            /* Active Battle: Dual Grids */
            <div className="w-full space-y-4">
              
              {/* Top: Enemy Target Radar Grid */}
              <div className="bg-white p-3 border-4 border-black brutal-shadow-lg select-none">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b-2 border-black font-mono text-xs font-bold uppercase">
                  <span className="flex items-center gap-1.5 text-[#ef4444]">
                    <Crosshair className="w-4 h-4 text-[#ef4444]" />
                    <span>TARGET RADAR (CLICK TO STRIKE)</span>
                  </span>
                  <span className="font-mono text-xs font-black">
                    SUNKEN: {botShips.filter((s) => s.sunk).length}/5
                  </span>
                </div>

                <div className="grid grid-cols-11 gap-1 bg-black p-2 border-2 border-black">
                  <div className="w-full aspect-square flex items-center justify-center font-mono text-[10px] font-black text-neutral-400">#</div>
                  {Array.from({ length: GRID_SIZE }).map((_, c) => (
                    <div key={c} className="w-full aspect-square flex items-center justify-center font-mono text-xs font-black text-white">{c + 1}</div>
                  ))}

                  {Array.from({ length: GRID_SIZE }).map((_, r) => (
                    <React.Fragment key={r}>
                      <div className="w-full aspect-square flex items-center justify-center font-mono text-xs font-black text-white">{ROWS_LETTERS[r]}</div>
                      {Array.from({ length: GRID_SIZE }).map((_, c) => {
                        const shot = playerRadarShots[r][c];

                        return (
                          <div
                            key={c}
                            onClick={() => firePlayerShot(r, c)}
                            className={`aspect-square border border-neutral-700 flex items-center justify-center font-mono text-xs font-black transition-colors ${
                              shot === 'hit'
                                ? 'bg-[#ef4444] text-white animate-pulse'
                                : shot === 'miss'
                                ? 'bg-neutral-800 text-neutral-400'
                                : 'bg-[#18181b] hover:bg-neutral-800 cursor-crosshair'
                            }`}
                          >
                            {shot === 'hit' ? '💥' : shot === 'miss' ? '•' : ''}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Bottom: Your Ocean & Incoming Fleet Status */}
              <div className="bg-white p-3 border-3 border-black brutal-shadow select-none">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b-2 border-black font-mono text-xs font-bold uppercase">
                  <span>YOUR OCEAN FLEET (DEFENSE)</span>
                  <span>SURVIVING: {playerShips.filter((s) => !s.sunk).length}/5</span>
                </div>

                <div className="grid grid-cols-11 gap-1 bg-[#f4f4ec] p-2 border-2 border-black">
                  <div className="w-full aspect-square flex items-center justify-center font-mono text-[10px] font-black text-neutral-400">#</div>
                  {Array.from({ length: GRID_SIZE }).map((_, c) => (
                    <div key={c} className="w-full aspect-square flex items-center justify-center font-mono text-[10px] font-black">{c + 1}</div>
                  ))}

                  {Array.from({ length: GRID_SIZE }).map((_, r) => (
                    <React.Fragment key={r}>
                      <div className="w-full aspect-square flex items-center justify-center font-mono text-[10px] font-black">{ROWS_LETTERS[r]}</div>
                      {Array.from({ length: GRID_SIZE }).map((_, c) => {
                        const hasShip = playerGrid[r][c] !== null;
                        const shot = playerIncomingShots[r][c];

                        return (
                          <div
                            key={c}
                            className={`aspect-square border border-black flex items-center justify-center font-mono text-xs font-black ${
                              shot === 'hit'
                                ? 'bg-[#ef4444] text-white animate-pulse'
                                : shot === 'miss'
                                ? 'bg-neutral-200 text-neutral-500'
                                : hasShip
                                ? 'bg-black text-white'
                                : 'bg-white'
                            }`}
                          >
                            {shot === 'hit' ? '💥' : shot === 'miss' ? '•' : hasShip ? '■' : ''}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right Column: Fleet Status & Intel */}
        <div className="relative z-10 w-full lg:w-[380px] flex flex-col gap-3 shrink-0">
          
          {/* Enemy Vessels Status */}
          <div className="bg-[#f4f4eb] text-black border-3 border-black p-3.5 brutal-shadow space-y-2.5">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
              <span className="font-brutal text-xs font-black uppercase tracking-wide">
                Enemy Armada Tracker
              </span>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                {botShips.filter((s) => s.sunk).length} / 5 SUNK
              </span>
            </div>

            <div className="space-y-1.5">
              {SHIPS_CONFIG.map((ship) => {
                const botShip = botShips.find((s) => s.id === ship.id);
                const isSunk = botShip?.sunk;

                return (
                  <div
                    key={ship.id}
                    className={`p-2 border-2 border-black flex items-center justify-between ${
                      isSunk ? 'bg-[#ef4444] text-white line-through font-black' : 'bg-white text-black'
                    }`}
                  >
                    <span className="font-brutal text-xs uppercase flex items-center gap-1.5">
                      <span>{ship.icon}</span>
                      <span>{ship.name} ({ship.size})</span>
                    </span>
                    <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 border border-black bg-white text-black">
                      {isSunk ? 'DESTROYED' : 'AFLOAT'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Strip */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={restartAll}
              className="brutal-press py-2.5 bg-[#ef4444] hover:bg-red-500 text-white font-brutal text-xs font-black uppercase border-3 border-black brutal-shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>RESTART WAR</span>
            </button>

            <button
              onClick={() => setShowRules(true)}
              className="brutal-press py-2.5 bg-white hover:bg-neutral-100 text-black font-brutal text-xs font-black uppercase border-3 border-black brutal-shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>RADAR RULES</span>
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
                <div className="w-7 h-7 bg-[#f97316] border-2 border-black flex items-center justify-center font-black text-white text-xs">
                  🚢
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Naval Battleship Rules
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
                  1. Deploy Your Armada
                </strong>
                Position your 5 naval vessels on the 10x10 ocean grid horizontally or vertically. Ships cannot overlap.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Call Radar Artillery Strikes
                </strong>
                Click any coordinate on the enemy target radar. A direct hit scores an explosion 💥 and grants you a bonus artillery shot!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Total Fleet Destruction
                </strong>
                Sink all 5 enemy vessels before the computer sinks yours to win the naval campaign!
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
