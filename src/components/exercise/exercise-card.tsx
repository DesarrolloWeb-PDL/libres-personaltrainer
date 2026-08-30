"use client";

import type { ExerciseWithRelations } from "@/lib/ports/exercise-repository";

interface ExerciseCardProps {
  exercise: ExerciseWithRelations;
}

/**
 * Exercise card — displays name (EN + ES), muscle group, equipment, and media.
 */
export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const primaryMedia = exercise.media.find((m) => m.isPrimary) ?? exercise.media[0];

  return (
    <article className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900">
      {/* Thumbnail */}
      {primaryMedia && (
        <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
          {primaryMedia.type === "gif" || primaryMedia.type === "image" ? (
            <img
              src={primaryMedia.url}
              alt={exercise.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <span className="text-sm">Video</span>
            </div>
          )}
        </div>
      )}

      {/* Name */}
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
        {exercise.name}
      </h3>
      {exercise.nameEs && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {exercise.nameEs}
        </p>
      )}

      {/* Badges */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {exercise.muscleGroup && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {exercise.muscleGroup.nameEs ?? exercise.muscleGroup.name}
          </span>
        )}
        {exercise.equipment && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {exercise.equipment.nameEs ?? exercise.equipment.name}
          </span>
        )}
      </div>

      {/* Instructions preview */}
      {exercise.instructions && (
        <p className="mt-2 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
          {exercise.instructions}
        </p>
      )}
    </article>
  );
}
