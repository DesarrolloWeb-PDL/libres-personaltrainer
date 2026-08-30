import type {
  ProgramRepository,
  ProgramRecord,
  ProgramWithDays,
  CreateProgramData,
} from "@/lib/ports/program-repository";
import { prisma } from "../client";

/**
 * Prisma adapter for the ProgramRepository port.
 *
 * Implements training program data access using Prisma + SQLite.
 * Supports full program creation with nested days and exercises.
 */
export class PrismaProgramAdapter implements ProgramRepository {
  private readonly includeWithDays = {
    days: {
      orderBy: { dayNumber: "asc" as const },
      include: {
        exercises: {
          orderBy: { order: "asc" as const },
          include: {
            exercise: {
              include: {
                muscleGroup: true,
              },
            },
          },
        },
      },
    },
  } as const;

  async findById(id: string): Promise<ProgramWithDays | null> {
    return prisma.trainingProgram.findUnique({
      where: { id },
      include: this.includeWithDays,
    }) as Promise<ProgramWithDays | null>;
  }

  async findActiveByUserId(userId: string): Promise<ProgramWithDays | null> {
    return prisma.trainingProgram.findFirst({
      where: { userId },
      orderBy: { startDate: "desc" },
      include: this.includeWithDays,
    }) as Promise<ProgramWithDays | null>;
  }

  async create(data: CreateProgramData): Promise<ProgramWithDays> {
    return prisma.trainingProgram.create({
      data: {
        userId: data.userId,
        name: data.name,
        splitType: data.splitType ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        days: {
          create: data.days.map((day) => ({
            dayNumber: day.dayNumber,
            name: day.name ?? null,
            exercises: {
              create: day.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets ?? null,
                reps: ex.reps ?? null,
                weight: ex.weight ?? null,
                rpe: ex.rpe ?? null,
                order: ex.order,
              })),
            },
          })),
        },
      },
      include: this.includeWithDays,
    }) as Promise<ProgramWithDays>;
  }

  async findByUserId(userId: string): Promise<ProgramRecord[]> {
    return prisma.trainingProgram.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    }) as Promise<ProgramRecord[]>;
  }
}
