/**
 * Workout Repository Port — Hexagonal Architecture
 *
 * This port defines the contract for workout session and set data access.
 * Infrastructure adapters implement this interface; domain logic depends only on it.
 */

export interface WorkoutSession {
  id: string;
  userId: string;
  programId: string;
  dayId: string;
  startedAt: Date;
  completedAt: Date | null;
}

export interface WorkoutSessionWithExercises extends WorkoutSession {
  day: {
    id: string;
    dayNumber: number;
    name: string | null;
    exercises: WorkoutExerciseWithSets[];
  };
}

export interface WorkoutExerciseWithSets {
  id: string;
  exerciseId: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  order: number;
  exercise: {
    id: string;
    name: string;
    nameEs: string | null;
    muscleGroup: {
      id: string;
      name: string;
      nameEs: string | null;
      category: string | null;
    } | null;
  };
  workoutSets: WorkoutSetRecord[];
}

export interface WorkoutSetRecord {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  completed: boolean;
}

export interface StartSessionData {
  userId: string;
  programId: string;
  dayId: string;
}

export interface LogSetData {
  setId: string;
  reps?: number;
  weight?: number;
  rpe?: number;
}

export interface WorkoutRepository {
  /** Start a new workout session */
  startSession(data: StartSessionData): Promise<WorkoutSession>;

  /** Get a session by ID with exercises and sets */
  findSessionById(id: string): Promise<WorkoutSessionWithExercises | null>;

  /** Log a single set (update reps, weight, RPE, mark completed) */
  logSet(data: LogSetData): Promise<WorkoutSetRecord>;

  /** Mark a workout session as completed */
  completeSession(id: string): Promise<WorkoutSession>;

  /** Get all sessions for a user, newest first */
  findSessionsByUserId(userId: string): Promise<WorkoutSession[]>;

  /** Get the active (incomplete) session for a user, if any */
  findActiveSession(userId: string): Promise<WorkoutSessionWithExercises | null>;
}
