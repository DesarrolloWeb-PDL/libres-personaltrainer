/**
 * Volume Tracking Repository Port — Hexagonal Architecture
 *
 * This port defines the contract for volume tracking data access.
 * Infrastructure adapters implement this interface; domain logic depends only on it.
 */

export interface VolumeTrackingEntry {
  id: string;
  userId: string;
  muscleGroup: string;
  week: string;
  sets: number;
  volumeLoad: number;
}

export interface UpsertVolumeData {
  userId: string;
  muscleGroup: string;
  week: string;
  sets: number;
  volumeLoad?: number;
}

export interface VolumeTrackingRepository {
  /** Upsert volume tracking entry (create or update) */
  upsert(data: UpsertVolumeData): Promise<VolumeTrackingEntry>;

  /** Get current week's volume for a user */
  getCurrentWeekVolume(userId: string): Promise<VolumeTrackingEntry[]>;

  /** Get volume history for a user, optionally filtered by muscle group */
  getHistory(
    userId: string,
    muscleGroup?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<VolumeTrackingEntry[]>;

  /** Calculate volume from workout sessions for a specific week */
  calculateVolumeFromSessions(
    userId: string,
    week: string,
  ): Promise<VolumeTrackingEntry[]>;

  /** Get the last deload week for a user */
  getLastDeloadWeek(userId: string): Promise<string | null>;

  /** Mark a week as deload */
  markDeloadWeek(userId: string, week: string): Promise<void>;

  /** Get all weeks with deload status */
  getDeloadWeeks(userId: string): Promise<string[]>;
}
