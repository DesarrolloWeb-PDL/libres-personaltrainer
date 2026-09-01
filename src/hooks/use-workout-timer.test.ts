import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkoutTimer } from "./use-workout-timer";

describe("useWorkoutTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with default seconds", () => {
    const { result } = renderHook(() => useWorkoutTimer());
    expect(result.current.seconds).toBe(90);
    expect(result.current.display).toBe("01:30");
    expect(result.current.isRunning).toBe(false);
  });

  it("initializes with custom default seconds", () => {
    const { result } = renderHook(() => useWorkoutTimer({ defaultSeconds: 60 }));
    expect(result.current.seconds).toBe(60);
    expect(result.current.display).toBe("01:00");
  });

  it("starts countdown from default seconds", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(87);
    expect(result.current.display).toBe("01:27");
  });

  it("starts countdown from custom seconds", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.start(30);
    });

    expect(result.current.seconds).toBe(30);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.seconds).toBe(25);
  });

  it("calls onTick callback", () => {
    const onTick = vi.fn();
    const { result } = renderHook(() => useWorkoutTimer({ onTick }));

    act(() => {
      result.current.start(5);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick).toHaveBeenCalledWith(4);
    expect(onTick).toHaveBeenCalledWith(3);
  });

  it("calls onComplete when timer reaches zero", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useWorkoutTimer({ onComplete }));

    act(() => {
      result.current.start(2);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it("pauses the timer", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(7);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.seconds).toBe(7);
  });

  it("resumes after pause", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.seconds).toBe(5);
  });

  it("reset stops timer and resets to default", () => {
    const { result } = renderHook(() => useWorkoutTimer({ defaultSeconds: 60 }));

    act(() => {
      result.current.start(30);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.seconds).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });

  it("reset with custom seconds", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.reset(120);
    });

    expect(result.current.seconds).toBe(120);
    expect(result.current.display).toBe("02:00");
  });

  it("stop sets seconds to zero and stops", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.start(30);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.display).toBe("00:00");
  });

  it("formats time correctly for edge cases", () => {
    const { result } = renderHook(() => useWorkoutTimer());

    act(() => {
      result.current.reset(0);
    });
    expect(result.current.display).toBe("00:00");

    act(() => {
      result.current.reset(5);
    });
    expect(result.current.display).toBe("00:05");

    act(() => {
      result.current.reset(59);
    });
    expect(result.current.display).toBe("00:59");

    act(() => {
      result.current.reset(61);
    });
    expect(result.current.display).toBe("01:01");
  });
});
