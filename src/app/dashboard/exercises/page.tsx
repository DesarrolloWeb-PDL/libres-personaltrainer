"use client";

import { api } from "@/lib/api/trpc-client";
import { ExerciseBrowser } from "@/components/exercise/exercise-browser";

export default function ExercisesPage() {
  const exercises = api.exercise.list.useQuery();
  const muscleGroups = api.muscleGroup.list.useQuery();
  const equipment = api.equipment.list.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-10 bg-blue-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Ejercicios</h1>
            <p className="text-sm text-zinc-400">
              Explora nuestra base de datos de ejercicios con animaciones GIF.
            </p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-1.5">
          <span className="text-sm">💪</span>
          <span className="text-sm font-medium text-zinc-300">
            {exercises.data?.length ?? 0} ejercicios disponibles
          </span>
        </div>
      </div>

      {/* Browser */}
      <ExerciseBrowser
        exercises={exercises.data ?? []}
        muscleGroups={muscleGroups.data ?? []}
        equipment={equipment.data ?? []}
        isLoading={exercises.isLoading || muscleGroups.isLoading || equipment.isLoading}
      />
    </div>
  );
}
