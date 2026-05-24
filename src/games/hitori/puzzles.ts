export interface HitoriPuzzle {
  grid: number[][];
  solution: boolean[][]; // true = shaded
}

export const HITORI_PUZZLES: HitoriPuzzle[] = [
  {
    grid: [
      [1,2,3,2,1],
      [3,1,2,4,3],
      [2,4,1,3,2],
      [1,3,4,2,4],
      [4,1,2,1,3],
    ],
    solution: [
      [false,false,false,true,true],
      [true,false,false,false,true],
      [false,true,false,false,true],
      [false,false,true,false,true],
      [true,false,false,true,false],
    ],
  },
];
