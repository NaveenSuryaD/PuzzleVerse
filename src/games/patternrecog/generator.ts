import type { PatternPuzzle, PatternItem, Shape, PatternColor, PatternType } from './types';

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'diamond'];
const COLORS: PatternColor[] = ['word', 'number', 'logic', 'visual', 'classic'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function baseItem(overrides: Partial<PatternItem> = {}): PatternItem {
  return {
    shape: overrides.shape ?? rand(SHAPES),
    color: overrides.color ?? rand(COLORS),
    size: overrides.size ?? 2,
    count: overrides.count ?? 1,
  };
}

function shuffledChoices(correct: PatternItem, wrong: PatternItem[]): PatternItem[] {
  const all = [correct, ...wrong.slice(0, 3)];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function makeColorCycle(): PatternPuzzle {
  const colors: PatternColor[] = [];
  const start = randInt(0, COLORS.length - 1);
  for (let i = 0; i < 5; i++) colors.push(COLORS[(start + i) % COLORS.length]);
  const shape = rand(SHAPES);
  const seq = colors.slice(0, 4).map(color => baseItem({ shape, color }));
  const answer = baseItem({ shape, color: colors[4] });
  const wrongs = COLORS.filter(c => c !== colors[4]).map(color => baseItem({ shape, color }));
  return { sequence: seq, answer, choices: shuffledChoices(answer, wrongs), type: 'color_cycle' };
}

function makeShapeCycle(): PatternPuzzle {
  const start = randInt(0, SHAPES.length - 1);
  const color = rand(COLORS);
  const seq = Array.from({ length: 4 }, (_, i) => baseItem({ shape: SHAPES[(start + i) % SHAPES.length], color }));
  const answer = baseItem({ shape: SHAPES[(start + 4) % SHAPES.length], color });
  const wrongs = SHAPES.filter(s => s !== answer.shape).map(shape => baseItem({ shape, color }));
  return { sequence: seq, answer, choices: shuffledChoices(answer, wrongs), type: 'shape_cycle' };
}

function makeSizeProgression(): PatternPuzzle {
  const shape = rand(SHAPES);
  const color = rand(COLORS);
  // sizes: 1, 1, 2, 2 → answer is 3
  const sizes = [1, 1, 2, 2, 3];
  const seq = sizes.slice(0, 4).map(size => baseItem({ shape, color, size }));
  const answer = baseItem({ shape, color, size: 3 });
  const wrongs = [1, 2].map(size => baseItem({ shape, color, size }));
  wrongs.push(baseItem({ shape, color: rand(COLORS.filter(c => c !== color)), size: 3 }));
  return { sequence: seq, answer, choices: shuffledChoices(answer, wrongs), type: 'size_progression' };
}

function makeCountProgression(): PatternPuzzle {
  const shape = rand(SHAPES);
  const color = rand(COLORS);
  const seq = [1, 1, 2, 2].map(count => baseItem({ shape, color, count }));
  const answer = baseItem({ shape, color, count: 3 });
  const wrongs = [
    baseItem({ shape, color, count: 1 }),
    baseItem({ shape, color, count: 2 }),
    baseItem({ shape: rand(SHAPES.filter(s => s !== shape)), color, count: 3 }),
  ];
  return { sequence: seq, answer, choices: shuffledChoices(answer, wrongs), type: 'count_progression' };
}

const MAKERS = [makeColorCycle, makeShapeCycle, makeSizeProgression, makeCountProgression];

export function generatePattern(): PatternPuzzle {
  return MAKERS[Math.floor(Math.random() * MAKERS.length)]();
}

export function generatePatterns(count = 8): PatternPuzzle[] {
  return Array.from({ length: count }, generatePattern);
}
