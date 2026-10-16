import React, { memo } from 'react';

/**
 * Neo-Brutalist Architectural Grid Background.
 * Zero-overhead, 100% vector CSS/SVG pattern.
 * Colors: White, Vivid Green, Crimson Red, Jet Black. Zero blue.
 */
export const FloatingPiecesBackground = memo(({ isDark = false }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300 ${
        isDark ? 'bg-[#0f0f12]' : 'bg-[#f4f4ec]'
      }`}
    >
      {/* Blueprint Dot Grid */}
      <div
        className={`absolute inset-0 opacity-40 ${
          isDark ? 'bg-brutal-dots-dark' : 'bg-brutal-dots'
        }`}
      />

      {/* Subtle Brutalist Architectural Lines */}
      <div className="absolute inset-0 opacity-15">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="brutal-grid" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M 120 0 L 0 0 0 120"
                fill="none"
                stroke={isDark ? "#ffffff" : "#000000"}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle cx="0" cy="0" r="2" fill={isDark ? "#22c55e" : "#000000"} />
              <path
                d="M -6 0 L 6 0 M 0 -6 L 0 6"
                stroke={isDark ? "#22c55e" : "#ef4444"}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#brutal-grid)" />
        </svg>
      </div>

      {/* Brutalist Watermark Stamp Badges */}
      <div className="absolute top-16 left-6 hidden lg:flex flex-col gap-1 font-mono text-[10px] font-black uppercase tracking-widest text-black/20 dark:text-white/20 select-none">
        <span>[SYS.CHESS_ENGINE // v2.0]</span>
        <span>[BOARD: 64 SQUARES // STRICT ZERO BLUE]</span>
        <span>[PALETTE: WHITE #FFFFFF // GREEN #22C55E // RED #EF4444]</span>
      </div>

      <div className="absolute bottom-6 right-6 hidden lg:flex flex-col items-end gap-1 font-mono text-[10px] font-black uppercase tracking-widest text-black/20 dark:text-white/20 select-none">
        <span>[ATELIER NEO-BRUTALISM]</span>
        <span>[FPS: 60 // LOW-LATENCY MINIMAX]</span>
      </div>
    </div>
  );
});
