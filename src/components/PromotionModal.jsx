import React, { useEffect } from 'react';
import { PieceIcon } from '../utils/pieceSvgs';
import { Crown, Sparkles, X } from 'lucide-react';

export const PromotionModal = ({ color = 'w', onSelectPiece, onCancel }) => {
  const pieces = [
    {
      type: 'q',
      name: 'Queen',
      key: 'Q',
      pts: '9 pts',
      desc: 'Most Powerful Piece',
      badgeBg: 'bg-[#22c55e] text-black'
    },
    {
      type: 'r',
      name: 'Rook',
      key: 'R',
      pts: '5 pts',
      desc: 'Linear Artillery',
      badgeBg: 'bg-[#facc15] text-black'
    },
    {
      type: 'b',
      name: 'Bishop',
      key: 'B',
      pts: '3 pts',
      desc: 'Diagonal Dominance',
      badgeBg: 'bg-white text-black'
    },
    {
      type: 'n',
      name: 'Knight',
      key: 'N',
      pts: '3 pts',
      desc: 'Tactical Fork Jumper',
      badgeBg: 'bg-white text-black'
    }
  ];

  // Hotkey listener: Q, R, B, N or Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'q') {
        e.preventDefault();
        onSelectPiece('q');
      } else if (key === 'r') {
        e.preventDefault();
        onSelectPiece('r');
      } else if (key === 'b') {
        e.preventDefault();
        onSelectPiece('b');
      } else if (key === 'n') {
        e.preventDefault();
        onSelectPiece('n');
      } else if (key === 'escape' && onCancel) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectPiece, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 modal-backdrop-anim select-none"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white text-black border-4 border-black p-5 sm:p-7 brutal-shadow-xl max-w-md w-full text-center space-y-4 relative modal-content-anim">
        {onCancel && (
          <button
            onClick={onCancel}
            className="brutal-press absolute top-3 right-3 bg-black text-white hover:bg-neutral-800 p-1.5 border-2 border-black cursor-pointer"
            title="Cancel promotion & take back move (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="border-b-3 border-black pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#facc15] border-2 border-black font-mono text-[11px] font-black uppercase mb-1.5 brutal-shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>PAWN REACHED THE OTHER SIDE</span>
          </div>
          <h3 className="font-brutal text-xl sm:text-2xl font-black uppercase tracking-tight">
            WHAT SHOULD THIS PAWN BECOME?
          </h3>
          <p className="text-xs text-neutral-600 font-mono mt-0.5">
            Choose a piece to replace your pawn. Click an option or press <kbd className="px-1 py-0.2 bg-black text-white font-bold text-[10px]">Q</kbd>, <kbd className="px-1 py-0.2 bg-black text-white font-bold text-[10px]">R</kbd>, <kbd className="px-1 py-0.2 bg-black text-white font-bold text-[10px]">B</kbd>, or <kbd className="px-1 py-0.2 bg-black text-white font-bold text-[10px]">N</kbd>.
          </p>
        </div>

        {/* 4 Promotion Choices */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1">
          {pieces.map((p) => {
            const pieceChar = color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
            return (
              <button
                key={p.type}
                onClick={() => onSelectPiece(p.type)}
                className="brutal-press flex flex-col items-center justify-between p-3 bg-[#f4f4eb] hover:bg-[#22c55e] border-3 border-black transition-all cursor-pointer brutal-shadow-sm group text-black"
                title={`Promote to ${p.name} [HotKey: ${p.key}]`}
              >
                <span className={`font-mono text-[9px] font-black uppercase px-1.5 py-0.5 border border-black mb-1.5 ${p.badgeBg}`}>
                  {p.pts}
                </span>

                <div className="w-14 h-14 my-1 drop-shadow-sm group-hover:scale-110 transition-transform">
                  <PieceIcon piece={pieceChar} />
                </div>

                <div className="mt-1">
                  <span className="font-brutal text-sm font-black uppercase block leading-tight">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-neutral-700 font-mono font-black block mt-0.5">
                    [{p.key}]
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {onCancel && (
          <div className="pt-2 border-t-2 border-black/30 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">
              Change mind?
            </span>
            <button
              onClick={onCancel}
              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border border-black font-black uppercase cursor-pointer"
            >
              CANCEL MOVE (ESC)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
