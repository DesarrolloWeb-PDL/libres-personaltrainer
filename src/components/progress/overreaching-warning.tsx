"use client";

import type { VolumeStatus, MuscleGroup } from "@/lib/domain/types";

interface OverreachingItem {
  muscleGroup: MuscleGroup;
  status: VolumeStatus;
  sets: number;
}

interface OverreachingWarningProps {
  overreachingMuscles: OverreachingItem[];
  onDismiss?: () => void;
}

export function OverreachingWarning({ overreachingMuscles, onDismiss }: OverreachingWarningProps) {
  if (overreachingMuscles.length === 0) {
    return null;
  }

  const muscleNames = overreachingMuscles
    .map((m) => m.muscleGroup.charAt(0).toUpperCase() + m.muscleGroup.slice(1))
    .join(", ");

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="w-1 h-10 bg-red-500 rounded-full flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-red-400">Overreaching Detected</h3>
          <p className="mt-1 text-sm text-zinc-300">
            You&apos;re training <strong className="text-zinc-100">{muscleNames}</strong> above your
            Maximum Recoverable Volume (MRV). This can lead to:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-400">
            <li>Decreased performance</li>
            <li>Increased injury risk</li>
            <li>Accumulated fatigue</li>
          </ul>
          <p className="mt-2 text-sm text-zinc-300">
            <strong className="text-zinc-100">Recommendation:</strong> Consider a deload week or
            reduce volume for these muscle groups.
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 rounded-lg p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Dismiss warning"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
