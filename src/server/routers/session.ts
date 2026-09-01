import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaWorkoutAdapter } from "@/lib/infrastructure/prisma/adapters/workout";
import { PrismaVolumeTrackingAdapter } from "@/lib/infrastructure/prisma/adapters/volume-tracking";
import { PrismaExerciseAdapter } from "@/lib/infrastructure/prisma/adapters/exercise";
import { PrismaProfileAdapter } from "@/lib/infrastructure/prisma/adapters/user-profile";
import { toDomainExercise } from "@/lib/infrastructure/prisma/mappers";
import { getSuggestions as getDomainSuggestions } from "@/lib/domain/substitution";
import type { Equipment } from "@/lib/domain/types";

const workoutRepo = new PrismaWorkoutAdapter();
const volumeRepo = new PrismaVolumeTrackingAdapter();
const exerciseRepo = new PrismaExerciseAdapter();
const profileRepo = new PrismaProfileAdapter();

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

  /** Mark a workout session as completed and update volume tracking */
  complete: publicProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Complete the session
      const session = await workoutRepo.completeSession(input.id);

      // Get the session with exercises to calculate volume
      const sessionWithExercises = await workoutRepo.findSessionById(
        input.id,
      );

      if (sessionWithExercises) {
        // Calculate current week string
        const week = dateToWeekString(new Date());

        // Calculate volume per muscle group from completed sets
        const volumeMap = new Map<
          string,
          { sets: number; volumeLoad: number }
        >();

        const exercises = sessionWithExercises.day?.exercises ?? [];
        for (const exercise of exercises) {
          const muscleGroup =
            exercise.exercise?.muscleGroup?.name ?? "Unknown";
          const completedSets = exercise.workoutSets?.filter(
            (s) => s.completed,
          ) ?? [];

          for (const set of completedSets) {
            const existing = volumeMap.get(muscleGroup) ?? {
              sets: 0,
              volumeLoad: 0,
            };
            const weight = set.weight ?? 0;
            const reps = set.reps ?? 0;

            volumeMap.set(muscleGroup, {
              sets: existing.sets + 1,
              volumeLoad: existing.volumeLoad + weight * reps,
            });
          }
        }

        // Upsert volume tracking for each muscle group
        for (const [muscleGroup, data] of volumeMap) {
          await volumeRepo.upsert({
            userId: input.userId,
            muscleGroup,
            week,
            sets: data.sets,
            volumeLoad: data.volumeLoad,
          });
        }
      }

      return session;
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

  /** Get up to 3 substitute suggestions for an exercise */
  getSuggestions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        exerciseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [profile, currentDbExercise, allDbExercises] = await Promise.all([
        profileRepo.findByUserId(input.userId),
        exerciseRepo.findById(input.exerciseId),
        exerciseRepo.findAll(),
      ]);

      if (!currentDbExercise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exercise not found",
        });
      }

      const equipment = (profile?.equipment as Equipment) ?? "full_gym";
      const injuries = profile?.injuries
        ? profile.injuries
            .split(",")
            .map((injury) => injury.trim())
            .filter(Boolean)
        : [];

      const current = toDomainExercise(currentDbExercise);
      const all = allDbExercises.map((ex) => toDomainExercise(ex));

      const suggestions = getDomainSuggestions(
        current,
        all,
        equipment,
        injuries,
        3,
      );

      const dbById = new Map(allDbExercises.map((ex) => [ex.id, ex]));

      return {
        suggestions: suggestions.map((suggestion) => {
          const dbExercise = dbById.get(suggestion.id);
          return {
            id: suggestion.id,
            name: suggestion.name,
            nameEs: dbExercise?.nameEs ?? null,
            muscleGroupName: dbExercise?.muscleGroup?.name ?? suggestion.muscleGroup,
            equipmentName: dbExercise?.equipment?.name ?? suggestion.equipment[0],
            isCompound: suggestion.isCompound,
            matchesProfile: suggestion.isCompound === current.isCompound,
          };
        }),
      };
    }),

  /** Apply a substitution, updating only WorkoutExercise.exerciseId */
  applySubstitution: publicProcedure
    .input(
      z.object({
        workoutExerciseId: z.string(),
        newExerciseId: z.string(),
      })
    )
    .mutation(({ input }) => {
      return workoutRepo.substituteExercise(input);
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
