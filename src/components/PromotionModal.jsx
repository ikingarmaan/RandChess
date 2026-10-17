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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 modal-backdrop-anim"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white text-black border-4 border-black p-5 sm:p-6 brutal-shadow-lg max-w-sm w-full text-center space-y-4 select-none modal-content-anim">
        <div className="border-b-3 border-black pb-2">
          <div className="inline-block px-2 py-0.5 bg-[#facc15] border-2 border-black font-mono text-[10px] font-black uppercase mb-1">
            [ RANK 8 REACHED ]
          </div>
          <h3 className="font-brutal text-lg font-black uppercase tracking-tight">
            Pawn Promotion
          </h3>
          <p className="text-xs text-neutral-600 font-mono">
            Select a piece for promotion
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 py-1">
          {pieces.map((p) => {
            const pieceChar = color === 'w' ? p.type.toUpperCase() : p.type;
            return (
              <button
                key={p.type}
                onClick={() => onSelectPiece(p.type)}
                className="brutal-press flex flex-col items-center justify-center p-2.5 bg-[#f4f4eb] hover:bg-[#22c55e] border-2 border-black transition-all cursor-pointer brutal-shadow-sm group"
              >
                <div className="w-10 h-10 mb-1">
                  <PieceIcon piece={pieceChar} />
                </div>
                <span className="font-brutal text-xs font-black uppercase">
                  {p.name}
                </span>
                <span className="text-[10px] text-neutral-600 font-mono font-bold">
                  [{p.key}]
                </span>
              </button>
            );
          })}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="font-mono text-xs text-neutral-600 hover:text-black underline uppercase font-bold cursor-pointer"
          >
            Cancel Move
          </button>
        )}
      </div>
    </div>
  );
};
