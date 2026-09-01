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
  "#3B82F6",
  "#EF4444",
  "#84CC16",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#65A30D",
  "#EA580C",
  "#7C3AED",
];

const tooltipStyle = {
  backgroundColor: "#18181B",
  border: "1px solid #3F3F46",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#F4F4F5",
};

const gridStyle = { stroke: "#27272A" };

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
          radius={[4, 4, 0, 0]}
        />
      )),
    [muscleGroups],
  );

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-400">
          No volume data yet. Complete workouts to see volume load per muscle group.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-50">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid {...gridStyle} strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#71717A" }} stroke="#3F3F46" />
          <YAxis tick={{ fontSize: 12, fill: "#71717A" }} stroke="#3F3F46" />
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
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-400">
          No body weight data yet. Log your weight to see the trend.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-50">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid {...gridStyle} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#71717A" }} stroke="#3F3F46" />
          <YAxis
            tick={{ fontSize: 12, fill: "#71717A" }}
            stroke="#3F3F46"
            domain={["auto", "auto"]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="Daily"
            stroke="#3B82F6"
            strokeWidth={1.5}
            dot={{ r: 3, fill: "#3B82F6" }}
            strokeDasharray="5 5"
          />
          {weeklyAverages && weeklyAverages.length > 0 && (
            <Line
              type="monotone"
              dataKey="Weekly Avg"
              stroke="#84CC16"
              strokeWidth={2}
              dot={{ r: 4, fill: "#84CC16" }}
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

export const OneRMChart = memo(function OneRMChart({
  data,
  title = "Estimated 1RM Progression",
}: OneRMChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-400">
          No strength data yet. Log your lifts to see 1RM progression.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-50">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid {...gridStyle} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#71717A" }} stroke="#3F3F46" />
          <YAxis
            tick={{ fontSize: 12, fill: "#71717A" }}
            stroke="#3F3F46"
            domain={["auto", "auto"]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="1RM (kg)"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3B82F6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
