import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaProgressAdapter } from "@/lib/infrastructure/prisma/adapters/progress";
import { detectPlateau } from "@/lib/domain/plateau";

const progressRepo = new PrismaProgressAdapter();

/**
 * Progress tRPC router — body weight, 1RM, volume, and plateau detection.
 */
export const progressRouter = createTRPCRouter({
  /** Record a new progress entry */
  record: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        date: z.date().optional(),
        bodyWeight: z.number().min(0).optional(),
        estimated1RM: z.number().min(0).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      return progressRepo.record(input);
    }),

  /** Get body weight history */
  getWeightHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(({ input }) => {
      return progressRepo.getWeightHistory(
        input.userId,
        input.startDate,
        input.endDate,
      );
    }),

  /** Get estimated 1RM history */
  get1RMHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(({ input }) => {
      return progressRepo.get1RMHistory(
        input.userId,
        input.startDate,
        input.endDate,
      );
    }),

  /** Get volume load history by muscle group */
  getVolumeHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(({ input }) => {
      return progressRepo.getVolumeHistory(
        input.userId,
        input.startDate,
        input.endDate,
      );
    }),

  /** Get latest progress entry */
  getLatest: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return progressRepo.getLatest(input.userId);
    }),

  /** Detect plateaus in progress data */
  detectPlateau: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const history = await progressRepo.get1RMHistory(input.userId);
      const weightHistory = await progressRepo.getWeightHistory(input.userId);

      const oneRMData = history
        .filter((e) => e.estimated1RM !== null)
        .map((e) => ({
          date: e.date,
          value: e.estimated1RM!,
        }));

      const weightData = weightHistory
        .filter((e) => e.bodyWeight !== null)
        .map((e) => ({
          date: e.date,
          value: e.bodyWeight!,
        }));

      return {
        oneRMPlateau: detectPlateau(oneRMData),
        weightPlateau: detectPlateau(weightData),
      };
    }),

  /** Export progress data as CSV */
  exportCSV: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(({ input }) => {
      return progressRepo.exportCSV(
        input.userId,
        input.startDate,
        input.endDate,
      );
    }),

  /** Get all progress entries */
  getAll: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return progressRepo.getAllByUserId(input.userId);
    }),
});
