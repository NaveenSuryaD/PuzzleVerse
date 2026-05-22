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
}

interface ProgressState {
  games: Record<string, GameProgress>;
  overallStreak: number;
  lastOverallPlayDate: string;
  achievements: string[];
  favoritedGames: string[];
  recordGame: (gameId: string, won: boolean, timeSeconds: number) => void;
  toggleFavorite: (gameId: string) => void;
  unlockAchievement: (achievementId: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      games: {},
      overallStreak: 0,
      lastOverallPlayDate: '',
      achievements: [],
      favoritedGames: [],
      recordGame: (gameId, won, timeSeconds) => {
        const state = get();
        const existing = state.games[gameId] ?? {
          gameId,
          gamesPlayed: 0,
          gamesWon: 0,
          bestTimeSeconds: null,
          currentStreak: 0,
          maxStreak: 0,
          lastPlayedDate: '',
          totalHintsUsed: 0,
        };
        const todayStr = today();
        const streakContinues = existing.lastPlayedDate === todayStr ||
          isYesterday(existing.lastPlayedDate);
        const newStreak = won ? (streakContinues ? existing.currentStreak + 1 : 1) : 0;
        const updated: GameProgress = {
          ...existing,
          gamesPlayed: existing.gamesPlayed + 1,
          gamesWon: existing.gamesWon + (won ? 1 : 0),
          bestTimeSeconds: won
            ? existing.bestTimeSeconds === null
              ? timeSeconds
              : Math.min(existing.bestTimeSeconds, timeSeconds)
            : existing.bestTimeSeconds,
          currentStreak: newStreak,
          maxStreak: Math.max(existing.maxStreak, newStreak),
          lastPlayedDate: todayStr,
        };
        set({ games: { ...state.games, [gameId]: updated } });
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

function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10) === dateStr;
}
