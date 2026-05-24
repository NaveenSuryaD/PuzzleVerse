import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameProgress {
  gameId: string;
  gamesPlayed: number;
  gamesWon: number;
  bestTimeSeconds: number | null;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string;
  totalHintsUsed: number;
  completedDailyDates: string[];
  guessDistribution: number[];    // [count at 1 guess, 2, 3, 4, 5, 6] — WordGuess only
  cleanSolves: number;            // wins with 0 hints
}

interface ProgressState {
  games: Record<string, GameProgress>;
  overallStreak: number;
  lastOverallPlayDate: string;
  achievements: string[];
  favoritedGames: string[];
  recordGame: (gameId: string, won: boolean, timeSeconds: number, hintsUsed?: number, guessCount?: number) => void;
  recordDailyComplete: (gameId: string, date: string, won: boolean) => void;
  incrementHints: (gameId: string) => void;
  toggleFavorite: (gameId: string) => void;
  unlockAchievement: (achievementId: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10) === dateStr;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      games: {},
      overallStreak: 0,
      lastOverallPlayDate: '',
      achievements: [],
      favoritedGames: [],

      recordGame: (gameId, won, timeSeconds, hintsUsed = 0, guessCount) => {
        const state = get();
        const existing: GameProgress = state.games[gameId] ?? {
          gameId,
          gamesPlayed: 0,
          gamesWon: 0,
          bestTimeSeconds: null,
          currentStreak: 0,
          maxStreak: 0,
          lastPlayedDate: '',
          totalHintsUsed: 0,
          completedDailyDates: [],
          guessDistribution: [0,0,0,0,0,0],
          cleanSolves: 0,
        };
        const dist = existing.guessDistribution ?? [0,0,0,0,0,0];
        if (won && guessCount !== undefined && guessCount >= 1 && guessCount <= 6) {
          dist[guessCount - 1] = (dist[guessCount - 1] ?? 0) + 1;
        }
        const todayStr = today();

        // Per-game streak
        const gameStreakContinues = existing.lastPlayedDate === todayStr || isYesterday(existing.lastPlayedDate);
        const newStreak = won ? (gameStreakContinues ? existing.currentStreak + 1 : 1) : 0;

        const updated: GameProgress = {
          ...existing,
          completedDailyDates: existing.completedDailyDates ?? [],
          guessDistribution: dist,
          gamesPlayed: existing.gamesPlayed + 1,
          gamesWon: existing.gamesWon + (won ? 1 : 0),
          cleanSolves: (existing.cleanSolves ?? 0) + (won && hintsUsed === 0 ? 1 : 0),
          totalHintsUsed: existing.totalHintsUsed + hintsUsed,
          bestTimeSeconds: won
            ? existing.bestTimeSeconds === null
              ? timeSeconds
              : Math.min(existing.bestTimeSeconds, timeSeconds)
            : existing.bestTimeSeconds,
          currentStreak: newStreak,
          maxStreak: Math.max(existing.maxStreak, newStreak),
          lastPlayedDate: todayStr,
        };

        // Overall streak: count days in a row ANY game was played
        const alreadyPlayedToday = state.lastOverallPlayDate === todayStr;
        const overallContinues = alreadyPlayedToday || isYesterday(state.lastOverallPlayDate);
        const newOverallStreak = alreadyPlayedToday
          ? state.overallStreak
          : overallContinues
            ? state.overallStreak + 1
            : 1;

        set({
          games: { ...state.games, [gameId]: updated },
          overallStreak: newOverallStreak,
          lastOverallPlayDate: todayStr,
        });
      },

      recordDailyComplete: (gameId, date, won) => {
        if (!won) return;  // only track wins
        const state = get();
        const existing: GameProgress = state.games[gameId] ?? {
          gameId,
          gamesPlayed: 0,
          gamesWon: 0,
          bestTimeSeconds: null,
          currentStreak: 0,
          maxStreak: 0,
          lastPlayedDate: '',
          totalHintsUsed: 0,
          completedDailyDates: [],
        };
        const completedDailyDates = existing.completedDailyDates ?? [];
        if (completedDailyDates.includes(date)) return;  // already recorded
        set({
          games: {
            ...state.games,
            [gameId]: { ...existing, completedDailyDates: [...completedDailyDates, date] },
          },
        });
      },

      incrementHints: (gameId) => {
        const state = get();
        const existing = state.games[gameId];
        if (!existing) return;
        set({ games: { ...state.games, [gameId]: { ...existing, totalHintsUsed: existing.totalHintsUsed + 1 } } });
      },

      toggleFavorite: (gameId) => {
        const { favoritedGames } = get();
        const next = favoritedGames.includes(gameId)
          ? favoritedGames.filter(id => id !== gameId)
          : [...favoritedGames, gameId];
        set({ favoritedGames: next });
      },

      unlockAchievement: (achievementId) => {
        const { achievements } = get();
        if (!achievements.includes(achievementId)) {
          set({ achievements: [...achievements, achievementId] });
        }
      },
    }),
    {
      name: 'puzzleverse-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
