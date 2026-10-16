/**
 * Grandmaster Opening Book for instant, accurate opening play.
 * Maps position FEN (first 3 segments: pieces, turn, castling) to high-quality master moves.
 */

const BOOK = {
  // Initial position: White options
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq': [
    { from: 'e2', to: 'e4', weight: 45, name: "King's Pawn" },
    { from: 'd2', to: 'd4', weight: 35, name: "Queen's Pawn" },
    { from: 'c2', to: 'c4', weight: 12, name: "English Opening" },
    { from: 'g1', to: 'f3', weight: 8, name: "Réti Opening" }
  ],

  // 1. e4 responses (Black)
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq': [
    { from: 'e7', to: 'e5', weight: 40, name: "Open Game" },
    { from: 'c7', to: 'c5', weight: 35, name: "Sicilian Defense" },
    { from: 'e7', to: 'e6', weight: 12, name: "French Defense" },
    { from: 'c7', to: 'c6', weight: 8, name: "Caro-Kann Defense" },
    { from: 'd7', to: 'd5', weight: 5, name: "Scandinavian Defense" }
  ],

  // 1. e4 e5 -> 2. Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    { from: 'g1', to: 'f3', weight: 70, name: "King's Knight" },
    { from: 'b1', to: 'c3', weight: 15, name: "Vienna Game" },
    { from: 'f2', to: 'f4', weight: 15, name: "King's Gambit" }
  ],

  // 1. e4 e5 2. Nf3 -> 2... Nc6, 2... Nf6
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': [
    { from: 'b8', to: 'c6', weight: 75, name: "Normal Defense" },
    { from: 'g8', to: 'f6', weight: 20, name: "Petrov's Defense" },
    { from: 'd7', to: 'd6', weight: 5, name: "Philidor Defense" }
  ],

  // 1. e4 e5 2. Nf3 Nc6 -> 3. Bb5 (Ruy Lopez), 3. Bc4 (Italian), 3. d4 (Scotch)
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq': [
    { from: 'f1', to: 'b5', weight: 50, name: "Ruy Lopez" },
    { from: 'f1', to: 'c4', weight: 35, name: "Italian Game" },
    { from: 'd2', to: 'd4', weight: 15, name: "Scotch Game" }
  ],

  // 1. e4 c5 -> 2. Nf3 (Open Sicilian)
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    { from: 'g1', to: 'f3', weight: 80, name: "Open Sicilian" },
    { from: 'b1', to: 'c3', weight: 12, name: "Alapin Sicilian" },
    { from: 'c2', to: 'c3', weight: 8, name: "Alapin Variation" }
  ],

  // 1. e4 c5 2. Nf3 -> 2... d6, 2... Nc6, 2... e6
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': [
    { from: 'd7', to: 'd6', weight: 45, name: "Classical/Najdorf Setup" },
    { from: 'b8', to: 'c6', weight: 35, name: "Old Sicilian" },
    { from: 'e7', to: 'e6', weight: 20, name: "French-Sicilian" }
  ],

  // 1. d4 responses (Black)
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq': [
    { from: 'g8', to: 'f6', weight: 50, name: "Indian Defenses" },
    { from: 'd7', to: 'd5', weight: 40, name: "Closed Game" },
    { from: 'e7', to: 'e6', weight: 10, name: "Horwitz Defense" }
  ],

  // 1. d4 d5 -> 2. c4 (Queen's Gambit)
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq': [
    { from: 'c2', to: 'c4', weight: 75, name: "Queen's Gambit" },
    { from: 'g1', to: 'f3', weight: 15, name: "Queen's Knight Attack" },
    { from: 'c1', to: 'f4', weight: 10, name: "London System" }
  ],

  // 1. d4 d5 2. c4 -> 2... e6 (QGD), 2... c6 (Slav)
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': [
    { from: 'e7', to: 'e6', weight: 55, name: "Queen's Gambit Declined" },
    { from: 'c7', to: 'c6', weight: 35, name: "Slav Defense" },
    { from: 'd5', to: 'c4', weight: 10, name: "Queen's Gambit Accepted" }
  ],

  // 1. d4 Nf6 -> 2. c4
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq': [
    { from: 'c2', to: 'c4', weight: 75, name: "Main Line Indian" },
    { from: 'g1', to: 'f3', weight: 15, name: "Knight Development" },
    { from: 'c1', to: 'f4', weight: 10, name: "London System" }
  ],

  // 1. d4 Nf6 2. c4 -> 2... e6, 2... g6 (King's Indian / Grünfeld)
  'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': [
    { from: 'e7', to: 'e6', weight: 50, name: "Nimzo/Queen's Indian Setup" },
    { from: 'g7', to: 'g6', weight: 45, name: "King's Indian / Grünfeld Setup" },
    { from: 'c7', to: 'c5', weight: 5, name: "Benoni Defense" }
  ]
};

/**
 * Looks up an opening book move for current position.
 * Returns { from, to, name } or null.
 */
export function getBookMove(chess) {
  const tokens = chess.fen().split(' ');
  // Key = pieces turn castling
  const key = `${tokens[0]} ${tokens[1]} ${tokens[2]}`;
  const candidates = BOOK[key];

  if (!candidates || candidates.length === 0) return null;

  // Weighted random selection
  const totalWeight = candidates.reduce((sum, c) => sum + (c.weight || 10), 0);
  let r = Math.random() * totalWeight;

  for (const c of candidates) {
    r -= (c.weight || 10);
    if (r <= 0) {
      // Validate that the move is strictly legal in current position
      const legalMoves = chess.moves({ verbose: true });
      const valid = legalMoves.find(m => m.from === c.from && m.to === c.to);
      if (valid) {
        return {
          from: c.from,
          to: c.to,
          promotion: valid.promotion,
          san: valid.san,
          openingName: c.name
        };
      }
    }
  }

  return null;
}
