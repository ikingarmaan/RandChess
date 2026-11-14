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
  HelpCircle
} from 'lucide-react';

export const GameCatalogueHub = ({
  onSelectGame,
  isDarkTheme = false
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'strategy' | 'arcade'

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
    }
  ];

  const filteredGames = games.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'strategy') return ['chess', 'tictactoe'].includes(g.id);
    if (filter === 'arcade') return ['snake', 'pong'].includes(g.id);
    return true;
  });

  return (
    <div className={`w-full min-h-screen flex flex-col items-center p-3 sm:p-6 lg:p-10 select-none ${isDarkTheme ? 'bg-[#0f0f12] text-white' : 'bg-[#f4f4ec] text-black'}`}>
      
      {/* Hero Masthead Banner */}
      <div className="w-full max-w-6xl mb-8 flex flex-col items-center text-center">
        
        {/* Top Brutalist Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white border-2 border-black font-mono text-xs font-black uppercase tracking-wider mb-3 brutal-shadow-sm">
          <Gamepad2 className="w-3.5 h-3.5 text-[#22c55e]" />
          <span>RANDGAMES ARENA // 4 HIGH-VOLTAGE BATTLEFIELDS</span>
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
            { id: 'strategy', label: 'STRATEGY', count: 2 },
            { id: 'arcade', label: 'REFLEX & ARCADE', count: 2 }
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

      {/* Primary Games Grid (4 cards in responsive grid) */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
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
                  {game.features.slice(0, 4).map((feat, idx) => (
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
        <div>RANDGAMES v2.0 // 4 ZERO-BLUE ARENAS READY FOR COMBAT</div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="font-bold text-black dark:text-white">CHESS</span>
          <span>•</span>
          <span className="font-bold text-black dark:text-white">TIC-TAC-TOE</span>
          <span>•</span>
          <span className="font-bold text-black dark:text-white">SNAKE ARENA</span>
          <span>•</span>
          <span className="font-bold text-black dark:text-white">CYBER PONG</span>
        </div>
      </div>
    </div>
  );
};
