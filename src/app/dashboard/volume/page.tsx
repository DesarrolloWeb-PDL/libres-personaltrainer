"use client";

import { useState, useMemo } from "react";
import { api } from "@/lib/api/trpc-client";
import { VolumeLandmarks } from "@/components/progress/volume-landmarks";
import { OverreachingWarning } from "@/components/progress/overreaching-warning";
import { DeloadRecommendation } from "@/components/progress/deload-recommendation";
import { useSession } from "next-auth/react";

export default function VolumeDashboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const [warningDismissed, setWarningDismissed] = useState(false);

  const statusQuery = api.volume.getStatus.useQuery({
    userId,
    experienceLevel: "intermediate",
  });

  const deloadQuery = api.volume.getDeloadRecommendation.useQuery({
    userId,
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
    const undertrainingCount = statuses.filter((s) => s.status === "undertraining").length;
    const overreachingCount = statuses.filter((s) => s.status === "overreaching").length;

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
    await activateDeloadMutation.mutateAsync({ userId });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Volume Tracking</h1>
        <p className="text-sm text-zinc-400">
          Monitor your training volume per muscle group and optimize recovery.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Sets
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {isLoading ? "..." : summaryStats.totalSets}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-lime-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Volume
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {isLoading ? "..." : summaryStats.totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400">kg</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-lime-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Optimal</p>
              <p className="text-3xl font-black text-lime-400">
                {isLoading ? "..." : summaryStats.optimalCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-rose-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Issues</p>
              <p className="text-3xl font-black text-rose-400">
                {isLoading
                  ? "..."
                  : summaryStats.undertrainingCount + summaryStats.overreachingCount}
              </p>
            </div>
          </div>
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
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400">Loading volume status...</p>
        </div>
      ) : (
        <VolumeLandmarks statuses={statuses} />
      )}
    </div>
  );
}
