"use client";

import { useEffect } from "react";
import { api } from "@/lib/api/trpc-client";

interface Suggestion {
  id: string;
  name: string;
  nameEs: string | null;
  muscleGroupName: string;
  equipmentName: string;
  isCompound: boolean;
  matchesProfile: boolean;
}

interface SubstitutionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  workoutExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  onApplied?: () => void;
}

/**
 * Bottom sheet for swapping one exercise for another.
 *
 * - Loads suggestions only while open.
 * - Lists up to 3 alternatives.
 * - One tap applies the substitution and preserves sets/reps/RPE.
 * - Dismissal never mutates.
 */
export function SubstitutionSheet({
  isOpen,
  onClose,
  userId,
  workoutExerciseId,
  exerciseId,
  exerciseName,
  onApplied,
}: SubstitutionSheetProps) {
  const suggestionsQuery = api.session.getSuggestions.useQuery(
    { userId, exerciseId },
    { enabled: isOpen },
  );

  const applyMutation = api.session.applySubstitution.useMutation({
    onSuccess: () => {
      onClose();
      onApplied?.();
    },
  });

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleApply = (suggestion: Suggestion) => {
    applyMutation.mutate({
      workoutExerciseId,
      newExerciseId: suggestion.id,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="presentation"
      data-testid="substitution-sheet"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="substitution-title"
        className="relative w-full max-w-2xl rounded-t-xl border-x border-t border-zinc-800 bg-zinc-900 p-4 shadow-2xl"
        style={{ maxHeight: "75vh", overflow: "auto" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2
              id="substitution-title"
              className="text-lg font-bold text-zinc-50"
            >
              Cambiar ejercicio
            </h2>
            <p className="text-sm text-zinc-400">{exerciseName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close substitution sheet"
            className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg
              className="mx-auto h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Loading */}
        {suggestionsQuery.isLoading && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
            <p className="text-sm text-zinc-400">Buscando alternativas...</p>
          </div>
        )}

        {/* Error */}
        {suggestionsQuery.isError && !suggestionsQuery.isLoading && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-center">
            <p className="text-sm font-medium text-rose-400">
              No se pudieron cargar las alternativas.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Intentá de nuevo en unos segundos.
            </p>
          </div>
        )}

        {/* Empty / Suggestions */}
        {!suggestionsQuery.isLoading && !suggestionsQuery.isError && (
          <>
            {suggestionsQuery.data?.suggestions.length === 0 ? (
              <div
                className="rounded-lg border border-zinc-700 bg-zinc-800 p-6 text-center"
                data-testid="no-alternatives"
              >
                <p className="text-sm font-medium text-zinc-300">
                  No hay alternativas disponibles
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  No encontramos ejercicios compatibles para sustituir este
                  movimiento.
                </p>
              </div>
            ) : (
              <div className="space-y-2" role="list">
                {suggestionsQuery.data?.suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleApply(suggestion)}
                    disabled={applyMutation.isPending}
                    aria-label={`Sustituir por ${suggestion.nameEs ?? suggestion.name}`}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-left transition-colors hover:border-blue-500/50 hover:bg-zinc-700 disabled:opacity-50"
                    role="listitem"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-100">
                          {suggestion.nameEs ?? suggestion.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {suggestion.muscleGroupName} •{" "}
                          {suggestion.equipmentName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          suggestion.matchesProfile
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {suggestion.matchesProfile ? "Similar" : "Otra"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
