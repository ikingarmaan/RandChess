import React from 'react';
import { Clock, User, Bot, Wifi, Award } from 'lucide-react';
import { PieceIcon } from '../utils/pieceSvgs';

export const PlayerCard = ({
  player, // { name, type: 'human' | 'bot' | 'remote', color: 'w' | 'b', rating: 1500 }
  timeRemaining = null, // seconds or null for unlimited
  isCurrentTurn = false,
  isThinking = false,
  capturedPieces = [], // array of piece chars e.g. ['p', 'p', 'b']
  materialAdvantage = 0 // e.g. +3
}) => {
  const isWhite = player.color === 'w';

  // Format time MM:SS
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLowTime = timeRemaining !== null && timeRemaining <= 30 && timeRemaining > 0;

  return (
    <div
      className={`relative w-full rounded-xl py-1.5 px-3 transition-all duration-200 border-2 select-none ${
        isCurrentTurn
          ? 'bg-[#181822] border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
          : 'bg-[#14141a] border-neutral-600 shadow-sm'
      }`}
    >
      {/* Turn indicator glow line */}
      {isCurrentTurn && (
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      )}

      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Player Identity, ELO & Captured Pieces */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar Medal */}
          <div
            className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold shrink-0 transition-all ${
              isWhite
                ? 'bg-white text-neutral-900 border-2 border-white shadow-sm'
                : 'bg-neutral-900 text-white border-2 border-neutral-500 shadow-sm'
            }`}
          >
            {player.type === 'bot' ? (
              <Bot className="w-4 h-4 text-emerald-400" />
            ) : player.type === 'remote' ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <User className="w-4 h-4 text-neutral-800" />
            )}

            {isCurrentTurn && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#181822] shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif-master text-xs sm:text-sm font-black text-white truncate">
              {player.name}
            </span>

            {player.rating && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-emerald-300 border border-neutral-600 shrink-0">
                {player.type === 'bot' ? 'AI' : 'ELO'} {player.rating}
              </span>
            )}

            {isThinking && isCurrentTurn && (
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/25 border border-emerald-400 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Thinking...
              </span>
            )}

            {/* Captured Pieces Mini Velvet Tray */}
            {capturedPieces.length > 0 && (
              <div className="hidden sm:flex items-center -space-x-1 px-1.5 py-0.5 rounded bg-black/60 border border-neutral-700 shrink-0">
                {capturedPieces.map((p, idx) => (
                  <div key={idx} className="w-4 h-4 drop-shadow">
                    <PieceIcon piece={p} />
                  </div>
                ))}
              </div>
            )}

            {materialAdvantage > 0 && (
              <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-500/25 border border-emerald-400 px-1.5 py-0.2 rounded shrink-0">
                +{materialAdvantage}
              </span>
            )}
          </div>
        </div>

        {/* Right: Digital Timer */}
        {timeRemaining !== null && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-black text-xs sm:text-sm border-2 shrink-0 transition-all ${
              isLowTime
                ? 'bg-red-950 text-red-300 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                : isCurrentTurn
                ? 'bg-black text-emerald-400 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-black text-white border-neutral-600'
            }`}
          >
            <Clock
              className={`w-3.5 h-3.5 ${
                isLowTime ? 'text-red-400 animate-spin' : isCurrentTurn ? 'text-emerald-400' : 'text-neutral-400'
              }`}
            />
            <span className="tracking-wider">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
