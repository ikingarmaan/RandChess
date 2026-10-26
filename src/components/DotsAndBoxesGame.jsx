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
  HelpCircle,
  X as CloseIcon,
  Gamepad2,
  Sliders
} from 'lucide-react';
import { sound } from '../utils/sound';

export const DotsAndBoxesGame = ({
  isDarkTheme = false,
  soundEnabled = true,
  onOpenCatalogue
}) => {
  const [gridSize, setGridSize] = useState(4); // 3x3 boxes, 4x4 boxes, or 5x5 boxes
  const numBoxes = gridSize; // e.g. 4
  const numDots = gridSize + 1; // e.g. 5

  // Lines state:
  // hLines: numDots x numBoxes (rows x cols)
  // vLines: numBoxes x numDots (rows x cols)
  const [hLines, setHLines] = useState(() =>
    Array.from({ length: numDots }, () => Array(numBoxes).fill(null))
  );
  const [vLines, setVLines] = useState(() =>
    Array.from({ length: numBoxes }, () => Array(numDots).fill(null))
  );
  // Boxes state: numBoxes x numBoxes (null | 'R' | 'Y')
  const [boxes, setBoxes] = useState(() =>
    Array.from({ length: numBoxes }, () => Array(numBoxes).fill(null))
  );

  const [turn, setTurn] = useState('R'); // 'R' = Red (Player 1), 'Y' = Yellow
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pass_play'
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [winner, setWinner] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showRules, setShowRules] = useState(false);

  // Sync sound setting
  useEffect(() => {
    sound.enabled = soundActive;
  }, [soundActive]);

  // Reset board when gridSize changes
  useEffect(() => {
    setHLines(Array.from({ length: gridSize + 1 }, () => Array(gridSize).fill(null)));
    setVLines(Array.from({ length: gridSize }, () => Array(gridSize + 1).fill(null)));
    setBoxes(Array.from({ length: gridSize }, () => Array(gridSize).fill(null)));
    setTurn('R');
    setWinner(null);
  }, [gridSize]);

  // Check if any box was just completed by the placed line
  const checkNewlyCompletedBoxes = useCallback(
    (curHLines, curVLines, curBoxes, player) => {
      const newlyCompleted = [];
      const updatedBoxes = curBoxes.map((r) => [...r]);

      for (let r = 0; r < numBoxes; r++) {
        for (let c = 0; c < numBoxes; c++) {
          if (updatedBoxes[r][c] === null) {
            const top = curHLines[r][c] !== null;
            const bottom = curHLines[r + 1][c] !== null;
            const left = curVLines[r][c] !== null;
            const right = curVLines[r][c + 1] !== null;

            if (top && bottom && left && right) {
              updatedBoxes[r][c] = player;
              newlyCompleted.push([r, c]);
            }
          }
        }
      }
      return { newlyCompleted, updatedBoxes };
    },
    [numBoxes]
  );

  // Make a line move
  const makeMove = useCallback(
    (type, r, c) => {
      if (winner !== null || isBotThinking) return;

      let nextHLines = hLines.map((row) => [...row]);
      let nextVLines = vLines.map((row) => [...row]);

      if (type === 'H') {
        if (nextHLines[r][c] !== null) return;
        nextHLines[r][c] = turn;
      } else {
        if (nextVLines[r][c] !== null) return;
        nextVLines[r][c] = turn;
      }

      sound.playMove();

      const { newlyCompleted, updatedBoxes } = checkNewlyCompletedBoxes(
        nextHLines,
        nextVLines,
        boxes,
        turn
      );

      setHLines(nextHLines);
      setVLines(nextVLines);
      setBoxes(updatedBoxes);

      if (newlyCompleted.length > 0) {
        sound.playCapture();
        // Check if all boxes are claimed
        const totalBoxes = numBoxes * numBoxes;
        let claimedCount = 0;
        let rCount = 0;
        let yCount = 0;

        updatedBoxes.forEach((row) =>
          row.forEach((b) => {
            if (b === 'R') { claimedCount++; rCount++; }
            else if (b === 'Y') { claimedCount++; yCount++; }
          })
        );

        if (claimedCount === totalBoxes) {
          sound.playGameOver();
          if (rCount > yCount) setWinner('R');
          else if (yCount > rCount) setWinner('Y');
          else setWinner('draw');
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        }
        // Player gets extra turn on box completion!
      } else {
        setTurn((t) => (t === 'R' ? 'Y' : 'R'));
      }
    },
    [winner, isBotThinking, hLines, vLines, turn, checkNewlyCompletedBoxes, boxes, numBoxes]
  );

  // Bot automation
  useEffect(() => {
    if (gameMode !== 'ai' || winner !== null || turn !== 'Y') return;

    setIsBotThinking(true);
    const delay = botDifficulty === 'easy' ? 350 : 600;

    const botTimer = setTimeout(() => {
      // Find all available lines
      const availableHLines = [];
      for (let r = 0; r < numDots; r++) {
        for (let c = 0; c < numBoxes; c++) {
          if (hLines[r][c] === null) availableHLines.push({ type: 'H', r, c });
        }
      }

      const availableVLines = [];
      for (let r = 0; r < numBoxes; r++) {
        for (let c = 0; c < numDots; c++) {
          if (vLines[r][c] === null) availableVLines.push({ type: 'V', r, c });
        }
      }

      const allAvailable = [...availableHLines, ...availableVLines];
      if (allAvailable.length === 0) {
        setIsBotThinking(false);
        return;
      }

      let chosen = allAvailable[0];

      // Priority 1: Check if any move immediately completes a box!
      const completingMoves = allAvailable.filter((m) => {
        const testH = hLines.map((row) => [...row]);
        const testV = vLines.map((row) => [...row]);
        if (m.type === 'H') testH[m.r][m.c] = 'Y';
        else testV[m.r][m.c] = 'Y';
        return checkNewlyCompletedBoxes(testH, testV, boxes, 'Y').newlyCompleted.length > 0;
      });

      if (completingMoves.length > 0) {
        chosen = completingMoves[0];
      } else if (botDifficulty !== 'easy') {
        // Priority 2: Avoid giving away 3rd side of a box to opponent
        const safeMoves = allAvailable.filter((m) => {
          const testH = hLines.map((row) => [...row]);
          const testV = vLines.map((row) => [...row]);
          if (m.type === 'H') testH[m.r][m.c] = 'Y';
          else testV[m.r][m.c] = 'Y';

          // Check if any box now has 3 sides
          for (let r = 0; r < numBoxes; r++) {
            for (let c = 0; c < numBoxes; c++) {
              if (boxes[r][c] === null) {
                let sides = 0;
                if (testH[r][c] !== null) sides++;
                if (testH[r + 1][c] !== null) sides++;
                if (testV[r][c] !== null) sides++;
                if (testV[r][c + 1] !== null) sides++;
                if (sides === 3) return false;
              }
            }
          }
          return true;
        });

        if (safeMoves.length > 0) {
          chosen = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        } else {
          chosen = allAvailable[Math.floor(Math.random() * allAvailable.length)];
        }
      } else {
        chosen = allAvailable[Math.floor(Math.random() * allAvailable.length)];
      }

      setIsBotThinking(false);
      makeMove(chosen.type, chosen.r, chosen.c);
    }, delay);

    return () => clearTimeout(botTimer);
  }, [gameMode, winner, turn, numDots, numBoxes, hLines, vLines, boxes, botDifficulty, checkNewlyCompletedBoxes, makeMove]);

  const scores = useMemo(() => {
    let r = 0, y = 0;
    boxes.forEach((row) =>
      row.forEach((b) => {
        if (b === 'R') r++;
        else if (b === 'Y') y++;
      })
    );
    return { R: r, Y: y };
  }, [boxes]);

  return (
    <div className={`flex flex-col min-h-0 flex-1 ${isDarkTheme ? 'bg-[#0f0f11] text-white' : 'bg-[#f4f4ec] text-black'} select-none`}>
      {/* Header Bar */}
      <header className={`border-b-3 border-black px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#facc15] border-2 border-black flex items-center justify-center font-black text-black text-base brutal-shadow-sm font-mono shrink-0">
            ✏️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brutal font-black text-sm sm:text-lg tracking-tight uppercase">
                Dots & Boxes
              </h1>
              <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#facc15] text-black border border-black hidden sm:inline">
                TERRITORY CAPTURE • ZERO BLUE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-neutral-500 hidden sm:block">
              PENCIL & PAPER DUEL // COMBO CHAIN REACTIONS
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
            onClick={() => {
              setHLines(Array.from({ length: gridSize + 1 }, () => Array(gridSize).fill(null)));
              setVLines(Array.from({ length: gridSize }, () => Array(gridSize + 1).fill(null)));
              setBoxes(Array.from({ length: gridSize }, () => Array(gridSize).fill(null)));
              setTurn('R');
              setWinner(null);
            }}
            className="brutal-press px-2.5 py-1 sm:py-1.5 bg-[#22c55e] hover:bg-green-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 min-h-0 overflow-y-auto">
        
        {/* Left Column: Grid */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[480px] shrink-0">
          
          {/* Status Pill */}
          <div className={`w-full p-2.5 border-3 border-black brutal-shadow-sm flex items-center justify-between gap-2 ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}>
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full border-2 border-black animate-pulse"
                style={{ backgroundColor: turn === 'R' ? '#ef4444' : '#facc15' }}
              />
              <span className="font-brutal text-sm font-black uppercase">
                {winner ? (winner === 'draw' ? 'DRAW MATCH!' : `${winner === 'R' ? 'RED' : 'YELLOW'} WINS!`) : isBotThinking ? 'BOT IS DRAWING...' : `${turn === 'R' ? 'RED' : 'YELLOW'}'S TURN`}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs font-black">
              <span className="px-2 py-0.5 bg-[#ef4444] text-white border border-black">R: {scores.R}</span>
              <span className="px-2 py-0.5 bg-[#facc15] text-black border border-black">Y: {scores.Y}</span>
            </div>
          </div>

          {/* Dots and Lines Arena */}
          <div className="w-full bg-white p-4 sm:p-6 border-4 border-black brutal-shadow-xl select-none flex items-center justify-center">
            <div className="relative">
              {Array.from({ length: numDots }).map((_, r) => (
                <div key={r} className="flex items-center">
                  {Array.from({ length: numDots }).map((_, c) => (
                    <React.Fragment key={c}>
                      {/* Dot */}
                      <div className="w-4 h-4 rounded-full bg-black z-30 shrink-0" />

                      {/* Horizontal Line to next dot */}
                      {c < numBoxes && (
                        <button
                          onClick={() => makeMove('H', r, c)}
                          disabled={hLines[r]?.[c] !== null || winner !== null || isBotThinking}
                          className={`h-4 w-12 sm:w-16 transition-all flex items-center justify-center cursor-pointer ${
                            hLines[r]?.[c] === 'R'
                              ? 'bg-[#ef4444] border-y-2 border-black z-20'
                              : hLines[r]?.[c] === 'Y'
                              ? 'bg-[#facc15] border-y-2 border-black z-20'
                              : 'bg-neutral-200 hover:bg-[#22c55e]/60 z-10'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ))}

              {/* Vertical Lines & Box Fills overlay */}
              <div className="absolute top-2 left-0 w-full h-[calc(100%-16px)] pointer-events-none">
                {Array.from({ length: numBoxes }).map((_, r) => (
                  <div key={r} className="flex h-12 sm:h-16 items-center">
                    {Array.from({ length: numDots }).map((_, c) => (
                      <React.Fragment key={c}>
                        {/* Vertical Line */}
                        <button
                          onClick={() => makeMove('V', r, c)}
                          disabled={vLines[r]?.[c] !== null || winner !== null || isBotThinking}
                          className={`w-4 h-full pointer-events-auto transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                            vLines[r]?.[c] === 'R'
                              ? 'bg-[#ef4444] border-x-2 border-black z-20'
                              : vLines[r]?.[c] === 'Y'
                              ? 'bg-[#facc15] border-x-2 border-black z-20'
                              : 'bg-neutral-200 hover:bg-[#22c55e]/60 z-10'
                          }`}
                        />

                        {/* Box Claim Fill */}
                        {c < numBoxes && (
                          <div
                            className={`w-12 sm:w-16 h-full flex items-center justify-center font-brutal text-lg sm:text-xl font-black transition-all ${
                              boxes[r]?.[c] === 'R'
                                ? 'bg-[#ef4444]/30 border-2 border-dashed border-[#ef4444] text-[#ef4444] animate-pulse'
                                : boxes[r]?.[c] === 'Y'
                                ? 'bg-[#facc15]/30 border-2 border-dashed border-[#facc15] text-[#a16207] animate-pulse'
                                : ''
                            }`}
                          >
                            {boxes[r]?.[c] || ''}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Command Station */}
        <div className="relative z-10 w-full lg:w-[380px] flex flex-col gap-3 shrink-0">
          
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
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Heuristic Bot</span>
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
                <span className="text-[9px] font-mono font-bold text-black opacity-80">Pass & Play</span>
              </button>
            </div>

            {/* AI Difficulty Selector */}
            {gameMode === 'ai' && (
              <div className="border-t-2 border-black pt-2 space-y-1.5">
                <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                  AI Difficulty:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'easy', label: 'EASY', desc: 'Random line moves' },
                    { id: 'medium', label: 'MEDIUM', desc: 'Captures boxes & avoids traps' },
                    { id: 'hard', label: 'HARD', desc: 'Corridor sweep analysis' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setBotDifficulty(lvl.id)}
                      className={`py-1.5 px-1 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer text-center ${
                        botDifficulty === lvl.id ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                      }`}
                      title={lvl.desc}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid Size Selector */}
            <div className="border-t-2 border-black pt-2 space-y-1.5">
              <span className="font-mono text-[10px] text-neutral-600 font-bold uppercase block">
                Grid Size:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { size: 3, label: '3x3 (9 Boxes)' },
                  { size: 4, label: '4x4 (16 Boxes)' },
                  { size: 5, label: '5x5 (25 Boxes)' }
                ].map((item) => (
                  <button
                    key={item.size}
                    onClick={() => setGridSize(item.size)}
                    className={`py-1 border-2 border-black font-mono text-[10px] font-black uppercase cursor-pointer ${
                      gridSize === item.size ? 'bg-black text-[#22c55e]' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons Strip */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setHLines(Array.from({ length: gridSize + 1 }, () => Array(gridSize).fill(null)));
                setVLines(Array.from({ length: gridSize }, () => Array(gridSize + 1).fill(null)));
                setBoxes(Array.from({ length: gridSize }, () => Array(gridSize).fill(null)));
                setTurn('R');
                setWinner(null);
              }}
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
                <div className="w-7 h-7 bg-[#facc15] border-2 border-black flex items-center justify-center font-black text-black text-xs">
                  ✏️
                </div>
                <h3 className="font-brutal font-black text-base sm:text-lg uppercase">
                  Dots & Boxes Rules
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
                  1. Drawing Lines
                </strong>
                Click between two adjacent dots to draw a connecting line horizontally or vertically.
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  2. Claiming Boxes & Bonus Turns
                </strong>
                The player who draws the 4th side of any 1x1 box claims that box and earns an <strong>extra bonus turn</strong>!
              </div>

              <div className="p-2.5 bg-neutral-100 text-black border-2 border-black">
                <strong className="font-brutal text-black uppercase block mb-1">
                  3. Chain Reactions
                </strong>
                Sacrificing or completing corridors triggers chain reactions where multiple boxes are claimed consecutively!
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

