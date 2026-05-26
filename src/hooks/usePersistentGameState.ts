import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedGameData<T> {
  gameState: T;
  elapsedSeconds: number;
  savedAt: number;
}

export interface LoadResult<T> {
  found: boolean;
  gameState: T | null;
  elapsedSeconds: number;
}

// Max age for a saved game: 24 hours
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function usePersistentGameState<T>(gameId: string) {
  const key = `pv_game_v4_${gameId}`;

  const save = useCallback(async (gameState: T, elapsedSeconds: number): Promise<void> => {
    const secondsToSave = typeof elapsedSeconds === 'number' && !isNaN(elapsedSeconds)
      ? elapsedSeconds
      : 0;

    const data: SavedGameData<T> = {
      gameState,
      elapsedSeconds: secondsToSave,
      savedAt: Date.now(),
    };

    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }, [key]);

  const load = useCallback(async (): Promise<LoadResult<T>> => {
    try {
      const raw = await AsyncStorage.getItem(key);

      if (!raw) {
        return { found: false, gameState: null, elapsedSeconds: 0 };
      }

      const data: SavedGameData<T> = JSON.parse(raw);

      if (Date.now() - data.savedAt > MAX_AGE_MS) {
        await AsyncStorage.removeItem(key);
        return { found: false, gameState: null, elapsedSeconds: 0 };
      }

      const elapsed = typeof data.elapsedSeconds === 'number' && !isNaN(data.elapsedSeconds)
        ? data.elapsedSeconds
        : 0;

      return {
        found: true,
        gameState: data.gameState,
        elapsedSeconds: elapsed,
      };
    } catch {
      return { found: false, gameState: null, elapsedSeconds: 0 };
    }
  }, [key]);

  const clear = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  }, [key]);

  return { save, load, clear };
}
