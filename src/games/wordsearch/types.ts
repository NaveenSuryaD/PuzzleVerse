export type Direction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// [dr, dc] for each direction index
export const DIR_VECTORS: [number, number][] = [
  [0, 1],   // 0: right
  [0, -1],  // 1: left
  [1, 0],   // 2: down
  [-1, 0],  // 3: up
  [1, 1],   // 4: down-right
  [1, -1],  // 5: down-left
  [-1, 1],  // 6: up-right
  [-1, -1], // 7: up-left
];

export interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  found: boolean;
}

export interface WordSearchPuzzle {
  grid: string[][];
  words: PlacedWord[];
  theme: string;
  themeEmoji: string;
  gridSize: number;
}

export interface CellCoord {
  row: number;
  col: number;
}
