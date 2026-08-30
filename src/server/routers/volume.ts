import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaVolumeTrackingAdapter } from "@/lib/infrastructure/prisma/adapters/volume-tracking";
import {
  getLandmarks,
  checkVolumeStatus,
  calculateWeeklyVolume,
} from "@/lib/domain/volume";
import { shouldDeload } from "@/lib/domain/deload";
import type { ExperienceLevel, MuscleGroup } from "@/lib/domain/types";
import { ALL_MUSCLE_GROUPS } from "@/lib/domain/constants";

const volumeRepo = new PrismaVolumeTrackingAdapter();

/**
 * Volume tRPC router — volume tracking, status, and deload recommendations.
 */
export const volumeRouter = createTRPCRouter({
  /** Get current week's volume for a user */
  getCurrentWeek: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return volumeRepo.getCurrentWeekVolume(input.userId);
    }),

  /** Get volume history for a user */
  getHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        muscleGroup: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      return volumeRepo.getHistory(
        input.userId,
        input.muscleGroup,
        input.startDate,
        input.endDate,
      );
    }),

  /** Calculate volume from workout sessions for a specific week */
  calculateVolume: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        week: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return volumeRepo.calculateVolumeFromSessions(
        input.userId,
        input.week,
      );
    }),

  /** Get volume status per muscle group with landmarks */
  getStatus: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
      }),
    )
    .query(async ({ input }) => {
      const currentVolume = await volumeRepo.getCurrentWeekVolume(
        input.userId,
      );
      const landmarks = getLandmarks(input.experienceLevel);

      // Build status for all muscle groups
      const statuses = ALL_MUSCLE_GROUPS.map((muscle) => {
        const tracking = currentVolume.find(
          (v) => v.muscleGroup === muscle,
        );
        const landmark = landmarks.find((l) => l.muscleGroup === muscle);

        if (!landmark) {
          return {
            muscleGroup: muscle,
            status: "optimal" as const,
            sets: tracking?.sets ?? 0,
            volumeLoad: tracking?.volumeLoad ?? 0,
            landmarks: null,
          };
        }

        const status = checkVolumeStatus(
          tracking?.sets ?? 0,
          landmark,
        );

        return {
          muscleGroup: muscle,
          status,
          sets: tracking?.sets ?? 0,
          volumeLoad: tracking?.volumeLoad ?? 0,
          landmarks: landmark,
        };
      });

      return statuses;
    }),

  /** Get deload recommendation */
  getDeloadRecommendation: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        weeksSinceDeload: z.number().min(0),
      }),
    )
    .query(async ({ input }) => {
      const lastDeloadWeek = await volumeRepo.getLastDeloadWeek(
        input.userId,
      );
      const deloadWeeks = await volumeRepo.getDeloadWeeks(input.userId);

      // Simple recommendation based on time
      const shouldDeloadNow = shouldDeload(input.weeksSinceDeload);

      let recommendation: "deload_now" | "continue" | "adjust" =
        "continue";
      let reason = "You're in a good training rhythm.";

      if (shouldDeloadNow) {
        recommendation = "deload_now";
        reason =
          "It's been 5+ weeks since your last deload. Consider a deload week to allow recovery.";
      } else if (input.weeksSinceDeload >= 4) {
        recommendation = "adjust";
        reason =
          "Approaching deload territory. Monitor fatigue and performance closely.";
      }

      return {
        recommendation,
        reason,
        weeksSinceDeload: input.weeksSinceDeload,
        lastDeloadWeek,
        totalDeloads: deloadWeeks.length,
      };
    }),

  /** Mark current week as deload */
  activateDeload: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const now = new Date();
      const weekString = dateToWeekString(now);
      await volumeRepo.markDeloadWeek(input.userId, weekString);
      return { success: true, week: weekString };
    }),
});

// ─── Helpers ─────────────────────────────────────────────────────────

function dateToWeekString(date: Date): string {
  const d = new Date(date);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
