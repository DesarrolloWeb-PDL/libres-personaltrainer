/**
 * Plateau Detection — PURE TypeScript
 *
 * Detects when progress has stalled for 2+ weeks.
 * Suggests deload or program change when plateau is detected.
 */

export interface ProgressDataPoint {
  date: Date;
  value: number;
}

export interface PlateauResult {
  isPlateau: boolean;
  weeksSinceImprovement: number;
  lastImprovementDate: Date | null;
  currentValue: number;
  peakValue: number;
  percentChange: number;
  suggestion: string | null;
}

/**
 * Detects if a plateau exists in a series of progress data points.
 *
 * A plateau is defined as: no improvement in the metric for 14+ days.
 *
 * @param data - Array of { date, value } sorted by date ascending
 * @param minDaysForPlateau - Minimum days without improvement to consider a plateau (default: 14)
 * @returns PlateauResult with detection info and suggestion
 */
export function detectPlateau(
  data: ProgressDataPoint[],
  minDaysForPlateau: number = 14,
): PlateauResult {
  if (data.length === 0) {
    return {
      isPlateau: false,
      weeksSinceImprovement: 0,
      lastImprovementDate: null,
      currentValue: 0,
      peakValue: 0,
      percentChange: 0,
      suggestion: null,
    };
  }

  // Sort by date ascending
  const sorted = [...data].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const currentValue = sorted[sorted.length - 1].value;
  const peakValue = Math.max(...sorted.map((d) => d.value));

  // Find the last time the value improved over the peak
  let lastImprovementDate: Date | null = null;
  let runningPeak = -Infinity;

  for (const point of sorted) {
    if (point.value > runningPeak) {
      runningPeak = point.value;
      lastImprovementDate = point.date;
    }
  }

  const now = new Date();
  const daysSinceImprovement = lastImprovementDate
    ? Math.floor(
        (now.getTime() - lastImprovementDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : sorted.length > 0
      ? Math.floor(
          (now.getTime() - sorted[0].date.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  const weeksSinceImprovement = Math.floor(daysSinceImprovement / 7);

  const isPlateau = daysSinceImprovement >= minDaysForPlateau;

  const percentChange =
    peakValue > 0
      ? ((currentValue - peakValue) / peakValue) * 100
      : 0;

  let suggestion: string | null = null;
  if (isPlateau) {
    if (percentChange < -5) {
      suggestion =
        "Performance has declined. Consider a deload week to recover, then reassess your program.";
    } else if (weeksSinceImprovement >= 4) {
      suggestion =
        "No improvement for 4+ weeks. Consider changing your training program, rep ranges, or exercise selection.";
    } else {
      suggestion =
        "Progress has stalled for 2+ weeks. Try adjusting volume, intensity, or adding variety to break through.";
    }
  }

  return {
    isPlateau,
    weeksSinceImprovement,
    lastImprovementDate,
    currentValue,
    peakValue,
    percentChange: Math.round(percentChange * 100) / 100,
    suggestion,
  };
}

/**
 * Calculates weekly averages from daily progress data.
 * Useful for smoothing out noise in body weight tracking.
 */
export function calculateWeeklyAverages(
  data: ProgressDataPoint[],
): { weekStart: Date; average: number; count: number }[] {
  if (data.length === 0) return [];

  const sorted = [...data].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const weekMap = new Map<
    string,
    { sum: number; count: number; firstDate: Date }
  >();

  for (const point of sorted) {
    const weekKey = getWeekKey(point.date);
    const existing = weekMap.get(weekKey);
    if (existing) {
      existing.sum += point.value;
      existing.count += 1;
    } else {
      weekMap.set(weekKey, {
        sum: point.value,
        count: 1,
        firstDate: startOfWeek(point.date),
      });
    }
  }

  return Array.from(weekMap.values())
    .map((w) => ({
      weekStart: w.firstDate,
      average: Math.round((w.sum / w.count) * 100) / 100,
      count: w.count,
    }))
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getWeekKey(date: Date): string {
  const d = new Date(date);
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
