export type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';
export type KeyState = 'correct' | 'present' | 'absent' | 'unused';
export type GameMode = 'daily' | 'unlimited';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface WordGuessState {
  answer: string;
  guesses: string[];
  evaluations: LetterState[][];
  currentGuess: string;
  gameStatus: GameStatus;
  mode: GameMode;
}
