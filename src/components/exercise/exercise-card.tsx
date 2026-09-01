"use client";

import { useState } from "react";
import type { ExerciseWithRelations } from "@/lib/ports/exercise-repository";

interface ExerciseCardProps {
  exercise: ExerciseWithRelations;
  onSelect?: (exercise: ExerciseWithRelations) => void;
}

export function ExerciseCard({ exercise, onSelect }: ExerciseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const primaryMedia = exercise.media.find((m) => m.isPrimary) ?? exercise.media[0];
  const gifUrl = exercise.gifUrl ?? primaryMedia?.url;

  return (
    <article
      className="group rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-colors hover:border-blue-500/50 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(exercise)}
    >
      {/* GIF / Thumbnail */}
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        {gifUrl && !imgError ? (
          <img
            src={gifUrl}
            alt={exercise.nameEs ?? exercise.name}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
        )}

        {/* Body part badge overlay */}
        {exercise.bodyPart && (
          <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-zinc-300 backdrop-blur-sm">
            {exercise.bodyPart}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-zinc-100 text-sm truncate">
          {exercise.nameEs ?? exercise.name}
        </h3>
        {exercise.nameEs && exercise.name !== exercise.nameEs && (
          <p className="text-xs text-zinc-500 truncate mt-0.5">{exercise.name}</p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {exercise.muscleGroup && (
            <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">
              {exercise.muscleGroup.nameEs ?? exercise.muscleGroup.name}
            </span>
          )}
          {exercise.equipment && (
            <span className="inline-flex items-center rounded-full bg-lime-500/15 px-2 py-0.5 text-xs font-medium text-lime-400">
              {exercise.equipment.nameEs ?? exercise.equipment.name}
            </span>
          )}
          {exercise.category && (
            <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
              {exercise.category}
            </span>
          )}
        </div>

        {/* Instructions preview */}
        {exercise.instructions && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{exercise.instructions}</p>
        )}
      </div>
    </article>
  );
}
