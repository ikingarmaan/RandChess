import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, X, Eye } from 'lucide-react';
import { sound } from '../utils/sound';

export const GameOverModal = ({
  result, // { type: 'checkmate' | 'stalemate' | 'draw' | 'timeout' | 'resignation', winner: 'w' | 'b' | null, reason: string }
  onNewGame,
  onClose,
  playerColor = 'w'
}) => {
  useEffect(() => {
    sound.playGameOver();

    // Celebration confetti (Vivid Green, Crimson Red, Stark White, Warning Yellow)
    if (result.type === 'checkmate' || (result.winner && result.winner === playerColor)) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#ffffff', '#ef4444', '#facc15']
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#22c55e', '#ffffff', '#facc15']
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#ef4444', '#ffffff', '#22c55e']
        });
      }, 250);
    }
  }, [result, playerColor]);

  const winnerName = result.winner === 'w' ? 'WHITE' : result.winner === 'b' ? 'BLACK' : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white text-black border-4 border-black p-6 sm:p-8 brutal-shadow-xl max-w-md w-full text-center space-y-5 relative select-none">
        <button
          onClick={onClose}
          className="brutal-press absolute top-4 right-4 bg-black text-white hover:bg-neutral-800 p-1.5 border-2 border-black cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Brutalist Trophy Stamp */}
        <div className="mx-auto w-16 h-16 bg-[#facc15] border-3 border-black flex items-center justify-center brutal-shadow-sm">
          <Trophy className="w-9 h-9 text-black" />
        </div>

        <div>
          <div className="inline-block px-2.5 py-0.5 bg-black text-[#22c55e] font-mono text-xs font-black uppercase tracking-wider mb-2">
            [ MATCH CONCLUDED ]
          </div>
          <h2 className="font-brutal text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {winnerName ? `${winnerName} VICTORIOUS!` : 'MATCH DRAW'}
          </h2>
          <p className="font-mono text-xs font-black uppercase text-black bg-[#f4f4eb] border-2 border-black p-2 mt-2">
            {result.reason || result.type}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onNewGame();
            }}
            className="brutal-press flex-1 flex items-center justify-center gap-2 py-3 bg-[#22c55e] hover:bg-green-400 text-black border-3 border-black font-brutal text-sm font-black uppercase tracking-wider cursor-pointer brutal-shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onClose}
            className="brutal-press flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-neutral-100 text-black border-3 border-black font-brutal text-sm font-black uppercase tracking-wider cursor-pointer brutal-shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>REVIEW BOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
