import type { SequencePuzzle, SequenceType } from './types';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function applyBlanks(full: number[], blankCount: number): SequencePuzzle & { full: number[] } {
  const indices = new Set<number>();
  while (indices.size < Math.min(blankCount, full.length - 2)) {
    indices.add(rand(1, full.length - 2));
  }
  const sequence: (number | null)[] = full.map((v, i) => (indices.has(i) ? null : v));
  const answers = full.filter((_, i) => indices.has(i));
  return { sequence, answers, hint: '', type: 'arithmetic', full };
}

function make(type: SequenceType, full: number[], hint: string, blanks = 2): SequencePuzzle {
  const { sequence, answers } = applyBlanks(full, blanks);
  return { sequence, answers, hint, type };
}

function makeArithmetic(): SequencePuzzle {
  const start = rand(1, 20);
  const step = rand(2, 9);
  const full = Array.from({ length: 6 }, (_, i) => start + i * step);
  return make('arithmetic', full, `+${step} each time`);
}

function makeGeometric(): SequencePuzzle {
  const start = rand(1, 5);
  const ratio = rand(2, 3);
  const full = Array.from({ length: 5 }, (_, i) => start * Math.pow(ratio, i));
  return make('geometric', full, `×${ratio} each time`, 1);
}

function makeFibonacci(): SequencePuzzle {
  const a = rand(1, 4), b = rand(a, 6);
  const full = [a, b];
  while (full.length < 7) full.push(full[full.length - 1] + full[full.length - 2]);
  return make('fibonacci', full, 'Add the two before it');
}

function makeSquares(): SequencePuzzle {
  const start = rand(1, 5);
  const full = Array.from({ length: 6 }, (_, i) => (start + i) ** 2);
  return make('squares', full, 'Perfect squares');
}

function makeCubes(): SequencePuzzle {
  const full = [1, 8, 27, 64, 125, 216];
  return make('cubes', full, 'Perfect cubes', 1);
}

function makeTriangular(): SequencePuzzle {
  const full = [1, 3, 6, 10, 15, 21];
  return make('triangular', full, 'Triangular numbers');
}

const MAKERS = [makeArithmetic, makeGeometric, makeFibonacci, makeSquares, makeCubes, makeTriangular];

export function generateSequence(): SequencePuzzle {
  return MAKERS[Math.floor(Math.random() * MAKERS.length)]();
}

export function generateSequences(count = 8): SequencePuzzle[] {
  return Array.from({ length: count }, generateSequence);
}
