const MAZE_SIZE = 11; // odd number for proper maze

export interface MazeData {
  cells: boolean[][]; // true = wall, false = passage
  size: number;
}

export function generateMaze(): MazeData {
  const size = MAZE_SIZE;
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(true));

  function carve(r: number, c: number) {
    const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
    cells[r][c] = false;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr > 0 && nr < size - 1 && nc > 0 && nc < size - 1 && cells[nr][nc]) {
        cells[r + dr / 2][c + dc / 2] = false;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  cells[0][1] = false; // entrance
  cells[size - 1][size - 2] = false; // exit

  return { cells, size };
}

export { MAZE_SIZE };
