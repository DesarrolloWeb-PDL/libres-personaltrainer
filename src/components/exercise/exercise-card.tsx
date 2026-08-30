"use client";

import type { ExerciseWithRelations } from "@/lib/ports/exercise-repository";

interface ExerciseCardProps {
  exercise: ExerciseWithRelations;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const primaryMedia = exercise.media.find((m) => m.isPrimary) ?? exercise.media[0];

  return (
    <article className="group rounded-xl bg-zinc-900 border border-zinc-800 p-4 transition-colors hover:border-zinc-700">
      {/* Thumbnail */}
      {primaryMedia && (
        <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-zinc-800">
          {primaryMedia.type === "gif" || primaryMedia.type === "image" ? (
            <img
              src={primaryMedia.url}
              alt={exercise.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <span className="text-sm">Video</span>
            </div>
          )}
        </div>
      )}

      {/* Name */}
      <h3 className="font-semibold text-zinc-50">{exercise.name}</h3>
      {exercise.nameEs && (
        <p className="text-sm text-zinc-400">{exercise.nameEs}</p>
      )}

      {/* Badges */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {exercise.muscleGroup && (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400">
            {exercise.muscleGroup.nameEs ?? exercise.muscleGroup.name}
          </span>
        )}
        {exercise.equipment && (
          <span className="inline-flex items-center rounded-full bg-lime-500/10 px-2.5 py-0.5 text-xs font-bold text-lime-400">
            {exercise.equipment.nameEs ?? exercise.equipment.name}
          </span>
        )}
      </div>

      {/* Instructions preview */}
      {exercise.instructions && (
        <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
          {exercise.instructions}
        </p>
      )}
    </article>
  );
}
