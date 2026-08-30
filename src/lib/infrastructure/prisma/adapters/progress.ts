import type {
  ProgressRepository,
  ProgressEntry,
  VolumeLoadEntry,
  RecordProgressData,
} from "@/lib/ports/progress-repository";
import { prisma } from "../client";

/**
 * Prisma adapter for the ProgressRepository port.
 *
 * Implements progress and body weight data access using Prisma + SQLite.
 * Handles recording progress, querying history, and CSV export.
 */
export class PrismaProgressAdapter implements ProgressRepository {
  async record(data: RecordProgressData): Promise<ProgressEntry> {
    return prisma.progress.create({
      data: {
        userId: data.userId,
        date: data.date ?? new Date(),
        bodyWeight: data.bodyWeight ?? null,
        estimated1RM: data.estimated1RM ?? null,
        notes: data.notes ?? null,
      },
    }) as Promise<ProgressEntry>;
  }

  async getWeightHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProgressEntry[]> {
    return prisma.progress.findMany({
      where: {
        userId,
        bodyWeight: { not: null },
        ...(startDate && { date: { gte: startDate } }),
        ...(endDate && { date: { lte: endDate } }),
        ...(!startDate && !endDate && {}),
        AND: [
          ...(startDate ? [{ date: { gte: startDate } }] : []),
          ...(endDate ? [{ date: { lte: endDate } }] : []),
        ],
      },
      orderBy: { date: "asc" },
    }) as Promise<ProgressEntry[]>;
  }

  async get1RMHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProgressEntry[]> {
    return prisma.progress.findMany({
      where: {
        userId,
        estimated1RM: { not: null },
        AND: [
          ...(startDate ? [{ date: { gte: startDate } }] : []),
          ...(endDate ? [{ date: { lte: endDate } }] : []),
        ],
      },
      orderBy: { date: "asc" },
    }) as Promise<ProgressEntry[]>;
  }

  async getVolumeHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VolumeLoadEntry[]> {
    const where: Record<string, unknown> = {
      userId,
      workoutExercise: {
        day: {
          program: {
            userId,
          },
        },
      },
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      (where as Record<string, unknown>).workoutSession = {
        startedAt: dateFilter,
      };
    }

    const sets = await prisma.workoutSet.findMany({
      where: {
        completed: true,
        workoutExercise: {
          day: {
            program: {
              userId,
            },
          },
        },
        ...(startDate || endDate
          ? {
              workoutExercise: {
                day: {
                  sessions: {
                    some: {
                      startedAt: {
                        ...(startDate ? { gte: startDate } : {}),
                        ...(endDate ? { lte: endDate } : {}),
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        workoutExercise: {
          include: {
            exercise: {
              include: {
                muscleGroup: true,
              },
            },
            day: {
              include: {
                sessions: {
                  orderBy: { startedAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Group by week + muscle group
    const grouped = new Map<
      string,
      { date: Date; muscleGroup: string; volumeLoad: number; sets: number }
    >();

    for (const set of sets) {
      const muscleGroup =
        set.workoutExercise.exercise.muscleGroup?.name ?? "Unknown";
      const weight = set.weight ?? 0;
      const reps = set.reps ?? 0;
      const volumeLoad = weight * reps;

      // Get week key from session date
      const sessionDate =
        set.workoutExercise.day.sessions[0]?.startedAt ?? new Date();
      const weekKey = getWeekKey(sessionDate);
      const groupKey = `${weekKey}-${muscleGroup}`;

      const existing = grouped.get(groupKey);
      if (existing) {
        existing.volumeLoad += volumeLoad;
        existing.sets += 1;
      } else {
        grouped.set(groupKey, {
          date: startOfWeek(sessionDate),
          muscleGroup,
          volumeLoad,
          sets: 1,
        });
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }

  async getLatest(userId: string): Promise<ProgressEntry | null> {
    return prisma.progress.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }) as Promise<ProgressEntry | null>;
  }

  async getAllByUserId(userId: string): Promise<ProgressEntry[]> {
    return prisma.progress.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }) as Promise<ProgressEntry[]>;
  }

  async exportCSV(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    const entries = await prisma.progress.findMany({
      where: {
        userId,
        AND: [
          ...(startDate ? [{ date: { gte: startDate } }] : []),
          ...(endDate ? [{ date: { lte: endDate } }] : []),
        ],
      },
      orderBy: { date: "asc" },
    });

    const header = "Date,Body Weight,Estimated 1RM,Notes";
    const rows = entries.map((e) => {
      const date = e.date.toISOString().split("T")[0];
      const weight = e.bodyWeight ?? "";
      const oneRM = e.estimated1RM ?? "";
      const notes = e.notes ? `"${e.notes.replace(/"/g, '""')}"` : "";
      return `${date},${weight},${oneRM},${notes}`;
    });

    return [header, ...rows].join("\n");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getWeekKey(date: Date): string {
  const d = new Date(date);
  // Get ISO week number
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
