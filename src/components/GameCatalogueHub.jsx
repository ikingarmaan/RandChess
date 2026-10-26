import React, { useState } from 'react';
import {
  Gamepad2,
  Sparkles,
  Swords,
  Trophy,
  Play,
  Flame,
  Clock,
  Users,
  Bot,
  Wifi,
  Shield,
  HelpCircle,
  Dice5
} from 'lucide-react';

export const GameCatalogueHub = ({
  onSelectGame,
  isDarkTheme = false
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'strategy' | 'arcade' | 'board'

  const games = [
    {
      id: 'chess',
      title: 'RandChess 2.0',
      shortTitle: 'CHESS',
      category: 'TACTICAL STRATEGY // 64 SQUARES',
      icon: '♞',
      badge: 'TOP STRATEGY',
      badgeColor: 'bg-[#22c55e] text-black',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#22c55e]',
      btnBg: 'bg-[#22c55e] hover:bg-green-400 text-black',
      description: 'Stockfish-calibrated Minimax engine (800-2100 ELO), real-time online PvP with 6-char room codes, GM coach explainer, and customizable timers.',
      features: [
        'Minimax AI with 4 Difficulty Tiers',
        'Live Online Multiplayer (Rooms & Quick Match)',
        'Local 1v1 Pass & Play',
        'Customizable Countdown Clocks',
        'Zero Blue Neo-Brutalist Board'
      ]
    },
    {
      id: 'ludo',
      title: 'Neo-Brutal Ludo',
      shortTitle: 'LUDO',
      category: 'CLASSIC BATTLE // 2-4 PLAYERS',
      icon: '🎲',
      badge: '2-4 PLAYERS',
      badgeColor: 'bg-[#f97316] text-white',
      playable: true,
      players: '2 - 4 Players (Min 2, Max 4)',
      highlightBorder: 'hover:border-[#f97316]',
      btnBg: 'bg-[#f97316] hover:bg-orange-500 text-white',
      description: 'The ancient 4-corner board game rebuilt in high-contrast Neo-Brutalism. Supports 2 to 4 players online with live room codes, smart bots, and tactile 3D dice.',
      features: [
        '2, 3, or 4 Player Matchmaking & Private Rooms',
        'Bot AI with 3 Difficulty Modes (Easy, Medium, Hard)',
        '1v1 to 4-Player Local Pass & Play',
        'Tactile 3D Dice Shaker with Audio FX',
        '8 Safe Squares, Captures & Home Celebrations'
      ]
    },
    {
      id: 'connect4',
      title: 'Gravity Connect 4',
      shortTitle: 'CONNECT 4',
      category: 'GRID STRATEGY // 7x6',
      icon: '🔴 🟡',
      badge: 'POPULAR',
      badgeColor: 'bg-[#ef4444] text-white',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#ef4444]',
      btnBg: 'bg-[#ef4444] hover:bg-red-500 text-white',
      description: 'Vertical gravity drop duel. Line up 4 chips horizontally, vertically, or diagonally while blocking opponent traps. Powered by Minimax AI.',
      features: [
        '7x6 Vertical Drop Grid with Hover Previews',
        'Minimax AI Engine across 3 Difficulties',
        '1v1 Local Pass & Play Mode',
        'Turn Countdown Timer (15s, 30s, 60s, ∞)',
        'Dynamic 4-in-a-Row Victory Line Animations'
      ]
    },
    {
      id: 'checkers',
      title: 'Brutal Checkers',
      shortTitle: 'CHECKERS',
      category: 'DIAGONAL COMBAT // 8x8',
      icon: '⚪ ⚫',
      badge: 'CLASSIC',
      badgeColor: 'bg-black text-white',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-black',
      btnBg: 'bg-black hover:bg-neutral-800 text-[#facc15]',
      description: 'Tactical diagonal draughts warfare with mandatory jumping rules, multi-jump combo chains, crown kinging, and heuristic bot AI.',
      features: [
        '8x8 Dark Grid with Glowing Legal Destination Dots',
        'Mandatory Multi-Jump Chain Enforcements',
        'Back-Rank King Promotion 👑',
        'Minimax Checkers Bot with 3 Difficulty Tiers',
        '1v1 Local Pass & Play with Score Tracking'
      ]
    },
    {
      id: 'battleship',
      title: 'Naval Battleship',
      shortTitle: 'BATTLESHIP',
      category: 'COORDINATE WARFARE // 10x10',
      icon: '🚢 💥',
      badge: 'ARTILLERY',
      badgeColor: 'bg-[#f97316] text-white',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#f97316]',
      btnBg: 'bg-[#f97316] hover:bg-orange-500 text-white',
      description: 'Coordinate artillery radar strikes. Deploy your 5-ship fleet with rotation and auto-randomize, then call radar missile strikes against Hunt & Target AI.',
      features: [
        '3 Radar Difficulty Modes (Cadet, Commander, Admiral)',
        '10x10 Ocean Grid & Enemy Radar Strike Station',
        '5 Naval Ships with Horizontal/Vertical Rotation',
        'Smart Hunt & Target AI with Parity Checkerboard',
        'vs Bot AI and 1v1 Local Pass & Play Modes'
      ]
    },
    {
      id: 'minesweeper',
      title: 'Minesweeper Tactical',
      shortTitle: 'MINESWEEPER',
      category: 'LOGIC DEDUCTION',
      icon: '🚩 💣',
      badge: 'SPEEDRUN',
      badgeColor: 'bg-[#22c55e] text-black',
      playable: true,
      players: 'Singleplayer',
      highlightBorder: 'hover:border-[#22c55e]',
      btnBg: 'bg-[#22c55e] hover:bg-green-400 text-black',
      description: 'Zero-guess mine clearance grid with first-click safety guarantees, cascading flood-fill reveals, precision digital stopwatch, and flagging controls.',
      features: [
        '100% First-Click Safe Zone Guarantee',
        'Beginner (9x9), Intermediate (16x16), Expert (16x24)',
        'Cascading Zero-Mine Auto-Reveal',
        'Mobile Tap-to-Flag / Desktop Right-Click Flagging',
        'Retro Digital LED Bomb & Stopwatch HUD'
      ]
    },
    {
      id: 'othello',
      title: 'Brutal Othello',
      shortTitle: 'REVERSI',
      category: 'DYNAMIC FLIPS // 8x8',
      icon: '⚫ ⚪',
      badge: 'STRATEGY',
      badgeColor: 'bg-black text-[#22c55e]',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#22c55e]',
      btnBg: 'bg-[#22c55e] hover:bg-green-400 text-black',
      description: 'Trap and flip opponent pieces across all 8 directions. Features live flip previews, corner positional weighting, and territory tug-of-war gauges.',
      features: [
        'Live Sandwich Flip Highlight on Hover',
        'Positional Heuristic AI with Corner Dominance',
        'Territory Tug-of-War Real-Time Gauge',
        'Automatic Pass-Turn Enforcement',
        '1v1 Local Pass & Play'
      ]
    },
    {
      id: 'dotsandboxes',
      title: 'Dots & Boxes',
      shortTitle: 'DOTS & BOXES',
      category: 'TERRITORY CAPTURE',
      icon: '✏️ ⏹️',
      badge: 'PENCIL & PAPER',
      badgeColor: 'bg-[#facc15] text-black',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#facc15]',
      btnBg: 'bg-[#facc15] hover:bg-yellow-400 text-black',
      description: 'Draw lines between grid dots to claim boxes and trigger combo chain reactions. Features smart corridor AI and customizable grid sizes.',
      features: [
        '3 Bot Difficulty Tiers (Easy, Medium, Hard)',
        'Selectable Grids: 3x3, 4x4, or 5x5 Boxes',
        '4th Side Completion Bonus Turns & Chain Combos',
        'Corridor-Aware Heuristic Bot AI',
        '1v1 Local Pass & Play and vs Bot AI'
      ]
    },
    {
      id: 'pong',
      title: 'Cyber Pong 1v1',
      shortTitle: 'CYBER PONG',
      category: '60 FPS ARCADE',
      icon: '🏓 ⚡',
      badge: 'FAST ACTION',
      badgeColor: 'bg-[#22c55e] text-black',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#22c55e]',
      btnBg: 'bg-[#22c55e] hover:bg-green-400 text-black',
      description: 'High-speed 60 FPS vector paddle physics. Features spin deflection angles, accelerating ball speed, reactive AI bot, and same-keyboard 1v1 duels.',
      features: [
        '3 Difficulty Reaction Speeds (Easy, Medium, Brutal)',
        'Touch / Mouse Drag & Keyboard Steer Controls',
        '60 FPS HTML5 Canvas Physics Engine',
        'Edge Deflection Spin & Ball Acceleration',
        'vs Bot AI and 1v1 Same Keyboard Modes'
      ]
    },
    {
      id: 'snake',
      title: 'Snake Arena Duel',
      shortTitle: 'SNAKE ARENA',
      category: 'GRID SURVIVAL // 20x20',
      icon: '🐍 🍎',
      badge: 'RETRO ARCADE',
      badgeColor: 'bg-[#22c55e] text-black',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#22c55e]',
      btnBg: 'bg-[#22c55e] hover:bg-green-400 text-black',
      description: 'Classic arcade snake with red apples, bonus golden stars, and an intense 1v1 Tron-style duel mode where two snakes battle on the same arena.',
      features: [
        '3 Speed Difficulties (Slither, Viper, Cobra)',
        'Solo Survival, vs AI Bot Duel, & 1v1 Local Modes',
        'Autonomous AI Snake Opponent Navigation',
        'Mobile Touch D-Pad Controls & Keyboard Support',
        'Persistent LocalStorage High Scores'
      ]
    },
    {
      id: 'snakesladders',
      title: 'Snakes & Ladders',
      shortTitle: 'SNAKES & LADDERS',
      category: '100-TILE RACE // 2-4 PLAYERS',
      icon: '🪜 🐍',
      badge: '2-4 PLAYERS',
      badgeColor: 'bg-[#facc15] text-black',
      playable: true,
      players: '2 - 4 Players',
      highlightBorder: 'hover:border-[#facc15]',
      btnBg: 'bg-[#facc15] hover:bg-yellow-400 text-black',
      description: 'The iconic 100-tile boustrophedon race! Climb golden ladders, avoid hazard snakes, roll tactile 3D dice, and enjoy 2 to 4 player local or bot matches.',
      features: [
        '3 Board Difficulties (Sunny Climb, Classic, Hazard Pit)',
        '100-Tile Boustrophedon Numbered Grid',
        'Tactile 3D Animated Dice with Audio FX',
        'Exact 100 Finish Bounce Rule & 6s Extra Roll',
        '2 to 4 Players Local Pass & Play or vs Bots'
      ]
    },
    {
      id: 'tictactoe',
      title: 'Brutal Tic-Tac-Toe',
      shortTitle: 'TIC TAC TOE',
      category: 'LIGHTNING PLAY // 3x3 ARENA',
      icon: '✕ ◯',
      badge: 'UNBEATABLE MINIMAX',
      badgeColor: 'bg-[#facc15] text-black',
      playable: true,
      players: '1 - 2 Players',
      highlightBorder: 'hover:border-[#facc15]',
      btnBg: 'bg-[#facc15] hover:bg-yellow-400 text-black',
      description: 'Fast-paced 3-in-a-row duel featuring an Unbeatable Minimax AI bot, local pass & play, live win streak tracking, and celebratory confetti.',
      features: [
        '100% Unbeatable Minimax AI (Try to Draw!)',
        '1v1 Local Pass & Play Mode',
        'Streak Tracker & Local Record Storage',
        'Customizable Round Countdown Clocks',
        'Animated Dynamic Victory Lines'
      ]
    }
  ];

  const filteredGames = games.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'strategy') return ['chess', 'othello', 'checkers', 'connect4'].includes(g.id);
    if (filter === 'arcade') return ['pong', 'snake', 'minesweeper', 'tictactoe'].includes(g.id);
    if (filter === 'board') return ['ludo', 'battleship', 'snakesladders', 'dotsandboxes'].includes(g.id);
    return true;
  });

  return (
    <div className={`w-full min-h-screen flex flex-col items-center p-3 sm:p-6 lg:p-10 select-none ${isDarkTheme ? 'bg-[#0f0f12] text-white' : 'bg-[#f4f4ec] text-black'}`}>
      
      {/* Hero Masthead Banner */}
      <div className="w-full max-w-6xl mb-8 flex flex-col items-center text-center">
        
        {/* Top Brutalist Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white border-2 border-black font-mono text-xs font-black uppercase tracking-wider mb-3 brutal-shadow-sm">
          <Gamepad2 className="w-3.5 h-3.5 text-[#22c55e]" />
          <span>RANDGAMES ARENA // 12 HIGH-VOLTAGE BATTLEFIELDS</span>
        </div>

        {/* Main Title */}
        <h1 className="font-brutal text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-2">
          SELECT YOUR BATTLEFIELD
        </h1>

        <p className="font-mono text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl">
          High-voltage tactical board & arcade games featuring Stockfish-calibrated Minimax, Unbeatable AI & Real-Time Multiplayer. Strict Zero Blue Neo-Brutalism.
        </p>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-5 p-1 bg-black border-2 border-black flex-wrap justify-center">
          {[
            { id: 'all', label: 'ALL GAMES', count: games.length },
            { id: 'strategy', label: 'STRATEGY', count: 4 },
            { id: 'board', label: 'BOARD & DICE', count: 4 },
            { id: 'arcade', label: 'REFLEX & ARCADE', count: 4 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 font-brutal text-xs font-black uppercase cursor-pointer transition-colors ${
                filter === tab.id
                  ? 'bg-[#facc15] text-black brutal-shadow-sm'
                  : 'bg-black text-white hover:text-[#facc15]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Primary Games Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredGames.map((game) => {
          return (
            <div
              key={game.id}
              className={`relative flex flex-col justify-between border-4 border-black transition-all ${
                game.playable
                  ? `brutal-shadow-lg ${game.highlightBorder} cursor-pointer`
                  : 'opacity-70 border-dashed brutal-shadow-sm'
              } ${isDarkTheme ? 'bg-[#18181b]' : 'bg-white'}`}
              onClick={() => {
                if (game.playable) onSelectGame(game.id);
              }}
            >
              {/* Card Header & Badge */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 bg-black text-white border-2 border-black flex items-center justify-center text-2xl font-black font-mono brutal-shadow-sm shrink-0">
                    {game.icon}
                  </div>
                  <span
                    className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black ${game.badgeColor}`}
                  >
                    {game.badge}
                  </span>
                </div>

                <div className="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
                  {game.category}
                </div>

                <h3 className="font-brutal text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">
                  {game.title}
                </h3>

                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-black font-mono text-[11px] font-bold mb-3">
                  <Users className="w-3 h-3 text-black dark:text-white" />
                  <span>{game.players}</span>
                </div>

                <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
                  {game.description}
                </p>

                {/* Features Bullet List */}
                <div className="space-y-1.5 pt-2 border-t border-black/20">
                  {game.features.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
                      <span className="w-1.5 h-1.5 bg-[#22c55e] border border-black shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-4 pt-0 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGame(game.id);
                  }}
                  className={`brutal-press w-full py-3 px-4 border-3 border-black font-brutal text-sm font-black uppercase cursor-pointer brutal-shadow-sm flex items-center justify-center gap-2 ${game.btnBg}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>LAUNCH {game.shortTitle}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Specs */}
      <div className="w-full max-w-6xl border-t-2 border-black/30 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-500 gap-2">
        <div>RANDGAMES v2.0 // 12 ZERO-BLUE ARENAS READY FOR COMBAT</div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span>CHESS</span>
          <span>•</span>
          <span>LUDO</span>
          <span>•</span>
          <span>CONNECT 4</span>
          <span>•</span>
          <span>CHECKERS</span>
          <span>•</span>
          <span>BATTLESHIP</span>
          <span>•</span>
          <span>MINESWEEPER</span>
          <span>•</span>
          <span>OTHELLO</span>
          <span>•</span>
          <span>DOTS & BOXES</span>
          <span>•</span>
          <span>PONG</span>
          <span>•</span>
          <span>SNAKE</span>
          <span>•</span>
          <span>SNAKES & LADDERS</span>
          <span>•</span>
          <span>TIC-TAC-TOE</span>
        </div>
      </div>
    </div>
  );
};
