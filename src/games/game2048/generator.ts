import type { Grid, GameState } from './types';

export function createEmptyGrid(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}

export function addRandom(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (!grid[r][c]) empty.push([r, c]);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map(row => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

export function initGame(): GameState {
  let g = createEmptyGrid();
  g = addRandom(g);
  g = addRandom(g);
  return { grid: g, score: 0, won: false, over: false };
}

function slideRow(row: (number | null)[]): { result: (number | null)[]; gained: number } {
  const nums = row.filter(v => v !== null) as number[];
  let gained = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      merged.push(nums[i] * 2);
      gained += nums[i] * 2;
      i += 2;
    } else {
      merged.push(nums[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(0);
  return { result: merged.map(v => v === 0 ? null : v), gained };
}

export function move(state: GameState, dir: 'left' | 'right' | 'up' | 'down'): GameState {
  const { grid, score } = state;
  let rotated = grid.map(r => [...r]);
  let gained = 0;

  // Rotate so we always slide left
  if (dir === 'right') rotated = rotated.map(r => [...r].reverse());
  if (dir === 'up') rotated = rotated[0].map((_, c) => rotated.map(r => r[c]));
  if (dir === 'down') rotated = rotated[0].map((_, c) => rotated.map(r => r[c]).reverse());

  const result = rotated.map(row => {
    const { result: r, gained: g } = slideRow(row);
    gained += g;
    return r;
  });

  // Rotate back (inverse transforms)
  let final = result;
  if (dir === 'right') final = result.map(r => [...r].reverse());
  if (dir === 'up') final = result[0].map((_, c) => result.map(r => r[c]));
  // 'down' forward was 90° CW; inverse is 90° CCW = transpose then reverse row order
  if (dir === 'down') final = result[0].map((_, c) => result.map(r => r[c])).reverse();

  // Check if anything changed
  const changed = final.some((r, ri) => r.some((v, ci) => v !== grid[ri][ci]));
  if (!changed) return state;

  const newGrid = addRandom(final);
  const newScore = score + gained;
  const won = newGrid.some(r => r.some(v => v === 2048));
  const over = !hasValidMoves(newGrid);

  return { grid: newGrid, score: newScore, won, over };
}

function hasValidMoves(grid: Grid): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return true;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}
