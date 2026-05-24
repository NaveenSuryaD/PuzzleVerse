import type { MineGrid } from './types';

export type MsDifficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_CONFIG: Record<MsDifficulty, { rows: number; cols: number; mines: number }> = {
  easy:   { rows: 8,  cols: 8,  mines: 10 },
  medium: { rows: 10, cols: 10, mines: 20 },
  hard:   { rows: 12, cols: 12, mines: 35 },
};

export function initGrid(firstR: number, firstC: number, diff: MsDifficulty = 'easy'): MineGrid {
  const { rows: ROWS, cols: COLS, mines: MINES } = DIFFICULTY_CONFIG[diff];

  const grid: MineGrid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0,
    }))
  );

  const forbidden = new Set<string>();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = firstR + dr, nc = firstC + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS)
        forbidden.add(`${nr},${nc}`);
    }

  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!grid[r][c].isMine && !forbidden.has(`${r},${c}`)) {
      grid[r][c].isMine = true;
      placed++;
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].isMine) count++;
          }
        grid[r][c].adjacentMines = count;
      }
    }
  }
  return grid;
}

export function reveal(grid: MineGrid, r: number, c: number, diff: MsDifficulty = 'easy'): MineGrid {
  const { rows: ROWS, cols: COLS } = DIFFICULTY_CONFIG[diff];
  const next = grid.map(row => row.map(cell => ({ ...cell })));
  const queue: [number, number][] = [[r, c]];
  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    const cell = next[cr][cc];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;
    cell.isRevealed = true;
    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          queue.push([cr + dr, cc + dc]);
    }
  }
  return next;
}

export function isWon(grid: MineGrid): boolean {
  return grid.every(row => row.every(c => c.isMine || c.isRevealed));
}
