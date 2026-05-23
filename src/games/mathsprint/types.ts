export type Operator = '+' | '-' | '×' | '÷';

export interface Question {
  a: number;
  b: number;
  op: Operator;
  answer: number;
}

export type GameStatus = 'playing' | 'done';
