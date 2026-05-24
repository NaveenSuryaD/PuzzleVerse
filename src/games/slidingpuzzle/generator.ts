import type { TileGrid } from './types';

export function solvedGrid(): TileGrid {
  const grid: TileGrid = [];
  let n = 1;
  for (let r = 0; r < 4; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < 4; c++) {
      row.push(n === 16 ? null : n);
      n++;
    }
    grid.push(row);
  }
  return grid;
}

export function isSolved(grid: TileGrid): boolean {
  let n = 1;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const expected = n === 16 ? null : n;
      if (grid[r][c] !== expected) return false;
      n++;
    }
  }
  return true;
}

export function findEmpty(grid: TileGrid): [number, number] {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === null) return [r, c];
  return [3, 3];
}

export function shuffle(grid: TileGrid, moves = 200): TileGrid {
  let g = grid.map(r => [...r]);
  let [er, ec] = findEmpty(g);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let i = 0; i < moves; i++) {
    const valid = dirs.filter(([dr, dc]) => {
      const nr = er + dr; const nc = ec + dc;
      return nr >= 0 && nr < 4 && nc >= 0 && nc < 4;
    });
    const [dr, dc] = valid[Math.floor(Math.random() * valid.length)];
    const nr = er + dr; const nc = ec + dc;
    g[er][ec] = g[nr][nc];
    g[nr][nc] = null;
    er = nr; ec = nc;
  }
  return g;
}
