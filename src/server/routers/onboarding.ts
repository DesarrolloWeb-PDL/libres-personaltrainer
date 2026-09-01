import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaProfileAdapter } from "@/lib/infrastructure/prisma/adapters/user-profile";

const profileRepo = new PrismaProfileAdapter();

const experienceLevelEnum = z.enum(["beginner", "intermediate", "advanced"]);
const goalsEnum = z.enum(["muscle_gain", "fat_loss", "strength", "endurance", "maintenance"]);
const equipmentEnum = z.enum(["full_gym", "home_gym", "bodyweight_only"]);
const genderEnum = z.enum(["male", "female", "other"]);

/**
 * Onboarding tRPC router — profile creation and retrieval during onboarding flow.
 */
export const onboardingRouter = createTRPCRouter({
  /** Get profile by user ID */
  getProfile: publicProcedure.input(z.object({ userId: z.string() })).query(({ input }) => {
    return profileRepo.findByUserId(input.userId);
  }),

  /** Submit full onboarding wizard data */
  submitWizard: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        age: z.number().int().min(10).max(100).optional(),
        experienceLevel: experienceLevelEnum.optional(),
        goals: z.array(goalsEnum).min(1).optional(),
        equipment: equipmentEnum.optional(),
        injuries: z.string().optional(),
        gender: genderEnum.optional(),
        weight: z.number().min(20).max(300).optional(),
        height: z.number().min(100).max(250).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, goals, ...profileData } = input;

      // Serialize goals array to comma-separated string for storage
      const goalsString = goals?.join(",") ?? null;

      return profileRepo.update(userId, {
        ...profileData,
        goals: goalsString,
      });
    }),

  /** Update a single profile field */
  updateProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        age: z.number().int().min(10).max(100).optional(),
        experienceLevel: experienceLevelEnum.optional(),
        goals: z.array(goalsEnum).optional(),
        equipment: equipmentEnum.optional(),
        injuries: z.string().optional(),
        gender: genderEnum.optional(),
        weight: z.number().min(20).max(300).optional(),
        height: z.number().min(100).max(250).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, goals, ...profileData } = input;

      const goalsString = goals?.join(",") ?? undefined;

      return profileRepo.update(userId, {
        ...profileData,
        goals: goalsString,
      });
    }),
});
