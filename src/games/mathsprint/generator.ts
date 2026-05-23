import type { Question, Operator } from './types';

const TOTAL = 20;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
  const ops: Operator[] = difficulty === 'easy' ? ['+', '-']
    : difficulty === 'medium' ? ['+', '-', '×']
    : ['+', '-', '×', '÷'];

  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;

  if (op === '+') {
    a = rand(1, difficulty === 'easy' ? 20 : 50);
    b = rand(1, difficulty === 'easy' ? 20 : 50);
    answer = a + b;
  } else if (op === '-') {
    a = rand(2, difficulty === 'easy' ? 20 : 50);
    b = rand(1, a);
    answer = a - b;
  } else if (op === '×') {
    a = rand(2, difficulty === 'medium' ? 12 : 15);
    b = rand(2, difficulty === 'medium' ? 12 : 15);
    answer = a * b;
  } else {
    // division: generate from product to ensure integer result
    b = rand(2, 12);
    answer = rand(2, 12);
    a = b * answer;
  }

  return { a, b, op, answer };
}

export function generateQuestions(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Question[] {
  return Array.from({ length: TOTAL }, () => makeQuestion(difficulty));
}
