/**
 * Training Engine Domain Types
 * PURE TypeScript — zero framework/DB imports
 */

// ─── Enums & Literals ────────────────────────────────────────────────

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type Goal = "muscle_gain" | "fat_loss" | "strength" | "endurance" | "maintenance";

export type Equipment = "full_gym" | "home_gym" | "bodyweight_only";

export type SplitType = "push_pull_legs" | "upper_lower" | "full_body" | "custom";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core";

export type PeriodizationMode = "linear" | "dup";

export type VolumeStatus = "undertraining" | "optimal" | "overreaching";

// ─── Core Entities ───────────────────────────────────────────────────

export interface UserProfile {
  age: number;
  experienceLevel: ExperienceLevel;
  goals: Goal[];
  equipment: Equipment;
  injuries?: string[];
  trainingFrequency: number; // days per week (1-7)
}

export interface Exercise {
  id: string;
  name: string;
  nameEs?: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment[];
  isCompound: boolean;
  substitutions?: string[];
}

// ─── Workout Structures ──────────────────────────────────────────────

export interface TrainingProgram {
  splitType: SplitType;
  weeks: number;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  rpe?: number;
  restSeconds?: number;
}

// ─── Prescription (overload output) ──────────────────────────────────

export interface Prescription {
  exerciseId: string;
  exerciseName: string;
  currentSets: number;
  currentReps: number;
  currentWeight?: number;
  recommendedSets: number;
  recommendedReps: number;
  recommendedWeight?: number;
  reason: string;
}

// ─── Volume ──────────────────────────────────────────────────────────

export interface VolumeLandmarks {
  muscleGroup: MuscleGroup;
  MEV: number; // Minimum Effective Volume
  MAV: number; // Maximum Adaptive Volume
  MRV: number; // Maximum Recoverable Volume
}

export interface VolumeTracking {
  muscleGroup: MuscleGroup;
  weeklySets: number;
  volumeLoad: number; // sets × reps × weight aggregate
}

// ─── History (for overload/deload) ───────────────────────────────────

export interface ExerciseHistoryEntry {
  exerciseId: string;
  date: string; // ISO date
  sets: number;
  reps: number;
  weight: number;
  rpe?: number;
}

export interface PerformanceSnapshot {
  exerciseId: string;
  baselineWeight: number;
  currentWeight: number;
  baselineRpe: number;
  currentRpe: number;
  sessionsSinceStart: number;
}
