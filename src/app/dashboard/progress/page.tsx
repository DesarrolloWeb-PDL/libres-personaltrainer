"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api/trpc-client";
import { BodyWeightForm } from "@/components/progress/body-weight-form";
import {
  OneRMChart,
  BodyWeightChart,
  VolumeLoadChart,
} from "@/components/progress/volume-load-chart";
import { useSession } from "next-auth/react";

export default function ProgressPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const [dateRange, setDateRange] = useState<"3m" | "6m" | "1y" | "all">(
    "all",
  );

  const weightQuery = api.progress.getWeightHistory.useQuery({
    userId,
  });
  const oneRMQuery = api.progress.get1RMHistory.useQuery({
    userId,
  });
  const volumeQuery = api.progress.getVolumeHistory.useQuery({
    userId,
  });

  const weightHistory = useMemo(() => {
    if (!weightQuery.data) return [];
    return weightQuery.data
      .filter((e) => e.bodyWeight !== null)
      .map((e) => ({
        date: new Date(e.date).toISOString().split("T")[0],
        value: e.bodyWeight!,
      }));
  }, [weightQuery.data]);

  const oneRMHistory = useMemo(() => {
    if (!oneRMQuery.data) return [];
    return oneRMQuery.data
      .filter((e) => e.estimated1RM !== null)
      .map((e) => ({
        date: new Date(e.date).toISOString().split("T")[0],
        value: e.estimated1RM!,
      }));
  }, [oneRMQuery.data]);

  const { volumeHistory, muscleGroups } = useMemo(() => {
    if (!volumeQuery.data) return { volumeHistory: [], muscleGroups: [] };

    const grouped = new Map<
      string,
      { week: string; [key: string]: string | number }
    >();
    const groups = new Set<string>();

    for (const entry of volumeQuery.data) {
      const weekKey = new Date(entry.date).toISOString().split("T")[0];
      groups.add(entry.muscleGroup);

      const existing = grouped.get(weekKey);
      if (existing) {
        existing[entry.muscleGroup] =
          ((existing[entry.muscleGroup] as number) || 0) + entry.volumeLoad;
      } else {
        grouped.set(weekKey, {
          week: weekKey,
          [entry.muscleGroup]: entry.volumeLoad,
        });
      }
    }

    return {
      volumeHistory: Array.from(grouped.values()),
      muscleGroups: Array.from(groups),
    };
  }, [volumeQuery.data]);

  const latestWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].value
    : null;

  const latest1RM = oneRMHistory.length > 0
    ? oneRMHistory[oneRMHistory.length - 1].value
    : null;

  const totalVolume = useMemo(() => {
    return volumeHistory.reduce((sum, week) => {
      const weekTotal = Object.entries(week).reduce((acc, [key, val]) => {
        if (key !== "week" && typeof val === "number") return acc + val;
        return acc;
      }, 0);
      return sum + weekTotal;
    }, 0);
  }, [volumeHistory]);

  const isLoading = weightQuery.isLoading || oneRMQuery.isLoading || volumeQuery.isLoading;

  const recordMutation = api.progress.record.useMutation({
    onSuccess: () => {
      weightQuery.refetch();
    },
  });

  const utils = api.useUtils();

  const handleExportCSV = useCallback(async () => {
    const csv = await utils.progress.exportCSV.fetch({ userId });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "progress.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [utils]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Progress</h1>
        <p className="text-sm text-zinc-400">
          Track your body weight, strength, and volume over time.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Current Weight
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {isLoading ? "..." : latestWeight !== null ? `${latestWeight}` : "—"}
              </p>
              {latestWeight !== null && (
                <p className="text-xs text-zinc-400">kg</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-lime-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Estimated 1RM
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {isLoading ? "..." : latest1RM !== null ? `${latest1RM}` : "—"}
              </p>
              {latest1RM !== null && (
                <p className="text-xs text-zinc-400">kg</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-amber-500 rounded-full" />
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Volume
              </p>
              <p className="text-3xl font-black text-zinc-50">
                {isLoading ? "..." : totalVolume > 0 ? totalVolume.toLocaleString() : "—"}
              </p>
              {totalVolume > 0 && (
                <p className="text-xs text-zinc-400">kg</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Range:
        </span>
        {(["3m", "6m", "1y", "all"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              dateRange === range
                ? "bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {range === "all" ? "All" : range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Body Weight Logging */}
      <BodyWeightForm
        onSubmit={async (data) => {
          await recordMutation.mutateAsync({
            userId,
            bodyWeight: data.bodyWeight,
            notes: data.notes,
          });
        }}
        isSubmitting={recordMutation.isPending}
      />

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-sm text-zinc-400">Loading weight data...</p>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-sm text-zinc-400">Loading strength data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BodyWeightChart data={weightHistory} />
          <OneRMChart data={oneRMHistory} />
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400">Loading volume data...</p>
        </div>
      ) : (
        <VolumeLoadChart data={volumeHistory} muscleGroups={muscleGroups} />
      )}

      {/* Data Export */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h3 className="mb-1 text-sm font-semibold text-zinc-50">Export Data</h3>
        <p className="mb-3 text-xs text-zinc-400">
          Download your progress data as CSV for external analysis.
        </p>
        <button
          onClick={handleExportCSV}
          className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}
