import React, { useState } from 'react';
import { PieceIcon } from '../utils/pieceSvgs';

export const BOARD_THEMES = {
  neo_emerald: {
    id: 'neo_emerald',
    name: 'Neo-Emerald',
    light: 'bg-[#ffffff] text-black',
    dark: 'bg-[#22c55e] text-white',
    accent: '#22c55e'
  },
  neo_ruby: {
    id: 'neo_ruby',
    name: 'Neo-Ruby',
    light: 'bg-[#ffffff] text-black',
    dark: 'bg-[#ef4444] text-white',
    accent: '#ef4444'
  },
  neo_mono: {
    id: 'neo_mono',
    name: 'Stark Mono',
    light: 'bg-[#ffffff] text-black',
    dark: 'bg-[#18181b] text-white',
    accent: '#000000'
  },
  neo_amber: {
    id: 'neo_amber',
    name: 'Hazard Amber',
    light: 'bg-[#fef9c3] text-black',
    dark: 'bg-[#f59e0b] text-black',
    accent: '#facc15'
  }
};

export const ChessBoard = ({
  chess,
  onMove,
  isFlipped = false,
  boardTheme = 'neo_emerald',
  lastMove = null,
  coachMove = null,
  showCoachArrow = true,
  showLegalDots = true,
  showCoordinates = true,
  showLastMoveHighlight = true,
  blindfoldMode = false,
  interactive = true,
  kingInCheckSq = null
}) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [draggedSquare, setDraggedSquare] = useState(null);

  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.neo_emerald;

  // Coordinate arrays
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = isFlipped ? [...files].reverse() : files;
  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

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

  // Calculate coordinates in percentage for the Coach Arrow
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

  // Neo-Brutalist Tactical Vector Arrow with Black Outline
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
        className="absolute inset-0 w-full h-full pointer-events-none z-30 brutal-coach-arrow overflow-visible"
        viewBox="0 0 100 100"
      >
        <defs>
          <marker
            id="brutalArrowHeadBlack"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#000000" stroke="#000000" strokeWidth="1" />
          </marker>
          <marker
            id="brutalArrowHeadGreen"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#22c55e" stroke="#000000" strokeWidth="0.8" />
          </marker>
        </defs>

        {/* Shadow / outline line */}
        <line
          x1={start.x}
          y1={start.y}
          x2={shortenedEnd.x}
          y2={shortenedEnd.y}
          stroke="#000000"
          strokeWidth="6"
          strokeLinecap="round"
          markerEnd="url(#brutalArrowHeadBlack)"
        />
        {/* Neon Green inner line */}
        <line
          x1={start.x}
          y1={start.y}
          x2={shortenedEnd.x}
          y2={shortenedEnd.y}
          stroke="#22c55e"
          strokeWidth="3.2"
          strokeLinecap="round"
          markerEnd="url(#brutalArrowHeadGreen)"
        />
        {/* Origin dot */}
        <circle cx={start.x} cy={start.y} r="2.8" fill="#000000" />
        <circle cx={start.x} cy={start.y} r="1.8" fill="#ffffff" />
      </svg>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Outer Brutalist Frame with Thick 4px Black Border & Hard Offset Shadow */}
      <div className="relative w-full max-w-[min(94vw,540px)] aspect-square border-4 border-black bg-black brutal-shadow-lg transition-transform">
        <div className="relative w-full h-full bg-black overflow-hidden">
          {/* 8x8 Chessboard Grid */}
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {displayRanks.map((rank, rIdx) =>
              displayFiles.map((file, fIdx) => {
                const sq = `${file}${rank}`;
                const piece = chess.get(sq);
                const isSelected = selectedSquare === sq;
                const isLightSquare = (fIdx + rIdx) % 2 === 0;
                const bgClass = isLightSquare ? theme.light : theme.dark;

                const isLastMove =
                  showLastMoveHighlight && lastMove && (lastMove.from === sq || lastMove.to === sq);

                // Smooth kinetic sliding animation
                let isMovedPiece = false;
                let slideStyle = {};
                if (lastMove && lastMove.to === sq && piece) {
                  const fromFile = lastMove.from[0];
                  const fromRank = lastMove.from[1];
                  const fromFIdx = displayFiles.indexOf(fromFile);
                  const fromRIdx = displayRanks.indexOf(fromRank);
                  if (fromFIdx !== -1 && fromRIdx !== -1) {
                    const dx = (fromFIdx - fIdx) * 100;
                    const dy = (fromRIdx - rIdx) * 100;
                    slideStyle = {
                      '--slide-x': `${dx}%`,
                      '--slide-y': `${dy}%`
                    };
                    isMovedPiece = true;
                  }
                }

                const legalMove = legalMoves.find((m) => m.to === sq);
                const isCapture = legalMove && (piece || (legalMove.flags && legalMove.flags.includes('e')));
                const isKingInCheck = sq === kingInCheckSq;
                const isMyPiece = piece && piece.color === chess.turn();

                return (
                  <div
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, sq)}
                    className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${bgClass} ${
                      isSelected
                        ? '!bg-[#facc15] ring-4 ring-black ring-inset z-10'
                        : ''
                    } ${
                      isLastMove
                        ? 'after:absolute after:inset-0 after:bg-[#facc15]/30 after:border-2 after:border-black/50'
                        : ''
                    } ${
                      isKingInCheck ? 'king-in-check-alarm z-20 border-2 border-black' : ''
                    }`}
                  >
                    {/* Rank Coordinate */}
                    {showCoordinates && fIdx === 0 && (
                      <span
                        className={`absolute top-0.5 left-1 font-mono text-[10px] sm:text-xs font-black select-none pointer-events-none ${
                          isLightSquare ? 'text-black' : 'text-white'
                        }`}
                      >
                        {rank}
                      </span>
                    )}

                    {/* File Coordinate */}
                    {showCoordinates && rIdx === 7 && (
                      <span
                        className={`absolute bottom-0.5 right-1 font-mono text-[10px] sm:text-xs font-black select-none pointer-events-none ${
                          isLightSquare ? 'text-black' : 'text-white'
                        }`}
                      >
                        {file}
                      </span>
                    )}

                    {/* Piece Vector Icon */}
                    {piece && !blindfoldMode && (
                      <div
                        key={`${sq}-${piece.type}-${isMovedPiece ? `${lastMove.from}-${lastMove.to}` : 'static'}`}
                        draggable={interactive && isMyPiece}
                        onDragStart={(e) => handleDragStart(e, sq)}
                        onDragEnd={() => setDraggedSquare(null)}
                        style={slideStyle}
                        className={`w-[88%] h-[88%] flex items-center justify-center select-none ${
                          isMovedPiece ? 'piece-slide-anim' : 'transition-transform duration-150'
                        } ${
                          interactive && isMyPiece
                            ? 'hover:scale-110 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing active:scale-95'
                            : ''
                        } ${draggedSquare === sq ? 'opacity-25 scale-90' : 'opacity-100'}`}
                      >
                        <PieceIcon piece={piece.color === 'w' ? piece.type.toUpperCase() : piece.type} />
                      </div>
                    )}

                    {/* Blindfold Mode Silhouette (When blindfold mode enabled) */}
                    {piece && blindfoldMode && (
                      <div className="w-2.5 h-2.5 rounded-full bg-black/40 ring-1 ring-white/60 pointer-events-none" />
                    )}

                    {/* Legal Move Indicators (Neo-Brutalist Solid Discs / Hazard Target Rings) */}
                    {showLegalDots && legalMove && !isCapture && (
                      <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black ring-2 ring-white pointer-events-none z-20 brutal-shadow-sm" />
                    )}

                    {showLegalDots && legalMove && isCapture && (
                      <div className="absolute inset-1 border-[3px] border-black bg-red-500/40 pointer-events-none z-20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* AI Coach Tactical Arrow Overlay */}
          {arrowSvg}
        </div>
      </div>
    </div>
  );
};
