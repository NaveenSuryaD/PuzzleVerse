export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SudokuPuzzle {
  board: number[][];       // 0 = empty
  solution: number[][];
  difficulty: Difficulty;
  givens: boolean[][];     // true = original given cell (immutable)
}

function createEmptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false;
    }
  }
  return true;
}

function solve(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function copyBoard(board: number[][]): number[][] {
  return board.map(row => [...row]);
}

function countSolutions(board: number[][], limit = 2): number {
  let count = 0;
  function bt(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (bt()) { /* continue */ }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }
  bt();
  return count;
}

const GIVENS: Record<Difficulty, number> = {
  easy:   36,
  medium: 27,
  hard:   22,
};

export function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
  const solution = createEmptyBoard();
  solve(solution);

  const board = copyBoard(solution);
  const givensCount = GIVENS[difficulty];
  let cellsToRemove = 81 - givensCount;

  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  for (const [r, c] of positions) {
    if (cellsToRemove === 0) break;
    const backup = board[r][c];
    board[r][c] = 0;
    const test = copyBoard(board);
    if (countSolutions(test, 2) !== 1) {
      board[r][c] = backup;
    } else {
      cellsToRemove--;
    }
  }

  const givens: boolean[][] = board.map(row => row.map(v => v !== 0));

  return { board: copyBoard(board), solution, difficulty, givens };
}
