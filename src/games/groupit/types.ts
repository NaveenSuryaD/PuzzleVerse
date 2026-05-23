export type Tier = 1 | 2 | 3 | 4;

export interface PuzzleGroup {
  tier: Tier;
  category: string;
  words: [string, string, string, string];
}

export interface Puzzle {
  id: number;
  groups: [PuzzleGroup, PuzzleGroup, PuzzleGroup, PuzzleGroup];
}

export type GameStatus = 'playing' | 'won' | 'lost';
