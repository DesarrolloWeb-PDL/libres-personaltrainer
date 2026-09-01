/**
 * Training Engine — Split Selection & Program Generation
 * PURE TypeScript — zero framework/DB imports
 */

import type {
  Exercise,
  MuscleGroup,
  SplitType,
  TrainingProgram,
  UserProfile,
  WorkoutDay,
  WorkoutExercise,
} from "./types";

import { SPLIT_TEMPLATES } from "./constants";

// ─── Split Selector ──────────────────────────────────────────────────

/**
 * Selects the optimal training split based on frequency and experience.
 *
 * Rules:
 * - ≤3 days/week → full body
 * - 4 days/week  → upper/lower
 * - 5+ days/week → push/pull/legs if advanced, upper/lower otherwise
 */
export function selectSplit(profile: UserProfile): SplitType {
  const { trainingFrequency, experienceLevel } = profile;

  if (trainingFrequency <= 3) return "full_body";
  if (trainingFrequency === 4) return "upper_lower";

  // 5+ days
  if (experienceLevel === "advanced") return "push_pull_legs";
  return "upper_lower";
}

// ─── Program Generator ───────────────────────────────────────────────

/**
 * Generates a full TrainingProgram from a user profile and exercise pool.
 * Does NOT apply periodization or volume adjustments — that's done by
 * PeriodizationEngine and VolumeEngine respectively.
 */
export function generateProgram(
  profile: UserProfile,
  exercises: Exercise[],
  weeks: number = 8,
): TrainingProgram {
  const splitType = selectSplit(profile);
  const days = generateWorkoutDays(splitType, profile.trainingFrequency, exercises);

  return {
    splitType,
    weeks,
    days,
  };
}

// ─── Workout Day Generator ───────────────────────────────────────────

/**
 * Generates WorkoutDay[] for a given split and frequency.
 * Selects appropriate exercises per muscle group from the pool.
 */
function generateWorkoutDays(
  splitType: SplitType,
  frequency: number,
  exercises: Exercise[],
): WorkoutDay[] {
  // Handle custom split — return empty for now
  if (splitType === "custom") {
    return [];
  }

  const template = SPLIT_TEMPLATES[splitType];
  const days: WorkoutDay[] = [];

  for (let i = 0; i < frequency; i++) {
    const dayIndex = i % template.dayNames.length;
    const dayName = template.dayNames[dayIndex];
    const targetMuscles = template.muscleGroups[dayName as keyof typeof template.muscleGroups];

    const workoutExercises = selectExercisesForDay(targetMuscles, exercises, splitType);

    days.push({
      dayNumber: i + 1,
      name: dayName,
      exercises: workoutExercises,
    });
  }

  return days;
}

// ─── Exercise Selection per Day ──────────────────────────────────────

/**
 * Selects exercises for a single workout day targeting specific muscle groups.
 * Picks 1 compound + 1-2 isolations per muscle group when available.
 */
function selectExercisesForDay(
  targetMuscles: readonly MuscleGroup[],
  exercises: Exercise[],
  splitType: SplitType,
): WorkoutExercise[] {
  const result: WorkoutExercise[] = [];

  for (const muscle of targetMuscles) {
    const muscleExercises = exercises.filter((e) => e.muscleGroup === muscle);

    if (muscleExercises.length === 0) continue;

    // Pick compounds first
    const compounds = muscleExercises.filter((e) => e.isCompound);
    const isolations = muscleExercises.filter((e) => !e.isCompound);

    // Add 1 compound if available
    if (compounds.length > 0) {
      result.push(createWorkoutExercise(compounds[0], splitType));
    }

    // Add up to 2 isolations
    const maxIsolations = compounds.length > 0 ? 2 : 1;
    for (let i = 0; i < Math.min(maxIsolations, isolations.length); i++) {
      result.push(createWorkoutExercise(isolations[i], splitType));
    }
  }

  return result;
}

// ─── WorkoutExercise Factory ─────────────────────────────────────────

/**
 * Creates a WorkoutExercise with default prescriptions based on split type.
 * These are starting points — PeriodizationEngine refines them.
 */
function createWorkoutExercise(exercise: Exercise, splitType: SplitType): WorkoutExercise {
  // Default prescriptions vary slightly by split
  switch (splitType) {
    case "push_pull_legs":
      return {
        exercise,
        sets: exercise.isCompound ? 4 : 3,
        reps: exercise.isCompound ? 8 : 12,
        restSeconds: exercise.isCompound ? 180 : 90,
      };
    case "upper_lower":
      return {
        exercise,
        sets: exercise.isCompound ? 3 : 3,
        reps: exercise.isCompound ? 8 : 12,
        restSeconds: exercise.isCompound ? 150 : 90,
      };
    case "full_body":
    default:
      return {
        exercise,
        sets: exercise.isCompound ? 3 : 2,
        reps: exercise.isCompound ? 10 : 15,
        restSeconds: exercise.isCompound ? 120 : 60,
      };
  }
}
