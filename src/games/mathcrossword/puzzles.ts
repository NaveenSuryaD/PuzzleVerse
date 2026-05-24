export interface MathCrosswordPuzzle {
  // 3x5 grid: rows are equations
  // Format: [num, op, num, '=', num] for each row
  // And columns also form equations
  grid: (number | string | null)[][]; // null = black cell
  editableCells: [number, number][]; // cells user fills in
  solution: Record<string, number | string>; // "r,c" -> value
}

export const MATH_CROSSWORD_PUZZLES: MathCrosswordPuzzle[] = [
  {
    // 3 rows × 5 cols: row0: 3+4=7, row1: 2+5=7, row2: 5+9=14... simplified
    grid: [
      [3, '+', null, '=', 7],
      ['+', null, '+', null, '+'],
      [null, '+', 5, '=', null],
      ['=', null, '=', null, '='],
      [null, null, null, null, null],
    ],
    editableCells: [[0,2],[1,1],[1,3],[2,0],[2,4],[4,0],[4,2],[4,4]],
    solution: { '0,2':4, '1,1':'+', '1,3':'+', '2,0':1, '2,4':9, '4,0':4, '4,2':9, '4,4':16 },
  },
];
