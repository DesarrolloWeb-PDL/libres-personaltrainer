import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaProgramAdapter } from "@/lib/infrastructure/prisma/adapters/program";
import { PrismaExerciseAdapter } from "@/lib/infrastructure/prisma/adapters/exercise";
import { generateProgram, selectSplit } from "@/lib/domain/training-engine";
import type { Exercise as DomainExercise } from "@/lib/domain/types";
import type { Equipment } from "@/lib/domain/types";

const programRepo = new PrismaProgramAdapter();
const exerciseRepo = new PrismaExerciseAdapter();

/**
 * Maps DB equipment name to domain Equipment type.
 */
function mapEquipment(name: string): Equipment {
  const map: Record<string, Equipment> = {
    Barbell: "full_gym",
    Dumbbell: "full_gym",
    Cable: "full_gym",
    Machine: "full_gym",
    "Pull-up Bar": "full_gym",
    "Bodyweight": "bodyweight_only",
    Resistance: "home_gym",
  };
  return map[name] ?? "full_gym";
}

/**
 * Maps DB exercise to domain Exercise type for the training engine.
 */
function toDomainExercise(
  ex: { id: string; name: string; muscleGroup: { category: string | null } | null; equipment: { name: string } | null },
  isCompound: boolean = true,
): DomainExercise {
  const mgCategory = ex.muscleGroup?.category ?? "chest";
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: mgCategory as DomainExercise["muscleGroup"],
    equipment: ex.equipment ? [mapEquipment(ex.equipment.name)] : ["full_gym"],
    isCompound,
  };
}

/**
 * Program tRPC router — generate, get, list programs.
 */
export const programRouter = createTRPCRouter({
  /** Generate a new program from user profile */
  generate: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().default("My Training Program"),
        trainingFrequency: z.number().int().min(1).max(7),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
      })
    )
    .mutation(async ({ input }) => {
      // Fetch available exercises from DB
      const dbExercises = await exerciseRepo.findAll();

      // Map to domain exercises (assume all are compound for now)
      const exercises = dbExercises.map((ex) => toDomainExercise(ex));

      // Generate program using the domain training engine
      const program = generateProgram(
        {
          age: 25,
          experienceLevel: input.experienceLevel,
          goals: ["muscle_gain"],
          equipment: "full_gym",
          trainingFrequency: input.trainingFrequency,
        },
        exercises,
      );

      // Persist the generated program
      const created = await programRepo.create({
        userId: input.userId,
        name: input.name,
        splitType: program.splitType,
        startDate: new Date(),
        days: program.days.map((day) => ({
          dayNumber: day.dayNumber,
          name: day.name,
          exercises: day.exercises.map((we, idx) => {
            // Find the DB exercise ID from the domain exercise
            const dbEx = dbExercises.find((d) => d.name === we.exercise.name);
            return {
              exerciseId: dbEx?.id ?? exercises[0].id,
              sets: we.sets,
              reps: we.reps,
              rpe: we.rpe,
              order: idx + 1,
            };
          }),
        })),
      });

      return created;
    }),

  /** Get the current active program for a user */
  getCurrent: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return programRepo.findActiveByUserId(input.userId);
    }),

  /** Get a program by ID */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return programRepo.findById(input.id);
    }),

  /** List all programs for a user */
  listByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return programRepo.findByUserId(input.userId);
    }),
});
