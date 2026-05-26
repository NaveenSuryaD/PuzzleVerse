import { useState, useEffect, useRef, useCallback } from 'react';

export interface GameTimer {
  elapsedSeconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  restore: (seconds: number) => void;
  restoreAndResume: (seconds: number) => void;
}

export function useGameTimer(): GameTimer {
  const elapsedRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    clearTimer();
    // Only update the ref — no setState, so no re-renders every tick
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
    }, 1000);
  }, [clearTimer]);

  useEffect(() => { return () => clearTimer(); }, [clearTimer]);

  useEffect(() => {
    if (isRunning) { startInterval(); } else { clearTimer(); }
  }, [isRunning, startInterval, clearTimer]);

  const start = useCallback(() => {
    elapsedRef.current = 0;
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => { setIsRunning(false); }, []);
  const resume = useCallback(() => { setIsRunning(true); }, []);

  const reset = useCallback(() => {
    clearTimer();
    elapsedRef.current = 0;
    setIsRunning(false);
  }, [clearTimer]);

  const restore = useCallback((seconds: number) => {
    clearTimer();
    elapsedRef.current = seconds;
    setIsRunning(false);
  }, [clearTimer]);

  const restoreAndResume = useCallback((seconds: number) => {
    elapsedRef.current = seconds;
    startInterval();
    setIsRunning(true);
  }, [startInterval]);

  return {
    get elapsedSeconds() { return elapsedRef.current; },
    isRunning,
    start,
    pause,
    resume,
    reset,
    restore,
    restoreAndResume,
  };
}
