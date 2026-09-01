/**
 * Progress Repository Port — Hexagonal Architecture
 *
 * This port defines the contract for progress and body weight data access.
 * Infrastructure adapters implement this interface; domain logic depends only on it.
 */

export interface ProgressEntry {
  id: string;
  userId: string;
  date: Date;
  bodyWeight: number | null;
  estimated1RM: number | null;
  notes: string | null;
}

export interface VolumeLoadEntry {
  date: Date;
  muscleGroup: string;
  volumeLoad: number;
  sets: number;
}

export interface RecordProgressData {
  userId: string;
  date?: Date;
  bodyWeight?: number;
  estimated1RM?: number;
  notes?: string;
}

export interface ProgressRepository {
  /** Record a new progress entry */
  record(data: RecordProgressData): Promise<ProgressEntry>;

  /** Get body weight history for a user, optionally filtered by date range */
  getWeightHistory(userId: string, startDate?: Date, endDate?: Date): Promise<ProgressEntry[]>;

  /** Get estimated 1RM history for a user, optionally filtered by date range */
  get1RMHistory(userId: string, startDate?: Date, endDate?: Date): Promise<ProgressEntry[]>;

  /** Get volume load history aggregated by muscle group and week */
  getVolumeHistory(userId: string, startDate?: Date, endDate?: Date): Promise<VolumeLoadEntry[]>;

  /** Get the latest progress entry for a user */
  getLatest(userId: string): Promise<ProgressEntry | null>;

  /** Get all progress entries for a user, newest first */
  getAllByUserId(userId: string): Promise<ProgressEntry[]>;

  /** Export progress data as CSV string */
  exportCSV(userId: string, startDate?: Date, endDate?: Date): Promise<string>;
}
