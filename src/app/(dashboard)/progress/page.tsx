"use client";

import { useState, useMemo } from "react";
import { BodyWeightForm } from "@/components/progress/body-weight-form";
import {
  OneRMChart,
  BodyWeightChart,
  VolumeLoadChart,
} from "@/components/progress/volume-load-chart";

// Mock data — will be replaced with tRPC queries
const MOCK_USER_ID = "user-1";

interface ProgressPageProps {
  // In real app, these would come from tRPC
  weightHistory?: { date: string; value: number }[];
  oneRMHistory?: { date: string; value: number }[];
  volumeHistory?: { week: string; [key: string]: string | number }[];
}

/**
 * Progress Page — Dashboard for tracking body weight, 1RM, and volume load.
 *
 * Shows overview cards, charts, and body weight logging form.
 */
export default function ProgressPage({
  weightHistory = [],
  oneRMHistory = [],
  volumeHistory = [],
}: ProgressPageProps) {
  const [dateRange, setDateRange] = useState<"3m" | "6m" | "1y" | "all">(
    "all",
  );

  // Calculate overview stats
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

  // Get unique muscle groups from volume data
  const muscleGroups = useMemo(() => {
    if (volumeHistory.length === 0) return [];
    const keys = new Set<string>();
    volumeHistory.forEach((week) => {
      Object.keys(week).forEach((key) => {
        if (key !== "week") keys.add(key);
      });
    });
    return Array.from(keys);
  }, [volumeHistory]);

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
            {latestWeight !== null ? `${latestWeight} kg` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Estimated 1RM
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {latest1RM !== null ? `${latest1RM} kg` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Total Volume
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : "—"}
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
          // TODO: Wire to tRPC mutation
          console.log("Log weight:", data);
        }}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BodyWeightChart data={weightHistory} />
        <OneRMChart data={oneRMHistory} />
      </div>

      <VolumeLoadChart data={volumeHistory} muscleGroups={muscleGroups} />

      {/* Data Export */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Export Data
        </h3>
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          Download your progress data as CSV for external analysis.
        </p>
        <button
          onClick={() => {
            // TODO: Wire to tRPC exportCSV query
            console.log("Export CSV");
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}
