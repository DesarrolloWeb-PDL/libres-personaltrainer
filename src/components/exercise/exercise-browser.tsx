"use client";

import { useState, useMemo } from "react";
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
  onSelect?: (exercise: ExerciseWithRelations) => void;
}

export function ExerciseBrowser({
  exercises,
  muscleGroups,
  equipment,
  isLoading = false,
  onSelect,
}: ExerciseBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("");

  const bodyParts = useMemo(() => {
    const set = new Set<string>();
    for (const ex of exercises) {
      if (ex.bodyPart) set.add(ex.bodyPart);
    }
    return Array.from(set).sort();
  }, [exercises]);

  const filtered = exercises.filter((ex) => {
    const matchesSearch =
      !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.nameEs?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesMuscle =
      !selectedMuscleGroup || ex.muscleGroupId === selectedMuscleGroup;

    const matchesEquipment =
      !selectedEquipment || ex.equipmentId === selectedEquipment;

    const matchesBodyPart =
      !selectedBodyPart || ex.bodyPart === selectedBodyPart;

    return matchesSearch && matchesMuscle && matchesEquipment && matchesBodyPart;
  });

  const hasFilters = search || selectedMuscleGroup || selectedEquipment || selectedBodyPart;

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
          placeholder="Buscar ejercicios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Body Part Filter */}
      {bodyParts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBodyPart("")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              !selectedBodyPart
                ? "bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Todas las zonas
          </button>
          {bodyParts.map((bp) => (
            <button
              key={bp}
              onClick={() =>
                setSelectedBodyPart(selectedBodyPart === bp ? "" : bp)
              }
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedBodyPart === bp
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {bp}
            </button>
          ))}
        </div>
      )}

      {/* Muscle Group Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMuscleGroup("")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            !selectedMuscleGroup
              ? "bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Todos los músculos
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
          Todo el equipo
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
      {hasFilters && (
        <button
          onClick={() => {
            setSearch("");
            setSelectedMuscleGroup("");
            setSelectedEquipment("");
            setSelectedBodyPart("");
          }}
          className="text-sm font-medium text-blue-500 hover:text-blue-400"
        >
          Limpiar filtros
        </button>
      )}

      {/* Results Count */}
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {isLoading
          ? "Cargando ejercicios..."
          : `${filtered.length} ejercicio${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl bg-zinc-900 border border-zinc-800"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 py-12">
          <p className="text-sm text-zinc-400">
            No se encontraron ejercicios con esos filtros.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedMuscleGroup("");
              setSelectedEquipment("");
              setSelectedBodyPart("");
            }}
            className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-400"
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* Exercise Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
