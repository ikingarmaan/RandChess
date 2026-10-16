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
      className={`relative w-full rounded-2xl p-3 sm:p-4 transition-all duration-300 border-2 ${
        isCurrentTurn
          ? 'bg-[#18181c] border-emerald-500 shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(16,185,129,0.2)]'
          : 'bg-[#141418] border-neutral-700 shadow-md text-neutral-300'
      }`}
    >
      {/* Mechanical Clock Rocker Top Bar */}
      <div className="absolute top-0 left-6 right-6 h-[3px] overflow-hidden rounded-full">
        {isCurrentTurn && (
          <div className="w-full h-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Left: Player Identity, Title & Captured Pieces */}
        <div className="flex items-center gap-3">
          {/* Avatar Medal / Plaque */}
          <div
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold shadow-md transition-all ${
              isWhite
                ? 'bg-white text-neutral-900 border-2 border-white'
                : 'bg-neutral-900 text-white border-2 border-neutral-600'
            }`}
          >
            {player.type === 'bot' ? (
              <Bot className="w-6 h-6 text-emerald-400" />
            ) : player.type === 'remote' ? (
              <Wifi className="w-6 h-6 text-emerald-400" />
            ) : (
              <User className="w-6 h-6 text-neutral-800" />
            )}

            {/* Turn Jewel Indicator */}
            {isCurrentTurn && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#18181c] shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-serif-master text-sm sm:text-base font-black tracking-wide ${
                  isCurrentTurn ? 'text-white' : 'text-neutral-200'
                }`}
              >
                {player.name}
              </span>

              {/* FIDE / ELO Title Badge */}
              {player.rating ? (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-600">
                  {player.type === 'bot' ? 'AI' : 'ELO'} {player.rating}
                </span>
              ) : null}

              {isThinking && isCurrentTurn && (
                <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Thinking...
                </span>
              )}
            </div>

            {/* Recessed Captured Pieces Velvet Tray */}
            <div className="flex items-center gap-2 mt-1 min-h-[22px]">
              <div className="flex items-center -space-x-1 px-2 py-0.5 rounded-lg bg-black/60 border border-neutral-700">
                {capturedPieces.length === 0 ? (
                  <span className="text-[11px] font-mono text-neutral-400 px-1 italic">no captures yet</span>
                ) : (
                  capturedPieces.map((p, idx) => (
                    <div
                      key={idx}
                      className="w-5 h-5 opacity-90 hover:opacity-100 hover:scale-125 transition-all drop-shadow"
                    >
                      <PieceIcon piece={p} />
                    </div>
                  ))
                )}
              </div>

              {materialAdvantage > 0 && (
                <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/25 border-2 border-emerald-400 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.35)]">
                  +{materialAdvantage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Chronometer Clock Display (DGT style) */}
        {timeRemaining !== null && (
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono font-black text-base sm:text-lg border-2 transition-all duration-200 ${
              isLowTime
                ? 'bg-red-950/80 text-red-300 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                : isCurrentTurn
                ? 'bg-[#101012] text-emerald-400 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                : 'bg-[#101012] text-neutral-300 border-neutral-700'
            }`}
          >
            <Clock
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isLowTime ? 'text-red-400 animate-spin' : isCurrentTurn ? 'text-emerald-400' : 'text-neutral-400'
              }`}
            />
            <span className="tracking-widest">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
