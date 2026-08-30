"use client";

import type { VolumeStatus, MuscleGroup } from "@/lib/domain/types";

interface VolumeLandmark {
  muscleGroup: MuscleGroup;
  MEV: number;
  MAV: number;
  MRV: number;
}

interface VolumeStatusItem {
  muscleGroup: MuscleGroup;
  status: VolumeStatus;
  sets: number;
  volumeLoad: number;
  landmarks: VolumeLandmark | null;
}

interface VolumeLandmarksProps {
  statuses: VolumeStatusItem[];
  title?: string;
}

/**
 * VolumeLandmarks — Visual display of volume status per muscle group.
 * Shows MEV/MAV/MRV bar with color-coded status indicators.
 */
export function VolumeLandmarks({
  statuses,
  title = "Volume Status",
}: VolumeLandmarksProps) {
  if (statuses.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No volume data yet. Complete workouts to see volume status.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <div className="space-y-4">
        {statuses.map((item) => (
          <VolumeMuscleCard key={item.muscleGroup} item={item} />
        ))}
      </div>
    </div>
  );
}

interface VolumeMuscleCardProps {
  item: VolumeStatusItem;
}

/**
 * VolumeMuscleCard — Shows volume status for a single muscle group.
 */
function VolumeMuscleCard({ item }: VolumeMuscleCardProps) {
  const { muscleGroup, status, sets, landmarks } = item;

  const statusConfig = {
    undertraining: {
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      label: "Undertraining",
      icon: "⬇",
    },
    optimal: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      label: "Optimal",
      icon: "✓",
    },
    overreaching: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      label: "Overreaching",
      icon: "⬆",
    },
  };

  const config = statusConfig[status];
  const maxSets = landmarks ? landmarks.MRV + 4 : 24;

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
        >
          <span>{config.icon}</span>
          {config.label}
        </span>
      </div>

      {landmarks && (
        <div className="space-y-2">
          {/* Volume bar */}
          <div className="relative h-6 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            {/* MRV zone */}
            <div
              className="absolute inset-y-0 left-0 bg-red-200 dark:bg-red-900/40"
              style={{ width: `${(landmarks.MRV / maxSets) * 100}%` }}
            />
            {/* MAV zone */}
            <div
              className="absolute inset-y-0 left-0 bg-green-200 dark:bg-green-900/40"
              style={{ width: `${(landmarks.MAV / maxSets) * 100}%` }}
            />
            {/* MEV zone */}
            <div
              className="absolute inset-y-0 left-0 bg-yellow-200 dark:bg-yellow-900/40"
              style={{ width: `${(landmarks.MEV / maxSets) * 100}%` }}
            />
            {/* Current sets indicator */}
            <div
              className="absolute inset-y-0 w-1 bg-neutral-900 dark:bg-neutral-100"
              style={{ left: `${(sets / maxSets) * 100}%` }}
            />
          </div>

          {/* Landmark labels */}
          <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>MEV: {landmarks.MEV}</span>
            <span>MAV: {landmarks.MAV}</span>
            <span>MRV: {landmarks.MRV}</span>
          </div>

          {/* Current sets */}
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            Current: <span className="font-semibold">{sets}</span> sets/week
          </div>
        </div>
      )}
    </div>
  );
}
