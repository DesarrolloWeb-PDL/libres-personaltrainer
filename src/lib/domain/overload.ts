/**
 * Overload Engine — Progressive Overload Logic
 * PURE TypeScript — zero framework/DB imports
 *
 * Rules (Helms 2016):
 * - RPE < 7  → increase weight by 5-10%
 * - RPE 7-8  → maintain weight, increase reps
 * - RPE > 9  → decrease weight by 5%
 */

import type { Prescription, WorkoutExercise } from "./types";

import { OVERLOAD_CONFIG, RPE_THRESHOLDS } from "./constants";

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Recommends overload adjustments for a set of exercises based on their RPE.
 *
 * @param exercises - Current workout exercises with RPE data
 * @returns Prescription[] with specific recommendations
 */
export function recommendOverload(exercises: WorkoutExercise[]): Prescription[] {
  return exercises.map((exercise) => generatePrescription(exercise));
}

/**
 * Generates a single prescription for an exercise based on its RPE.
 */
function generatePrescription(exercise: WorkoutExercise): Prescription {
  const rpe = exercise.rpe ?? 7.5; // default assumption

  if (rpe < RPE_THRESHOLDS.EASY_MAX) {
    return handleEasyLoad(exercise, rpe);
  }

  if (rpe <= RPE_THRESHOLDS.MODERATE_MAX) {
    return handleModerateLoad(exercise, rpe);
  }

  return handleHardLoad(exercise, rpe);
}

// ─── Easy Load (RPE < 7) ─────────────────────────────────────────────

function handleEasyLoad(exercise: WorkoutExercise, rpe: number): Prescription {
  const currentWeight = exercise.weight ?? 0;
  const increasePercent = clampWeightIncrease(OVERLOAD_CONFIG.EASY_WEIGHT_INCREASE_PERCENT);
  const recommendedWeight = Math.round(currentWeight * (1 + increasePercent));

  return {
    exerciseId: exercise.exercise.id,
    exerciseName: exercise.exercise.name,
    currentSets: exercise.sets,
    currentReps: exercise.reps,
    currentWeight,
    recommendedSets: exercise.sets,
    recommendedReps: exercise.reps,
    recommendedWeight: Math.max(recommendedWeight, currentWeight + 2.5),
    reason: `RPE ${rpe} is below ${RPE_THRESHOLDS.EASY_MAX} — load is too light. Increase weight by ${Math.round(increasePercent * 100)}%.`,
  };
}

// ─── Moderate Load (RPE 7-9) ─────────────────────────────────────────

function handleModerateLoad(exercise: WorkoutExercise, rpe: number): Prescription {
  const currentWeight = exercise.weight ?? 0;
  const recommendedReps = exercise.reps + OVERLOAD_CONFIG.MODERATE_REP_INCREMENT;

  return {
    exerciseId: exercise.exercise.id,
    exerciseName: exercise.exercise.name,
    currentSets: exercise.sets,
    currentReps: exercise.reps,
    currentWeight,
    recommendedSets: exercise.sets,
    recommendedReps,
    recommendedWeight: currentWeight,
    reason: `RPE ${rpe} is in the ${RPE_THRESHOLDS.MODERATE_MIN}-${RPE_THRESHOLDS.MODERATE_MAX} range — load is appropriate. Add ${OVERLOAD_CONFIG.MODERATE_REP_INCREMENT} rep.`,
  };
}

// ─── Hard Load (RPE > 9) ─────────────────────────────────────────────

function handleHardLoad(exercise: WorkoutExercise, rpe: number): Prescription {
  const currentWeight = exercise.weight ?? 0;
  const decreasePercent = clampWeightDecrease(OVERLOAD_CONFIG.HARD_WEIGHT_DECREASE_PERCENT);
  const recommendedWeight = Math.round(currentWeight * (1 - decreasePercent));

  return {
    exerciseId: exercise.exercise.id,
    exerciseName: exercise.exercise.name,
    currentSets: exercise.sets,
    currentReps: exercise.reps,
    currentWeight,
    recommendedSets: exercise.sets,
    recommendedReps: exercise.reps,
    recommendedWeight: Math.min(recommendedWeight, currentWeight - 2.5),
    reason: `RPE ${rpe} is above ${RPE_THRESHOLDS.HARD_MIN} — load is too heavy. Decrease weight by ${Math.round(decreasePercent * 100)}%.`,
  };
}

// ─── Safety Clamps ───────────────────────────────────────────────────

function clampWeightIncrease(percent: number): number {
  return Math.min(percent, OVERLOAD_CONFIG.MAX_WEIGHT_INCREASE_PERCENT);
}

function clampWeightDecrease(percent: number): number {
  return Math.min(percent, OVERLOAD_CONFIG.HARD_WEIGHT_DECREASE_PERCENT);
}
