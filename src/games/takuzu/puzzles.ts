export interface TakuzuPuzzle {
  given: (0 | 1 | null)[][];
  solution: (0 | 1)[][];
}

export const TAKUZU_PUZZLES: TakuzuPuzzle[] = [
  {
    given: [
      [null, 0, null, null, 1, null],
      [1, null, null, 0, null, null],
      [null, null, 1, null, null, 0],
      [0, null, null, 1, null, null],
      [null, 1, null, null, 0, null],
      [null, null, 0, null, null, 1],
    ],
    solution: [
      [0, 0, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1],
      [0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 1],
      [1, 1, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0],
    ],
  },
];
