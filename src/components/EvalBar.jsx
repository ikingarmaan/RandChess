import React from 'react';

/**
 * Vertical Chess Evaluation Bar
 * Displays live centipawn advantage with classical precision.
 * White, Emerald Green, and Obsidian/Alabaster styling (ZERO BLUE).
 */
export const EvalBar = ({ evalScore = 0, isFlipped = false }) => {
  // Clamp centipawns between -1000 and +1000 for visual bar calculation
  const clamped = Math.max(-1000, Math.min(1000, evalScore));
  const whitePct = 50 + (clamped / 1000) * 45;

  let displayScore = '0.0';
  if (Math.abs(evalScore) > 90000) {
    displayScore = evalScore > 0 ? '+M' : '-M';
  } else {
    const val = (Math.abs(evalScore) / 100).toFixed(1);
    displayScore = evalScore > 0 ? `+${val}` : evalScore < 0 ? `-${val}` : '0.0';
  }

  const topPct = isFlipped ? whitePct : 100 - whitePct;

  return (
    <div className="relative w-6 sm:w-7.5 self-stretch rounded-xl overflow-hidden flex flex-col border border-neutral-800 shadow-2xl bg-neutral-950 select-none ring-1 ring-white/10">
      {/* Top Section (Black default / White if flipped) */}
      <div
        className={`w-full transition-all duration-300 ease-out flex items-start justify-center pt-2 ${
          isFlipped ? 'bg-[#f4f4f5] text-neutral-900 font-black' : 'bg-[#18181b] text-neutral-200 font-bold'
        }`}
        style={{ height: `${topPct}%` }}
      >
        {!isFlipped && evalScore < -40 && (
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-tight px-0.5">
            {displayScore}
          </span>
        )}
        {isFlipped && evalScore > 40 && (
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-tight px-0.5">
            {displayScore}
          </span>
        )}
      </div>

      {/* Bottom Section (White default / Black if flipped) */}
      <div
        className={`w-full transition-all duration-300 ease-out flex items-end justify-center pb-2 ${
          isFlipped ? 'bg-[#18181b] text-neutral-200 font-bold' : 'bg-[#f4f4f5] text-neutral-900 font-black'
        }`}
        style={{ height: `${100 - topPct}%` }}
      >
        {!isFlipped && evalScore >= -40 && (
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-tight px-0.5">
            {displayScore}
          </span>
        )}
        {isFlipped && evalScore <= 40 && (
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-tight px-0.5">
            {displayScore}
          </span>
        )}
      </div>

      {/* Emerald Precision 0.0 Center Needle */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-emerald-500 -translate-y-1/2 pointer-events-none shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
    </div>
  );
};
