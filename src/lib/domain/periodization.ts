/**
 * Periodization Engine — Linear & DUP algorithms
 * PURE TypeScript — zero framework/DB imports
 *
 * - Linear: Progressive volume/intensity increase over weeks
 * - DUP (Daily Undulating): Varies rep ranges within each week (heavy/moderate/light)
 */

import type { PeriodizationMode, WorkoutDay, WorkoutExercise } from "./types";

import { DUP_REP_RANGES, LINEAR_REP_PROGRESSION } from "./constants";

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Applies periodization adjustments to workout days for a given week.
 *
 * @param days     - Base workout days (from training engine)
 * @param mode     - 'linear' or 'dup'
 * @param week     - Current week number (1-indexed)
 * @param totalWeeks - Total program duration
 * @returns Adjusted WorkoutDay[] for the given week
 */
export function applyPeriodization(
  days: WorkoutDay[],
  mode: PeriodizationMode,
  week: number,
  totalWeeks: number,
): WorkoutDay[] {
  switch (mode) {
    case "linear":
      return applyLinear(days, week, totalWeeks);
    case "dup":
      return applyDUP(days, week);
  }
}

// ─── Linear Periodization ────────────────────────────────────────────

/**
 * Linear model: start with higher reps / lower intensity, progress to
 * lower reps / higher intensity over the program duration.
 *
 * Week 1: 10 reps @ RPE 6
 * Week N: 6 reps @ RPE 9
 *
 * Interpolates linearly between these endpoints.
 */
function applyLinear(days: WorkoutDay[], week: number, totalWeeks: number): WorkoutDay[] {
  const progress = totalWeeks > 1 ? (week - 1) / (totalWeeks - 1) : 0;

  const reps = Math.round(
    LINEAR_REP_PROGRESSION.startReps +
      progress * (LINEAR_REP_PROGRESSION.endReps - LINEAR_REP_PROGRESSION.startReps),
  );

  const rpe =
    Math.round(
      (LINEAR_REP_PROGRESSION.startRpe +
        progress * (LINEAR_REP_PROGRESSION.endRpe - LINEAR_REP_PROGRESSION.startRpe)) *
        10,
    ) / 10;

  return days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => adjustExerciseForLinear(exercise, reps, rpe)),
  }));
}

function adjustExerciseForLinear(
  exercise: WorkoutExercise,
  targetReps: number,
  targetRpe: number,
): WorkoutExercise {
  return {
    ...exercise,
    reps: targetReps,
    rpe: targetRpe,
  };
}

// ─── DUP (Daily Undulating Periodization) ────────────────────────────

/**
 * DUP model: rotates through heavy / moderate / light days within each week.
 *
 * Pattern repeats every 3 sessions:
 * - Day 1: Heavy  (1-5 reps, 5 sets, RPE 8.5)
 * - Day 2: Moderate (8-12 reps, 4 sets, RPE 7.5)
 * - Day 3: Light   (12-20 reps, 3 sets, RPE 6.5)
 *
 * Within a DUP cycle, there's also a progression:
 * - Cycle 1 (weeks 1-3): base ranges
 * - Cycle 2 (weeks 4-6): shift toward heavier
 * - Cycle 3 (weeks 7-8): peak intensity
 */
function applyDUP(days: WorkoutDay[], week: number): WorkoutDay[] {
  const cycleWeek = (week - 1) % 3; // 0, 1, 2 within cycle
  const cycleNumber = Math.floor((week - 1) / 3); // which cycle we're in

  // Cycle progression shifts the baseline toward heavier loads
  const cycleShift = Math.min(cycleNumber * 0.5, 2); // cap at +2 reps shift

  return days.map((day, dayIndex) => {
    const template = getDUPTemplate(dayIndex);

    // Apply cycle progression: shift reps slightly heavier each cycle
    const adjustedMin = Math.max(template.min - Math.round(cycleShift), 1);
    const adjustedMax = Math.max(template.max - Math.round(cycleShift), adjustedMin + 1);

    // Pick reps within range (use middle)
    const reps = Math.round((adjustedMin + adjustedMax) / 2);

    return {
      ...day,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        sets: template.sets,
        reps: exercise.exercise.isCompound ? reps : Math.min(reps + 4, 20),
        rpe: template.rpe,
        restSeconds: exercise.exercise.isCompound ? 180 : 90,
      })),
    };
  });
}

/**
 * Maps day index to a DUP template (heavy → moderate → light rotation).
 */
function getDUPTemplate(dayIndex: number): {
  min: number;
  max: number;
  sets: number;
  rpe: number;
} {
  const templates = [DUP_REP_RANGES.heavy, DUP_REP_RANGES.moderate, DUP_REP_RANGES.light];
  const t = templates[dayIndex % 3];
  return { min: t.min, max: t.max, sets: t.sets, rpe: t.rpe };
}
