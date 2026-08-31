/**
 * Exercise Repository Port — Hexagonal Architecture
 *
 * This port defines the contract for exercise data access.
 * Infrastructure adapters implement this interface; domain logic depends only on it.
 */

export interface ExerciseFilters {
  muscleGroupId?: string;
  equipmentId?: string;
  search?: string;
}

export interface ExerciseMedia {
  id: string;
  type: string;
  url: string;
  isPrimary: boolean;
}

export interface ExerciseWithRelations {
  id: string;
  name: string;
  nameEs: string | null;
  slug: string | null;
  instructions: string | null;
  gifUrl: string | null;
  bodyPart: string | null;
  category: string | null;
  muscle: string | null;
  muscleGroupId: string | null;
  muscleGroup: {
    id: string;
    name: string;
    nameEs: string | null;
    category: string | null;
  } | null;
  equipmentId: string | null;
  equipment: {
    id: string;
    name: string;
    nameEs: string | null;
  } | null;
  media: ExerciseMedia[];
}

export interface ExerciseRepository {
  /** Find all exercises, optionally filtered */
  findAll(filters?: ExerciseFilters): Promise<ExerciseWithRelations[]>;

  /** Find a single exercise by ID */
  findById(id: string): Promise<ExerciseWithRelations | null>;

  /** Search exercises by name (English or Spanish), partial match */
  search(query: string): Promise<ExerciseWithRelations[]>;
}
