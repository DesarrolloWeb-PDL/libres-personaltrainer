"use client";

import { useState, useCallback } from "react";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";

interface SetData {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  completed: boolean;
}

interface ExerciseData {
  id: string;
  exerciseId: string;
  exercise: {
    id: string;
    name: string;
    nameEs: string | null;
    muscleGroup: {
      name: string;
      category: string | null;
    } | null;
  };
  workoutSets: SetData[];
  sets: number | null;
}

interface WorkoutLoggerProps {
  exercises: ExerciseData[];
  onLogSet: (setId: string, data: { reps: number; weight: number; rpe: number }) => Promise<void>;
  onCompleteExercise?: (exerciseId: string) => void;
  onCompleteWorkout?: () => void;
}

/**
 * WorkoutLogger — Displays exercises with sets for logging during a workout session.
 *
 * Each set has: set number, reps input, weight input, RPE selector, completed toggle.
 * Includes a rest timer that starts after completing a set.
 */
export function WorkoutLogger({
  exercises,
  onLogSet,
  onCompleteWorkout,
}: WorkoutLoggerProps) {
  const [localSets, setLocalSets] = useState<
    Record<string, { reps: string; weight: string; rpe: string }>
  >({});

  const { display, isRunning, start, pause, resume, reset } = useWorkoutTimer({
    defaultSeconds: 90,
  });

  const getLocalSet = useCallback(
    (setId: string) =>
      localSets[setId] ?? { reps: "", weight: "", rpe: "" },
    [localSets],
  );

  const updateLocalSet = useCallback(
    (setId: string, field: "reps" | "weight" | "rpe", value: string) => {
      setLocalSets((prev) => ({
        ...prev,
        [setId]: { ...getLocalSet(setId), [field]: value },
      }));
    },
    [getLocalSet],
  );

  const handleCompleteSet = useCallback(
    async (setId: string) => {
      const local = getLocalSet(setId);
      const reps = parseInt(local.reps, 10);
      const weight = parseFloat(local.weight);
      const rpe = parseFloat(local.rpe);

      if (isNaN(reps) || isNaN(weight) || isNaN(rpe)) return;

      await onLogSet(setId, { reps, weight, rpe });

      // Start rest timer
      reset(90);
      start(90);
    },
    [getLocalSet, onLogSet, reset, start],
  );

  const allExercisesComplete = exercises.every((ex) =>
    ex.workoutSets.every((s) => s.completed),
  );

  return (
    <div className="space-y-6">
      {/* Rest Timer */}
      {(isRunning || display !== "01:30") && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Rest Timer
          </p>
          <p className="text-4xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
            {display}
          </p>
          <div className="mt-2 flex justify-center gap-2">
            {isRunning ? (
              <button
                onClick={pause}
                className="rounded bg-neutral-200 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resume}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
              >
                Resume
              </button>
            )}
            <button
              onClick={() => reset(90)}
              className="rounded bg-neutral-200 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Exercises */}
      {exercises.map((exercise) => {
        const completedCount = exercise.workoutSets.filter(
          (s) => s.completed,
        ).length;
        const totalSets = exercise.workoutSets.length;

        return (
          <div
            key={exercise.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {exercise.exercise.name}
                </h3>
                {exercise.exercise.muscleGroup && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {exercise.exercise.muscleGroup.name}
                  </p>
                )}
              </div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {completedCount}/{totalSets}
              </span>
            </div>

            {/* Sets Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <th className="pb-2 pr-2">Set</th>
                    <th className="pb-2 px-2">Reps</th>
                    <th className="pb-2 px-2">Weight</th>
                    <th className="pb-2 px-2">RPE</th>
                    <th className="pb-2 pl-2">Done</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.workoutSets.map((set) => {
                    const local = getLocalSet(set.id);
                    return (
                      <tr
                        key={set.id}
                        className={
                          set.completed
                            ? "bg-green-50 dark:bg-green-900/20"
                            : ""
                        }
                      >
                        <td className="py-1.5 pr-2 font-medium text-neutral-700 dark:text-neutral-300">
                          {set.setNumber}
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min={0}
                            value={set.completed ? (set.reps ?? "") : local.reps}
                            onChange={(e) =>
                              updateLocalSet(set.id, "reps", e.target.value)
                            }
                            disabled={set.completed}
                            className="w-16 rounded border border-neutral-200 bg-white px-2 py-1 text-center text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                            placeholder="10"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={
                              set.completed ? (set.weight ?? "") : local.weight
                            }
                            onChange={(e) =>
                              updateLocalSet(set.id, "weight", e.target.value)
                            }
                            disabled={set.completed}
                            className="w-20 rounded border border-neutral-200 bg-white px-2 py-1 text-center text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                            placeholder="60"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={set.completed ? (set.rpe ?? "") : local.rpe}
                            onChange={(e) =>
                              updateLocalSet(set.id, "rpe", e.target.value)
                            }
                            disabled={set.completed}
                            className="w-16 rounded border border-neutral-200 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                          >
                            <option value="">RPE</option>
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 pl-2">
                          {set.completed ? (
                            <span className="text-green-600 dark:text-green-400">
                              ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCompleteSet(set.id)}
                              disabled={!local.reps || !local.weight || !local.rpe}
                              className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Log
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Complete Workout */}
      {allExercisesComplete && (
        <button
          onClick={onCompleteWorkout}
          className="w-full rounded-lg bg-green-600 py-3 text-lg font-semibold text-white hover:bg-green-700"
        >
          Complete Workout
        </button>
      )}
    </div>
  );
}
