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

export function ExerciseBrowser({
  exercises,
  muscleGroups,
  equipment,
  isLoading = false,
}: ExerciseBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");

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
      {/* Search Bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Filter Chips - Muscle Groups */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMuscleGroup("")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            !selectedMuscleGroup
              ? "bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          All
        </button>
        {muscleGroups.map((mg) => (
          <button
            key={mg.id}
            onClick={() =>
              setSelectedMuscleGroup(
                selectedMuscleGroup === mg.id ? "" : mg.id,
              )
            }
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedMuscleGroup === mg.id
                ? "bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {mg.nameEs ?? mg.name}
          </button>
        ))}
      </div>

      {/* Equipment Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedEquipment("")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            !selectedEquipment
              ? "bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          All Equipment
        </button>
        {equipment.map((eq) => (
          <button
            key={eq.id}
            onClick={() =>
              setSelectedEquipment(
                selectedEquipment === eq.id ? "" : eq.id,
              )
            }
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedEquipment === eq.id
                ? "bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {eq.nameEs ?? eq.name}
          </button>
        ))}
      </div>

      {/* Clear Filters */}
      {(search || selectedMuscleGroup || selectedEquipment) && (
        <button
          onClick={() => {
            setSearch("");
            setSelectedMuscleGroup("");
            setSelectedEquipment("");
          }}
          className="text-sm font-medium text-blue-500 hover:text-blue-400"
        >
          Clear all filters
        </button>
      )}

      {/* Results Count */}
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {isLoading
          ? "Loading exercises..."
          : `${filtered.length} exercise${filtered.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-zinc-900 border border-zinc-800"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 py-12">
          <p className="text-sm text-zinc-400">
            No exercises match your filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedMuscleGroup("");
              setSelectedEquipment("");
            }}
            className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-400"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Exercise Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  );
}
