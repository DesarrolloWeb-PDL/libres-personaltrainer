import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/infrastructure/prisma/client";

/**
 * Nutrition tRPC router — TDEE calculator and meal logging.
 */
export const nutritionRouter = createTRPCRouter({
  /** Get user profile for nutrition calculations */
  getProfile: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: input.userId },
    });
    return profile;
  }),

  /** Update nutrition profile fields */
  updateProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        gender: z.enum(["male", "female", "other"]).optional(),
        weight: z.number().min(20).max(300).optional(),
        height: z.number().min(100).max(250).optional(),
        age: z.number().int().min(10).max(100).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, ...data } = input;
      return prisma.profile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
    }),

  /** Log a meal entry */
  logMeal: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string(),
        calories: z.number().min(0),
        protein: z.number().min(0).optional(),
        carbs: z.number().min(0).optional(),
        fat: z.number().min(0).optional(),
        date: z.string().optional(), // ISO date string, defaults to today
      }),
    )
    .mutation(async ({ input }) => {
      const date = input.date ? new Date(input.date) : new Date();
      // Normalize to start of day
      date.setHours(0, 0, 0, 0);

      return prisma.mealEntry.create({
        data: {
          userId: input.userId,
          name: input.name,
          calories: input.calories,
          protein: input.protein ?? 0,
          carbs: input.carbs ?? 0,
          fat: input.fat ?? 0,
          date,
        },
      });
    }),

  /** Get meal entries for a date range */
  getMeals: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ? new Date(input.startDate) : new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = input.endDate ? new Date(input.endDate) : new Date();
      endDate.setHours(23, 59, 59, 999);

      return prisma.mealEntry.findMany({
        where: {
          userId: input.userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "desc" },
      });
    }),

  /** Delete a meal entry */
  deleteMeal: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    return prisma.mealEntry.delete({
      where: { id: input.id },
    });
  }),

  /** Get daily nutrition summary */
  getDailySummary: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        date: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const date = input.date ? new Date(input.date) : new Date();
      date.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const meals = await prisma.mealEntry.findMany({
        where: {
          userId: input.userId,
          date: {
            gte: date,
            lte: endDate,
          },
        },
      });

      const totals = meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fat: acc.fat + meal.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );

      return {
        date: date.toISOString().split("T")[0],
        meals,
        totals,
      };
    }),
});
