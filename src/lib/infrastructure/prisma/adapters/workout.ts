import type {
  WorkoutRepository,
  WorkoutSession,
  WorkoutSessionWithExercises,
  StartSessionData,
  LogSetData,
  WorkoutSetRecord,
} from "@/lib/ports/workout-repository";
import { prisma } from "../client";

/**
 * Prisma adapter for the WorkoutRepository port.
 *
 * Implements workout session and set data access using Prisma + SQLite.
 * Handles session lifecycle: start → log sets → complete.
 */
export class PrismaWorkoutAdapter implements WorkoutRepository {
  private readonly sessionWithExercises = {
    day: {
      include: {
        exercises: {
          orderBy: { order: "asc" as const },
          include: {
            exercise: {
              include: {
                muscleGroup: true,
              },
            },
            workoutSets: {
              orderBy: { setNumber: "asc" as const },
            },
          },
        },
      },
    },
  } as const;

  async startSession(data: StartSessionData): Promise<WorkoutSession> {
    // First, get the day to know how many sets to pre-create for each exercise
    const day = await prisma.workoutDay.findUnique({
      where: { id: data.dayId },
      include: {
        exercises: {
          orderBy: { order: "asc" as const },
        },
      },
    });

    if (!day) {
      throw new Error(`WorkoutDay ${data.dayId} not found`);
    }

    // Create the session
    const session = await prisma.workoutSession.create({
      data: {
        userId: data.userId,
        programId: data.programId,
        dayId: data.dayId,
      },
    });

    // Pre-create empty sets for each exercise
    for (const exercise of day.exercises) {
      const setsCount = exercise.sets ?? 3;
      await prisma.workoutSet.createMany({
        data: Array.from({ length: setsCount }, (_, i) => ({
          workoutExerciseId: exercise.id,
          setNumber: i + 1,
          completed: false,
        })),
      });
    }

    return session as WorkoutSession;
  }

  async findSessionById(id: string): Promise<WorkoutSessionWithExercises | null> {
    const session = await prisma.workoutSession.findUnique({
      where: { id },
      include: this.sessionWithExercises,
    });

    return session as unknown as WorkoutSessionWithExercises | null;
  }

  async logSet(data: LogSetData): Promise<WorkoutSetRecord> {
    return prisma.workoutSet.update({
      where: { id: data.setId },
      data: {
        ...(data.reps !== undefined && { reps: data.reps }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.rpe !== undefined && { rpe: data.rpe }),
        completed: true,
      },
    }) as Promise<WorkoutSetRecord>;
  }

  async completeSession(id: string): Promise<WorkoutSession> {
    return prisma.workoutSession.update({
      where: { id },
      data: { completedAt: new Date() },
    }) as Promise<WorkoutSession>;
  }

  async findSessionsByUserId(userId: string): Promise<WorkoutSession[]> {
    return prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
    }) as Promise<WorkoutSession[]>;
  }

  async findActiveSession(
    userId: string
  ): Promise<WorkoutSessionWithExercises | null> {
    const session = await prisma.workoutSession.findFirst({
      where: { userId, completedAt: null },
      orderBy: { startedAt: "desc" },
      include: this.sessionWithExercises,
    });

    return session as unknown as WorkoutSessionWithExercises | null;
  }
}
