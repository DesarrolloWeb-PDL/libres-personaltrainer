"use client";

import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface VolumeDataPoint {
  week: string;
  [muscleGroup: string]: string | number;
}

interface VolumeLoadChartProps {
  data: VolumeDataPoint[];
  muscleGroups: string[];
  title?: string;
}

const CHART_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be123c",
  "#65a30d",
  "#c2410c",
  "#6d28d9",
];

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "12px",
};

/**
 * VolumeLoadChart — Bar chart showing volume load per muscle group per week.
 * Memoized to prevent unnecessary re-renders when parent updates.
 */
export const VolumeLoadChart = memo(function VolumeLoadChart({
  data,
  muscleGroups,
  title = "Volume Load by Muscle Group",
}: VolumeLoadChartProps) {
  const bars = useMemo(
    () =>
      muscleGroups.map((group, i) => (
        <Bar
          key={group}
          dataKey={group}
          name={group}
          fill={CHART_COLORS[i % CHART_COLORS.length]}
          radius={[2, 2, 0, 0]}
        />
      )),
    [muscleGroups],
  );

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No volume data yet. Complete workouts to see volume load per muscle
          group.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {bars}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

interface BodyWeightChartProps {
  data: { date: string; value: number }[];
  weeklyAverages?: { date: string; value: number }[];
  title?: string;
}

/**
 * BodyWeightChart — Line chart showing body weight over time with weekly averages.
 * Memoized to prevent unnecessary re-renders when parent updates.
 */
export const BodyWeightChart = memo(function BodyWeightChart({
  data,
  weeklyAverages,
  title = "Body Weight Trend",
}: BodyWeightChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => {
        const weeklyAvg = weeklyAverages?.find((w) => w.date === d.date);
        return {
          date: d.date,
          Daily: d.value,
          "Weekly Avg": weeklyAvg?.value ?? null,
        };
      }),
    [data, weeklyAverages],
  );

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No body weight data yet. Log your weight to see the trend.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            domain={["auto", "auto"]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="Daily"
            stroke="#2563eb"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            strokeDasharray="5 5"
          />
          {weeklyAverages && weeklyAverages.length > 0 && (
            <Line
              type="monotone"
              dataKey="Weekly Avg"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

interface OneRMChartProps {
  data: { date: string; value: number }[];
  title?: string;
}

/**
 * OneRMChart — Line chart showing estimated 1RM progression over time.
 * Memoized for performance.
 */
export const OneRMChart = memo(function OneRMChart({
  data,
  title = "Estimated 1RM Progression",
}: OneRMChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No strength data yet. Log your lifts to see 1RM progression.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            domain={["auto", "auto"]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="1RM (kg)"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
