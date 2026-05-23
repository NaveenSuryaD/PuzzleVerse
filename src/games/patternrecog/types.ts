export type Shape = 'circle' | 'square' | 'triangle' | 'diamond';
export type PatternColor = 'word' | 'number' | 'logic' | 'visual' | 'classic';
export type PatternType = 'color_cycle' | 'shape_cycle' | 'size_progression' | 'rotation' | 'count_progression';

export interface PatternItem {
  shape: Shape;
  color: PatternColor;
  size: number;    // 1-3
  count: number;   // 1-3 copies shown
}

export interface PatternPuzzle {
  sequence: PatternItem[];  // 4 items shown
  answer: PatternItem;      // correct 5th item
  choices: PatternItem[];   // 4 choices incl. answer
  type: PatternType;
}
