import type { Color, ColorSortState, Tube } from './types';

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'purple'];
const TUBE_COUNT = 6; // 5 color tubes + 1 empty buffer
const BALLS_PER_TUBE = 4;

export function generateColorSort(): ColorSortState {
  // Start with sorted state
  const sorted: Tube[] = COLORS.map(c => [c, c, c, c]);
  sorted.push([]); // empty tube

  // Shuffle all balls
  const allBalls: Color[] = sorted.slice(0, 5).flat();
  for (let i = allBalls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]];
  }

  // Redistribute to 5 tubes
  const tubes: Tube[] = [];
  for (let i = 0; i < 5; i++) {
    tubes.push(allBalls.slice(i * 4, i * 4 + 4));
  }
  tubes.push([]); // empty

  return { tubes };
}

export function isSolved(tubes: Tube[]): boolean {
  return tubes.every(tube =>
    tube.length === 0 ||
    (tube.length === BALLS_PER_TUBE && tube.every(b => b === tube[0]))
  );
}

export function canMove(tubes: Tube[], from: number, to: number): boolean {
  const src = tubes[from];
  const dst = tubes[to];
  if (src.length === 0) return false;
  if (dst.length >= BALLS_PER_TUBE) return false;
  if (dst.length === 0) return true;
  return src[src.length - 1] === dst[dst.length - 1];
}

export function applyMove(tubes: Tube[], from: number, to: number): Tube[] {
  const next = tubes.map(t => [...t]);
  const ball = next[from].pop()!;
  next[to].push(ball);
  return next;
}
