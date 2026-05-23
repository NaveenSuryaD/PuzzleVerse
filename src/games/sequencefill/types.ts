export type SequenceType = 'arithmetic' | 'geometric' | 'fibonacci' | 'squares' | 'cubes' | 'triangular';

export interface SequencePuzzle {
  sequence: (number | null)[];   // null = blank to fill
  answers: number[];              // values for the blanks in order
  hint: string;                   // e.g. "+3 each time"
  type: SequenceType;
}

export type GameStatus = 'playing' | 'done';
