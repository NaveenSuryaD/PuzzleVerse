import type { CrosswordPuzzle } from './types';

function makePuzzle(
  id: number,
  flat: string,
  clues: Array<{ number: number; direction: 'across' | 'down'; clue: string }>,
  title?: string,
): CrosswordPuzzle {
  const sol: string[][] = [];
  for (let r = 0; r < 5; r++) {
    sol.push(flat.slice(r * 5, r * 5 + 5).split(''));
  }

  const nums: (number | undefined)[][] = Array.from({ length: 5 }, () => Array(5).fill(undefined));
  let n = 1;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (sol[r][c] === '#') continue;
      const startA = (c === 0 || sol[r][c - 1] === '#') && c + 1 < 5 && sol[r][c + 1] !== '#';
      const startD = (r === 0 || sol[r - 1][c] === '#') && r + 1 < 5 && sol[r + 1][c] !== '#';
      if (startA || startD) nums[r][c] = n++;
    }
  }

  const entries = clues.map(({ number: num, direction, clue }) => {
    let row = -1, col = -1;
    outer: for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (nums[r][c] === num) { row = r; col = c; break outer; }
      }
    }
    let answer = '';
    if (direction === 'across') {
      for (let cc = col; cc < 5 && sol[row][cc] !== '#'; cc++) answer += sol[row][cc];
    } else {
      for (let rr = row; rr < 5 && sol[rr][col] !== '#'; rr++) answer += sol[rr][col];
    }
    return { number: num, clue, answer, row, col, direction, length: answer.length };
  });

  const grid: string[][] = sol.map(row => row.map(c => (c === '#' ? '#' : '')));
  return { id, grid, solution: sol, clues: entries, title };
}

export const CROSSWORD_PUZZLES: CrosswordPuzzle[] = [
  makePuzzle(1,
    'BRAVE' + 'RAMEN' + 'ARROW' + 'VILLA' + 'ESSAY',
    [
      { number: 1, direction: 'across', clue: 'Courageous' },
      { number: 2, direction: 'across', clue: 'Japanese noodle soup' },
      { number: 3, direction: 'across', clue: 'Bow and ___' },
      { number: 4, direction: 'across', clue: 'Luxury country home' },
      { number: 5, direction: 'across', clue: 'Written composition' },
      { number: 1, direction: 'down', clue: 'Carry (past tense of bear)' },
      { number: 2, direction: 'down', clue: 'Wander aimlessly' },
      { number: 3, direction: 'down', clue: 'Put in place' },
      { number: 4, direction: 'down', clue: 'Gentle breeze' },
      { number: 5, direction: 'down', clue: 'Observe, see' },
    ],
    'Courage',
  ),
  makePuzzle(2,
    'CHESS' + 'HONEY' + 'EVENT' + 'STOVE' + 'SYNTH',
    [
      { number: 1, direction: 'across', clue: 'Board game with kings and queens' },
      { number: 2, direction: 'across', clue: 'Bee product' },
      { number: 3, direction: 'across', clue: 'Happening, occasion' },
      { number: 4, direction: 'across', clue: 'Kitchen cooking appliance' },
      { number: 5, direction: 'across', clue: 'Electronic music keyboard' },
      { number: 1, direction: 'down', clue: 'Treasure container' },
      { number: 2, direction: 'down', clue: 'Home, dwelling' },
      { number: 3, direction: 'down', clue: 'Serpent' },
      { number: 4, direction: 'down', clue: 'Opposite of odd' },
      { number: 5, direction: 'down', clue: 'Body part for sight' },
    ],
    'Games & Home',
  ),
  makePuzzle(3,
    'GLOBE' + 'LINER' + 'OLIVE' + 'BLEND' + 'EVENT',
    [
      { number: 1, direction: 'across', clue: 'Spherical world map' },
      { number: 2, direction: 'across', clue: 'Ocean cruise ship' },
      { number: 3, direction: 'across', clue: 'Green Mediterranean fruit' },
      { number: 4, direction: 'across', clue: 'Mix together smoothly' },
      { number: 5, direction: 'across', clue: 'Occasion or happening' },
      { number: 1, direction: 'down', clue: 'Admire, gaze at' },
      { number: 2, direction: 'down', clue: 'Illumination' },
      { number: 3, direction: 'down', clue: 'Opposite of off' },
      { number: 4, direction: 'down', clue: 'Exist, be present' },
      { number: 5, direction: 'down', clue: 'Way in, not exit' },
    ],
    'World Travels',
  ),
  makePuzzle(4,
    'STORM' + 'TOWER' + 'OLIVE' + 'RIVER' + 'METRO',
    [
      { number: 1, direction: 'across', clue: 'Violent weather' },
      { number: 2, direction: 'across', clue: 'Tall structure' },
      { number: 3, direction: 'across', clue: 'Green salad fruit' },
      { number: 4, direction: 'across', clue: 'Flowing waterway' },
      { number: 5, direction: 'across', clue: 'City underground train' },
      { number: 1, direction: 'down', clue: 'Pressure unit (abbrev.)' },
      { number: 2, direction: 'down', clue: 'Owl sound' },
      { number: 3, direction: 'down', clue: 'Stage performance' },
      { number: 4, direction: 'down', clue: 'Boat paddle' },
      { number: 5, direction: 'down', clue: 'Not him' },
    ],
    'City & Nature',
  ),
  makePuzzle(5,
    'CAMEL' + 'ARENA' + 'MAPLE' + 'ELBOW' + 'LOVER',
    [
      { number: 1, direction: 'across', clue: 'Desert hump animal' },
      { number: 2, direction: 'across', clue: 'Sports stadium' },
      { number: 3, direction: 'across', clue: '___ syrup topping' },
      { number: 4, direction: 'across', clue: 'Arm joint' },
      { number: 5, direction: 'across', clue: 'Romantic admirer' },
      { number: 1, direction: 'down', clue: 'Protective shell material' },
      { number: 2, direction: 'down', clue: 'Time period, decade' },
      { number: 3, direction: 'down', clue: 'Male parent' },
      { number: 4, direction: 'down', clue: 'Legal doc, rarely used' },
      { number: 5, direction: 'down', clue: 'Pick up, raise' },
    ],
    'Desert & Forest',
  ),
  makePuzzle(6,
    'CRISP' + 'RURAL' + 'INCUR' + 'SPARE' + 'PLANT',
    [
      { number: 1, direction: 'across', clue: 'Crunchy and fresh' },
      { number: 2, direction: 'across', clue: 'Relating to the countryside' },
      { number: 3, direction: 'across', clue: 'Bring upon oneself' },
      { number: 4, direction: 'across', clue: 'Extra, to save' },
      { number: 5, direction: 'across', clue: 'Greenery; to sow seeds' },
      { number: 1, direction: 'down', clue: 'Crime, transgression' },
      { number: 2, direction: 'down', clue: 'Dried grape' },
      { number: 3, direction: 'down', clue: 'Narrative, account' },
      { number: 4, direction: 'down', clue: 'Skin irritation' },
      { number: 5, direction: 'down', clue: 'Primate; mimic' },
    ],
    'Fresh Start',
  ),
  makePuzzle(7,
    'DREAM' + 'ROBIN' + 'EVADE' + 'ARMOR' + 'MERRY',
    [
      { number: 1, direction: 'across', clue: 'Sleep vision' },
      { number: 2, direction: 'across', clue: 'Red-breasted bird' },
      { number: 3, direction: 'across', clue: 'Escape from, dodge' },
      { number: 4, direction: 'across', clue: 'Knight\'s metal suit' },
      { number: 5, direction: 'across', clue: 'Cheerful, happy' },
      { number: 1, direction: 'down', clue: 'Direction of sunrise' },
      { number: 2, direction: 'down', clue: 'Give a speech' },
      { number: 3, direction: 'down', clue: 'Grown-up' },
      { number: 4, direction: 'down', clue: 'Boundary edge' },
      { number: 5, direction: 'down', clue: 'Sky brightness' },
    ],
    'Birds & Knights',
  ),
  makePuzzle(8,
    'PILOT' + 'IONIC' + 'LLAMA' + 'OMEGA' + 'TAKEN',
    [
      { number: 1, direction: 'across', clue: 'Airplane captain' },
      { number: 2, direction: 'across', clue: 'Greek column style' },
      { number: 3, direction: 'across', clue: 'South American pack animal' },
      { number: 4, direction: 'across', clue: 'Last Greek letter' },
      { number: 5, direction: 'across', clue: 'Grabbed, seized' },
      { number: 1, direction: 'down', clue: 'Location, place' },
      { number: 2, direction: 'down', clue: 'Small pest insect' },
      { number: 3, direction: 'down', clue: 'Illumination source' },
      { number: 4, direction: 'down', clue: 'Race, compete' },
      { number: 5, direction: 'down', clue: 'Woven floor covering' },
    ],
    'Greek & Nature',
  ),
  makePuzzle(9,
    'FABLE' + 'LASER' + 'ABBEY' + 'STEEL' + 'HERON',
    [
      { number: 1, direction: 'across', clue: 'Moral short story' },
      { number: 2, direction: 'across', clue: 'Focused light beam' },
      { number: 3, direction: 'across', clue: 'Monastery or convent' },
      { number: 4, direction: 'across', clue: 'Strong iron alloy' },
      { number: 5, direction: 'across', clue: 'Long-legged wading bird' },
      { number: 1, direction: 'down', clue: 'Flat fish' },
      { number: 2, direction: 'down', clue: 'Lazy inaction' },
      { number: 3, direction: 'down', clue: 'Ground grain loaf' },
      { number: 4, direction: 'down', clue: 'Edge, ridge' },
      { number: 5, direction: 'down', clue: 'Egg-laying reptile' },
    ],
    'Legends & Light',
  ),
  makePuzzle(10,
    'BRAVE' + 'LINER' + 'ULTRA' + 'NOVEL' + 'TREAD',
    [
      { number: 1, direction: 'across', clue: 'Bold, fearless' },
      { number: 2, direction: 'across', clue: 'Ocean cruise ship' },
      { number: 3, direction: 'across', clue: 'Extreme, beyond normal' },
      { number: 4, direction: 'across', clue: 'Long fiction book; new' },
      { number: 5, direction: 'across', clue: 'Step carefully; tire surface' },
      { number: 1, direction: 'down', clue: 'Carry (past tense of bear)' },
      { number: 2, direction: 'down', clue: 'Illumination' },
      { number: 3, direction: 'down', clue: 'Volcanic rock' },
      { number: 4, direction: 'down', clue: 'Grapevine' },
      { number: 5, direction: 'down', clue: 'Conclude, end' },
    ],
    'Bold Stories',
  ),
];

export function getDailyCrossword(): CrosswordPuzzle {
  return CROSSWORD_PUZZLES[Math.floor(Date.now() / 86400000) % CROSSWORD_PUZZLES.length];
}

export function getRandomCrossword(excludeId?: number): CrosswordPuzzle {
  const pool = excludeId !== undefined
    ? CROSSWORD_PUZZLES.filter(p => p.id !== excludeId)
    : CROSSWORD_PUZZLES;
  return pool[Math.floor(Math.random() * pool.length)];
}
