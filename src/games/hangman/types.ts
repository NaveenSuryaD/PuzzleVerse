export type LetterStatus = 'idle' | 'correct' | 'wrong';

export interface HangmanPuzzle {
  word: string;
}

export type GameStatus = 'playing' | 'won' | 'lost';
