"use client";

import { useState, useMemo } from "react";
import { VolumeLandmarks } from "@/components/progress/volume-landmarks";
import { OverreachingWarning } from "@/components/progress/overreaching-warning";
import { DeloadRecommendation } from "@/components/progress/deload-recommendation";
import type { MuscleGroup } from "@/lib/domain/types";

// Mock data — will be replaced with tRPC queries
const MOCK_USER_ID = "user-1";

interface VolumeStatusItem {
  muscleGroup: MuscleGroup;
  status: "undertraining" | "optimal" | "overreaching";
  sets: number;
  volumeLoad: number;
  landmarks: {
    muscleGroup: MuscleGroup;
    MEV: number;
    MAV: number;
    MRV: number;
  } | null;
}

interface DeloadRecommendationData {
  recommendation: "deload_now" | "continue" | "adjust";
  reason: string;
  weeksSinceDeload: number;
  lastDeloadWeek: string | null;
  totalDeloads: number;
}

// Mock data for demonstration
const MOCK_STATUSES: VolumeStatusItem[] = [
  {
    muscleGroup: "chest",
    status: "optimal",
    sets: 14,
    volumeLoad: 4200,
    landmarks: { muscleGroup: "chest", MEV: 10, MAV: 16, MRV: 20 },
  },
  {
    muscleGroup: "back",
    status: "optimal",
    sets: 12,
    volumeLoad: 3600,
    landmarks: { muscleGroup: "back", MEV: 10, MAV: 16, MRV: 20 },
  },
  {
    muscleGroup: "shoulders",
    status: "undertraining",
    sets: 6,
    volumeLoad: 1800,
    landmarks: { muscleGroup: "shoulders", MEV: 8, MAV: 14, MRV: 18 },
  },
  {
    muscleGroup: "biceps",
    status: "optimal",
    sets: 10,
    volumeLoad: 1500,
    landmarks: { muscleGroup: "biceps", MEV: 6, MAV: 12, MRV: 16 },
  },
  {
    muscleGroup: "triceps",
    status: "optimal",
    sets: 8,
    volumeLoad: 1200,
    landmarks: { muscleGroup: "triceps", MEV: 6, MAV: 12, MRV: 16 },
  },
  {
    muscleGroup: "quadriceps",
    status: "overreaching",
    sets: 22,
    volumeLoad: 6600,
    landmarks: { muscleGroup: "quadriceps", MEV: 10, MAV: 16, MRV: 20 },
  },
  {
    muscleGroup: "hamstrings",
    status: "optimal",
    sets: 12,
    volumeLoad: 3600,
    landmarks: { muscleGroup: "hamstrings", MEV: 8, MAV: 14, MRV: 18 },
  },
  {
    muscleGroup: "glutes",
    status: "optimal",
    sets: 8,
    volumeLoad: 2400,
    landmarks: { muscleGroup: "glutes", MEV: 6, MAV: 12, MRV: 16 },
  },
  {
    muscleGroup: "calves",
    status: "undertraining",
    sets: 4,
    volumeLoad: 600,
    landmarks: { muscleGroup: "calves", MEV: 8, MAV: 14, MRV: 18 },
  },
];

const MOCK_DELOAD: DeloadRecommendationData = {
  recommendation: "adjust",
  reason:
    "Approaching deload territory. Monitor fatigue and performance closely.",
  weeksSinceDeload: 4,
  lastDeloadWeek: "2026-W31",
  totalDeloads: 2,
};

/**
 * Volume Dashboard — Overview of volume per muscle group with status indicators.
 * Shows MEV/MAV/MRV visual bars, overreaching warnings, and deload recommendations.
 */
export default function VolumeDashboardPage() {
  const [statuses] = useState<VolumeStatusItem[]>(MOCK_STATUSES);
  const [deload, setDeload] = useState<DeloadRecommendationData>(MOCK_DELOAD);
  const [isActivatingDeload, setIsActivatingDeload] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Calculate overreaching muscles
  const overreachingMuscles = useMemo(
    () => statuses.filter((s) => s.status === "overreaching"),
    [statuses],
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalSets = statuses.reduce((sum, s) => sum + s.sets, 0);
    const totalVolume = statuses.reduce((sum, s) => sum + s.volumeLoad, 0);
    const optimalCount = statuses.filter((s) => s.status === "optimal").length;
    const undertrainingCount = statuses.filter(
      (s) => s.status === "undertraining",
    ).length;
    const overreachingCount = statuses.filter(
      (s) => s.status === "overreaching",
    ).length;

    return {
      totalSets,
      totalVolume,
      optimalCount,
      undertrainingCount,
      overreachingCount,
    };
  }, [statuses]);

  const handleActivateDeload = async () => {
    setIsActivatingDeload(true);
    // TODO: Wire to tRPC mutation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setDeload((prev) => ({
      ...prev,
      recommendation: "continue",
      reason: "Deload week activated. Focus on recovery this week.",
      weeksSinceDeload: 0,
      lastDeloadWeek: "2026-W35",
      totalDeloads: prev.totalDeloads + 1,
    }));
    setIsActivatingDeload(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Volume Tracking
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Monitor your training volume per muscle group and optimize recovery.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Total Sets
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {summaryStats.totalSets}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Total Volume
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {summaryStats.totalVolume.toLocaleString()} kg
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Optimal
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {summaryStats.optimalCount}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Issues
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {summaryStats.undertrainingCount + summaryStats.overreachingCount}
          </p>
        </div>
      </div>

      {/* Overreaching Warning */}
      {!warningDismissed && overreachingMuscles.length > 0 && (
        <OverreachingWarning
          overreachingMuscles={overreachingMuscles}
          onDismiss={() => setWarningDismissed(true)}
        />
      )}

      {/* Deload Recommendation */}
      <DeloadRecommendation
        data={deload}
        onActivateDeload={handleActivateDeload}
        isActivating={isActivatingDeload}
      />

      {/* Volume Landmarks Display */}
      <VolumeLandmarks statuses={statuses} />
    </div>
  );
}
