import { WORD_BANK } from './wordBank';
import { LetterState } from './types';
import { getDailySeed, seededRandom } from '../../utils/dailySeed';

// First 2,315 words are the curated target words (used for daily + unlimited picks)
// The remaining words extend the valid vocabulary for guess validation
const TARGET_COUNT = 2315;

// Lazy-initialised slices — avoid allocating three sub-arrays at module load time
let _targetWords: string[] | undefined;
let _easyWords: string[] | undefined;
let _hardWords: string[] | undefined;
const getTargetWords = (): string[] => (_targetWords ??= WORD_BANK.slice(0, TARGET_COUNT));
const getEasyWords = (): string[] => (_easyWords ??= WORD_BANK.slice(0, 500));
const getHardWords = (): string[] => (_hardWords ??= WORD_BANK.slice(1500, TARGET_COUNT));

// Binary search replaces `new Set(WORD_BANK)` — no 18 K-entry Set allocated at startup.
// WORD_BANK is sorted alphabetically so binary search is correct here.
function binarySearch(arr: string[], target: string): boolean {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] === target) return true;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

export const pickDailyWord = (dateStr?: string): string => {
  const seed = getDailySeed('word-guess', dateStr);
  const words = getTargetWords();
  return words[seed % words.length];
};

export const pickRandomWord = (seed?: number): string => {
  const words = getTargetWords();
  if (seed !== undefined) {
    const rand = seededRandom(seed);
    return words[Math.floor(rand() * words.length)];
  }
  return words[Math.floor(Math.random() * words.length)];
};

export type WordDifficulty = 'easy' | 'medium' | 'hard';

export const pickWordByDifficulty = (difficulty: WordDifficulty): string => {
  if (difficulty === 'easy') {
    const words = getEasyWords();
    return words[Math.floor(Math.random() * words.length)];
  }
  if (difficulty === 'hard') {
    const words = getHardWords();
    return words[Math.floor(Math.random() * words.length)];
  }
  const words = getTargetWords();
  return words[Math.floor(Math.random() * words.length)];
};

export const isValidWord = (word: string): boolean =>
  binarySearch(WORD_BANK, word.toLowerCase());

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
