import type {
  ExerciseRepository,
  ExerciseFilters,
  ExerciseWithRelations,
} from "@/lib/ports/exercise-repository";
import { prisma } from "../client";

/**
 * Prisma adapter for the ExerciseRepository port.
 *
 * Implements exercise data access using Prisma + SQLite.
 * Includes muscleGroup, equipment, and media relations.
 */
export class PrismaExerciseAdapter implements ExerciseRepository {
  private readonly include = {
    muscleGroup: true,
    equipment: true,
    media: true,
  } as const;

  async findAll(filters?: ExerciseFilters): Promise<ExerciseWithRelations[]> {
    const where: Record<string, unknown> = {};

    if (filters?.muscleGroupId) {
      where.muscleGroupId = filters.muscleGroupId;
    }

    if (filters?.equipmentId) {
      where.equipmentId = filters.equipmentId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { nameEs: { contains: filters.search } },
      ];
    }

    return prisma.exercise.findMany({
      where,
      include: this.include,
      orderBy: { name: "asc" },
    }) as Promise<ExerciseWithRelations[]>;
  }

  async findById(id: string): Promise<ExerciseWithRelations | null> {
    return prisma.exercise.findUnique({
      where: { id },
      include: this.include,
    }) as Promise<ExerciseWithRelations | null>;
  }

  async search(query: string): Promise<ExerciseWithRelations[]> {
    return prisma.exercise.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { nameEs: { contains: query } },
        ],
      },
      include: this.include,
      orderBy: { name: "asc" },
    }) as Promise<ExerciseWithRelations[]>;
  }
}
