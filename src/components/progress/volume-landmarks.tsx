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

export function VolumeLandmarks({
  statuses,
  title = "Volume Status",
}: VolumeLandmarksProps) {
  if (statuses.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-50">{title}</h3>
        <p className="text-sm text-zinc-400">
          No volume data yet. Complete workouts to see volume status.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-50">{title}</h3>
      <div className="space-y-3">
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

function VolumeMuscleCard({ item }: VolumeMuscleCardProps) {
  const { muscleGroup, status, sets, landmarks } = item;

  const statusConfig = {
    undertraining: {
      barColor: "bg-amber-500",
      badgeColor: "bg-amber-500/10 text-amber-400",
      label: "Undertraining",
      icon: "↓",
    },
    optimal: {
      barColor: "bg-lime-500",
      badgeColor: "bg-lime-500/10 text-lime-400",
      label: "Optimal",
      icon: "✓",
    },
    overreaching: {
      barColor: "bg-red-500",
      badgeColor: "bg-red-500/10 text-red-400",
      label: "Overreaching",
      icon: "↑",
    },
  };

  const config = statusConfig[status];
  const maxSets = landmarks ? landmarks.MRV + 4 : 24;
  const percentage = Math.min((sets / maxSets) * 100, 100);

  return (
    <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-100">
          {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${config.badgeColor}`}
        >
          <span>{config.icon}</span>
          {config.label}
        </span>
      </div>

      {landmarks && (
        <div className="space-y-2">
          {/* Volume Progress Bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-700">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${config.barColor} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Landmark Labels */}
          <div className="flex justify-between text-xs text-zinc-500">
            <span>MEV: {landmarks.MEV}</span>
            <span>MAV: {landmarks.MAV}</span>
            <span>MRV: {landmarks.MRV}</span>
          </div>

          {/* Current sets */}
          <div className="text-xs text-zinc-400">
            Current: <span className="font-bold text-zinc-200">{sets}</span> sets/week
          </div>
        </div>
      )}
    </div>
  );
}
