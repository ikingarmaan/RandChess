import React from 'react';

/**
 * Neo-Brutalist Chess Evaluation Bar.
 * High-contrast tactile advantage gauge with thick black borders.
 */
export const EvalBar = ({ evalScore = 0, isFlipped = false }) => {
  // Clamp centipawns between -1000 and +1000
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
    <div className="relative w-6 sm:w-7.5 self-stretch border-3 border-black bg-black flex flex-col brutal-shadow select-none overflow-hidden">
      {/* Top Half (Black by default / White if flipped) */}
      <div
        className={`w-full flex items-start justify-center pt-1.5 ${
          isFlipped ? 'bg-white text-black font-black' : 'bg-[#18181b] text-white font-bold'
        }`}
        style={{
          height: `${topPct}%`,
          transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {!isFlipped && evalScore < -40 && (
          <span className="text-[10px] sm:text-xs font-mono font-black px-0.5 bg-black text-white border border-white/40">
            {displayScore}
          </span>
        )}
        {isFlipped && evalScore > 40 && (
          <span className="text-[10px] sm:text-xs font-mono font-black px-0.5 bg-white text-black border border-black">
            {displayScore}
          </span>
        )}
      </div>

      {/* Center Dividing Notch */}
      <div className="w-full h-1 bg-[#facc15] border-y border-black shrink-0" />

      {/* Bottom Half (White by default / Black if flipped) */}
      <div
        className={`w-full flex items-end justify-center pb-1.5 ${
          isFlipped ? 'bg-[#18181b] text-white font-bold' : 'bg-white text-black font-black'
        }`}
        style={{
          height: `${100 - topPct}%`,
          transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {!isFlipped && evalScore >= -40 && (
          <span className="text-[10px] sm:text-xs font-mono font-black px-0.5 bg-white text-black border border-black">
            {displayScore}
          </span>
        )}
        {isFlipped && evalScore <= 40 && (
          <span className="text-[10px] sm:text-xs font-mono font-black px-0.5 bg-black text-white border border-white/40">
            {displayScore}
          </span>
        )}
      </div>
    </div>
  );
};
