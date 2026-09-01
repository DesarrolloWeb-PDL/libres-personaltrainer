/**
 * Deload Engine — Detection & Recommendations
 * PURE TypeScript — zero framework/DB imports
 *
 * Triggers:
 * - Time-based: every 4-6 weeks
 * - Performance regression: >10% drop from baseline
 * - Overreaching: RPE consistently >9
 */

import type { PerformanceSnapshot, WorkoutDay } from "./types";

import { DELOAD_CONFIG } from "./constants";

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Checks if a deload should be triggered based on time and performance.
 *
 * @param weeksSinceDeload - Weeks elapsed since last deload
 * @param performanceSnapshots - Performance data for regression check
 * @returns true if deload is recommended
 */
export function shouldDeload(
  weeksSinceDeload: number,
  performanceSnapshots: PerformanceSnapshot[] = [],
): boolean {
  // Time-based trigger
  if (isTimeForDeload(weeksSinceDeload)) return true;

  // Performance regression trigger
  if (hasPerformanceRegression(performanceSnapshots)) return true;

  // Overreaching trigger (high RPE sustained)
  if (isOverreaching(performanceSnapshots)) return true;

  return false;
}

/**
 * Applies deload adjustments to workout days.
 * Reduces volume and intensity to facilitate recovery.
 */
export function applyDeload(days: WorkoutDay[]): WorkoutDay[] {
  return days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      sets: Math.max(1, Math.round(exercise.sets * (1 - DELOAD_CONFIG.VOLUME_REDUCTION_PERCENT))),
      reps: Math.max(
        1,
        Math.round(exercise.reps * (1 - DELOAD_CONFIG.INTENSITY_REDUCTION_PERCENT)),
      ),
      weight: exercise.weight
        ? Math.round(exercise.weight * (1 - DELOAD_CONFIG.INTENSITY_REDUCTION_PERCENT))
        : undefined,
      rpe: exercise.rpe ? Math.max(5, exercise.rpe - 2) : undefined,
    })),
  }));
}

// ─── Time-Based Detection ────────────────────────────────────────────

function isTimeForDeload(weeksSinceDeload: number): boolean {
  return weeksSinceDeload >= DELOAD_CONFIG.DEFAULT_INTERVAL_WEEKS;
}

// ─── Performance Regression Detection ────────────────────────────────

/**
 * Detects if performance has dropped >10% from baseline across
 * multiple exercises.
 */
function hasPerformanceRegression(snapshots: PerformanceSnapshot[]): boolean {
  if (snapshots.length === 0) return false;

  const regressedCount = snapshots.filter((s) => {
    const dropPercent =
      s.baselineWeight > 0 ? (s.baselineWeight - s.currentWeight) / s.baselineWeight : 0;
    return dropPercent > DELOAD_CONFIG.PERFORMANCE_DROP_THRESHOLD;
  }).length;

  // If >50% of tracked exercises show regression
  return regressedCount > snapshots.length / 2;
}

// ─── Overreaching Detection ──────────────────────────────────────────

/**
 * Detects if RPE is consistently above the hard threshold,
 * indicating accumulated fatigue.
 */
function isOverreaching(snapshots: PerformanceSnapshot[]): boolean {
  if (snapshots.length === 0) return false;

  const highRpeCount = snapshots.filter(
    (s) => s.currentRpe >= DELOAD_CONFIG.HIGH_RPE_THRESHOLD,
  ).length;

  // If all tracked exercises are consistently high RPE
  return (
    highRpeCount === snapshots.length &&
    snapshots.length >= DELOAD_CONFIG.HIGH_RPE_SESSIONS_BEFORE_DELOAD
  );
}
