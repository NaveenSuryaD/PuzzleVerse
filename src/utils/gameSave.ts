import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import React, { useEffect, useRef } from 'react';

const PREFIX = 'pv-save-';

export function saveGame(gameId: string, state: unknown): void {
  AsyncStorage.setItem(PREFIX + gameId, JSON.stringify(state));
}

export async function loadGameRaw(gameId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PREFIX + gameId);
  } catch {
    return null;
  }
}

export function clearGame(gameId: string): void {
  AsyncStorage.removeItem(PREFIX + gameId);
}

// Saves immediately whenever the user changes state, when the app backgrounds, and on unmount.
// Skips the initial render so we only save once the user has actually done something.
// active=false after game complete so we don't overwrite the cleared state.
// elapsedRef: optional ref to include _elapsed in every save so shell can restore timer.
export function useSaveGame(
  gameId: string,
  getState: () => unknown,
  active: boolean,
  deps: unknown[],
  elapsedRef?: React.RefObject<number>,
): void {
  const getStateRef = useRef(getState);
  const activeRef = useRef(active);
  const gameIdRef = useRef(gameId);
  const isFirstRenderRef = useRef(true);
  const hasSavedRef = useRef(false);

  getStateRef.current = getState;
  activeRef.current = active;
  gameIdRef.current = gameId;

  const saveWithElapsed = (id: string) => {
    const s = getStateRef.current();
    const elapsed = elapsedRef?.current ?? 0;
    saveGame(id, typeof s === 'object' && s !== null ? { ...s as object, _elapsed: elapsed } : s);
  };

  // Save immediately on every state change (skip first render — only save after user acts)
   
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (!active) return;
    hasSavedRef.current = true;
    saveWithElapsed(gameId);
    // deps intentionally spread — caller controls what triggers a save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, active, ...deps]);

  // Save on app backgrounding and on unmount (only if user made at least one move)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' && activeRef.current && hasSavedRef.current) {
        saveWithElapsed(gameIdRef.current);
      }
    });
    return () => {
      sub.remove();
      if (activeRef.current && hasSavedRef.current) {
        saveWithElapsed(gameIdRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
