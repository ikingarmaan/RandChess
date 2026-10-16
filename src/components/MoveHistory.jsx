import React, { useRef, useEffect, useState } from 'react';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Copy, Check, Download, BookOpen, Terminal } from 'lucide-react';

export const MoveHistory = ({
  history = [], // array of { san, from, to, piece, color, fen }
  currentMoveIndex = null,
  isLive = true,
  onJumpToMove,
  onGoFirst,
  onGoPrev,
  onGoNext,
  onGoLast,
  fen,
  pgn,
  onLoadFen
}) => {
  const containerRef = useRef(null);
  const [copiedFen, setCopiedFen] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [showFenInput, setShowFenInput] = useState(false);
  const [customFenInput, setCustomFenInput] = useState('');

  // Auto scroll to latest move when at live
  useEffect(() => {
    if (containerRef.current && isLive) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length, isLive]);

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
      setCopiedFen(true);
      setTimeout(() => setCopiedFen(false), 2000);
    }
  };

  const handleCopyPGN = () => {
    if (pgn) {
      navigator.clipboard.writeText(pgn);
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    }
  };

  const handleDownloadPGN = () => {
    if (!pgn) return;
    const blob = new Blob([pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brutal-chess-match-${Date.now()}.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyCustomFen = (e) => {
    e.preventDefault();
    if (!customFenInput.trim()) return;
    if (onLoadFen) {
      onLoadFen(customFenInput.trim());
    }
    setCustomFenInput('');
    setShowFenInput(false);
  };

  const isAtStart = currentMoveIndex === -1;
  const isAtEnd = isLive || currentMoveIndex >= history.length - 1;

  return (
    <div className="w-full bg-[#f4f4eb] border-3 border-black flex flex-col h-56 sm:h-64 brutal-shadow select-none overflow-hidden text-black">
      {/* Brutalist Scoresheet Header */}
      <div className="bg-black text-white px-3 py-2 flex items-center justify-between border-b-3 border-black shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#22c55e]" />
          <span className="font-brutal text-xs font-black uppercase tracking-wider text-white">
            Move History
          </span>
          <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-[#22c55e] text-black border border-black">
            {history.length} {history.length === 1 ? 'MOVE' : 'MOVES'}
          </span>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFenInput(!showFenInput)}
            className="flex items-center gap-1 text-[11px] font-mono font-black uppercase px-2 py-0.5 bg-[#facc15] text-black hover:bg-yellow-400 border-2 border-black transition-colors cursor-pointer"
            title="Load custom FEN position"
          >
            <Terminal className="w-3 h-3" />
            <span className="hidden sm:inline">FEN</span>
          </button>
          <button
            onClick={handleCopyFEN}
            className="flex items-center gap-1 text-[11px] font-mono font-black uppercase px-2 py-0.5 bg-[#22c55e] text-black hover:bg-green-400 border-2 border-black transition-colors cursor-pointer"
            title="Copy current board FEN"
          >
            {copiedFen ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copiedFen ? 'COPIED' : 'COPY'}</span>
          </button>
          <button
            onClick={handleDownloadPGN}
            className="flex items-center gap-1 text-[11px] font-mono font-black uppercase px-2 py-0.5 bg-white text-black hover:bg-neutral-100 border-2 border-black transition-colors cursor-pointer"
            title="Download PGN match record"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">PGN</span>
          </button>
        </div>
      </div>

      {/* Optional Custom FEN Input Bar */}
      {showFenInput && (
        <form onSubmit={handleApplyCustomFen} className="p-2 bg-[#facc15] border-b-3 border-black flex gap-1.5 items-center shrink-0">
          <input
            type="text"
            value={customFenInput}
            onChange={(e) => setCustomFenInput(e.target.value)}
            placeholder="Paste FEN (e.g. 8/8/8/8/4k3/8/4K3/8 w - - 0 1)"
            className="flex-1 px-2.5 py-1 text-xs font-mono bg-white text-black border-2 border-black outline-none font-bold"
          />
          <button
            type="submit"
            className="px-3 py-1 text-xs font-mono font-black uppercase bg-black text-white hover:bg-neutral-800 border-2 border-black cursor-pointer"
          >
            LOAD
          </button>
        </form>
      )}

      {/* Move List Body */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 font-mono text-xs bg-white text-black">
        {movePairs.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center p-3 text-center my-auto">
            <div className="bg-[#facc15] border-3 border-black px-4 py-2 font-mono text-xs font-black text-black uppercase mb-1 brutal-shadow-sm">
              [ NO MOVES RECORDED YET ]
            </div>
            <span className="text-xs font-mono font-bold text-black mt-1">
              Make a move on the board to start match recording
            </span>
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.moveNum}
              className="grid grid-cols-12 gap-1.5 p-1 items-center bg-[#fefce8] border-2 border-black brutal-shadow-sm"
            >
              {/* High-contrast Move Number Badge */}
              <div className="col-span-3 flex items-center">
                <span className="bg-black text-[#facc15] font-mono font-black text-xs px-2 py-0.5 border border-black min-w-[32px] text-center">
                  {pair.moveNum}.
                </span>
              </div>

              {/* White Move Button */}
              <button
                onClick={() => onJumpToMove && onJumpToMove(pair.wIdx)}
                className={`col-span-4 text-center font-mono text-xs font-black px-2 py-1 border-2 border-black transition-all cursor-pointer ${
                  currentMoveIndex === pair.wIdx
                    ? 'bg-[#22c55e] text-black font-black brutal-shadow-sm ring-2 ring-black'
                    : 'bg-white text-black font-black hover:bg-neutral-100'
                }`}
                title={`Jump to move ${pair.moveNum}. ${pair.white?.san}`}
              >
                {pair.white?.san}
              </button>

              {/* Black Move Button */}
              {pair.black ? (
                <button
                  onClick={() => onJumpToMove && onJumpToMove(pair.bIdx)}
                  className={`col-span-5 text-center font-mono text-xs font-black px-2 py-1 border-2 border-black transition-all cursor-pointer ${
                    currentMoveIndex === pair.bIdx
                      ? 'bg-[#22c55e] text-black font-black brutal-shadow-sm ring-2 ring-black'
                      : 'bg-black text-white font-black hover:bg-neutral-800'
                  }`}
                  title={`Jump to move ${pair.moveNum}... ${pair.black.san}`}
                >
                  {pair.black.san}
                </button>
              ) : (
                <div className="col-span-5" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Neo-Brutalist Step Navigation Dock */}
      <div className="bg-[#facc15] border-t-3 border-black p-2 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onGoFirst}
            disabled={history.length === 0 || isAtStart}
            className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-white font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
            title="Jump to initial board position (Move 0)"
          >
            <ChevronFirst className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Start</span>
          </button>
          <button
            onClick={onGoPrev}
            disabled={history.length === 0 || isAtStart}
            className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-neutral-100 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-black font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
            title="Step Back one move"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3] text-black" />
            <span>Back</span>
          </button>
        </div>

        {/* Current Move Indicator */}
        <div className="px-3 py-1 border-2 border-black font-mono text-xs font-black bg-black text-[#22c55e]">
          {history.length === 0 ? 'MOVE 0' : isLive ? `LIVE (${history.length})` : `${currentMoveIndex === -1 ? '0' : currentMoveIndex + 1}/${history.length}`}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onGoNext}
            disabled={history.length === 0 || isAtEnd}
            className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-neutral-100 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-black font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
            title="Step Forward one move"
          >
            <span>Fwd</span>
            <ChevronRight className="w-4 h-4 stroke-[3] text-black" />
          </button>
          <button
            onClick={onGoLast}
            disabled={history.length === 0 || isAtEnd}
            className="brutal-press flex items-center gap-1 px-3 py-1.5 bg-[#22c55e] hover:bg-green-400 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-400 disabled:shadow-none disabled:cursor-not-allowed border-2 border-black text-black font-brutal text-xs font-black uppercase brutal-shadow-sm cursor-pointer"
            title="Jump to latest live move"
          >
            <span className="hidden sm:inline">Live</span>
            <ChevronLast className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
