"use client";

import { useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api/trpc-client";
import { BodyWeightForm } from "@/components/progress/body-weight-form";
import {
  OneRMChart,
  BodyWeightChart,
  VolumeLoadChart,
} from "@/components/progress/volume-load-chart";

const USER_ID = "cmtg8qhsf0000pgkzcm8m2mma";

export default function ProgressPage() {
  const [dateRange, setDateRange] = useState<"3m" | "6m" | "1y" | "all">(
    "all",
  );

  const weightQuery = api.progress.getWeightHistory.useQuery({
    userId: USER_ID,
  });
  const oneRMQuery = api.progress.get1RMHistory.useQuery({
    userId: USER_ID,
  });
  const volumeQuery = api.progress.getVolumeHistory.useQuery({
    userId: USER_ID,
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
    const csv = await utils.progress.exportCSV.fetch({ userId: USER_ID });
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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Progress
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Track your body weight, strength, and volume over time.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Current Weight
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : latestWeight !== null ? `${latestWeight} kg` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Estimated 1RM
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : latest1RM !== null ? `${latest1RM} kg` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Total Volume
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : "—"}
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Range:
        </span>
        {(["3m", "6m", "1y", "all"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`rounded px-3 py-1 text-xs font-medium ${
              dateRange === range
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
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
            userId: USER_ID,
            bodyWeight: data.bodyWeight,
            notes: data.notes,
          });
        }}
        isSubmitting={recordMutation.isPending}
      />

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading weight data...</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading strength data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BodyWeightChart data={weightHistory} />
          <OneRMChart data={oneRMHistory} />
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading volume data...</p>
        </div>
      ) : (
        <VolumeLoadChart data={volumeHistory} muscleGroups={muscleGroups} />
      )}

      {/* Data Export */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Export Data
        </h3>
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          Download your progress data as CSV for external analysis.
        </p>
        <button
          onClick={handleExportCSV}
          className="rounded bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}
