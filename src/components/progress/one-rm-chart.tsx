"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface OneRMDataPoint {
  date: string;
  value: number;
}

interface OneRMChartProps {
  data: OneRMDataPoint[];
  title?: string;
}

export function OneRMChart({
  data,
  title = "Estimated 1RM Progression",
}: OneRMChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-400">
          No 1RM data yet. Log your sets during workouts to see progression.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-50">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#71717A" }}
            stroke="#3F3F46"
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#71717A" }}
            stroke="#3F3F46"
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181B",
              border: "1px solid #3F3F46",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#F4F4F5",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="Est. 1RM (kg)"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3B82F6" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
