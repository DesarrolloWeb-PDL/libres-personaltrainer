import type {
  VolumeTrackingRepository,
  VolumeTrackingEntry,
  UpsertVolumeData,
} from "@/lib/ports/volume-tracking-repository";
import { prisma } from "../client";

/**
 * Prisma adapter for the VolumeTrackingRepository port.
 *
 * Implements volume tracking data access using Prisma + SQLite.
 * Handles upserting volume entries, calculating volume from sessions,
 * and managing deload weeks.
 */
export class PrismaVolumeTrackingAdapter implements VolumeTrackingRepository {
  async upsert(data: UpsertVolumeData): Promise<VolumeTrackingEntry> {
    const existing = await prisma.volumeTracking.findUnique({
      where: {
        userId_muscleGroup_week: {
          userId: data.userId,
          muscleGroup: data.muscleGroup,
          week: data.week,
        },
      },
    });

    if (existing) {
      const updated = await prisma.volumeTracking.update({
        where: { id: existing.id },
        data: {
          sets: data.sets,
          ...(data.volumeLoad !== undefined && { volumeLoad: data.volumeLoad }),
        },
      });
      return updated as VolumeTrackingEntry;
    }

    const created = await prisma.volumeTracking.create({
      data: {
        userId: data.userId,
        muscleGroup: data.muscleGroup,
        week: data.week,
        sets: data.sets,
        volumeLoad: data.volumeLoad ?? 0,
      },
    });

    return created as VolumeTrackingEntry;
  }

  async getCurrentWeekVolume(userId: string): Promise<VolumeTrackingEntry[]> {
    const week = getCurrentWeekString();
    return prisma.volumeTracking.findMany({
      where: { userId, week },
      orderBy: { muscleGroup: "asc" },
    }) as Promise<VolumeTrackingEntry[]>;
  }

  async getHistory(
    userId: string,
    muscleGroup?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<VolumeTrackingEntry[]> {
    return prisma.volumeTracking.findMany({
      where: {
        userId,
        ...(muscleGroup && { muscleGroup }),
        ...(startDate && { week: { gte: startDate } }),
        ...(endDate && { week: { lte: endDate } }),
      },
      orderBy: [{ week: "asc" }, { muscleGroup: "asc" }],
    }) as Promise<VolumeTrackingEntry[]>;
  }

  async calculateVolumeFromSessions(userId: string, week: string): Promise<VolumeTrackingEntry[]> {
    // Get week date range from ISO week string
    const weekStart = getWeekStartDate(week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get completed sets for this week
    const sets = await prisma.workoutSet.findMany({
      where: {
        completed: true,
        workoutExercise: {
          day: {
            program: {
              userId,
            },
            sessions: {
              some: {
                startedAt: {
                  gte: weekStart,
                  lt: weekEnd,
                },
              },
            },
          },
        },
      },
      include: {
        workoutExercise: {
          include: {
            exercise: {
              include: {
                muscleGroup: true,
              },
            },
          },
        },
      },
    });

    // Group by muscle group
    const volumeMap = new Map<string, { sets: number; volumeLoad: number }>();

    for (const set of sets) {
      const muscleGroup = set.workoutExercise.exercise.muscleGroup?.name ?? "Unknown";
      const weight = set.weight ?? 0;
      const reps = set.reps ?? 0;
      const volumeLoad = weight * reps;

      const existing = volumeMap.get(muscleGroup) ?? {
        sets: 0,
        volumeLoad: 0,
      };
      volumeMap.set(muscleGroup, {
        sets: existing.sets + 1,
        volumeLoad: existing.volumeLoad + volumeLoad,
      });
    }

    // Upsert each muscle group's volume
    const results: VolumeTrackingEntry[] = [];
    for (const [muscleGroup, data] of volumeMap) {
      const entry = await this.upsert({
        userId,
        muscleGroup,
        week,
        sets: data.sets,
        volumeLoad: data.volumeLoad,
      });
      results.push(entry);
    }

    return results;
  }

  async getLastDeloadWeek(userId: string): Promise<string | null> {
    // We use a convention: deload weeks are stored with a special prefix
    const deloadEntry = await prisma.volumeTracking.findFirst({
      where: {
        userId,
        muscleGroup: "__deload__",
      },
      orderBy: { week: "desc" },
    });

    return deloadEntry?.week ?? null;
  }

  async markDeloadWeek(userId: string, week: string): Promise<void> {
    await this.upsert({
      userId,
      muscleGroup: "__deload__",
      week,
      sets: 0,
      volumeLoad: 0,
    });
  }

  async getDeloadWeeks(userId: string): Promise<string[]> {
    const entries = await prisma.volumeTracking.findMany({
      where: {
        userId,
        muscleGroup: "__deload__",
      },
      orderBy: { week: "asc" },
    });

    return entries.map((e) => e.week);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getCurrentWeekString(): string {
  const now = new Date();
  return dateToWeekString(now);
}

function dateToWeekString(date: Date): string {
  const d = new Date(date);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekStartDate(weekString: string): Date {
  // Parse "2026-W35" format
  const [yearStr, weekStr] = weekString.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));

  const targetWeek = new Date(startOfWeek1);
  targetWeek.setDate(startOfWeek1.getDate() + (week - 1) * 7);

  return targetWeek;
}
