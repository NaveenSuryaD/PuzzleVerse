import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameTimer(initialSeconds = 0) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(initialSeconds);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  const reset = useCallback((seconds = 0) => {
    setIsRunning(false);
    elapsedRef.current = seconds;
    setElapsedSeconds(seconds);
  }, []);

  const restore = useCallback((seconds: number) => {
    elapsedRef.current = seconds;
    setElapsedSeconds(seconds);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return { elapsedSeconds, elapsedRef, isRunning, start, pause, resume, reset, restore };
}
