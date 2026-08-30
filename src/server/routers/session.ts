import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaWorkoutAdapter } from "@/lib/infrastructure/prisma/adapters/workout";

const workoutRepo = new PrismaWorkoutAdapter();

/**
 * Session tRPC router — workout session lifecycle and logging.
 */
export const sessionRouter = createTRPCRouter({
  /** Start a new workout session for a program day */
  start: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        programId: z.string(),
        dayId: z.string(),
      })
    )
    .mutation(({ input }) => {
      return workoutRepo.startSession(input);
    }),

  /** Get a session by ID with exercises and sets */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return workoutRepo.findSessionById(input.id);
    }),

  /** Log a set with reps, weight, RPE */
  logSet: publicProcedure
    .input(
      z.object({
        setId: z.string(),
        reps: z.number().int().min(0).optional(),
        weight: z.number().min(0).optional(),
        rpe: z.number().min(1).max(10).optional(),
      })
    )
    .mutation(({ input }) => {
      return workoutRepo.logSet(input);
    }),

  /** Mark a workout session as completed */
  complete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      return workoutRepo.completeSession(input.id);
    }),

  /** Get all sessions for a user, newest first */
  listByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return workoutRepo.findSessionsByUserId(input.userId);
    }),

  /** Get the active (incomplete) session for a user, if any */
  getActive: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return workoutRepo.findActiveSession(input.userId);
    }),
});
