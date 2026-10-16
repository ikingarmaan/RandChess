import React, { useRef, useEffect } from 'react';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Copy, Check, BookOpen } from 'lucide-react';

export const MoveHistory = ({
  history = [], // array of { san, from, to, piece, color }
  currentMoveIndex = -1,
  onJumpToMove,
  fen,
  pgn
}) => {
  const containerRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  // Auto scroll to latest move
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length]);

  // Group into pairs: [ { moveNum: 1, white: 'e4', black: 'e5', wIdx: 0, bIdx: 1 }, ... ]
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNum: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] || null,
      wIdx: i,
      bIdx: i + 1
    });
  }

  const handleCopyFEN = () => {
    if (fen) {
      navigator.clipboard.writeText(fen);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAtStart = currentMoveIndex === -1;
  const isAtEnd = history.length === 0 || currentMoveIndex === history.length - 1;

  return (
    <div className="w-full bg-[#16161b] border-2 border-neutral-700 rounded-xl p-2.5 sm:p-3 flex flex-col h-48 sm:h-56 shadow-xl">
      {/* Header styled as FIDE Scoresheet with move count */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-1.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          <h3 className="font-serif-master text-xs font-black text-white uppercase tracking-wider">
            Move Scoresheet
          </h3>
          <span className="text-[10px] font-mono font-black px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400">
            {history.length} {history.length === 1 ? 'move' : 'moves'}
          </span>
        </div>
        <button
          onClick={handleCopyFEN}
          className="flex items-center gap-1 text-[11px] font-mono font-bold text-white hover:text-emerald-300 transition-all cursor-pointer px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 shadow-sm"
          title="Copy current board FEN"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-300" />}
          <span>{copied ? 'Copied' : 'Copy FEN'}</span>
        </button>
      </div>

      {/* Move list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-0.5 pr-1 font-mono text-xs">
        {movePairs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-300 text-xs font-sans gap-1 p-2 text-center">
            <span className="font-bold text-white">No moves recorded yet</span>
            <span className="text-[11px] text-neutral-400">Moves played will appear here</span>
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.moveNum}
              className="grid grid-cols-12 gap-1 px-2 py-0.5 rounded hover:bg-neutral-800/70 transition-colors items-center"
            >
              <span className="col-span-3 text-emerald-400 font-bold font-mono text-xs">
                {pair.moveNum}.
              </span>
              <button
                onClick={() => onJumpToMove && onJumpToMove(pair.wIdx)}
                className={`col-span-4 text-left font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                  currentMoveIndex === pair.wIdx
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.45)] border border-emerald-300'
                    : 'text-white hover:text-emerald-300 hover:bg-neutral-800'
                }`}
              >
                {pair.white?.san}
              </button>
              {pair.black && (
                <button
                  onClick={() => onJumpToMove && onJumpToMove(pair.bIdx)}
                  className={`col-span-5 text-left font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                    currentMoveIndex === pair.bIdx
                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.45)] border border-emerald-300'
                      : 'text-neutral-200 hover:text-emerald-300 hover:bg-neutral-800'
                  }`}
                >
                  {pair.black.san}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Step Navigation Controls with Clear Labels & High Contrast */}
      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-neutral-800 mt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onJumpToMove && onJumpToMove(-1)}
            disabled={history.length === 0 || isAtStart}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-neutral-600 font-serif-master text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            title="Jump to initial board position"
          >
            <ChevronFirst className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Start</span>
          </button>
          <button
            onClick={() => onJumpToMove && onJumpToMove(Math.max(-1, (currentMoveIndex === -1 ? -1 : currentMoveIndex) - 1))}
            disabled={history.length === 0 || isAtStart}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-emerald-400 font-serif-master text-[11px] font-black transition-all cursor-pointer shadow-sm"
            title="Step Back one move"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
            <span>Back</span>
          </button>
        </div>

        <span className="text-[11px] font-mono font-bold text-white px-2 py-0.5 bg-black border-2 border-neutral-600 rounded">
          {currentMoveIndex === -1 ? 'Move 0' : `${currentMoveIndex + 1}/${history.length}`}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onJumpToMove && onJumpToMove(Math.min(history.length - 1, currentMoveIndex + 1))}
            disabled={history.length === 0 || isAtEnd}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-emerald-400 font-serif-master text-[11px] font-black transition-all cursor-pointer shadow-sm"
            title="Step Forward one move"
          >
            <span>Fwd</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
          </button>
          <button
            onClick={() => onJumpToMove && onJumpToMove(history.length - 1)}
            disabled={history.length === 0 || isAtEnd}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:cursor-not-allowed border-2 border-neutral-600 font-serif-master text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            title="Jump to latest live move"
          >
            <span className="hidden sm:inline">Live</span>
            <ChevronLast className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
