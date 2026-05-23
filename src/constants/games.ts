export interface GameDefinition {
  id: string;
  name: string;
  emoji: string;
  category: 'word' | 'number' | 'logic' | 'visual' | 'classic';
  tagline: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'variable';
  estimatedMinutes: number;
  isUnlimited: boolean;
  hasDailyMode: boolean;
  mvpPhase: number;
}

export const GAMES: GameDefinition[] = [
  {
    id: 'sudoku',
    name: 'Sudoku Classic',
    emoji: '🔢',
    category: 'number',
    tagline: 'Fill the 9×9 grid with digits 1–9',
    description: 'Each row, column, and 3×3 box must contain digits 1–9 exactly once. No repeats allowed.',
    difficulty: 'variable',
    estimatedMinutes: 10,
    isUnlimited: true,
    hasDailyMode: true,
    mvpPhase: 1,
  },
  {
    id: 'word-guess',
    name: 'Word Guess',
    emoji: '🟩',
    category: 'word',
    tagline: 'Guess the hidden word in 6 tries',
    description: '5-letter word. Green = right letter, right spot. Yellow = right letter, wrong spot. Gray = not in the word. 6 attempts to get it.',
    difficulty: 'variable',
    estimatedMinutes: 3,
    isUnlimited: true,
    hasDailyMode: true,
    mvpPhase: 2,
  },
  {
    id: 'word-search',
    name: 'Word Search',
    emoji: '🔍',
    category: 'word',
    tagline: 'Find all hidden words in the grid',
    description: 'Letters hide 10 themed words going horizontal, vertical, or diagonal. Drag from the first letter to the last to find them.',
    difficulty: 'easy',
    estimatedMinutes: 5,
    isUnlimited: true,
    hasDailyMode: false,
    mvpPhase: 4,
  },
  {
    id: 'group-it',
    name: 'Group It',
    emoji: '🔗',
    category: 'word',
    tagline: 'Find four groups of four related words',
    description: '16 words, 4 hidden categories. Find which four words share a connection. Yellow is easiest, purple is trickiest. Four mistakes allowed.',
    difficulty: 'variable',
    estimatedMinutes: 5,
    isUnlimited: false,
    hasDailyMode: true,
    mvpPhase: 5,
  },
  {
    id: 'hangman',
    name: 'Hangman',
    emoji: '🪢',
    category: 'word',
    tagline: 'Guess the word before the hangman is drawn',
    description: 'Letters hide a secret word. Guess one letter at a time — six wrong guesses and it\'s over. Can you crack the word in time?',
    difficulty: 'variable',
    estimatedMinutes: 3,
    isUnlimited: true,
    hasDailyMode: false,
    mvpPhase: 6,
  },
  {
    id: 'number-bonds',
    name: 'Number Bonds',
    emoji: '🔢',
    category: 'number',
    tagline: 'Find pairs of numbers that sum to the target',
    description: 'Tap two numbers that add up to the target. Clear the whole board to win. Simple math, satisfying combos.',
    difficulty: 'easy',
    estimatedMinutes: 3,
    isUnlimited: true,
    hasDailyMode: false,
    mvpPhase: 6,
  },
  {
    id: 'crossword-mini',
    name: 'Mini Crossword',
    emoji: '✏️',
    category: 'word',
    tagline: 'Classic crossword in a compact 5×5 grid',
    description: 'Fill in across and down answers based on clues. Tap a cell, pick a direction, and type. Complete the grid to win.',
    difficulty: 'medium',
    estimatedMinutes: 5,
    isUnlimited: true,
    hasDailyMode: true,
    mvpPhase: 7,
  },
  {
    id: 'pattern-recog',
    name: 'Pattern Match',
    emoji: '🔭',
    category: 'logic',
    tagline: 'What comes next in the pattern?',
    description: 'A sequence of shapes and colors. Study the pattern and pick the correct next item from four choices.',
    difficulty: 'variable',
    estimatedMinutes: 4,
    isUnlimited: true,
    hasDailyMode: false,
    mvpPhase: 7,
  },
  {
    id: 'sequence-fill',
    name: 'Sequence Fill',
    emoji: '🌀',
    category: 'number',
    tagline: 'Complete the number sequence',
    description: 'Arithmetic, geometric, Fibonacci, squares — fill the blanks to complete each number pattern. 8 sequences per round.',
    difficulty: 'variable',
    estimatedMinutes: 4,
    isUnlimited: true,
    hasDailyMode: false,
    mvpPhase: 7,
  },
  {
    id: 'math-sprint',
    name: 'Math Sprint',
    emoji: '⚡',
    category: 'number',
    tagline: 'Answer 20 math questions as fast as possible',
    description: 'Rapid-fire arithmetic. Addition, subtraction, multiplication, division. Wrong answers cost you time. How fast can you go?',
    difficulty: 'variable',
    estimatedMinutes: 2,
    isUnlimited: true,
    hasDailyMode: false,
    mvpPhase: 7,
  },
];

export const getGamesByCategory = (category: string): GameDefinition[] =>
  GAMES.filter(g => g.category === category);

export const getGamesByMVP = (maxPhase: number): GameDefinition[] =>
  GAMES.filter(g => g.mvpPhase <= maxPhase);
