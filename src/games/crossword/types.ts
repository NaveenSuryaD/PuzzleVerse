export interface ClueEntry {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  length: number;
}

export interface CrosswordPuzzle {
  id: number;
  grid: string[][];   // 5×5, '#' = black cell, letter = given, '' = empty
  solution: string[][]; // 5×5 of letters
  clues: ClueEntry[];
  title?: string;
}

export type Direction = 'across' | 'down';
export type CellState = { letter: string; isBlack: boolean; number?: number };
