import React from 'react';
import { Clock, User, Bot, Wifi } from 'lucide-react';
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
      className={`relative w-full border-3 border-black p-2 transition-all duration-100 select-none ${
        isCurrentTurn
          ? 'bg-[#22c55e] text-black brutal-shadow-md'
          : 'bg-white text-black brutal-shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Player Identity & Badges */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar Stamp */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 border-2 border-black flex items-center justify-center font-black shrink-0 ${
              isWhite ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            {player.type === 'bot' ? (
              <Bot className="w-4 h-4 text-[#22c55e]" />
            ) : player.type === 'remote' ? (
              <Wifi className="w-4 h-4 text-[#22c55e]" />
            ) : (
              <User className={`w-4 h-4 ${isWhite ? 'text-black' : 'text-white'}`} />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-brutal text-xs sm:text-sm font-black truncate uppercase tracking-tight">
                {player.name}
              </span>
              {player.rating && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 bg-black text-[#22c55e] border border-black">
                  {player.type === 'bot' ? 'BOT' : 'ELO'} {player.rating}
                </span>
              )}
              {isThinking && (
                <span className="text-[9px] font-mono font-black uppercase px-1.5 bg-[#facc15] text-black border border-black animate-pulse">
                  CALCULATING...
                </span>
              )}
            </div>

            {/* Captured Pieces & Material Badge */}
            <div className="flex items-center gap-1 h-4 overflow-hidden mt-0.5">
              {capturedPieces.slice(0, 10).map((p, idx) => (
                <div key={idx} className="w-3 h-3 shrink-0">
                  <PieceIcon piece={p} />
                </div>
              ))}
              {capturedPieces.length > 10 && (
                <span className="text-[9px] font-mono font-black">+{capturedPieces.length - 10}</span>
              )}
              {materialAdvantage > 0 && (
                <span className="text-[9px] font-mono font-black px-1 bg-black text-white ml-0.5">
                  +{materialAdvantage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Brutalist Digital Clock */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 border-2 border-black font-mono text-xs sm:text-sm font-black transition-colors shrink-0 ${
            isLowTime
              ? 'bg-[#ef4444] text-white animate-pulse'
              : isCurrentTurn
              ? 'bg-black text-[#22c55e]'
              : 'bg-black text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </div>
    </div>
  );
};
