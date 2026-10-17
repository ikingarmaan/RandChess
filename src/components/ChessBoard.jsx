import React, { useState, useRef, useEffect } from 'react';
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
  const [dragOverlay, setDragOverlay] = useState(null); // { piece, x, y, fromSq, hoverSq }

  const boardRef = useRef(null);
  const pointerTrackerRef = useRef(null); // { startX, startY, sq, piece, isDragging }

  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.neo_emerald;

  // Coordinate arrays
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = isFlipped ? [...files].reverse() : files;
  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

  // Global Pointer Event Listeners for Butter-Smooth Drag & Drop across Desktop and Mobile
  useEffect(() => {
    const handleWindowPointerMove = (e) => {
      if (!pointerTrackerRef.current) return;
      const { startX, startY, sq, piece, isDragging } = pointerTrackerRef.current;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

      if (dist > 5 || isDragging) {
        pointerTrackerRef.current.isDragging = true;
        if (boardRef.current) {
          const rect = boardRef.current.getBoundingClientRect();
          const col = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
          const row = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
          let hoverSq = null;
          if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            hoverSq = `${displayFiles[col]}${displayRanks[row]}`;
          }
          setDragOverlay({
            piece,
            x: e.clientX,
            y: e.clientY,
            fromSq: sq,
            hoverSq
          });
        }
      }
    };

    const handleWindowPointerUp = () => {
      if (!pointerTrackerRef.current) return;
      const { isDragging } = pointerTrackerRef.current;
      const currentDrag = dragOverlay;

      pointerTrackerRef.current = null;
      setDragOverlay(null);

      // If user was actively dragging and released over a destination square
      if (isDragging && currentDrag && currentDrag.hoverSq) {
        const targetSq = currentDrag.hoverSq;
        const moveCandidate = legalMoves.find((m) => m.to === targetSq);
        if (moveCandidate) {
          onMove(moveCandidate);
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
        // Dropped on invalid square
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [displayFiles, displayRanks, legalMoves, onMove, dragOverlay]);

  // Pointer Down on a Board Square: unified click-to-move & drag-to-move
  const handleSquarePointerDown = (e, sq) => {
    if (!interactive) return;

    // 1. If clicking a valid destination square after selecting a piece (Click-to-move)
    if (selectedSquare) {
      const moveCandidate = legalMoves.find((m) => m.to === sq);
      if (moveCandidate) {
        onMove(moveCandidate);
        setSelectedSquare(null);
        setLegalMoves([]);
        pointerTrackerRef.current = null;
        return;
      }
    }

    // 2. Otherwise check if touching/clicking own piece
    const piece = chess.get(sq);
    if (piece && piece.color === chess.turn()) {
      if (selectedSquare === sq && !pointerTrackerRef.current?.isDragging) {
        // Toggle selection off if tapped again
        setSelectedSquare(null);
        setLegalMoves([]);
        pointerTrackerRef.current = null;
      } else {
        setSelectedSquare(sq);
        const moves = chess.moves({ square: sq, verbose: true });
        setLegalMoves(moves);
        pointerTrackerRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          sq,
          piece,
          isDragging: false
        };
      }
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
      pointerTrackerRef.current = null;
    }
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

  // Sleek Tactical Vector Arrow (Proportional, non-intrusive)
  let arrowSvg = null;
  if (showCoachArrow && coachMove && coachMove.from && coachMove.to) {
    const start = getSquareCenter(coachMove.from);
    const end = getSquareCenter(coachMove.to);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy);

    // Graceful offsets so the arrow doesn't obstruct the piece
    const startOffset = {
      x: start.x + Math.cos(angle) * 2.2,
      y: start.y + Math.sin(angle) * 2.2
    };

    const endOffset = {
      x: start.x + Math.cos(angle) * Math.max(0, length - 2.8),
      y: start.y + Math.sin(angle) * Math.max(0, length - 2.8)
    };

    arrowSvg = (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible opacity-90"
        viewBox="0 0 100 100"
      >
        <defs>
          <marker
            id="sleekArrowHeadBlack"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="3.2"
            markerHeight="3.2"
            orient="auto-start-reverse"
          >
            <path d="M 1 2 L 8 5 L 1 8 z" fill="#000000" stroke="#000000" strokeWidth="0.8" />
          </marker>
          <marker
            id="sleekArrowHeadGreen"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="2.5"
            markerHeight="2.5"
            orient="auto-start-reverse"
          >
            <path d="M 1 2.2 L 7.5 5 L 1 7.8 z" fill="#22c55e" />
          </marker>
        </defs>

        {/* Outer dark stroke */}
        <line
          x1={startOffset.x}
          y1={startOffset.y}
          x2={endOffset.x}
          y2={endOffset.y}
          stroke="#000000"
          strokeWidth="2.6"
          strokeLinecap="round"
          markerEnd="url(#sleekArrowHeadBlack)"
        />
        {/* Neon green inner stroke */}
        <line
          x1={startOffset.x}
          y1={startOffset.y}
          x2={endOffset.x}
          y2={endOffset.y}
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
          markerEnd="url(#sleekArrowHeadGreen)"
        />
        {/* Origin dot */}
        <circle cx={start.x} cy={start.y} r="1.5" fill="#000000" />
        <circle cx={start.x} cy={start.y} r="0.9" fill="#22c55e" />
      </svg>
    );
  }

  return (
    <div
      className="relative w-full flex flex-col items-center select-none"
      style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
    >
      {/* Outer Brutalist Frame with Thick 4px Black Border & Hard Offset Shadow */}
      <div className="relative w-full max-w-[min(94vw,540px)] aspect-square border-4 border-black bg-black brutal-shadow-lg transition-transform">
        <div
          ref={boardRef}
          className="relative w-full h-full bg-black overflow-hidden"
          style={{ touchAction: 'none' }}
        >
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

                const legalMove = legalMoves.find((m) => m.to === sq);
                const isCapture = legalMove && (piece || (legalMove.flags && legalMove.flags.includes('e')));
                const isKingInCheck = sq === kingInCheckSq;
                const isMyPiece = piece && piece.color === chess.turn();
                const isHoveredTarget = dragOverlay && dragOverlay.hoverSq === sq && legalMove;

                // Smooth kinetic sliding animation (100% square-relative coordinate offsets)
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

                // Animate castling rook smoothly alongside king
                if (lastMove && piece && piece.type === 'r') {
                  let rookFrom = null;
                  if (lastMove.from === 'e1' && lastMove.to === 'g1' && sq === 'f1') rookFrom = 'h1';
                  else if (lastMove.from === 'e1' && lastMove.to === 'c1' && sq === 'd1') rookFrom = 'a1';
                  else if (lastMove.from === 'e8' && lastMove.to === 'g8' && sq === 'f8') rookFrom = 'h8';
                  else if (lastMove.from === 'e8' && lastMove.to === 'c8' && sq === 'd8') rookFrom = 'a8';

                  if (rookFrom) {
                    const rFromFile = rookFrom[0];
                    const rFromRank = rookFrom[1];
                    const rFromFIdx = displayFiles.indexOf(rFromFile);
                    const rFromRIdx = displayRanks.indexOf(rFromRank);
                    if (rFromFIdx !== -1 && rFromRIdx !== -1) {
                      slideStyle = {
                        '--slide-x': `${(rFromFIdx - fIdx) * 100}%`,
                        '--slide-y': `${(rFromRIdx - rIdx) * 100}%`
                      };
                      isMovedPiece = true;
                    }
                  }
                }

                return (
                  <div
                    key={sq}
                    onPointerDown={(e) => handleSquarePointerDown(e, sq)}
                    className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${bgClass} ${
                      isSelected
                        ? '!bg-[#facc15] ring-4 ring-black ring-inset z-10'
                        : ''
                    } ${
                      isHoveredTarget
                        ? '!bg-[#22c55e] ring-4 ring-black ring-inset z-20'
                        : ''
                    } ${
                      isLastMove
                        ? 'after:absolute after:inset-0 after:bg-[#facc15]/35 after:border-2 after:border-black/60'
                        : ''
                    } ${
                      isKingInCheck ? 'king-in-check-alarm z-20 border-2 border-black' : ''
                    }`}
                  >
                    {/* Rank Coordinate */}
                    {showCoordinates && fIdx === 0 && (
                      <span
                        className={`absolute top-0.5 left-1 font-mono text-[10px] sm:text-xs font-black select-none pointer-events-none z-10 ${
                          isLightSquare ? 'text-black' : 'text-white'
                        }`}
                      >
                        {rank}
                      </span>
                    )}

                    {/* File Coordinate */}
                    {showCoordinates && rIdx === 7 && (
                      <span
                        className={`absolute bottom-0.5 right-1 font-mono text-[10px] sm:text-xs font-black select-none pointer-events-none z-10 ${
                          isLightSquare ? 'text-black' : 'text-white'
                        }`}
                      >
                        {file}
                      </span>
                    )}

                    {/* Piece Vector Container: 100% Dimensions for Exact 1:1 GPU Slide Glide */}
                    {piece && !blindfoldMode && (
                      <div
                        key={`${sq}-${piece.type}-${piece.color}-${isMovedPiece ? `${lastMove.from}-${lastMove.to}` : 'static'}`}
                        style={slideStyle}
                        className={`absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none z-10 ${
                          isMovedPiece ? 'piece-slide-anim' : ''
                        } ${dragOverlay && dragOverlay.fromSq === sq ? 'opacity-20' : 'opacity-100'}`}
                      >
                        <div
                          className={`w-[88%] h-[88%] flex items-center justify-center pointer-events-auto transition-transform duration-150 ${
                            interactive && isMyPiece
                              ? 'hover:scale-108 active:scale-95 cursor-grab active:cursor-grabbing'
                              : ''
                          }`}
                        >
                          <PieceIcon piece={piece.color === 'w' ? piece.type.toUpperCase() : piece.type} />
                        </div>
                      </div>
                    )}

                    {/* Blindfold Mode Silhouette (When blindfold mode enabled) */}
                    {piece && blindfoldMode && (
                      <div className="w-2.5 h-2.5 rounded-full bg-black/40 ring-1 ring-white/60 pointer-events-none z-10" />
                    )}

                    {/* Legal Move Indicators (Neo-Brutalist Solid Discs / Hazard Target Rings) */}
                    {showLegalDots && legalMove && !isCapture && (
                      <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black ring-2 ring-white pointer-events-none z-20 brutal-shadow-sm transition-transform duration-150 hover:scale-125" />
                    )}

                    {showLegalDots && legalMove && isCapture && (
                      <div className="absolute inset-1 border-[3px] border-black bg-red-500/35 pointer-events-none z-20 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
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

      {/* Ultra-Smooth Floating Drag Overlay (60/120fps GPU transform) */}
      {dragOverlay && (
        <div
          className="fixed pointer-events-none z-50 flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl"
          style={{
            left: `${dragOverlay.x}px`,
            top: `${dragOverlay.y}px`,
            transform: 'translate(-50%, -50%) scale(1.18)',
            willChange: 'left, top, transform'
          }}
        >
          <PieceIcon piece={dragOverlay.piece.color === 'w' ? dragOverlay.piece.type.toUpperCase() : dragOverlay.piece.type} />
        </div>
      )}
    </div>
  );
};
