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

/**
 * OneRMChart — Line chart showing estimated 1RM progression over time.
 * Uses Recharts for rendering.
 */
export function OneRMChart({
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
          No 1RM data yet. Log your sets during workouts to see progression.
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
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="Est. 1RM (kg)"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
