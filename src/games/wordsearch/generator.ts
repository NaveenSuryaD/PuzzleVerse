import type { Direction, PlacedWord, WordSearchPuzzle, CellCoord } from './types';
import { DIR_VECTORS } from './types';
import { WORD_THEMES } from './themes';

const FILL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const GRID_SIZE = 10;
const MAX_WORDS = 10;
const MAX_PLACE_ATTEMPTS = 80;

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tryPlace(grid: string[][], word: string, size: number): PlacedWord | null {
  const dirs = shuffled([0, 1, 2, 3, 4, 5, 6, 7] as Direction[]);

  for (const dir of dirs) {
    const [dr, dc] = DIR_VECTORS[dir];

    const rowMin = dr < 0 ? word.length - 1 : 0;
    const rowMax = dr > 0 ? size - word.length : size - 1;
    const colMin = dc < 0 ? word.length - 1 : 0;
    const colMax = dc > 0 ? size - word.length : size - 1;

    if (rowMin > rowMax || colMin > colMax) continue;

    for (let attempt = 0; attempt < MAX_PLACE_ATTEMPTS; attempt++) {
      const startRow = rowMin + Math.floor(Math.random() * (rowMax - rowMin + 1));
      const startCol = colMin + Math.floor(Math.random() * (colMax - colMin + 1));

      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dr;
        const c = startCol + i * dc;
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
          ok = false;
          break;
        }
      }

      if (ok) {
        for (let i = 0; i < word.length; i++) {
          grid[startRow + i * dr][startCol + i * dc] = word[i];
        }
        return { word, startRow, startCol, direction: dir, found: false };
      }
    }
  }
  return null;
}

export function generateWordSearch(themeIndex?: number): WordSearchPuzzle {
  const idx = themeIndex ?? Math.floor(Math.random() * WORD_THEMES.length);
  const theme = WORD_THEMES[idx % WORD_THEMES.length];

  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
  const placed: PlacedWord[] = [];

  const wordsToTry = shuffled(theme.words.filter(w => w.length <= GRID_SIZE));

  for (const word of wordsToTry) {
    if (placed.length >= MAX_WORDS) break;
    const pw = tryPlace(grid, word, GRID_SIZE);
    if (pw) placed.push(pw);
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) {
        grid[r][c] = FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)];
      }
    }
  }

  return {
    grid,
    words: placed,
    theme: theme.name,
    themeEmoji: theme.emoji,
    gridSize: GRID_SIZE,
  };
}

// Compute all cells in a straight line from start to end, snapped to 8 directions.
export function getCellsOnLine(start: CellCoord, end: CellCoord, gridSize: number): CellCoord[] {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;

  if (dRow === 0 && dCol === 0) return [start];

  const angle = Math.atan2(dRow, dCol);
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

  const dc = Math.round(Math.cos(snappedAngle));
  const dr = Math.round(Math.sin(snappedAngle));

  // Chebyshev distance = steps along the snapped direction
  const length = Math.max(Math.abs(dRow), Math.abs(dCol));

  const cells: CellCoord[] = [];
  for (let i = 0; i <= length; i++) {
    const r = start.row + i * dr;
    const c = start.col + i * dc;
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

// Check if the selected cells spell any unfound word (forward or reversed).
export function checkWordSelection(
  selectedCells: CellCoord[],
  grid: string[][],
  words: PlacedWord[],
): string | null {
  if (selectedCells.length < 2) return null;

  const letters = selectedCells.map(c => grid[c.row][c.col]).join('');
  const reversed = letters.split('').reverse().join('');

  for (const pw of words) {
    if (!pw.found && (pw.word === letters || pw.word === reversed)) {
      return pw.word;
    }
  }
  return null;
}
