// Chess puzzles: mate in 1
// Board represented as 8x8, 0-indexed from top-left (a8=0,0)
// Piece codes: K=king, Q=queen, R=rook, B=bishop, N=knight, P=pawn
// Lowercase = black, uppercase = white

export interface ChessPuzzle {
  name: string;
  board: (string | null)[][];
  solution: { from: [number, number]; to: [number, number] };
  hint: string;
}

export const CHESS_PUZZLES: ChessPuzzle[] = [
  {
    name: 'Back Rank Mate',
    board: [
      [null,null,null,null,null,'r',null,'k'],
      [null,null,null,null,null,null,null,'p'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,'P','P'],
      [null,null,null,null,null,null,null,'K'],
    ],
    solution: { from: [5, 0], to: [7, 0] }, // simplified
    hint: 'Rook to a1 — back rank checkmate!',
  },
  {
    name: 'Scholar\'s Mate Setup',
    board: [
      ['r',null,'b','q','k','b','n','r'],
      ['p','p','p','p',null,'p','p','p'],
      [null,null,'n',null,null,null,null,null],
      [null,null,null,null,'p',null,null,null],
      [null,null,'B',null,'P',null,null,null],
      [null,null,null,null,null,null,null,null],
      ['P','P','P','P',null,'P','P','P'],
      ['R','N','B','Q','K',null,'N','R'],
    ],
    solution: { from: [3, 4], to: [1, 6] }, // Qxf7#
    hint: 'Queen takes f7 — checkmate!',
  },
];
