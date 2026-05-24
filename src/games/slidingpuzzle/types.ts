export type TileGrid = (number | null)[][];

export interface SlidingPuzzleState {
  grid: TileGrid;
  moves: number;
}
