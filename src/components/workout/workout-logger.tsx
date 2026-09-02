"use client";

import { useState, useCallback } from "react";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { SubstitutionButton } from "./substitution-button";

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
  userId?: string;
  onLogSet: (setId: string, data: { reps: number; weight: number; rpe: number }) => Promise<void>;
  onCompleteExercise?: (exerciseId: string) => void;
  onCompleteWorkout?: () => void;
  onSubstitutionApplied?: (workoutExerciseId: string) => void;
}

export function WorkoutLogger({
  exercises,
  userId,
  onLogSet,
  onCompleteWorkout,
  onSubstitutionApplied,
}: WorkoutLoggerProps) {
  const [localSets, setLocalSets] = useState<
    Record<string, { reps: string; weight: string; rpe: string }>
  >({});

  const { display, isRunning, start, pause, resume, reset } = useWorkoutTimer({
    defaultSeconds: 90,
  });

  const getLocalSet = useCallback(
    (setId: string) => localSets[setId] ?? { reps: "", weight: "", rpe: "" },
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

  const adjustValue = useCallback(
    (setId: string, field: "reps" | "weight", delta: number) => {
      const current = getLocalSet(setId);
      const currentVal = parseFloat(current[field]) || 0;
      const step = field === "weight" ? 2.5 : 1;
      const newVal = Math.max(0, currentVal + delta * step);
      updateLocalSet(setId, field, String(newVal));
    },
    [getLocalSet, updateLocalSet],
  );

  const handleCompleteSet = useCallback(
    async (setId: string) => {
      const local = getLocalSet(setId);
      const reps = parseInt(local.reps, 10);
      const weight = parseFloat(local.weight);
      const rpe = parseFloat(local.rpe);

      if (isNaN(reps) || isNaN(weight) || isNaN(rpe)) return;

      await onLogSet(setId, { reps, weight, rpe });

      reset(90);
      start(90);
    },
    [getLocalSet, onLogSet, reset, start],
  );

  const allExercisesComplete = exercises.every((ex) => ex.workoutSets.every((s) => s.completed));

  return (
    <div className="space-y-6">
      {/* Rest Timer */}
      {(isRunning || display !== "01:30") && (
        <div
          className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center"
          role="timer"
          aria-label={`Rest timer: ${display}`}
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Rest Timer</p>
          <p className="mt-2 text-6xl font-mono font-black text-zinc-50">{display}</p>
          <div className="mt-4 flex justify-center gap-3">
            {isRunning ? (
              <button
                onClick={pause}
                aria-label="Pause rest timer"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-zinc-800 px-6 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resume}
                aria-label="Resume rest timer"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white hover:bg-blue-400 transition-colors"
              >
                Resume
              </button>
            )}
            <button
              onClick={() => reset(90)}
              aria-label="Reset rest timer to 90 seconds"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-zinc-800 px-6 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Exercises */}
      {exercises.map((exercise) => {
        const completedCount = exercise.workoutSets.filter((s) => s.completed).length;
        const totalSets = exercise.workoutSets.length;

        return (
          <section
            key={exercise.id}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-4"
            aria-label={`${exercise.exercise.name} - ${completedCount} of ${totalSets} sets completed`}
          >
            {/* Exercise Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-10 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-50">{exercise.exercise.name}</h3>
                {exercise.exercise.muscleGroup && (
                  <p className="text-xs text-zinc-400">{exercise.exercise.muscleGroup.name}</p>
                )}
              </div>
              <span
                className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300"
                aria-label={`${completedCount} of ${totalSets} sets completed`}
              >
                {completedCount}/{totalSets}
              </span>
              {userId && (
                <SubstitutionButton
                  userId={userId}
                  workoutExerciseId={exercise.id}
                  exerciseId={exercise.exerciseId}
                  exerciseName={exercise.exercise.name}
                  onApplied={() => onSubstitutionApplied?.(exercise.id)}
                />
              )}
            </div>

            {/* Sets */}
            <div className="space-y-2">
              {exercise.workoutSets.map((set) => {
                const local = getLocalSet(set.id);
                return (
                  <div
                    key={set.id}
                    className={`rounded-lg border p-3 ${
                      set.completed
                        ? "border-lime-500/30 bg-lime-500/10"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    {set.completed ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-500 text-xs font-bold text-zinc-900">
                            {set.setNumber}
                          </span>
                          <span className="text-sm text-zinc-300">
                            {set.reps} × {set.weight}kg
                          </span>
                          <span className="text-xs text-zinc-500">RPE {set.rpe}</span>
                        </div>
                        <span className="text-lime-400 font-bold">✓</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Set Number + Previous Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                              {set.setNumber}
                            </span>
                            <span className="text-xs text-zinc-500">Set {set.setNumber}</span>
                          </div>
                          {/* Previous set info */}
                          {set.setNumber > 1 &&
                            exercise.workoutSets[set.setNumber - 2]?.completed && (
                              <span className="text-xs text-zinc-500">
                                Last: {exercise.workoutSets[set.setNumber - 2].weight}kg ×{" "}
                                {exercise.workoutSets[set.setNumber - 2].reps}
                              </span>
                            )}
                        </div>

                        {/* Weight & Reps Controls */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Weight */}
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                              Weight (kg)
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => adjustValue(set.id, "weight", -1)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-700 text-xl font-bold text-zinc-300 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
                                aria-label="Decrease weight"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                step={2.5}
                                value={local.weight}
                                onChange={(e) => updateLocalSet(set.id, "weight", e.target.value)}
                                aria-label={`Set ${set.setNumber} weight in kilograms`}
                                className="flex-1 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800 px-2 text-center text-2xl font-black text-zinc-50 focus:border-blue-500 focus:outline-none"
                                placeholder="0"
                              />
                              <button
                                onClick={() => adjustValue(set.id, "weight", 1)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-700 text-xl font-bold text-zinc-300 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
                                aria-label="Increase weight"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Reps */}
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                              Reps
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => adjustValue(set.id, "reps", -1)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-700 text-xl font-bold text-zinc-300 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
                                aria-label="Decrease reps"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={local.reps}
                                onChange={(e) => updateLocalSet(set.id, "reps", e.target.value)}
                                aria-label={`Set ${set.setNumber} reps`}
                                className="flex-1 min-h-[44px] rounded-xl border border-zinc-600 bg-zinc-800 px-2 text-center text-2xl font-black text-zinc-50 focus:border-blue-500 focus:outline-none"
                                placeholder="0"
                              />
                              <button
                                onClick={() => adjustValue(set.id, "reps", 1)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-700 text-xl font-bold text-zinc-300 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
                                aria-label="Increase reps"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* RPE + Complete Button */}
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                              RPE
                            </label>
                            <select
                              value={local.rpe}
                              onChange={(e) => updateLocalSet(set.id, "rpe", e.target.value)}
                              aria-label={`Set ${set.setNumber} RPE`}
                              className="min-h-[44px] w-full rounded-xl border border-zinc-600 bg-zinc-800 px-3 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">RPE</option>
                              {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => handleCompleteSet(set.id)}
                            disabled={!local.reps || !local.weight || !local.rpe}
                            aria-label={`Log set ${set.setNumber}`}
                            className="min-h-[44px] min-w-[44px] flex-1 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Complete Set
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Complete Workout */}
      {allExercisesComplete && (
        <button
          onClick={onCompleteWorkout}
          aria-label="Complete workout session"
          className="w-full min-h-[56px] rounded-xl bg-lime-500 py-4 text-lg font-black text-zinc-900 hover:bg-lime-400 active:bg-lime-600 transition-colors"
        >
          Complete Workout
        </button>
      )}
    </div>
  );
}
