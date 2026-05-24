export type Grid = (number | null)[][];

export interface GameState {
  grid: Grid;
  score: number;
  won: boolean;
  over: boolean;
}
