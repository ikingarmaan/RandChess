import React, { useState } from 'react';
import { PieceIcon } from '../utils/pieceSvgs';

export const BOARD_THEMES = {
  emerald: {
    name: 'Atelier Emerald & Linen',
    light: 'bg-[#ebe5d8] text-[#2d5a3f]',
    dark: 'bg-[#2e5b40] text-[#ebe5d8]',
    border: 'border-[#1b3827]',
    accent: '#10b981'
  },
  ruby: {
    name: 'Burgundy Salon & Ivory',
    light: 'bg-[#f6efe2] text-[#7a1f2d]',
    dark: 'bg-[#7a1f2d] text-[#f6efe2]',
    border: 'border-[#4a1019]',
    accent: '#ef4444'
  },
  onyx: {
    name: 'Studio Obsidian & Chalk',
    light: 'bg-[#ecebe6] text-[#222227]',
    dark: 'bg-[#222227] text-[#ecebe6]',
    border: 'border-[#141416]',
    accent: '#ffffff'
  },
  wood: {
    name: 'Handcrafted Walnut & Maple',
    light: 'bg-[#eedbb8] text-[#784d2b]',
    dark: 'bg-[#784d2b] text-[#eedbb8]',
    border: 'border-[#4e3019]',
    accent: '#10b981'
  }
};

export const ChessBoard = ({
  chess,
  onMove,
  isFlipped = false,
  boardTheme = 'emerald',
  lastMove = null,
  coachMove = null,
  showCoachArrow = true,
  showLegalDots = true,
  interactive = true,
  kingInCheckSq = null
}) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [draggedSquare, setDraggedSquare] = useState(null);

  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.emerald;

  // Board coordinates setup based on orientation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = isFlipped ? [...files].reverse() : files;
  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

  const getSquareColor = (fileIdx, rankIdx) => {
    return (fileIdx + rankIdx) % 2 === 0 ? theme.light : theme.dark;
  };

  const handleSquareClick = (sq) => {
    if (!interactive) return;

    // If clicking a valid target square after selecting a piece
    const moveCandidate = legalMoves.find((m) => m.to === sq);
    if (moveCandidate) {
      onMove(moveCandidate);
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Otherwise check if clicking own piece
    const piece = chess.get(sq);
    if (piece && piece.color === chess.turn()) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setLegalMoves([]);
      } else {
        setSelectedSquare(sq);
        const moves = chess.moves({ square: sq, verbose: true });
        setLegalMoves(moves);
      }
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, sq) => {
    if (!interactive) return;
    const piece = chess.get(sq);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(sq);
    setSelectedSquare(sq);
    const moves = chess.moves({ square: sq, verbose: true });
    setLegalMoves(moves);
    e.dataTransfer.setData('text/plain', sq);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSq) => {
    e.preventDefault();
    if (!draggedSquare || !interactive) return;

    const moveCandidate = legalMoves.find((m) => m.to === targetSq);
    if (moveCandidate) {
      onMove(moveCandidate);
    }
    setDraggedSquare(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Convert square (e.g. 'e4') to coordinates percentage (0% to 100%)
  const getSquareCenter = (sq) => {
    if (!sq || sq.length < 2) return { x: 0, y: 0 };
    const f = sq[0];
    const r = sq[1];
    const fIdx = displayFiles.indexOf(f);
    const rIdx = displayRanks.indexOf(r);
    if (fIdx === -1 || rIdx === -1) return { x: 0, y: 0 };
    return {
      x: (fIdx + 0.5) * 12.5,
      y: (rIdx + 0.5) * 12.5
    };
  };

  // Grandmaster AI Coach Arrow (Emerald Green & Pure White / Ruby)
  let arrowSvg = null;
  if (showCoachArrow && coachMove && coachMove.from && coachMove.to) {
    const start = getSquareCenter(coachMove.from);
    const end = getSquareCenter(coachMove.to);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy);

    const shortenedEnd = {
      x: start.x + Math.cos(angle) * Math.max(0, length - 3.4),
      y: start.y + Math.sin(angle) * Math.max(0, length - 3.4)
    };

    arrowSvg = (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-30 coach-arrow overflow-visible"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="coachArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <filter id="arrowGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#10b981" floodOpacity="0.8" />
          </filter>
          <marker
            id="coachArrowHead"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4.2"
            markerHeight="4.2"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#ffffff" stroke="#10b981" strokeWidth="0.8" />
          </marker>
        </defs>

        {/* Outer subtle glow */}
        <line
          x1={start.x}
          y1={start.y}
          x2={shortenedEnd.x}
          y2={shortenedEnd.y}
          stroke="#10b981"
          strokeWidth="3.6"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />

        {/* Core vibrant vector shaft */}
        <line
          x1={start.x}
          y1={start.y}
          x2={shortenedEnd.x}
          y2={shortenedEnd.y}
          stroke="url(#coachArrowGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          markerEnd="url(#coachArrowHead)"
          filter="url(#arrowGlow)"
        />

        {/* Origin pulsing focal dot */}
        <circle
          cx={start.x}
          cy={start.y}
          r="2.2"
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth="0.9"
          filter="url(#arrowGlow)"
        />
      </svg>
    );
  }

  return (
    <div className="relative aspect-square w-full max-w-[min(90vw,48vh,420px)] rounded-2xl p-2 sm:p-2.5 bg-gradient-to-b from-[#18181b] via-[#111113] to-[#09090b] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] border-2 border-neutral-700 select-none">
      {/* Metallic Inlay Rim */}
      <div className="relative w-full h-full rounded-xl p-[2px] bg-gradient-to-tr from-neutral-700 via-neutral-600 to-neutral-700 shadow-inner">
        {/* 8x8 Grid Container */}
        <div className="relative w-full h-full rounded-[10px] overflow-hidden shadow-2xl bg-neutral-950">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {displayRanks.map((rank, rIdx) =>
              displayFiles.map((file, fIdx) => {
                const sq = `${file}${rank}`;
                const piece = chess.get(sq);
                const bgClass = getSquareColor(fIdx, rIdx);

                const isSelected = selectedSquare === sq;
                const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
                const isMovedPiece = lastMove && lastMove.to === sq;

                // Calculate smooth slide offset from origin square
                let slideStyle = undefined;
                if (isMovedPiece && lastMove.from) {
                  const fromF = lastMove.from[0];
                  const fromR = lastMove.from[1];
                  const fDiff = displayFiles.indexOf(fromF) - fIdx;
                  const rDiff = displayRanks.indexOf(fromR) - rIdx;
                  slideStyle = {
                    '--slide-x': `${fDiff * 100}%`,
                    '--slide-y': `${rDiff * 100}%`
                  };
                }

                const legalMove = legalMoves.find((m) => m.to === sq);
                const isCapture = legalMove && (piece || (legalMove.flags && legalMove.flags.includes('e')));
                const isKingInCheck = sq === kingInCheckSq;
                const isMyPiece = piece && piece.color === chess.turn();

                const isLightSquare = (fIdx + rIdx) % 2 === 0;

                return (
                  <div
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, sq)}
                    className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${bgClass} ${
                      isSelected
                        ? 'ring-[3px] ring-inset ring-amber-400 z-10 shadow-[inset_0_0_16px_rgba(251,191,36,0.65)]'
                        : ''
                    } ${isLastMove ? 'after:absolute after:inset-0 after:bg-amber-400/20 after:mix-blend-overlay' : ''} ${
                      isKingInCheck ? 'king-in-check z-10' : ''
                    }`}
                  >
                    {/* Rank coordinate (High contrast, clearly visible) */}
                    {fIdx === 0 && (
                      <span className={`absolute top-0.5 left-1 font-mono text-[10px] sm:text-xs font-black select-none pointer-events-none drop-shadow ${
                        isLightSquare ? 'text-[#122e1c]' : 'text-white'
                      }`}>
                        {rank}
                      </span>
                    )}
                    {/* File coordinate (High contrast, clearly visible) */}
                    {rIdx === 7 && (
                      <span className={`absolute bottom-0.5 right-1 font-mono text-[10px] sm:text-xs font-black select-none pointer-events-none drop-shadow ${
                        isLightSquare ? 'text-[#122e1c]' : 'text-white'
                      }`}>
                        {file}
                      </span>
                    )}

                    {/* Piece Icon with Smooth Kinetic Animation */}
                    {piece && (
                      <div
                        key={`${sq}-${piece.type}-${isMovedPiece ? `${lastMove.from}-${lastMove.to}` : 'static'}`}
                        draggable={interactive && isMyPiece}
                        onDragStart={(e) => handleDragStart(e, sq)}
                        onDragEnd={() => setDraggedSquare(null)}
                        style={slideStyle}
                        className={`w-[88%] h-[88%] flex items-center justify-center select-none ${
                          isMovedPiece ? 'piece-slide-anim' : 'transition-transform duration-200'
                        } ${
                          interactive && isMyPiece
                            ? 'hover:scale-108 hover:-translate-y-0.5 hover:drop-shadow-[0_8px_14px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing active:scale-95'
                            : ''
                        } ${draggedSquare === sq ? 'opacity-30 scale-90' : 'opacity-100'}`}
                      >
                        <PieceIcon piece={piece.color === 'w' ? piece.type.toUpperCase() : piece.type} />
                      </div>
                    )}

                    {/* Legal Move Indicators (Emerald Target Jewel / Ruby Capture Reticle) */}
                    {showLegalDots && legalMove && !isCapture && (
                      <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500/90 pointer-events-none z-20 shadow-[0_0_12px_rgba(16,185,129,0.85)] ring-2 ring-white/70 animate-pulse" />
                    )}

                    {showLegalDots && legalMove && isCapture && (
                      <div className="absolute inset-1 rounded-full border-2 sm:border-[2.5px] border-red-500/90 bg-red-500/20 pointer-events-none z-20 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* AI Coach Best Move Arrow SVG Overlay */}
          {arrowSvg}
        </div>
      </div>
    </div>
  );
};
