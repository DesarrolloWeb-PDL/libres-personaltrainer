/**
 * Training Engine Domain Constants
 * PURE TypeScript — zero framework/DB imports
 *
 * Volume landmarks based on Schoenfeld (2017) meta-analysis.
 * RPE thresholds from Helms (2016) and Zourdos (2021).
 */

import type { ExperienceLevel, MuscleGroup, VolumeLandmarks } from "./types";

// ─── Volume Landmarks by Experience Level ─────────────────────────────
// Values = sets per muscle group per week

export const VOLUME_LANDMARKS: Record<ExperienceLevel, VolumeLandmarks[]> = {
  beginner: [
    { muscleGroup: "chest", MEV: 8, MAV: 12, MRV: 16 },
    { muscleGroup: "back", MEV: 8, MAV: 12, MRV: 16 },
    { muscleGroup: "shoulders", MEV: 6, MAV: 10, MRV: 14 },
    { muscleGroup: "biceps", MEV: 4, MAV: 8, MRV: 12 },
    { muscleGroup: "triceps", MEV: 4, MAV: 8, MRV: 12 },
    { muscleGroup: "quadriceps", MEV: 8, MAV: 12, MRV: 16 },
    { muscleGroup: "hamstrings", MEV: 6, MAV: 10, MRV: 14 },
    { muscleGroup: "glutes", MEV: 4, MAV: 8, MRV: 12 },
    { muscleGroup: "calves", MEV: 8, MAV: 12, MRV: 16 },
    { muscleGroup: "core", MEV: 0, MAV: 0, MRV: 0 },
  ],
  intermediate: [
    { muscleGroup: "chest", MEV: 10, MAV: 16, MRV: 20 },
    { muscleGroup: "back", MEV: 10, MAV: 16, MRV: 20 },
    { muscleGroup: "shoulders", MEV: 8, MAV: 14, MRV: 18 },
    { muscleGroup: "biceps", MEV: 6, MAV: 12, MRV: 16 },
    { muscleGroup: "triceps", MEV: 6, MAV: 12, MRV: 16 },
    { muscleGroup: "quadriceps", MEV: 10, MAV: 16, MRV: 20 },
    { muscleGroup: "hamstrings", MEV: 8, MAV: 14, MRV: 18 },
    { muscleGroup: "glutes", MEV: 6, MAV: 12, MRV: 16 },
    { muscleGroup: "calves", MEV: 8, MAV: 14, MRV: 18 },
    { muscleGroup: "core", MEV: 0, MAV: 0, MRV: 0 },
  ],
  advanced: [
    { muscleGroup: "chest", MEV: 12, MAV: 20, MRV: 24 },
    { muscleGroup: "back", MEV: 12, MAV: 20, MRV: 24 },
    { muscleGroup: "shoulders", MEV: 10, MAV: 16, MRV: 22 },
    { muscleGroup: "biceps", MEV: 8, MAV: 14, MRV: 20 },
    { muscleGroup: "triceps", MEV: 8, MAV: 14, MRV: 20 },
    { muscleGroup: "quadriceps", MEV: 12, MAV: 20, MRV: 24 },
    { muscleGroup: "hamstrings", MEV: 10, MAV: 16, MRV: 22 },
    { muscleGroup: "glutes", MEV: 8, MAV: 14, MRV: 20 },
    { muscleGroup: "calves", MEV: 10, MAV: 16, MRV: 22 },
    { muscleGroup: "core", MEV: 0, MAV: 0, MRV: 0 },
  ],
};

// ─── RPE Thresholds ──────────────────────────────────────────────────

export const RPE_THRESHOLDS = {
  /** Below this, the set was too easy → increase weight */
  EASY_MAX: 7,
  /** In this range → maintain weight, increase reps */
  MODERATE_MIN: 7,
  MODERATE_MAX: 9,
  /** Above this → too hard, consider decreasing */
  HARD_MIN: 9,
} as const;

// ─── Overload Percentages ────────────────────────────────────────────

export const OVERLOAD_CONFIG = {
  /** Weight increase % when RPE < 7 */
  EASY_WEIGHT_INCREASE_PERCENT: 0.075,
  /** Rep increase when RPE 7-8 */
  MODERATE_REP_INCREMENT: 1,
  /** Weight decrease % when RPE > 9 */
  HARD_WEIGHT_DECREASE_PERCENT: 0.05,
  /** Max weight increase cap (safety) */
  MAX_WEIGHT_INCREASE_PERCENT: 0.1,
  /** Max weight decrease floor (safety) */
  MIN_WEIGHT_DECREASE_PERCENT: 0.03,
} as const;

// ─── Deload Configuration ────────────────────────────────────────────

export const DELOAD_CONFIG = {
  /** Weeks between scheduled deloads (min) */
  MIN_WEEKS_BETWEEN: 4,
  /** Weeks between scheduled deloads (max) */
  MAX_WEEKS_BETWEEN: 6,
  /** Default deload interval */
  DEFAULT_INTERVAL_WEEKS: 5,
  /** Performance regression threshold (percentage drop) */
  PERFORMANCE_DROP_THRESHOLD: 0.1,
  /** RPE threshold for consecutive overreaching detection */
  HIGH_RPE_THRESHOLD: 9,
  /** Sessions of high RPE before deload trigger */
  HIGH_RPE_SESSIONS_BEFORE_DELOAD: 3,
  /** Volume reduction during deload (percentage) */
  VOLUME_REDUCTION_PERCENT: 0.5,
  /** Intensity reduction during deload (percentage) */
  INTENSITY_REDUCTION_PERCENT: 0.12,
} as const;

// ─── Periodization Rep Ranges ────────────────────────────────────────

export const DUP_REP_RANGES = {
  heavy: { min: 1, max: 5, sets: 5, rpe: 8.5 },
  moderate: { min: 8, max: 12, sets: 4, rpe: 7.5 },
  light: { min: 12, max: 20, sets: 3, rpe: 6.5 },
} as const;

export const LINEAR_REP_PROGRESSION = {
  /** Reps per set in week 1 */
  startReps: 10,
  /** Reps per set in final week */
  endReps: 6,
  /** Starting RPE */
  startRpe: 6,
  /** Ending RPE */
  endRpe: 9,
} as const;

// ─── Split Day Templates ─────────────────────────────────────────────

export const SPLIT_TEMPLATES = {
  push_pull_legs: {
    dayNames: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
    muscleGroups: {
      Push: ["chest", "shoulders", "triceps"] as MuscleGroup[],
      Pull: ["back", "biceps"] as MuscleGroup[],
      Legs: ["quadriceps", "hamstrings", "glutes", "calves"] as MuscleGroup[],
    },
  },
  upper_lower: {
    dayNames: ["Upper", "Lower", "Upper", "Lower", "Upper", "Lower", "Upper"],
    muscleGroups: {
      Upper: ["chest", "back", "shoulders", "biceps", "triceps"] as MuscleGroup[],
      Lower: ["quadriceps", "hamstrings", "glutes", "calves"] as MuscleGroup[],
    },
  },
  full_body: {
    dayNames: [
      "Full Body",
      "Full Body",
      "Full Body",
      "Full Body",
      "Full Body",
      "Full Body",
      "Full Body",
    ],
    muscleGroups: {
      "Full Body": [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "quadriceps",
        "hamstrings",
        "glutes",
        "calves",
      ] as MuscleGroup[],
    },
  },
} as const;

// ─── 1RM Estimation Formulas ─────────────────────────────────────────

export const ONE_RM_FORMULAS = {
  /** Epley: weight × (1 + reps / 30) */
  epley: (weight: number, reps: number): number => weight * (1 + reps / 30),
  /** Brzycki: weight × (36 / (37 - reps)) */
  brzycki: (weight: number, reps: number): number => weight * (36 / (37 - reps)),
  /** Lombardi: weight × reps^0.10 */
  lombardi: (weight: number, reps: number): number => weight * Math.pow(reps, 0.1),
} as const;

// ─── RPE/RIR Conversion ─────────────────────────────────────────────

export const RPE_RIR_MAP: Record<number, number> = {
  10: 0,
  9.5: 0.5,
  9: 1,
  8.5: 1.5,
  8: 2,
  7.5: 2.5,
  7: 3,
  6.5: 3.5,
  6: 4,
  5.5: 4.5,
  5: 5,
} as const;

// ─── All Muscle Groups ───────────────────────────────────────────────

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "core",
];

// ─── Injury-to-Exercise Pattern Mapping ──────────────────────────────
// Maps common injury keywords to muscle groups / movement patterns to avoid

export const INJURY_CONSTRAINTS: Record<string, MuscleGroup[]> = {
  shoulder: ["shoulders"],
  knee: ["quadriceps", "hamstrings", "glutes"],
  back: ["back"],
  "lower back": ["back", "core"],
  wrist: ["biceps", "triceps"],
  ankle: ["calves", "quadriceps", "hamstrings"],
  hip: ["glutes", "hamstrings", "quadriceps"],
  elbow: ["biceps", "triceps"],
  neck: ["shoulders", "back"],
};
