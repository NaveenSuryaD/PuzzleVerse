export type CellNotes = Set<number>;

export interface SudokuState {
  puzzle: import('./generator').SudokuPuzzle;
  board: number[][];
  notes: CellNotes[][];
  selectedCell: [number, number] | null;
  pencilMode: boolean;
  errors: boolean[][];
  isComplete: boolean;
}
