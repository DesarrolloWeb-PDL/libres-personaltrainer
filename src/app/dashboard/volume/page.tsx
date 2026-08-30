"use client";

import { useState, useMemo } from "react";
import { api } from "@/lib/api/trpc-client";
import { VolumeLandmarks } from "@/components/progress/volume-landmarks";
import { OverreachingWarning } from "@/components/progress/overreaching-warning";
import { DeloadRecommendation } from "@/components/progress/deload-recommendation";

const USER_ID = "cmtg8qhsf0000pgkzcm8m2mma";

export default function VolumeDashboardPage() {
  const [warningDismissed, setWarningDismissed] = useState(false);

  const statusQuery = api.volume.getStatus.useQuery({
    userId: USER_ID,
    experienceLevel: "intermediate",
  });

  const deloadQuery = api.volume.getDeloadRecommendation.useQuery({
    userId: USER_ID,
    weeksSinceDeload: 0,
  });

  const activateDeloadMutation = api.volume.activateDeload.useMutation({
    onSuccess: () => {
      deloadQuery.refetch();
    },
  });

  const statuses = statusQuery.data ?? [];
  const deload = deloadQuery.data ?? {
    recommendation: "continue" as const,
    reason: "Loading...",
    weeksSinceDeload: 0,
    lastDeloadWeek: null,
    totalDeloads: 0,
  };

  const overreachingMuscles = useMemo(
    () => statuses.filter((s) => s.status === "overreaching"),
    [statuses],
  );

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

  const isLoading = statusQuery.isLoading || deloadQuery.isLoading;

  const handleActivateDeload = async () => {
    await activateDeloadMutation.mutateAsync({ userId: USER_ID });
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
            {isLoading ? "..." : summaryStats.totalSets}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Total Volume
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : summaryStats.totalVolume.toLocaleString()} kg
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Optimal
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? "..." : summaryStats.optimalCount}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Issues
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {isLoading ? "..." : summaryStats.undertrainingCount + summaryStats.overreachingCount}
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
        isActivating={activateDeloadMutation.isPending}
      />

      {/* Volume Landmarks Display */}
      {isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading volume status...</p>
        </div>
      ) : (
        <VolumeLandmarks statuses={statuses} />
      )}
    </div>
  );
}
