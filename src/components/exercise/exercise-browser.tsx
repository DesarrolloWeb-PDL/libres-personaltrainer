"use client";

import { useState } from "react";
import { ExerciseCard } from "./exercise-card";
import type { ExerciseWithRelations } from "@/lib/ports/exercise-repository";

interface MuscleGroup {
  id: string;
  name: string;
  nameEs: string | null;
}

interface Equipment {
  id: string;
  name: string;
  nameEs: string | null;
}

interface ExerciseBrowserProps {
  exercises: ExerciseWithRelations[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  isLoading?: boolean;
}

/**
 * Exercise browser — search bar, muscle group filter, equipment filter, and grid.
 */
export function ExerciseBrowser({
  exercises,
  muscleGroups,
  equipment,
  isLoading = false,
}: ExerciseBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");

  // Client-side filtering (would be server-side via tRPC in production)
  const filtered = exercises.filter((ex) => {
    const matchesSearch =
      !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.nameEs?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesMuscle =
      !selectedMuscleGroup || ex.muscleGroupId === selectedMuscleGroup;

    const matchesEquipment =
      !selectedEquipment || ex.equipmentId === selectedEquipment;

    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search exercises..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedMuscleGroup}
          onChange={(e) => setSelectedMuscleGroup(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <option value="">All muscle groups</option>
          {muscleGroups.map((mg) => (
            <option key={mg.id} value={mg.id}>
              {mg.nameEs ?? mg.name}
            </option>
          ))}
        </select>

        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <option value="">All equipment</option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.nameEs ?? eq.name}
            </option>
          ))}
        </select>

        {(search || selectedMuscleGroup || selectedEquipment) && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedMuscleGroup("");
              setSelectedEquipment("");
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {isLoading
          ? "Loading exercises..."
          : `${filtered.length} exercise${filtered.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 py-12 dark:border-neutral-600">
          <p className="text-neutral-500 dark:text-neutral-400">
            No exercises match your filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedMuscleGroup("");
              setSelectedEquipment("");
            }}
            className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Exercise grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  );
}
