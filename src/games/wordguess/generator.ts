import { WORD_BANK, WORD_SET } from './wordBank';
import { LetterState } from './types';
import { getDailySeed, seededRandom } from '../../utils/dailySeed';

// First 2,315 words are the curated target words (used for daily + unlimited picks)
// The remaining words extend the valid vocabulary for guess validation
const TARGET_COUNT = 2315;
export const TARGET_WORDS = WORD_BANK.slice(0, TARGET_COUNT);

export const pickDailyWord = (dateStr?: string): string => {
  const seed = getDailySeed('word-guess', dateStr);
  return TARGET_WORDS[seed % TARGET_WORDS.length];
};

export const pickRandomWord = (seed?: number): string => {
  if (seed !== undefined) {
    const rand = seededRandom(seed);
    return TARGET_WORDS[Math.floor(rand() * TARGET_WORDS.length)];
  }
  return TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
};

// Accepts both target and obscure words as valid guesses
export const isValidWord = (word: string): boolean => WORD_SET.has(word.toLowerCase());

export const evaluateGuess = (guess: string, answer: string): LetterState[] => {
  const result: LetterState[] = Array(5).fill('absent');
  const answerLetters = answer.toLowerCase().split('');
  const guessLetters = guess.toLowerCase().split('');

  // Pass 1: correct positions
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = 'correct';
      answerLetters[i] = '#';
      guessLetters[i] = '#';
    }
  }

  // Pass 2: present but wrong position
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === '#') continue;
    const idx = answerLetters.indexOf(guessLetters[i]);
    if (idx !== -1) {
      result[i] = 'present';
      answerLetters[idx] = '#';
    }
  }

  return result;
};

export const generateShareText = (
  attempt: number,
  maxAttempts: number,
  evaluations: LetterState[][],
  won: boolean,
): string => {
  const grid = evaluations
    .map(row =>
      row.map(s => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛')).join('')
    )
    .join('\n');
  const score = won ? `${attempt}/${maxAttempts}` : `X/${maxAttempts}`;
  return `PuzzleVerse – Word Guess\n${score}\n\n${grid}`;
};
