"use client";

import { useState } from "react";
import { SubstitutionSheet } from "./substitution-sheet";

interface SubstitutionButtonProps {
  userId: string;
  workoutExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  onApplied?: () => void;
}

/**
 * Per-exercise "Cambiar" button that opens the substitution bottom sheet.
 *
 * Placed in the exercise-card header, beside the completed/total badge.
 */
export function SubstitutionButton({
  userId,
  workoutExerciseId,
  exerciseId,
  exerciseName,
  onApplied,
}: SubstitutionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={`Cambiar ejercicio ${exerciseName}`}
        className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
      >
        Cambiar
      </button>

      <SubstitutionSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userId={userId}
        workoutExerciseId={workoutExerciseId}
        exerciseId={exerciseId}
        exerciseName={exerciseName}
        onApplied={onApplied}
      />
    </>
  );
}
