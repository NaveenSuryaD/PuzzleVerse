export interface MagicSquarePuzzle {
  size: 3;
  magic: number;
  given: (number | null)[][];
  solution: number[][];
}

export const MAGIC_SQUARE_PUZZLES: MagicSquarePuzzle[] = [
  {
    size: 3,
    magic: 15,
    given: [[null, null, null], [null, 5, null], [null, null, null]],
    solution: [[2, 7, 6], [9, 5, 1], [4, 3, 8]],
  },
  {
    size: 3,
    magic: 15,
    given: [[2, null, null], [null, null, 1], [null, null, 8]],
    solution: [[2, 7, 6], [9, 5, 1], [4, 3, 8]],
  },
  {
    size: 3,
    magic: 15,
    given: [[null, 9, null], [null, null, null], [null, 3, null]],
    solution: [[2, 9, 4], [7, 5, 3], [6, 1, 8]],
  },
  {
    size: 3,
    magic: 15,
    given: [[8, null, null], [null, 5, null], [null, null, 2]],
    solution: [[8, 1, 6], [3, 5, 7], [4, 9, 2]],
  },
  {
    size: 3,
    magic: 15,
    given: [[4, null, null], [null, null, null], [null, null, 2]],
    solution: [[4, 9, 2], [3, 5, 7], [8, 1, 6]],
  },
];
