import type { KakuroGrid } from './types';

// Simplified 5x5 Kakuro puzzles
// B=black, C=clue(across,down), W(sol)=white
type RawCell =
  | { t: 'B' }
  | { t: 'C'; a?: number; d?: number }
  | { t: 'W'; s: number };

function buildGrid(raw: RawCell[][]): KakuroGrid {
  return raw.map(row => row.map(cell => {
    if (cell.t === 'B') return { type: 'black' as const, value: null, solution: null };
    if (cell.t === 'C') return { type: 'clue' as const, acrossClue: cell.a, downClue: cell.d, value: null, solution: null };
    return { type: 'white' as const, value: null, solution: cell.s };
  }));
}

const P1: RawCell[][] = [
  [{ t: 'B' }, { t: 'C', d: 4 }, { t: 'C', d: 3 }, { t: 'B' }, { t: 'B' }],
  [{ t: 'C', a: 3 }, { t: 'W', s: 1 }, { t: 'W', s: 2 }, { t: 'B' }, { t: 'B' }],
  [{ t: 'C', a: 6 }, { t: 'W', s: 3 }, { t: 'W', s: 1 }, { t: 'C', d: 2 }, { t: 'B' }],
  [{ t: 'B' }, { t: 'B' }, { t: 'C', a: 3 }, { t: 'W', s: 2 }, { t: 'B' }],
  [{ t: 'B' }, { t: 'B' }, { t: 'B' }, { t: 'B' }, { t: 'B' }],
];

const P2: RawCell[][] = [
  [{ t: 'B' }, { t: 'C', d: 6 }, { t: 'C', d: 7 }, { t: 'B' }, { t: 'B' }],
  [{ t: 'C', a: 9 }, { t: 'W', s: 4 }, { t: 'W', s: 5 }, { t: 'B' }, { t: 'B' }],
  [{ t: 'C', a: 3 }, { t: 'W', s: 2 }, { t: 'W', s: 2 }, { t: 'C', d: 7 }, { t: 'B' }],
  [{ t: 'B' }, { t: 'B' }, { t: 'C', a: 9 }, { t: 'W', s: 7 }, { t: 'B' }],
  [{ t: 'B' }, { t: 'B' }, { t: 'B' }, { t: 'B' }, { t: 'B' }],
];

export const KAKURO_PUZZLES: KakuroGrid[] = [P1, P2].map(buildGrid);
