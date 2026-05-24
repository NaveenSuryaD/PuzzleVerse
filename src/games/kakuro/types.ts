export type CellType = 'black' | 'clue' | 'white';

export interface KakuroCell {
  type: CellType;
  acrossClue?: number;  // sum for across run starting here
  downClue?: number;    // sum for down run starting here
  value: number | null; // user input for white cells
  solution: number | null;
}

export type KakuroGrid = KakuroCell[][];
