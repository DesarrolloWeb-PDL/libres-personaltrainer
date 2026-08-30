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

/**
 * OverreachingWarning — Warning banner when muscle groups exceed MRV.
 * Shows which muscles are overreaching and recommends action.
 */
export function OverreachingWarning({
  overreachingMuscles,
  onDismiss,
}: OverreachingWarningProps) {
  if (overreachingMuscles.length === 0) {
    return null;
  }

  const muscleNames = overreachingMuscles
    .map((m) => m.muscleGroup.charAt(0).toUpperCase() + m.muscleGroup.slice(1))
    .join(", ");

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Overreaching Detected
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            You&apos;re training <strong>{muscleNames}</strong> above your
            Maximum Recoverable Volume (MRV). This can lead to:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-700 dark:text-red-300">
            <li>Decreased performance</li>
            <li>Increased injury risk</li>
            <li>Accumulated fatigue</li>
          </ul>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            <strong>Recommendation:</strong> Consider a deload week or reduce
            volume for these muscle groups.
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 rounded p-1 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
            aria-label="Dismiss warning"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
