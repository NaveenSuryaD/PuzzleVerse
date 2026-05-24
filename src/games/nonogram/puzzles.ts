export interface NonogramPuzzle {
  name: string;
  rowClues: number[][];
  colClues: number[][];
  solution: boolean[][];
}

export const NONOGRAM_PUZZLES: NonogramPuzzle[] = [
  {
    name: 'Heart',
    rowClues: [[1,1],[3],[5],[3],[1]],
    colClues: [[1],[3],[5],[3],[1]],
    solution: [
      [false,true,false,true,false],
      [false,true,true,true,false],
      [true,true,true,true,true],
      [false,true,true,true,false],
      [false,false,true,false,false],
    ],
  },
  {
    name: 'House',
    rowClues: [[1],[3],[5],[1,1],[5]],
    colClues: [[3],[3],[5],[3],[3]],
    solution: [
      [false,false,true,false,false],
      [false,true,true,true,false],
      [true,true,true,true,true],
      [true,false,true,false,true],
      [true,true,true,true,true],
    ],
  },
  {
    name: 'X',
    rowClues: [[1,1],[1,1],[1],[1,1],[1,1]],
    colClues: [[1,1],[1,1],[1],[1,1],[1,1]],
    solution: [
      [true,false,false,false,true],
      [false,true,false,true,false],
      [false,false,true,false,false],
      [false,true,false,true,false],
      [true,false,false,false,true],
    ],
  },
];
