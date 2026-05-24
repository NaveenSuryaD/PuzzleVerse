export interface KenKenCage {
  cells: [number, number][];
  target: number;
  op: '+' | '-' | '*' | '/';
}

export interface KenKenPuzzle {
  size: 4;
  cages: KenKenCage[];
  solution: number[][];
}

export const KENKEN_PUZZLES: KenKenPuzzle[] = [
  {
    size: 4,
    cages: [
      { cells: [[0,0],[0,1]], target: 6, op: '+' },
      { cells: [[0,2],[1,2]], target: 2, op: '/' },
      { cells: [[0,3],[1,3]], target: 3, op: '-' },
      { cells: [[1,0],[2,0]], target: 3, op: '+' },
      { cells: [[1,1],[2,1],[2,2]], target: 8, op: '+' },
      { cells: [[2,3],[3,3]], target: 6, op: '*' },
      { cells: [[3,0],[3,1]], target: 4, op: '+' },
      { cells: [[3,2]], target: 3, op: '+' },
    ],
    solution: [[2,4,1,3],[1,3,2,4],[3,1,4,2],[4,2,3,1]],
  },
];
