import React, { useState } from 'react';
import { Gamepad2, X, Sparkles, Swords, Trophy, Play, Check, Flame, Clock } from 'lucide-react';

export const GameCatalogueModal = ({
  isOpen,
  onClose,
  activeGame,
  onSelectGame
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'playable' | 'upcoming'

  if (!isOpen) return null;

  const games = [
    {
      id: 'chess',
      title: 'RandChess 2.0',
      shortTitle: 'CHESS',
      category: 'STRATEGY // BOARD',
      icon: '♞',
      badge: 'POPULAR',
      badgeColor: 'bg-[#22c55e]',
      playable: true,
      players: '1 - 2 Players',
      description: 'Tactical 64-square battlefield with Stockfish-calibrated Minimax AI (800-2100 ELO), live multiplayer PvP, GM coach explainer, and customizable timers.',
      tags: ['vs Bot AI', '1v1 Local', 'Online PvP', 'Custom Timers', 'GM Coach']
    },
    {
      id: 'tictactoe',
      title: 'Brutal Tic-Tac-Toe',
      shortTitle: 'TIC TAC TOE',
      category: 'QUICK PLAY // TACTICAL',
      icon: '✕ ◯',
      badge: 'POPULAR',
      badgeColor: 'bg-[#facc15]',
      playable: true,
      players: '1 - 2 Players',
      description: 'Classic high-voltage 3-in-a-row with an Unbeatable Minimax AI bot, 1v1 local pass & play, win streak tracking, celebration confetti, and match clocks.',
      tags: ['Unbeatable Minimax', '1v1 Pass & Play', 'Streak Tracker', 'Custom Clock', 'Victory FX']
    },
    {
      id: 'ludo',
      title: 'Neo-Brutal Ludo',
      shortTitle: 'LUDO',
      category: 'CLASSIC // MULTIPLAYER',
      icon: '🎲',
      badge: 'NEW • 2-4 PLAYERS',
      badgeColor: 'bg-[#f97316] text-white',
      playable: true,
      players: '2 - 4 Players',
      description: 'The ancient 4-corner board game reimagined in high-contrast brutalism. Live online multiplayer rooms, smart bots, 2 to 4 player pass & play, tactile 3D dice, token captures, and safe zones.',
      tags: ['2-4 Players', 'Online PvP', 'Smart Bots', 'Tactile Dice', 'Safe Zones', 'Zero Blue']
    },
    {
      id: 'connect4',
      title: 'Gravity Connect 4',
      shortTitle: 'CONNECT 4',
      category: 'TACTICAL // GRID',
      icon: '🔴 🟡',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: '1 - 2 Players',
      description: 'Vertical drop strategy. Connect 4 checkers horizontally, vertically, or diagonally while blocking opponent traps.',
      tags: ['Gravity Grid', '4 In A Row', 'Drop Physics']
    },
    {
      id: 'checkers',
      title: 'Brutal Checkers',
      shortTitle: 'CHECKERS',
      category: 'CLASSIC // BOARD',
      icon: '⚪ ⚫',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: '1 - 2 Players',
      description: 'Diagonal jumping warfare with mandatory multi-jump captures, crown kinging, and clean brutalist pieces.',
      tags: ['Diagonal Jumps', 'Kinging', 'Classic Draughts']
    },
    {
      id: 'minesweeper',
      title: 'Minesweeper Tactical',
      shortTitle: 'MINESWEEPER',
      category: 'LOGIC // PUZZLE',
      icon: '🚩 💣',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: 'Singleplayer',
      description: 'High-stakes mine clearance grid with zero-guess logic deduction, speedrun clocks, and tactile cell flagging.',
      tags: ['Logic Grid', 'Speedrun Clock', 'Zero Guess']
    },
    {
      id: 'battleship',
      title: 'Naval Battleship',
      shortTitle: 'BATTLESHIP',
      category: 'WARFARE // COORDINATES',
      icon: '🚢 💥',
      badge: 'COMING SOON',
      badgeColor: 'bg-black text-white',
      playable: false,
      players: '1 - 2 Players',
      description: 'Coordinate grid artillery. Position your fleet, call tactical radar strikes, and sink the opponent armada.',
      tags: ['Grid Radar', 'Coordinate Strikes', 'Fleet Combat']
    }
  ];

  const filteredGames = games.filter((g) => {
    if (filter === 'playable') return g.playable;
    if (filter === 'upcoming') return !g.playable;
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
                  {games.filter((g) => g.playable).length} PLAYABLE NOW
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-600">
                Switch games instantly or browse upcoming tactical arcade titles
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
              onClick={() => setFilter('playable')}
              className={`brutal-press px-3 py-1 border-2 border-black cursor-pointer transition-colors ${
                filter === 'playable'
                  ? 'bg-[#22c55e] text-black brutal-shadow-sm'
                  : 'bg-[#f4f4eb] text-black hover:bg-neutral-200'
              }`}
            >
              PLAYABLE NOW ({games.filter((g) => g.playable).length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`brutal-press px-3 py-1 border-2 border-black cursor-pointer transition-colors ${
                filter === 'upcoming'
                  ? 'bg-[#facc15] text-black brutal-shadow-sm'
                  : 'bg-[#f4f4eb] text-black hover:bg-neutral-200'
              }`}
            >
              COMING SOON ({games.filter((g) => !g.playable).length})
            </button>
          </div>

          <span className="font-mono text-[10px] font-bold text-neutral-500">
            ACTIVE: <span className="bg-black text-[#22c55e] px-1.5 py-0.5">{activeGame.toUpperCase()}</span>
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
                    : game.playable
                    ? 'bg-[#f4f4eb] hover:bg-white brutal-shadow-sm'
                    : 'bg-neutral-100 opacity-80 border-dashed'
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

                  {game.playable ? (
                    isActive ? (
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
                    )
                  ) : (
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-1 bg-neutral-300 text-neutral-700 border border-neutral-400">
                      IN DEVELOPMENT
                    </span>
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
            <span>MORE QUICK STRATEGY GAMES ARE BEING ADDED TO THIS CATALOGUE</span>
          </div>
          <span className="hidden sm:inline bg-black text-[#facc15] px-1.5 py-0.5 text-[10px]">
            ARCADE HUB v2.0
          </span>
        </div>
      </div>
    </div>
  );
};

