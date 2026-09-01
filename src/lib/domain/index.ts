/**
 * Training Engine — Domain Layer Barrel Export
 * PURE TypeScript — zero framework/DB imports
 */

// Types
export type {
  ExperienceLevel,
  Goal,
  Equipment,
  SplitType,
  MuscleGroup,
  PeriodizationMode,
  VolumeStatus,
  UserProfile,
  Exercise,
  TrainingProgram,
  WorkoutDay,
  WorkoutExercise,
  Prescription,
  VolumeLandmarks,
  VolumeTracking,
  ExerciseHistoryEntry,
  PerformanceSnapshot,
} from "./types";

// Constants
export {
  VOLUME_LANDMARKS,
  RPE_THRESHOLDS,
  OVERLOAD_CONFIG,
  DELOAD_CONFIG,
  DUP_REP_RANGES,
  LINEAR_REP_PROGRESSION,
  SPLIT_TEMPLATES,
  ONE_RM_FORMULAS,
  RPE_RIR_MAP,
  ALL_MUSCLE_GROUPS,
  INJURY_CONSTRAINTS,
} from "./constants";

// Engines
export { selectSplit, generateProgram } from "./training-engine";
export { applyPeriodization } from "./periodization";
export {
  getLandmarks,
  getLandmarksForMuscle,
  calculateWeeklyVolume,
  checkVolumeStatus,
  checkAllVolumeStatuses,
  applyVolumeLandmarks,
} from "./volume";
export { recommendOverload } from "./overload";
export { shouldDeload, applyDeload } from "./deload";
export {
  findSubstitute,
  swapInjuredExercises,
  isInjuryRestricted,
  getSuggestions,
} from "./substitution";
export { estimate1RM, estimate1RMEpley } from "./one-rm";
export { rpeToRir, rirToRpe, isValidRpe, isValidRir, describeRpe } from "./rpe";
export { detectPlateau, calculateWeeklyAverages } from "./plateau";
