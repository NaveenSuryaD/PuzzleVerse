export interface SkyscraperPuzzle {
  size: 4;
  clues: {
    top: (number | null)[];
    bottom: (number | null)[];
    left: (number | null)[];
    right: (number | null)[];
  };
  solution: number[][];
}

export const SKYSCRAPER_PUZZLES: SkyscraperPuzzle[] = [
  {
    size: 4,
    clues: {
      top:    [2, 1, 3, 2],
      bottom: [3, 2, 1, 2],
      left:   [2, 2, 3, 1],
      right:  [2, 3, 1, 2],
    },
    solution: [
      [2,4,1,3],
      [3,1,4,2],
      [1,2,3,4],
      [4,3,2,1],
    ],
  },
  {
    size: 4,
    clues: {
      top:    [1, 3, 2, 2],
      bottom: [2, 2, 3, 1],
      left:   [1, 2, 3, 2],
      right:  [4, 2, 1, 3],
    },
    solution: [
      [4,1,3,2],
      [3,2,4,1],
      [1,3,2,4],
      [2,4,1,3],
    ],
  },
];
