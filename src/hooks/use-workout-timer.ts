"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseWorkoutTimerOptions {
  defaultSeconds?: number;
  onTick?: (seconds: number) => void;
  onComplete?: () => void;
}

interface UseWorkoutTimerReturn {
  seconds: number;
  isRunning: boolean;
  display: string;
  start: (initialSeconds?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: (newSeconds?: number) => void;
  stop: () => void;
}

/**
 * Hook for managing a countdown timer between workout sets.
 *
 * Usage:
 * ```tsx
 * const { display, start, reset, isRunning } = useWorkoutTimer({ defaultSeconds: 90 });
 * // Start a 90-second rest
 * start();
 * // Or start a custom duration
 * start(60);
 * ```
 */
export function useWorkoutTimer(options: UseWorkoutTimerOptions = {}): UseWorkoutTimerReturn {
  const { defaultSeconds = 90, onTick, onComplete } = options;
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const display = formatTime(seconds);

  const start = useCallback(
    (initialSeconds?: number) => {
      clearTimer();
      const startSeconds = initialSeconds ?? defaultSeconds;
      setSeconds(startSeconds);
      setIsRunning(true);

      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev - 1;
          onTick?.(next);
          if (next <= 0) {
            clearTimer();
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [defaultSeconds, onTick, onComplete, clearTimer],
  );

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (seconds <= 0) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [seconds, onTick, onComplete, clearTimer]);

  const reset = useCallback(
    (newSeconds?: number) => {
      clearTimer();
      setSeconds(newSeconds ?? defaultSeconds);
      setIsRunning(false);
    },
    [defaultSeconds, clearTimer],
  );

  const stop = useCallback(() => {
    clearTimer();
    setSeconds(0);
    setIsRunning(false);
  }, [clearTimer]);

  return { seconds, isRunning, display, start, pause, resume, reset, stop };
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
