import type { MineGrid, MineCell } from './types';

const ROWS = 8, COLS = 8, MINES = 10;

function createEmptyGrid(): MineGrid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0,
    }))
  );
}

export function initGrid(firstR: number, firstC: number): MineGrid {
  const grid = createEmptyGrid();
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
    const key = `${r},${c}`;
    if (!grid[r][c].isMine && !forbidden.has(key)) {
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

export function reveal(grid: MineGrid, r: number, c: number): MineGrid {
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

export { ROWS, COLS };
