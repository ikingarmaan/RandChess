import React from 'react';
import { PieceIcon } from '../utils/pieceSvgs';

export const PromotionModal = ({ color = 'w', onSelectPiece, onCancel }) => {
  const pieces = [
    { type: 'q', name: 'Queen', key: 'Q' },
    { type: 'r', name: 'Rook', key: 'R' },
    { type: 'b', name: 'Bishop', key: 'B' },
    { type: 'n', name: 'Knight', key: 'N' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#121214] border border-neutral-700/80 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-w-sm w-full text-center space-y-4 ring-1 ring-white/10">
        <div>
          <h3 className="font-serif-master text-lg font-bold text-white tracking-wide">
            Pawn Coronation
          </h3>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Select a piece of royal stature for promotion
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2.5 py-2">
          {pieces.map((p) => {
            const pieceChar = color === 'w' ? p.type.toUpperCase() : p.type;
            return (
              <button
                key={p.type}
                onClick={() => onSelectPiece(p.type)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900/90 hover:bg-emerald-500/15 border border-neutral-800 hover:border-emerald-500/50 transition-all hover:scale-105 active:scale-95 group cursor-pointer shadow-md"
              >
                <div className="w-12 h-12 mb-1.5 group-hover:drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                  <PieceIcon piece={pieceChar} />
                </div>
                <span className="font-serif-master text-[11px] font-bold text-neutral-300 group-hover:text-emerald-300">
                  {p.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  [{p.key}]
                </span>
              </button>
            );
          })}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Cancel coronation
          </button>
        )}
      </div>
    </div>
  );
};
