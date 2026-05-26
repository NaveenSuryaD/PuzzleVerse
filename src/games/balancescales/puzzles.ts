export interface ScalePuzzle {
  equations: {
    left: { shape: 'circle' | 'square' | 'triangle'; count: number }[];
    right: { shape: 'circle' | 'square' | 'triangle'; count: number }[];
  }[];
  question: 'circle' | 'square' | 'triangle';
  answer: number;
  choices: number[];
}

export const SCALE_PUZZLES: ScalePuzzle[] = [
  {
    equations: [
      { left: [{ shape: 'circle', count: 2 }], right: [{ shape: 'square', count: 1 }] },
      { left: [{ shape: 'square', count: 1 }], right: [{ shape: 'triangle', count: 4 }] },
    ],
    question: 'circle',
    answer: 2,
    choices: [1, 2, 3, 4],
  },
  {
    equations: [
      { left: [{ shape: 'circle', count: 3 }], right: [{ shape: 'square', count: 1 }, { shape: 'triangle', count: 1 }] },
      { left: [{ shape: 'triangle', count: 2 }], right: [{ shape: 'square', count: 1 }] },
    ],
    question: 'circle',
    answer: 1,
    choices: [1, 2, 3, 4],
  },
  {
    equations: [
      { left: [{ shape: 'circle', count: 1 }, { shape: 'square', count: 1 }], right: [{ shape: 'triangle', count: 5 }] },
      { left: [{ shape: 'circle', count: 2 }], right: [{ shape: 'square', count: 1 }] },
    ],
    question: 'square',
    answer: 3,
    choices: [2, 3, 4, 5],
  },
  {
    equations: [
      { left: [{ shape: 'square', count: 1 }], right: [{ shape: 'circle', count: 4 }] },
      { left: [{ shape: 'circle', count: 1 }], right: [{ shape: 'triangle', count: 3 }] },
    ],
    question: 'triangle',
    answer: 1,
    choices: [1, 2, 3, 4],
  },
  {
    equations: [
      { left: [{ shape: 'triangle', count: 3 }], right: [{ shape: 'square', count: 1 }] },
      { left: [{ shape: 'square', count: 2 }], right: [{ shape: 'circle', count: 1 }] },
    ],
    question: 'circle',
    answer: 6,
    choices: [4, 5, 6, 7],
  },
];
