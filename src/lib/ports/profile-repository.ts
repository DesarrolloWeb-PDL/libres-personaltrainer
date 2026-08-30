/**
 * Profile Repository Port — Hexagonal Architecture
 *
 * This port defines the contract for user profile data access.
 * Infrastructure adapters implement this interface; domain logic depends only on it.
 */

export interface ProfileRecord {
  id: string;
  userId: string;
  age: number | null;
  experienceLevel: string | null;
  goals: string | null;
  equipment: string | null;
  injuries: string | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
}

export interface CreateProfileData {
  userId: string;
  age?: number;
  experienceLevel?: string;
  goals?: string;
  equipment?: string;
  injuries?: string;
  gender?: string;
  weight?: number;
  height?: number;
}

export interface UpdateProfileData {
  age?: number;
  experienceLevel?: string;
  goals?: string | null;
  equipment?: string;
  injuries?: string;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
}

export interface ProfileRepository {
  /** Find a profile by user ID */
  findByUserId(userId: string): Promise<ProfileRecord | null>;

  /** Create a new profile */
  create(data: CreateProfileData): Promise<ProfileRecord>;

  /** Update an existing profile */
  update(userId: string, data: UpdateProfileData): Promise<ProfileRecord>;
}
