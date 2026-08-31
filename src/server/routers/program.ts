import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaProgramAdapter } from "@/lib/infrastructure/prisma/adapters/program";
import { PrismaExerciseAdapter } from "@/lib/infrastructure/prisma/adapters/exercise";
import { PrismaVolumeTrackingAdapter } from "@/lib/infrastructure/prisma/adapters/volume-tracking";
import { PrismaProfileAdapter } from "@/lib/infrastructure/prisma/adapters/user-profile";
import { generateProgram, selectSplit } from "@/lib/domain/training-engine";
import { applyDeload, shouldDeload } from "@/lib/domain/deload";
import type { Exercise as DomainExercise } from "@/lib/domain/types";
import type { Equipment, SplitType, UserProfile } from "@/lib/domain/types";

const programRepo = new PrismaProgramAdapter();
const exerciseRepo = new PrismaExerciseAdapter();
const volumeRepo = new PrismaVolumeTrackingAdapter();
const profileRepo = new PrismaProfileAdapter();

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
  /** Get personalized plan options based on user profile */
  getPlanOptions: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const profile = await profileRepo.findByUserId(input.userId);

      // Build user profile for domain engine
      const goals = (profile?.goals
        ? profile.goals.split(",").filter(Boolean)
        : ["muscle_gain"]) as UserProfile["goals"];

      const userProfile: UserProfile = {
        age: profile?.age ?? 25,
        experienceLevel: (profile?.experienceLevel as UserProfile["experienceLevel"]) ?? "intermediate",
        goals,
        equipment: (profile?.equipment as Equipment) ?? "full_gym",
        trainingFrequency: 4, // default, will be overridden per option
      };

      // Generate 3 plan options with different splits
      const options: Array<{
        splitType: SplitType;
        name: string;
        description: string;
        frequency: number;
        focus: string;
        bestFor: string;
      }> = [];

      // Option 1: Based on their frequency (auto-selected split)
      const autoSplit = selectSplit({ ...userProfile, trainingFrequency: profile?.weight ? 4 : 4 });
      const autoFreq = autoSplit === "push_pull_legs" ? 5 : autoSplit === "upper_lower" ? 4 : 3;
      options.push({
        splitType: autoSplit,
        name: formatSplitName(autoSplit),
        description: getSplitDescription(autoSplit, goals),
        frequency: autoFreq,
        focus: getSplitFocus(autoSplit, goals),
        bestFor: getSplitBestFor(autoSplit, userProfile.experienceLevel),
      });

      // Option 2: Full Body (always offer for beginners or low frequency)
      if (autoSplit !== "full_body") {
        options.push({
          splitType: "full_body",
          name: "Full Body",
          description: getSplitDescription("full_body", goals),
          frequency: 3,
          focus: getSplitFocus("full_body", goals),
          bestFor: getSplitBestFor("full_body", userProfile.experienceLevel),
        });
      }

      // Option 3: PPL (for intermediate+ who can handle more volume)
      if (autoSplit !== "push_pull_legs" && userProfile.experienceLevel !== "beginner") {
        options.push({
          splitType: "push_pull_legs",
          name: "Push / Pull / Legs",
          description: getSplitDescription("push_pull_legs", goals),
          frequency: 5,
          focus: getSplitFocus("push_pull_legs", goals),
          bestFor: getSplitBestFor("push_pull_legs", userProfile.experienceLevel),
        });
      }

      // Option 4: Upper/Lower (if not already included)
      if (autoSplit !== "upper_lower" && !options.find(o => o.splitType === "upper_lower")) {
        options.push({
          splitType: "upper_lower",
          name: "Upper / Lower",
          description: getSplitDescription("upper_lower", goals),
          frequency: 4,
          focus: getSplitFocus("upper_lower", goals),
          bestFor: getSplitBestFor("upper_lower", userProfile.experienceLevel),
        });
      }

      return options.slice(0, 3); // Max 3 options
    }),

  /** Generate a new program from user profile */
  generate: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().default("My Training Program"),
        splitType: z.enum(["push_pull_legs", "upper_lower", "full_body", "custom"]).optional(),
        trainingFrequency: z.number().int().min(1).max(7),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
      })
    )
    .mutation(async ({ input }) => {
      // Fetch user profile for personalized generation
      const profile = await profileRepo.findByUserId(input.userId);

      // Fetch available exercises from DB
      const dbExercises = await exerciseRepo.findAll();

      // Map to domain exercises
      const exercises = dbExercises.map((ex) => toDomainExercise(ex));

      // Build user profile from DB (with fallbacks)
      const goals = (profile?.goals
        ? profile.goals.split(",").filter(Boolean)
        : ["muscle_gain"]) as UserProfile["goals"];

      const userProfile: UserProfile = {
        age: profile?.age ?? 25,
        experienceLevel: input.experienceLevel,
        goals,
        equipment: (profile?.equipment as Equipment) ?? "full_gym",
        trainingFrequency: input.trainingFrequency,
      };

      // Generate program using the domain training engine
      const program = generateProgram(userProfile, exercises);

      // Override split type if user explicitly chose one
      const finalSplitType = input.splitType && input.splitType !== "custom"
        ? input.splitType
        : program.splitType;

      // Regenerate with the chosen split if different
      const finalProgram = input.splitType && input.splitType !== program.splitType
        ? generateProgram({ ...userProfile, trainingFrequency: getFrequencyForSplit(input.splitType) }, exercises)
        : program;

      // Persist the generated program
      const created = await programRepo.create({
        userId: input.userId,
        name: input.name,
        splitType: finalSplitType,
        startDate: new Date(),
        days: finalProgram.days.map((day) => ({
          dayNumber: day.dayNumber,
          name: day.name,
          exercises: day.exercises.map((we, idx) => {
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

  /** Regenerate program with deload consideration */
  regenerate: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().default("My Training Program"),
        trainingFrequency: z.number().int().min(1).max(7),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
        weeksSinceDeload: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      // Fetch available exercises from DB
      const dbExercises = await exerciseRepo.findAll();

      // Map to domain exercises (assume all are compound for now)
      const exercises = dbExercises.map((ex) => toDomainExercise(ex));

      // Generate program using the domain training engine
      let program = generateProgram(
        {
          age: 25,
          experienceLevel: input.experienceLevel,
          goals: ["muscle_gain"],
          equipment: "full_gym",
          trainingFrequency: input.trainingFrequency,
        },
        exercises,
      );

      // Check if deload should be applied
      const shouldDeloadNow = shouldDeload(input.weeksSinceDeload);

      if (shouldDeloadNow) {
        // Apply deload adjustments to the program
        program = {
          ...program,
          days: applyDeload(program.days),
        };

        // Mark this week as deload
        await volumeRepo.markDeloadWeek(input.userId, getCurrentWeekString());
      }

      // Persist the generated program
      const created = await programRepo.create({
        userId: input.userId,
        name: shouldDeloadNow
          ? `${input.name} (Deload Week)`
          : input.name,
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

      return {
        program: created,
        wasDeloadApplied: shouldDeloadNow,
      };
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

  /** Delete current program and all sessions for a user (start over) */
  deleteCurrent: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      await programRepo.deleteByUserId(input.userId);
      return { success: true };
    }),
});

// ─── Helpers ─────────────────────────────────────────────────────────

function getCurrentWeekString(): string {
  const now = new Date();
  const d = new Date(now);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function formatSplitName(split: SplitType): string {
  switch (split) {
    case "push_pull_legs": return "Push / Pull / Legs";
    case "upper_lower": return "Upper / Lower";
    case "full_body": return "Full Body";
    default: return "Custom";
  }
}

function getSplitDescription(split: SplitType, goals: string[]): string {
  const hasMuscle = goals.includes("muscle_gain");
  const hasStrength = goals.includes("strength");
  const hasFatLoss = goals.includes("fat_loss");

  switch (split) {
    case "push_pull_legs":
      return hasMuscle
        ? "Hit each muscle 2x/week with dedicated push, pull, and leg days. Best for hypertrophy."
        : hasStrength
          ? "Heavy compound focus with full recovery between sessions. Ideal for strength gains."
          : "Balanced high-frequency split with room for both volume and intensity.";
    case "upper_lower":
      return hasFatLoss
        ? "4-day split with supersets to keep heart rate up. Great for body recomposition."
        : "Balanced split hitting each muscle 2x/week. Flexible for any goal.";
    case "full_body":
      return hasStrength
        ? "Full body 3x/week with compound lifts. Perfect for building a base."
        : "Maximum frequency per muscle with minimum days. Efficient and effective.";
    default:
      return "A training split tailored to your goals.";
  }
}

function getSplitFocus(split: SplitType, goals: string[]): string {
  if (goals.includes("muscle_gain")) return "Hypertrophy";
  if (goals.includes("strength")) return "Strength";
  if (goals.includes("fat_loss")) return "Fat Loss";
  if (goals.includes("endurance")) return "Endurance";
  return "General Fitness";
}

function getSplitBestFor(split: SplitType, level: string): string {
  switch (split) {
    case "push_pull_legs":
      return level === "beginner" ? "Intermediate+" : "All levels";
    case "upper_lower":
      return "All levels";
    case "full_body":
      return level === "advanced" ? "Busy schedules" : "Beginners";
    default:
      return "All levels";
  }
}

function getFrequencyForSplit(split: SplitType): number {
  switch (split) {
    case "push_pull_legs": return 5;
    case "upper_lower": return 4;
    case "full_body": return 3;
    default: return 4;
  }
}
