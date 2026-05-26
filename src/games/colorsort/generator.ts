import type { Color, ColorSortState, Tube } from './types';

const ALL_COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];
const BALLS_PER_TUBE = 4;

export function getColorCountForLevel(level: number): number {
  if (level <= 3) return 5;
  if (level <= 6) return 6;
  return 7;
}

export function generateColorSort(level = 1): ColorSortState {
  const colorCount = getColorCountForLevel(level);
  const emptyCount = level <= 5 ? 1 : 2;
  const usedColors = ALL_COLORS.slice(0, colorCount) as Color[];

  const allBalls: Color[] = usedColors.flatMap(c => [c, c, c, c]);
  for (let i = allBalls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]];
  }

  const tubes: Tube[] = [];
  for (let i = 0; i < colorCount; i++) {
    tubes.push(allBalls.slice(i * 4, i * 4 + 4) as Tube);
  }
  for (let i = 0; i < emptyCount; i++) tubes.push([]);

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
