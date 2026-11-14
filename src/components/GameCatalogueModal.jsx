import React, { useState } from 'react';
import { Gamepad2, X, Sparkles, Swords, Trophy, Play, Check, Flame, Clock } from 'lucide-react';

export const GameCatalogueModal = ({
  isOpen,
  onClose,
  activeGame,
  onSelectGame
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'strategy' | 'arcade'

  if (!isOpen) return null;

  const games = [
    {
      id: 'chess',
      title: 'RandChess 2.0',
      shortTitle: 'CHESS',
      category: 'TACTICAL STRATEGY // BOARD',
      icon: '♞',
      badge: 'TOP STRATEGY',
      badgeColor: 'bg-[#22c55e] text-black',
      playable: true,
      players: '1 - 2 Players',
      description: 'Tactical 64-square battlefield with Stockfish-calibrated Minimax AI (800-2100 ELO), live multiplayer PvP, GM coach explainer, and customizable timers.',
      tags: ['vs Bot AI', '1v1 Local', 'Online PvP', 'Custom Timers', 'GM Coach']
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
      description: 'Classic high-voltage 3-in-a-row with an Unbeatable Minimax AI bot, 1v1 local pass & play, win streak tracking, celebration confetti, and match clocks.',
      tags: ['Unbeatable Minimax', '1v1 Pass & Play', 'Streak Tracker', 'Victory FX']
    },
    {
      id: 'snake',
      title: 'Snake Arena Duel',
      shortTitle: 'SNAKE ARENA',
      category: 'RETRO SURVIVAL // 20x20',
      icon: '🐍 🍎',
      badge: 'SURVIVAL',
      badgeColor: 'bg-[#22c55e] text-black',
      playable: true,
      players: '1 - 2 Players',
      description: 'Classic arcade snake with red apples, bonus golden stars, and an intense 1v1 Tron-style duel mode where two snakes battle on the same arena.',
      tags: ['Solo High-Score', '1v1 Tron Duel', 'Golden Stars', 'LocalStorage Highs']
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
      description: 'High-speed 60 FPS vector paddle physics. Features spin deflection angles, accelerating ball speed, reactive AI bot, and same-keyboard 1v1 duels.',
      tags: ['60 FPS Physics', 'Deflection Spin', 'Reactive Bot', 'Same-Keyboard 1v1']
    },
    {
      id: 'pool',
      title: 'Cyber 8-Ball Pool',
      shortTitle: '8-BALL POOL',
      category: '2D BILLIARDS RIG // 16 BALLS',
      icon: '🎱',
      badge: 'PHYSICS v2.0',
      badgeColor: 'bg-[#22c55e] text-black',
      playable: true,
      players: '1 - 2 Players',
      description: 'Authentic 8-ball billiards with 60 FPS vector physics, dynamic laser trajectory guides, ghost ball projection, tactile power cues, and real-time multiplayer.',
      tags: ['16-Ball Physics', 'Laser Trajectory', 'Smart Bots', 'Online PvP', 'Custom Clocks']
    }
  ];

  const filteredGames = games.filter((g) => {
    if (filter === 'strategy') return ['chess', 'tictactoe'].includes(g.id);
    if (filter === 'arcade') return ['pool', 'snake', 'pong'].includes(g.id);
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 modal-backdrop-anim select-none"
      style={{ overscrollBehavior: 'contain' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white text-black border-4 border-black p-4 sm:p-6 brutal-shadow-xl max-w-3xl w-full space-y-4 relative max-h-[92vh] overflow-y-auto modal-content-anim">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#22c55e] border-2 border-black flex items-center justify-center shrink-0 brutal-shadow-sm">
              <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brutal text-sm sm:text-lg font-black uppercase tracking-tight">
                  Game Catalogue & Hub
                </h2>
                <span className="text-[10px] font-mono font-black px-1.5 py-0.2 bg-[#facc15] text-black border border-black hidden sm:inline">
                  {games.length} PLAYABLE ARENAS
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-600">
                Switch games instantly across 5 tactical battlefields
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="brutal-press p-1.5 bg-black text-white hover:bg-neutral-800 border-2 border-black cursor-pointer"
            title="Close Catalogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono text-xs font-black">
            <button
              onClick={() => setFilter('all')}
              className={`brutal-press px-3 py-1 border-2 border-black cursor-pointer transition-colors ${
                filter === 'all'
                  ? 'bg-black text-white brutal-shadow-sm'
                  : 'bg-[#f4f4eb] text-black hover:bg-neutral-200'
              }`}
            >
              ALL GAMES ({games.length})
            </button>
            <button
              onClick={() => setFilter('strategy')}
              className={`brutal-press px-3 py-1 border-2 border-black cursor-pointer transition-colors ${
                filter === 'strategy'
                  ? 'bg-[#22c55e] text-black brutal-shadow-sm'
                  : 'bg-[#f4f4eb] text-black hover:bg-neutral-200'
              }`}
            >
              STRATEGY (2)
            </button>
            <button
              onClick={() => setFilter('arcade')}
              className={`brutal-press px-3 py-1 border-2 border-black cursor-pointer transition-colors ${
                filter === 'arcade'
                  ? 'bg-[#facc15] text-black brutal-shadow-sm'
                  : 'bg-[#f4f4eb] text-black hover:bg-neutral-200'
              }`}
            >
              PHYSICS & ARCADE (3)
            </button>
          </div>

          <span className="font-mono text-[10px] font-bold text-neutral-500">
            ACTIVE: <span className="bg-black text-[#22c55e] px-1.5 py-0.5">{activeGame ? activeGame.toUpperCase() : 'HUB'}</span>
          </span>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {filteredGames.map((game) => {
            const isActive = activeGame === game.id;

            return (
              <div
                key={game.id}
                className={`border-3 border-black p-3.5 flex flex-col justify-between transition-all ${
                  isActive
                    ? 'bg-[#f0fdf4] ring-2 ring-[#22c55e] brutal-shadow-md'
                    : 'bg-[#f4f4eb] hover:bg-white brutal-shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center text-xl font-black brutal-shadow-sm shrink-0">
                        {game.icon}
                      </div>
                      <div>
                        <h3 className="font-brutal text-sm sm:text-base font-black uppercase tracking-tight leading-tight">
                          {game.title}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-neutral-600 block">
                          {game.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 border border-black shrink-0 ${
                        game.badgeColor || 'bg-black text-white'
                      }`}
                    >
                      {game.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs font-mono text-neutral-800 leading-relaxed">
                    {game.description}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {game.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-white text-black border border-black"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="pt-3 mt-2 border-t-2 border-black flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-black text-neutral-600">
                    {game.players}
                  </span>

                  {isActive ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-[#22c55e] border-2 border-black font-brutal text-xs font-black uppercase text-black brutal-shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>CURRENTLY PLAYING</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectGame(game.id);
                        onClose();
                      }}
                      className="brutal-press flex items-center gap-1.5 px-3 py-1.5 bg-[#facc15] hover:bg-yellow-400 text-black border-2 border-black font-brutal text-xs font-black uppercase cursor-pointer brutal-shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>PLAY GAME ▶</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="bg-[#fefce8] border-2 border-black p-2.5 flex items-center justify-between text-xs font-mono font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#15803d] shrink-0" />
            <span>5 HIGH-VOLTAGE BATTLEFIELDS WITH ZERO BLUE DESIGN</span>
          </div>
          <span className="hidden sm:inline bg-black text-[#facc15] px-1.5 py-0.5 text-[10px]">
            ARCADE HUB v2.0
          </span>
        </div>
      </div>
    </div>
  );
};
