import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaExerciseAdapter } from "@/lib/infrastructure/prisma/adapters/exercise";

const exerciseRepo = new PrismaExerciseAdapter();

/**
 * Exercise tRPC router — CRUD + search + filtering.
 */
export const exerciseRouter = createTRPCRouter({
  /** List all exercises, optionally filtered by muscle group or equipment */
  list: publicProcedure
    .input(
      z
        .object({
          muscleGroupId: z.string().optional(),
          equipmentId: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(({ input }) => {
      return exerciseRepo.findAll(input);
    }),

  /** Search exercises by name (EN or ES), partial match */
  search: publicProcedure
    .input(z.object({ q: z.string().min(1) }))
    .query(({ input }) => {
      return exerciseRepo.search(input.q);
    }),

  /** Get a single exercise by ID */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return exerciseRepo.findById(input.id);
    }),

  /** Filter by muscle group */
  byMuscleGroup: publicProcedure
    .input(z.object({ muscleGroupId: z.string() }))
    .query(({ input }) => {
      return exerciseRepo.findAll({ muscleGroupId: input.muscleGroupId });
    }),

  /** Filter by equipment */
  byEquipment: publicProcedure
    .input(z.object({ equipmentId: z.string() }))
    .query(({ input }) => {
      return exerciseRepo.findAll({ equipmentId: input.equipmentId });
    }),
});
