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
  const [filter, setFilter] = useState('all'); // 'all' | 'playable' | 'upcoming'

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
      btnBg: 'bg-[#22c55e] hover:bg-green-400',
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
      badge: 'NEW // 2-4 PLAYERS',
      badgeColor: 'bg-[#f97316] text-white',
      playable: true,
      players: '2 - 4 Players (Min 2, Max 4)',
      highlightBorder: 'hover:border-[#f97316]',
      btnBg: 'bg-[#f97316] hover:bg-orange-500 text-white',
      description: 'The ancient 4-corner board game rebuilt in high-contrast Neo-Brutalism. Supports 2 to 4 players online with live room codes, smart bots, and tactile 3D dice.',
      features: [
        '2, 3, or 4 Player Matchmaking & Private Rooms',
        'Local Bot AI with Smart Tactical Heuristics',
        '1v1 to 4-Player Local Pass & Play',
        'Tactile 3D Dice Shaker with Audio FX',
        '8 Safe Squares, Captures & Home Celebrations'
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
    },
    {
      id: 'connect4',
      title: 'Gravity Connect 4',
      shortTitle: 'CONNECT 4',
      category: 'GRID STRATEGY // 7x6',
      icon: '🔴 🟡',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: '1 - 2 Players',
      description: 'Vertical drop strategy game. Connect 4 discs in a line horizontally, vertically, or diagonally while blocking traps.',
      features: ['Gravity Grid Physics', '4 In A Row Victory', 'Minimax Drop Engine']
    },
    {
      id: 'checkers',
      title: 'Brutal Checkers',
      shortTitle: 'CHECKERS',
      category: 'DIAGONAL COMBAT // 8x8',
      icon: '⚪ ⚫',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: '1 - 2 Players',
      description: 'Diagonal jumping warfare with mandatory multi-captures, king promotions, and crisp black-and-white pieces.',
      features: ['Forced Multi-Jumps', 'Crown Kinging', 'Tactile Jump Physics']
    },
    {
      id: 'minesweeper',
      title: 'Minesweeper Tactical',
      shortTitle: 'MINESWEEPER',
      category: 'LOGIC DEDUCTION',
      icon: '🚩 💣',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: 'Singleplayer',
      description: 'Zero-guess mine clearance grid with deductive logic guarantees, speedrun timers, and tactile cell flagging.',
      features: ['Zero Guess Logic', 'Speedrun Precision Clock', 'Custom Grid Sizing']
    },
    {
      id: 'battleship',
      title: 'Naval Battleship',
      shortTitle: 'BATTLESHIP',
      category: 'COORDINATE WARFARE',
      icon: '🚢 💥',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: '1 - 2 Players',
      description: 'Coordinate artillery grid warfare. Position your fleet, call tactical radar strikes, and sink the opponent armada.',
      features: ['Coordinate Radar', 'Tactical Air Strikes', '10x10 Fleet Grid']
    }
  ];

  const filteredGames = games.filter((g) => {
    if (filter === 'playable') return g.playable;
    if (filter === 'upcoming') return !g.playable;
    return true;
  });

  return (
    <div className={`w-full min-h-screen flex flex-col items-center p-3 sm:p-6 lg:p-10 select-none ${isDarkTheme ? 'bg-[#0f0f12] text-white' : 'bg-[#f4f4ec] text-black'}`}>
      
      {/* Hero Masthead Banner */}
      <div className="w-full max-w-6xl mb-8 flex flex-col items-center text-center">
        
        {/* Top Brutalist Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white border-2 border-black font-mono text-xs font-black uppercase tracking-wider mb-3 brutal-shadow-sm">
          <Gamepad2 className="w-3.5 h-3.5 text-[#22c55e]" />
          <span>RANDGAMES ARENA // MULTI-GAME PLATFORM</span>
        </div>

        {/* Main Title */}
        <h1 className="font-brutal text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-2">
          SELECT YOUR BATTLEFIELD
        </h1>

        <p className="font-mono text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl">
          High-voltage tactical board games featuring Stockfish-calibrated Minimax, Unbeatable AI & Real-Time Online Multiplayer. Strict Zero Blue Neo-Brutalism.
        </p>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-5 p-1 bg-black border-2 border-black">
          {[
            { id: 'all', label: 'ALL GAMES', count: games.length },
            { id: 'playable', label: 'PLAYABLE NOW', count: 3 },
            { id: 'upcoming', label: 'COMING SOON', count: 4 }
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
                {game.playable ? (
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
                ) : (
                  <div className="w-full py-2.5 px-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border-2 border-black font-mono text-xs font-black uppercase text-center cursor-not-allowed">
                    IN DEVELOPMENT
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Specs */}
      <div className="w-full max-w-6xl border-t-2 border-black/30 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-500 gap-2">
        <div>RANDGAMES v2.0 // HIGH-TACTICAL ZERO BLUE GAMING SUITE</div>
        <div className="flex items-center gap-3">
          <span>CHESS</span>
          <span>•</span>
          <span>LUDO (2-4P)</span>
          <span>•</span>
          <span>TIC-TAC-TOE</span>
        </div>
      </div>
    </div>
  );
};

