/**
 * Program Repository Port — Hexagonal Architecture
 *
 * This port defines the contract for training program data access.
 * Infrastructure adapters implement this interface; domain logic depends only on it.
 */

export interface ProgramRecord {
  id: string;
  userId: string;
  name: string;
  splitType: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface ProgramWithDays extends ProgramRecord {
  days: ProgramDay[];
}

export interface ProgramDay {
  id: string;
  dayNumber: number;
  name: string | null;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
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
    muscleGroupId: string | null;
    muscleGroup: {
      id: string;
      name: string;
      nameEs: string | null;
      category: string | null;
    } | null;
  };
}

export interface CreateProgramData {
  userId: string;
  name: string;
  splitType?: string;
  startDate?: Date;
  endDate?: Date;
  days: CreateDayData[];
}

export interface CreateDayData {
  dayNumber: number;
  name?: string;
  exercises: CreateExerciseData[];
}

export interface CreateExerciseData {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  order: number;
}

export interface ProgramRepository {
  /** Find a program by ID with all relations */
  findById(id: string): Promise<ProgramWithDays | null>;

  /** Find the active program for a user (most recent) */
  findActiveByUserId(userId: string): Promise<ProgramWithDays | null>;

  /** Create a full program with nested days and exercises */
  create(data: CreateProgramData): Promise<ProgramWithDays>;

  /** List all programs for a user */
  findByUserId(userId: string): Promise<ProgramRecord[]>;
}
