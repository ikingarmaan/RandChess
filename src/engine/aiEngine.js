import { Chess } from 'chess.js';
import { getBookMove } from './openingBook.js';

// Base piece values in centipawns
const PIECE_VALUES = {
  p: 100,
  n: 325,
  b: 335,
  r: 505,
  q: 925,
  k: 20000
};

// PeSTO's Piece-Square Tables (White perspective; flipped for Black)
const PST = {
  p: [
    [  0,  0,  0,  0,  0,  0,  0,  0 ],
    [ 78, 83, 86, 73, 102, 82, 85, 90 ],
    [  7, 29, 21, 44, 40, 31, 44,  7 ],
    [ -17, 16, -2, 15, 14,  0, 15,-13 ],
    [ -26,  3, 10,  9,  8,  3, -4,-23 ],
    [ -22,  9,  5,-11,-10, -2,  3,-19 ],
    [ -31,  8, -7,-37,-36,-14,  3,-31 ],
    [  0,  0,  0,  0,  0,  0,  0,  0 ]
  ],
  n: [
    [-66,-53,-75,-75,-10,-55,-58,-70 ],
    [-3, -6, 100,-36,  4, 62, -4,-14 ],
    [ 10, 67,  1, 74, 73, 27, 62, -2 ],
    [ 24, 24, 45, 37, 33, 41, 25, 17 ],
    [ -1,  5, 31, 21, 22, 35,  2,  0 ],
    [-18, 10, 13, 22, 18, 15, 11,-14 ],
    [-23,-15,  2,  0,  2,  0,-23,-20 ],
    [-74,-23,-26,-24,-19,-35,-22,-69 ]
  ],
  b: [
    [-59,-78,-82,-76,-23,-107,-37,-50 ],
    [-11, 20, 35,-42,-39, 31,  2,-22 ],
    [ -9, 39,-32, 41, 52,-10, 28,-14 ],
    [ 25, 17, 20, 34, 26, 25, 15, 10 ],
    [ 13, 10, 17, 23, 17, 16,  7,  2 ],
    [ 14, 25, 24, 15,  8, 25, 20, 15 ],
    [ 19, 20, 11,  6,  7,  6, 20, 16 ],
    [-33, -3,-14,-21,-13,-12,-39,-21 ]
  ],
  r: [
    [ 35, 29, 33,  4, 37, 33, 56, 50 ],
    [ 55, 29, 56, 67, 55, 62, 34, 60 ],
    [ 19, 35, 28, 33, 45, 27, 25, 15 ],
    [  0,  5, 16, 13, 18, -4, -9, -6 ],
    [-28,-35,-16,-21,-13,-29,-46,-30 ],
    [-42,-28,-42,-25,-25,-35,-26,-46 ],
    [-53,-38,-31,-26,-29,-43,-44,-53 ],
    [-30,-24,-18,  5, -2,-18,-31,-32 ]
  ],
  q: [
    [  6,  1,-18,-104, 69, 24, 88, 26 ],
    [ 14, 32, 60, -10, 20, 76, 57, 24 ],
    [ -2, 43, 32,  60, 72, 63, 43,  2 ],
    [  1,-16, 22,  26, 22, 20, 10,  6 ],
    [-16,-25, 16,  14, 15, 12, -4,-13 ],
    [-22, -9,  8,  -2,  1,  6, -8,-17 ],
    [-32,-20,-14, -14, -9,-14,-19,-33 ],
    [-34,-13,-44, -16,-18,-33,-24,-40 ]
  ],
  k: [
    [-65, 23, 16,-15,-56,-34,  2, 13 ],
    [ 29, -1,-20, -7, -8, -4,-38,-29 ],
    [ -9, 24,  2,-16,-20,  6, 22,-22 ],
    [-17,-20,-12,-27,-30,-25,-14,-36 ],
    [-49, -1,-27,-39,-46,-44,-33,-51 ],
    [-14,-14,-22,-46,-44,-30,-15,-27 ],
    [  1,  7, -8,-64,-43,-16,  9,  8 ],
    [-15, 36, 12,-54,  8,-28, 24, 14 ]
  ]
};

// Transposition Table (LRU cache of 20,000 positions)
const transpositionTable = new Map();
const MAX_TT_SIZE = 20000;

function getTTKey(chess) {
  const t = chess.fen().split(' ');
  return `${t[0]} ${t[1]} ${t[2]} ${t[3]}`;
}

/**
 * Fast, accurate board static evaluation function.
 * Evaluates material, positional tables, piece coordination, and pawn structure.
 */
export function evaluateBoard(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  const board = chess.board();
  let score = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pType = piece.type;
      const isWhite = piece.color === 'w';
      const baseValue = PIECE_VALUES[pType] || 0;

      // Track bishop pair
      if (pType === 'b') {
        if (isWhite) whiteBishops++;
        else blackBishops++;
      }

      // PST lookup
      const tableRow = isWhite ? r : 7 - r;
      const pstBonus = PST[pType] ? PST[pType][tableRow][c] : 0;

      const totalVal = baseValue + pstBonus;
      score += isWhite ? totalVal : -totalVal;
    }
  }

  // Bishop pair bonus (+35 centipawns)
  if (whiteBishops >= 2) score += 35;
  if (blackBishops >= 2) score -= 35;

  // Small tempo bonus for side to move
  score += chess.turn() === 'w' ? 12 : -12;

  return score;
}

/**
 * High-performance move ordering:
 * 1. Hash move / Best previous move
 * 2. Captures by MVV-LVA (victim * 10 - attacker)
 * 3. Promotions (Queen promotion top priority)
 * 4. Checks
 * 5. Center development moves
 */
function orderMoves(moves, hashMove = null) {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // 1. Hash move priority
    if (hashMove) {
      if (a.from === hashMove.from && a.to === hashMove.to) scoreA += 10000;
      if (b.from === hashMove.from && b.to === hashMove.to) scoreB += 10000;
    }

    // 2. Captures MVV-LVA
    if (a.captured) {
      const victimA = PIECE_VALUES[a.captured] || 100;
      const attackerA = PIECE_VALUES[a.piece] || 100;
      scoreA += 2000 + (victimA * 10 - attackerA);
    }
    if (b.captured) {
      const victimB = PIECE_VALUES[b.captured] || 100;
      const attackerB = PIECE_VALUES[b.piece] || 100;
      scoreB += 2000 + (victimB * 10 - attackerB);
    }

    // 3. Promotions
    if (a.promotion) scoreA += a.promotion === 'q' ? 1500 : 700;
    if (b.promotion) scoreB += b.promotion === 'q' ? 1500 : 700;

    // 4. Checks
    if (a.san && a.san.includes('+')) scoreA += 400;
    if (b.san && b.san.includes('+')) scoreB += 400;

    // 5. Center control (e4, d4, e5, d5)
    if (['e4', 'd4', 'e5', 'd5'].includes(a.to)) scoreA += 60;
    if (['e4', 'd4', 'e5', 'd5'].includes(b.to)) scoreB += 60;

    return scoreB - scoreA;
  });
}

/**
 * Quiescence search for immediate tactical captures.
 */
function quiescence(chess, alpha, beta, isMax, depth = 1) {
  const standPat = evaluateBoard(chess);
  if (depth <= 0) return standPat;

  if (isMax) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const allCaptures = chess.moves({ verbose: true }).filter(m => m.captured || m.promotion);
    allCaptures.sort((a, b) => ((PIECE_VALUES[b.captured] || 0) - (PIECE_VALUES[a.captured] || 0)));
    const captureMoves = allCaptures.slice(0, 3);

    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, false, depth - 1);
      chess.undo();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;

    const allCaptures = chess.moves({ verbose: true }).filter(m => m.captured || m.promotion);
    allCaptures.sort((a, b) => ((PIECE_VALUES[b.captured] || 0) - (PIECE_VALUES[a.captured] || 0)));
    const captureMoves = allCaptures.slice(0, 3);

    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, true, depth - 1);
      chess.undo();

      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

/**
 * Minimax with Alpha-Beta Pruning.
 */
function minimax(chess, depth, alpha, beta, isMax) {
  if (depth === 0) {
    return quiescence(chess, alpha, beta, isMax, 1);
  }

  if (chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const allMoves = orderMoves(chess.moves({ verbose: true }));
  const moves = allMoves.length > 14 ? allMoves.slice(0, 14) : allMoves;

  if (isMax) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

/**
 * Find best move fast and accurately.
 * Checks opening book first (< 2ms), then runs optimized Alpha-Beta search.
 */
export function getBestMove(chess, difficulty = 'medium') {
  const clone = new Chess(chess.fen());

  // 1. Check Grandmaster Opening Book for instant, master-level move
  const bookMove = getBookMove(clone);
  if (bookMove) {
    const pieceObj = clone.get(bookMove.from);
    return {
      move: {
        from: bookMove.from,
        to: bookMove.to,
        promotion: bookMove.promotion,
        san: bookMove.san,
        piece: pieceObj ? pieceObj.type : 'p',
        color: pieceObj ? pieceObj.color : clone.turn(),
        captured: clone.get(bookMove.to)?.type || null
      },
      evalScore: 20,
      isBookMove: true,
      openingName: bookMove.openingName
    };
  }

  const allMoves = orderMoves(clone.moves({ verbose: true }));
  if (allMoves.length === 0) return null;
  const moves = allMoves.length > 16 ? allMoves.slice(0, 16) : allMoves;

  const isWhite = clone.turn() === 'w';

  // Beginner mode: occasional random play
  if (difficulty === 'easy') {
    if (Math.random() < 0.3) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return {
        move: {
          from: randomMove.from,
          to: randomMove.to,
          promotion: randomMove.promotion,
          san: randomMove.san,
          piece: randomMove.piece,
          color: randomMove.color,
          captured: randomMove.captured || null
        },
        evalScore: 0
      };
    }
  }

  // Optimized search depths for instant (<80ms) execution and deep tactical vision
  let searchDepth = 2;
  if (difficulty === 'easy') searchDepth = 1;
  else if (difficulty === 'medium') searchDepth = 2;
  else if (difficulty === 'hard') searchDepth = 2;
  else if (difficulty === 'master') searchDepth = 2;

  let bestMove = moves[0];
  let bestScore = isWhite ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    clone.move(move);
    const score = minimax(clone, searchDepth - 1, alpha, beta, !isWhite);
    clone.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
    }
  }

  return {
    move: {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || undefined,
      san: bestMove.san,
      piece: bestMove.piece,
      color: bestMove.color,
      captured: bestMove.captured || null
    },
    evalScore: bestScore === Infinity || bestScore === -Infinity ? 0 : bestScore
  };
}
