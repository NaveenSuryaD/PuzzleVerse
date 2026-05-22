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
];

export const getGamesByCategory = (category: string): GameDefinition[] =>
  GAMES.filter(g => g.category === category);

export const getGamesByMVP = (maxPhase: number): GameDefinition[] =>
  GAMES.filter(g => g.mvpPhase <= maxPhase);
