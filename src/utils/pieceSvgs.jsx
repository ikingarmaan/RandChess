import React from 'react';

/**
 * High-definition Staunton vector chess pieces.
 * Standardized 100x100 viewBox with crisp outlines and subtle gradients.
 */

export const PieceIcon = ({ piece, className = "w-full h-full select-none" }) => {
  if (!piece) return null;
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();

  const filterId = `piece_filter_${isWhite ? 'w' : 'b'}_${type}`;
  const gradId = `piece_grad_${isWhite ? 'w' : 'b'}_${type}`;

  const currentStroke = isWhite ? "#18181b" : "#0d0d10";
  const innerDetail = isWhite ? "#18181b" : "#e5e5e7";
  const accentDetail = isWhite ? "#ded9ce" : "#383840";

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients for rich tactile Staunton feel */}
        {isWhite ? (
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f7f5f0" />
            <stop offset="100%" stopColor="#eae6dc" />
          </linearGradient>
        ) : (
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#36363c" />
            <stop offset="65%" stopColor="#222227" />
            <stop offset="100%" stopColor="#141417" />
          </linearGradient>
        )}

        {/* High-definition shadow: White pieces get dark shadow; Black pieces get specular light rim + dark shadow */}
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
          {isWhite ? (
            <feDropShadow dx="0" dy="2.8" stdDeviation="2" floodColor="#000000" floodOpacity="0.55" />
          ) : (
            <>
              {/* Crisp specular rim light so black pieces never blend into dark squares */}
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#ffffff" floodOpacity="0.45" />
              <feDropShadow dx="0" dy="3.2" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.85" />
            </>
          )}
        </filter>
      </defs>

      <g
        filter={`url(#${filterId})`}
        stroke={currentStroke}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={`url(#${gradId})`}
      >
        {type === 'p' && (
          // Pawn
          <g>
            <path d="M22 84 C22 80 28 78 32 78 L68 78 C72 78 78 80 78 84 L78 87 L22 87 Z" />
            <path d="M30 78 C35 73 40 68 42 56 L58 56 C60 68 65 73 70 78 Z" />
            <ellipse cx="50" cy="54" rx="14" ry="4" fill={accentDetail} />
            <path d="M41 54 C40 44 42 38 43 32 L57 32 C58 38 60 44 59 54 Z" />
            <ellipse cx="50" cy="32" rx="10" ry="3" fill={accentDetail} />
            <circle cx="50" cy="23" r="11" />
            <circle cx="47" cy="20" r="2.5" fill={innerDetail} stroke="none" opacity={isWhite ? "0.8" : "0.3"} />
          </g>
        )}

        {type === 'r' && (
          // Rook
          <g>
            <path d="M20 84 C20 80 26 78 30 78 L70 78 C74 78 80 80 80 84 L80 87 L20 87 Z" />
            <path d="M28 78 C32 74 36 68 36 50 L64 50 C64 68 68 74 72 78 Z" />
            <ellipse cx="50" cy="50" rx="16" ry="4" fill={accentDetail} />
            <path d="M34 50 L34 32 L66 32 L66 50 Z" />
            <path d="M26 32 L74 32 L74 18 L65 18 L65 24 L56 24 L56 18 L44 18 L44 24 L35 24 L35 18 L26 18 Z" />
            <line x1="30" y1="28" x2="70" y2="28" stroke={accentDetail} strokeWidth="2" />
          </g>
        )}

        {type === 'n' && (
          // Knight
          <g>
            <path d="M20 84 C20 80 26 78 30 78 L70 78 C74 78 80 80 80 84 L80 87 L20 87 Z" />
            <path d="M30 78 C33 70 34 60 36 52 C32 48 24 45 22 36 C20 28 26 23 32 23 C34 23 36 24 38 25 C40 18 45 13 54 13 C66 13 74 22 75 35 C76 48 72 65 72 78 Z" />
            <circle cx="34" cy="30" r="2.5" fill={innerDetail} stroke="none" />
            <path d="M42 35 C45 42 54 44 60 40" fill="none" stroke={currentStroke} strokeWidth="2" />
            <path d="M46 22 C52 22 62 26 64 34" fill="none" stroke={innerDetail} strokeWidth="2" opacity="0.6" />
            <path d="M28 42 C33 41 38 45 37 50" fill="none" stroke={currentStroke} strokeWidth="1.8" />
          </g>
        )}

        {type === 'b' && (
          // Bishop
          <g>
            <path d="M22 84 C22 80 28 78 32 78 L68 78 C72 78 78 80 78 84 L78 87 L22 87 Z" />
            <path d="M30 78 C34 72 38 64 40 54 L60 54 C62 64 66 72 70 78 Z" />
            <ellipse cx="50" cy="54" rx="14" ry="4" fill={accentDetail} />
            <path d="M36 54 C34 42 38 24 50 18 C62 24 66 42 64 54 Z" />
            <circle cx="50" cy="14" r="3.5" />
            {/* Bishop slit cut */}
            <path d="M44 32 L58 40" fill="none" stroke={currentStroke} strokeWidth="2.5" />
            <path d="M50 24 L50 34" fill="none" stroke={accentDetail} strokeWidth="1.5" />
            <path d="M46 29 L54 29" fill="none" stroke={accentDetail} strokeWidth="1.5" />
          </g>
        )}

        {type === 'q' && (
          // Queen
          <g>
            <path d="M20 84 C20 80 26 78 30 78 L70 78 C74 78 80 80 80 84 L80 87 L20 87 Z" />
            <path d="M28 78 C34 72 38 62 40 50 L60 50 C62 62 66 72 72 78 Z" />
            <ellipse cx="50" cy="50" rx="16" ry="4" fill={accentDetail} />
            <path d="M38 50 L24 28 L38 36 L50 20 L62 36 L76 28 L62 50 Z" />
            <circle cx="24" cy="25" r="3" />
            <circle cx="38" cy="33" r="2.5" />
            <circle cx="50" cy="17" r="3.5" />
            <circle cx="62" cy="33" r="2.5" />
            <circle cx="76" cy="25" r="3" />
            <ellipse cx="50" cy="62" rx="6" ry="2" fill={innerDetail} opacity="0.6" />
          </g>
        )}

        {type === 'k' && (
          // King
          <g>
            <path d="M20 84 C20 80 26 78 30 78 L70 78 C74 78 80 80 80 84 L80 87 L20 87 Z" />
            <path d="M28 78 C34 72 38 62 39 48 L61 48 C62 62 66 72 72 78 Z" />
            <ellipse cx="50" cy="48" rx="17" ry="4" fill={accentDetail} />
            <path d="M37 48 C32 38 35 24 50 22 C65 24 68 38 63 48 Z" />
            {/* King Cross */}
            <path d="M50 11 L50 21" stroke={currentStroke} strokeWidth="3" />
            <path d="M44 15 L56 15" stroke={currentStroke} strokeWidth="3" />
            <ellipse cx="50" cy="32" rx="6" ry="8" fill={accentDetail} opacity="0.7" />
          </g>
        )}
      </g>
    </svg>
  );
};
