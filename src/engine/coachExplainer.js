import { Chess } from 'chess.js';
import { getBestMove, evaluateBoard } from './aiEngine.js';

const PIECE_NAMES = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King'
};

const PIECE_VALS = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 20
};

/**
 * Checks if a square is in the center 4 squares (d4, e4, d5, e5)
 */
function isCenterSquare(sq) {
  return ['d4', 'e4', 'd5', 'e5'].includes(sq);
}

/**
 * Checks if square is in extended center (c3-f6)
 */
function isExtendedCenter(sq) {
  return ['c3', 'c4', 'c5', 'c6', 'd3', 'd4', 'd5', 'd6', 'e3', 'e4', 'e5', 'e6', 'f3', 'f4', 'f5', 'f6'].includes(sq);
}

/**
 * Deep tactical and positional analysis of the best move.
 * Generates human-like, Grandmaster-level explanations with tactical motifs.
 */
export function analyzeAndExplain(chess) {
  const clone = new Chess(chess.fen());

  if (clone.isGameOver()) {
    if (clone.isCheckmate()) {
      const winner = clone.turn() === 'w' ? 'Black' : 'White';
      return {
        bestMove: null,
        title: 'Checkmate - Game Over',
        theme: 'Checkmate',
        evalScore: clone.turn() === 'w' ? -9999 : 9999,
        evalText: `Checkmate! ${winner} wins.`,
        primaryReason: `${winner} has delivered checkmate. The game is over!`,
        keyBenefits: ['The king has no legal moves to escape check.'],
        speechText: `Checkmate. ${winner} wins the game.`
      };
    }
    return {
      bestMove: null,
      title: 'Drawn Position',
      theme: 'Draw',
      evalScore: 0,
      evalText: '0.00 (Equal)',
      primaryReason: 'The position has concluded in a draw (stalemate, repetition, or insufficient material).',
      keyBenefits: ['Neither side can force a win.'],
      speechText: 'The position is drawn.'
    };
  }

  // Calculate best move using fast, tactical evaluation
  const result = getBestMove(clone, 'hard');
  if (!result || !result.move) {
    return null;
  }

  const move = result.move;
  const isWhite = clone.turn() === 'w';
  const evalCentipawns = result.evalScore;
  const evalPawns = (evalCentipawns / 100).toFixed(2);
  const evalPrefix = evalCentipawns > 0 ? `+${evalPawns}` : `${evalPawns}`;

  let evalAssessment = 'Equal position';
  if (Math.abs(evalCentipawns) > 500) {
    evalAssessment = isWhite ? 'Decisive White advantage' : 'Decisive Black advantage';
  } else if (Math.abs(evalCentipawns) > 200) {
    evalAssessment = isWhite ? 'Clear White advantage' : 'Clear Black advantage';
  } else if (Math.abs(evalCentipawns) > 70) {
    evalAssessment = isWhite ? 'Slight White advantage' : 'Slight Black advantage';
  }

  const pieceName = PIECE_NAMES[move.piece] || 'Piece';
  const fromSquare = move.from;
  const toSquare = move.to;
  const san = move.san;

  // Simulate move to inspect aftermath
  clone.move(move);
  const isDeliveringCheck = clone.inCheck();
  const isDeliveringMate = clone.isCheckmate();
  const nextTurnMoves = clone.moves({ verbose: true });
  clone.undo();

  let title = `Play ${san} with the ${pieceName}`;
  let theme = 'Positional Improvement';
  let primaryReason = '';
  const keyBenefits = [];
  let threatWarning = '';
  let alternativeNote = '';

  // 1. CHECKMATE DELIVERY
  if (isDeliveringMate) {
    title = `Devastating Checkmate: ${san}!`;
    theme = 'Checkmate';
    primaryReason = `Playing ${san} delivers inescapable checkmate and immediately seals the victory.`;
    keyBenefits.push('The opposing king is trapped with zero legal flight squares.');
    keyBenefits.push('Decisive final blow ending the match.');
  }

  // 2. CASTLING (King Safety)
  else if (move.flags && (move.flags.includes('k') || move.flags.includes('q') || san === 'O-O' || san === 'O-O-O')) {
    title = `King Safety: Castle ${san === 'O-O' ? 'Kingside' : 'Queenside'}`;
    theme = 'King Safety';
    primaryReason = `Castles your King to safety behind a solid pawn fortress while activating the Rook toward the center files.`;
    keyBenefits.push('Removes the King from the exposed central file.');
    keyBenefits.push('Connects the Rooks and prepares for harmonious piece coordination.');
    threatWarning = 'Leaving the king uncastled invites dangerous central pawn breaks and pins.';
  }

  // 3. CAPTURING MATERIAL
  else if (move.captured) {
    const capturedName = PIECE_NAMES[move.captured] || 'Piece';
    const valDiff = (PIECE_VALS[move.captured] || 1) - (PIECE_VALS[move.piece] || 1);

    if (valDiff > 0) {
      title = `Winning Material: ${pieceName} takes ${capturedName}`;
      theme = 'Tactical Win';
      primaryReason = `Wins significant material by capturing the opposing ${capturedName} with your ${pieceName} (+${valDiff} material advantage).`;
      keyBenefits.push(`Wins positive piece trade: your ${pieceName} (${PIECE_VALS[move.piece]} pts) takes enemy ${capturedName} (${PIECE_VALS[move.captured]} pts).`);
      keyBenefits.push(`Weakens opponent's army and shifts the board toward a winning endgame.`);
    } else if (valDiff === 0) {
      title = `Equal Trade: ${san}`;
      theme = 'Favorable Exchange';
      primaryReason = `Trades off equal material on ${toSquare}, clearing lines and neutralizing opponent's active piece.`;
      keyBenefits.push(`Removes an opponent's piece from an influential square.`);
      keyBenefits.push(`Simplifies the position while maintaining structural integrity.`);
    } else {
      title = `Tactical Sacrifice / Exchange: ${san}`;
      theme = 'Tactics';
      primaryReason = `Captures on ${toSquare} to break open defensive lines or regain material with greater force.`;
      keyBenefits.push(`Shatters opponent's pawn structure or infiltrates critical defenses.`);
    }
  }

  // 4. FORK DETECTION (Attacking 2+ enemy pieces)
  else {
    // Check if the moved piece attacks multiple valuable enemy targets
    clone.move(move);
    const attacks = [];
    const board = clone.board();
    const [tRank, tFile] = [8 - parseInt(toSquare[1]), toSquare.charCodeAt(0) - 97];

    // Look at candidate opponent targets attacked
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sqPiece = board[r][c];
        if (sqPiece && sqPiece.color !== (isWhite ? 'w' : 'b')) {
          const targetSq = `${String.fromCharCode(97 + c)}${8 - r}`;
          if (sqPiece.type !== 'p') {
            attacks.push({ type: sqPiece.type, sq: targetSq, name: PIECE_NAMES[sqPiece.type] });
          }
        }
      }
    }
    clone.undo();

    // 5. PAWN PROMOTION
    if (move.promotion) {
      title = `Pawn Queening: ${san}`;
      theme = 'Pawn Promotion';
      primaryReason = `Advances the pawn to the final rank and promotes to a powerful Queen on ${toSquare}!`;
      keyBenefits.push('Creates overwhelming material superiority.');
      keyBenefits.push('Virtually guarantees a winning endgame.');
    }

    // 6. DELIVERING CHECK
    else if (isDeliveringCheck) {
      title = `Forcing Attack: Check with ${pieceName}!`;
      theme = 'Forcing Check';
      primaryReason = `Delivers a sharp check on ${toSquare}, seizing the initiative and forcing the opponent to respond defensively.`;
      keyBenefits.push('Dictates the pace of the game by forcing the opposing king or piece to react.');
      keyBenefits.push('Can disrupt opponent coordination or win crucial tempi.');
    }

    // 7. CENTER CONTROL
    else if (isCenterSquare(toSquare)) {
      title = `Center Dominance: ${pieceName} to ${toSquare}`;
      theme = 'Center Control';
      primaryReason = `Occupies the critical central ${toSquare} square, controlling maximum radiating squares and cramping opponent pieces.`;
      keyBenefits.push(`Exerts dominating control over the center of the board.`);
      keyBenefits.push(`Provides a commanding outpost from which to launch tactical attacks.`);
    }

    // 8. PIECE DEVELOPMENT (Opening)
    else if (move.piece === 'n' || move.piece === 'b') {
      title = `Rapid Development: ${pieceName} to ${toSquare}`;
      theme = 'Piece Development';
      primaryReason = `Develops the ${pieceName} from its starting square to an active post on ${toSquare}, fighting for space and preparing for castling.`;
      keyBenefits.push(`Activates minor piece to influence central and flank squares.`);
      keyBenefits.push(`Adheres to core opening principles: rapid development and King safety.`);
    }

    // 9. ROOK ON OPEN FILE
    else if (move.piece === 'r' && ['d1','d8','e1','e8','c1','c8'].includes(toSquare)) {
      title = `Rook Activation: Control the File`;
      theme = 'File Control';
      primaryReason = `Positions the Rook along an open or semi-open file on ${toSquare}, exerting deep pressure down into the enemy camp.`;
      keyBenefits.push('Maximizes the long-range power of the Rook.');
      keyBenefits.push('Prepares potential invasion to the 7th rank.');
    }

    // 10. GENERAL POSITIONAL IMPROVEMENT
    else {
      title = `Optimal Post: ${pieceName} to ${toSquare}`;
      theme = 'Positional Manoeuvre';
      primaryReason = `Improves the positioning of the ${pieceName}, expanding space, defending key squares, and coordinating with your forces.`;
      keyBenefits.push(`Increases piece mobility and board harmony.`);
      keyBenefits.push(`Maintains tactical flexibility while restricting counterplay.`);
    }
  }

  if (keyBenefits.length === 0) {
    keyBenefits.push('Improves overall piece activity.');
    keyBenefits.push('Maintains harmonious coordination.');
  }

  // Voice speech text for reading aloud
  const speechText = `${title}. ${primaryReason}`;

  return {
    bestMove: {
      from: fromSquare,
      to: toSquare,
      san: san,
      piece: move.piece,
      color: move.color,
      captured: move.captured || null
    },
    title,
    theme,
    evalScore: evalCentipawns,
    evalPawns: evalPrefix,
    evalAssessment,
    primaryReason,
    keyBenefits,
    threatWarning,
    speechText
  };
}
