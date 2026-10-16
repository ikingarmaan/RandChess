import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Compass, X } from 'lucide-react';
import { sound } from '../utils/sound';

export const GameOverModal = ({
  result, // { type: 'checkmate' | 'stalemate' | 'draw' | 'timeout' | 'resignation', winner: 'w' | 'b' | null, reason: string }
  onNewGame,
  onClose,
  playerColor = 'w'
}) => {
  useEffect(() => {
    sound.playGameOver();

    // If player won or checkmate occurred, launch celebration confetti (Emerald, Gold, Ruby)
    if (result.type === 'checkmate' || (result.winner && result.winner === playerColor)) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#ffffff', '#ef4444', '#f59e0b']
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#10b981', '#ffffff', '#ef4444']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#10b981', '#ffffff', '#ef4444']
        });
      }, 250);
    }
  }, [result]);

  const winnerName = result.winner === 'w' ? 'White' : result.winner === 'b' ? 'Black' : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-w-md w-full text-center space-y-5 relative ring-1 ring-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Plaque */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-amber-500/15 to-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h2 className="font-serif-master text-2xl font-black text-white tracking-wide">
            {winnerName ? `${winnerName} Victorious!` : 'Honorable Draw'}
          </h2>
          <p className="font-serif-master text-xs uppercase tracking-widest text-emerald-400 mt-1 font-bold">
            {result.reason || result.type}
          </p>
          <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto leading-relaxed">
            {result.type === 'checkmate'
              ? 'A decisive checkmate has delivered victory to the master strategist!'
              : result.type === 'timeout'
              ? 'The sands of time have run out on the chronometer.'
              : 'Neither competitor could force a breakthrough. A masterfully balanced contest.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onNewGame}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-serif-master font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Rematch
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 hover:text-white font-serif-master font-semibold text-xs uppercase tracking-wider border border-neutral-700 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            Examine Board
          </button>
        </div>
      </div>
    </div>
  );
};
