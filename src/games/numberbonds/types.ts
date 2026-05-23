export type TileState = 'idle' | 'selected' | 'matched' | 'wrong';

export interface Tile {
  id: number;
  value: number;
  state: TileState;
}

export interface NumberBondsPuzzle {
  target: number;
  tiles: Tile[];
}

export type GameStatus = 'playing' | 'won';
