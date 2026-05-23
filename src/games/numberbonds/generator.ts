import type { NumberBondsPuzzle, Tile } from './types';

const TARGETS = [18, 20, 22, 24];
const NUM_PAIRS = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generatePuzzle(): NumberBondsPuzzle {
  const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];

  // For target T, use pairs (1,T-1),(2,T-2),...,(NUM_PAIRS, T-NUM_PAIRS)
  // All 16 numbers are distinct because T >= 18 ensures T-NUM_PAIRS >= 10 > NUM_PAIRS
  const pairs: [number, number][] = Array.from({ length: NUM_PAIRS }, (_, i) => [i + 1, target - (i + 1)]);
  const numbers = shuffle(pairs.flatMap(([a, b]) => [a, b]));

  const tiles: Tile[] = numbers.map((value, id) => ({ id, value, state: 'idle' }));

  return { target, tiles };
}
