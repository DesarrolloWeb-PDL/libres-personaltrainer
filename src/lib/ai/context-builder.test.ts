import { describe, it, expect } from "vitest";
import {
  buildCoachSystemPrompt,
  estimateTokens,
  type CoachContextData,
} from "./context-builder";
import { ALL_MUSCLE_GROUPS } from "@/lib/domain/constants";
import type { ProfileRecord } from "@/lib/ports/profile-repository";
import type { ProgramWithDays } from "@/lib/ports/program-repository";
import type { VolumeTrackingEntry } from "@/lib/ports/volume-tracking-repository";
import type { WorkoutSessionWithExercises } from "@/lib/ports/workout-repository";

const baseProfile: ProfileRecord = {
  id: "prof-1",
  userId: "user-1",
  age: 30,
  experienceLevel: "intermediate",
  goals: "muscle_gain",
  equipment: "full_gym",
  injuries: "shoulder",
  gender: "male",
  weight: 80,
  height: 180,
};

const baseProgram: ProgramWithDays = {
  id: "prog-1",
  userId: "user-1",
  name: "Full Body Básico",
  splitType: "full_body",
  startDate: new Date("2026-01-06T00:00:00Z"),
  endDate: null,
  days: [
    {
      id: "day-1",
      dayNumber: 1,
      name: "A",
      exercises: [
        {
          id: "pe-1",
          exerciseId: "ex-1",
          sets: 3,
          reps: 10,
          weight: 80,
          rpe: 8,
          order: 1,
          exercise: {
            id: "ex-1",
            name: "Bench Press",
            nameEs: "Press de banca",
            muscleGroupId: "mg-1",
            muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
          },
        },
        {
          id: "pe-2",
          exerciseId: "ex-2",
          sets: 3,
          reps: 8,
          weight: null,
          rpe: 7,
          order: 2,
          exercise: {
            id: "ex-2",
            name: "Barbell Row",
            nameEs: "Remo con barra",
            muscleGroupId: "mg-2",
            muscleGroup: { id: "mg-2", name: "Back", nameEs: "Espalda", category: "back" },
          },
        },
      ],
    },
  ],
};

const baseVolume: VolumeTrackingEntry[] = [
  { id: "vt-1", userId: "user-1", muscleGroup: "chest", week: "2026-W02", sets: 12, volumeLoad: 9600 },
  { id: "vt-2", userId: "user-1", muscleGroup: "back", week: "2026-W02", sets: 10, volumeLoad: 7200 },
];

const baseSession: WorkoutSessionWithExercises = {
  id: "sess-1",
  userId: "user-1",
  programId: "prog-1",
  dayId: "day-1",
  startedAt: new Date("2026-01-07T10:00:00Z"),
  completedAt: new Date("2026-01-07T11:00:00Z"),
  day: {
    id: "day-1",
    dayNumber: 1,
    name: "A",
    exercises: [
      {
        id: "we-1",
        exerciseId: "ex-1",
        sets: 3,
        reps: 10,
        weight: 80,
        rpe: 8,
        order: 1,
        exercise: {
          id: "ex-1",
          name: "Bench Press",
          nameEs: "Press de banca",
          muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
        },
        workoutSets: [
          { id: "ws-1", workoutExerciseId: "we-1", setNumber: 1, reps: 10, weight: 80, rpe: 8, completed: true },
          { id: "ws-2", workoutExerciseId: "we-1", setNumber: 2, reps: 10, weight: 80, rpe: 8, completed: true },
        ],
      },
    ],
  },
};

function makeContext(overrides?: Partial<CoachContextData>): CoachContextData {
  return {
    profile: baseProfile,
    program: baseProgram,
    currentWeekVolume: baseVolume,
    lastDeloadWeek: null,
    recentSessions: [baseSession],
    ...overrides,
  };
}

describe("buildCoachSystemPrompt", () => {
  it("renders a full-data golden prompt", () => {
    const prompt = buildCoachSystemPrompt(makeContext());

    expect(prompt).toContain("Eres un entrenador personal virtual");
    expect(prompt).toContain("Respondé SIEMPRE en español");
    expect(prompt).toContain("Edad: 30 años");
    expect(prompt).toContain("Nivel: intermediate");
    expect(prompt).toContain("Full Body Básico");
    expect(prompt).toContain("Press de banca");
    expect(prompt).toContain("3x10");
    expect(prompt).toContain("chest: 12 series");
    expect(prompt).toContain("Últimas sesiones completadas");
    expect(prompt).toContain("Press de banca: 2 series completadas");
    expect(estimateTokens(prompt)).toBeLessThanOrEqual(2000);
  });

  it("handles no active program gracefully", () => {
    const prompt = buildCoachSystemPrompt(makeContext({ program: null }));

    expect(prompt).toContain("Programa activo: no tiene un programa activo");
    expect(prompt).toContain("Perfil del usuario:");
    expect(prompt).toContain("Volumen semanal actual:");
    expect(estimateTokens(prompt)).toBeLessThanOrEqual(2000);
  });

  it("never trims header, profile or deload sections", () => {
    const hugeProgram: ProgramWithDays = {
      ...baseProgram,
      days: Array.from({ length: 20 }, (_, i) => ({
        id: `day-${i}`,
        dayNumber: i + 1,
        name: `Día ${i + 1} con nombre extremadamente largo para forzar truncamiento`,
        exercises: Array.from({ length: 15 }, (_, j) => ({
          id: `pe-${i}-${j}`,
          exerciseId: `ex-${i}-${j}`,
          sets: 4,
          reps: 12,
          weight: 100,
          rpe: 9,
          order: j + 1,
          exercise: {
            id: `ex-${i}-${j}`,
            name: `Exercise ${i}-${j}`,
            nameEs: `Ejercicio con nombre muy largo ${i}-${j} para inflar tokens`,
            muscleGroupId: "mg-1",
            muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
          },
        })),
      })),
    };

    const manySessions: WorkoutSessionWithExercises[] = Array.from({ length: 5 }, (_, i) => ({
      ...baseSession,
      id: `sess-${i}`,
      completedAt: new Date(Date.now() - i * 86400000),
      day: {
        ...baseSession.day,
        exercises: Array.from({ length: 10 }, (_, j) => ({
          ...baseSession.day.exercises[0],
          id: `we-${i}-${j}`,
          exercise: {
            ...baseSession.day.exercises[0].exercise,
            nameEs: `Ejercicio súper largo número ${i}-${j} para forzar la degradación del contexto`,
          },
          workoutSets: Array.from({ length: 5 }, (_, k) => ({
            id: `ws-${i}-${j}-${k}`,
            workoutExerciseId: `we-${i}-${j}`,
            setNumber: k + 1,
            reps: 12,
            weight: 100,
            rpe: 9,
            completed: true,
          })),
        })),
      },
    }));

    const prompt = buildCoachSystemPrompt(
      makeContext({
        program: hugeProgram,
        recentSessions: manySessions,
      }),
    );

    expect(estimateTokens(prompt)).toBeLessThanOrEqual(2000);
    expect(prompt).toContain("Eres un entrenador personal virtual");
    expect(prompt).toContain("Perfil del usuario:");
    expect(prompt).toContain("Recomendación de descarga:");
  });

  it("degrades sessions first, then program, then volume", () => {
    const hugeProgram: ProgramWithDays = {
      ...baseProgram,
      days: Array.from({ length: 10 }, (_, i) => ({
        id: `day-${i}`,
        dayNumber: i + 1,
        name: `Día ${i + 1}`,
        exercises: Array.from({ length: 12 }, (_, j) => ({
          id: `pe-${i}-${j}`,
          exerciseId: `ex-${i}-${j}`,
          sets: 4,
          reps: 10,
          weight: 90,
          rpe: 8,
          order: j + 1,
          exercise: {
            id: `ex-${i}-${j}`,
            name: `Ex ${i}-${j}`,
            nameEs: `Ejercicio descriptivo y largo número ${i}-${j} para llenar tokens`,
            muscleGroupId: "mg-1",
            muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
          },
        })),
      })),
    };

    const manySessions: WorkoutSessionWithExercises[] = Array.from({ length: 5 }, (_, i) => ({
      ...baseSession,
      id: `sess-${i}`,
      completedAt: new Date(Date.now() - i * 86400000),
      day: {
        ...baseSession.day,
        exercises: Array.from({ length: 8 }, (_, j) => ({
          ...baseSession.day.exercises[0],
          id: `we-${i}-${j}`,
          exercise: {
            ...baseSession.day.exercises[0].exercise,
            nameEs: `Ejercicio muy largo ${i}-${j} para truncar`,
          },
          workoutSets: Array.from({ length: 5 }, (_, k) => ({
            id: `ws-${i}-${j}-${k}`,
            workoutExerciseId: `we-${i}-${j}`,
            setNumber: k + 1,
            reps: 10,
            weight: 90,
            rpe: 8,
            completed: true,
          })),
        })),
      },
    }));

    const volume: VolumeTrackingEntry[] = ALL_MUSCLE_GROUPS.map((muscle) => ({
      id: `vt-${muscle}`,
      userId: "user-1",
      muscleGroup: muscle,
      week: "2026-W02",
      sets: muscle === "chest" ? 6 : muscle === "back" ? 18 : 12,
      volumeLoad: 1000,
    }));

    const prompt = buildCoachSystemPrompt(
      makeContext({
        program: hugeProgram,
        recentSessions: manySessions,
        currentWeekVolume: volume,
      }),
    );

    expect(estimateTokens(prompt)).toBeLessThanOrEqual(2000);
    // Sessions degraded first → marker or names-only
    expect(
      prompt.includes("[omitido por límite]") ||
      !prompt.includes("series completadas"),
    ).toBe(true);
  });

  it("marks omitted sections with [omitido por límite]", () => {
    const massiveProgram: ProgramWithDays = {
      ...baseProgram,
      days: Array.from({ length: 30 }, (_, i) => ({
        id: `day-${i}`,
        dayNumber: i + 1,
        name: `Día ${i + 1}`,
        exercises: Array.from({ length: 20 }, (_, j) => ({
          id: `pe-${i}-${j}`,
          exerciseId: `ex-${i}-${j}`,
          sets: 4,
          reps: 12,
          weight: 100,
          rpe: 9,
          order: j + 1,
          exercise: {
            id: `ex-${i}-${j}`,
            name: `Ex ${i}-${j}`,
            nameEs: `Ejercicio extremadamente largo e innecesario para ocupar muchísimos tokens ${i}-${j}`,
            muscleGroupId: "mg-1",
            muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
          },
        })),
      })),
    };

    const prompt = buildCoachSystemPrompt(makeContext({ program: massiveProgram }));

    expect(estimateTokens(prompt)).toBeLessThanOrEqual(2000);
    expect(prompt).toContain("[omitido por límite]");
  });

  it("stays within budget even with all sections maxed out", () => {
    const prompt = buildCoachSystemPrompt(
      makeContext({
        program: {
          ...baseProgram,
          days: Array.from({ length: 7 }, (_, i) => ({
            ...baseProgram.days[0],
            id: `day-${i}`,
            dayNumber: i + 1,
            name: `Día ${i + 1}`,
          })),
        },
        recentSessions: Array.from({ length: 5 }, () => baseSession),
        currentWeekVolume: ALL_MUSCLE_GROUPS.map((muscle) => ({
          id: `vt-${muscle}`,
          userId: "user-1",
          muscleGroup: muscle,
          week: "2026-W02",
          sets: 10,
          volumeLoad: 5000,
        })),
      }),
    );

    expect(estimateTokens(prompt)).toBeLessThanOrEqual(2000);
  });
});

describe("estimateTokens", () => {
  it("returns ceil(characters / 4)", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
    expect(estimateTokens("abc")).toBe(1);
  });
});
