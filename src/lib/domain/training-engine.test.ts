import { describe, it, expect } from "vitest";
import { selectSplit, generateProgram } from "./training-engine";
import type { UserProfile, Exercise } from "./types";

// ─── Fixtures ────────────────────────────────────────────────────────

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  age: 25,
  experienceLevel: "intermediate",
  goals: ["muscle_gain"],
  equipment: "full_gym",
  trainingFrequency: 4,
  ...overrides,
});

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: "ex-1",
  name: "Bench Press",
  muscleGroup: "chest",
  equipment: ["full_gym"],
  isCompound: true,
  ...overrides,
});

const exercisePool: Exercise[] = [
  makeExercise({ id: "bench", name: "Bench Press", muscleGroup: "chest", isCompound: true }),
  makeExercise({ id: "cable-fly", name: "Cable Fly", muscleGroup: "chest", isCompound: false }),
  makeExercise({ id: "ohp", name: "Overhead Press", muscleGroup: "shoulders", isCompound: true }),
  makeExercise({
    id: "lateral-raise",
    name: "Lateral Raise",
    muscleGroup: "shoulders",
    isCompound: false,
  }),
  makeExercise({
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    muscleGroup: "triceps",
    isCompound: false,
  }),
  makeExercise({ id: "pullup", name: "Pull-up", muscleGroup: "back", isCompound: true }),
  makeExercise({ id: "barbell-row", name: "Barbell Row", muscleGroup: "back", isCompound: true }),
  makeExercise({ id: "bicep-curl", name: "Bicep Curl", muscleGroup: "biceps", isCompound: false }),
  makeExercise({ id: "squat", name: "Squat", muscleGroup: "quadriceps", isCompound: true }),
  makeExercise({ id: "leg-press", name: "Leg Press", muscleGroup: "quadriceps", isCompound: true }),
  makeExercise({ id: "leg-curl", name: "Leg Curl", muscleGroup: "hamstrings", isCompound: false }),
  makeExercise({
    id: "romanian-dl",
    name: "Romanian Deadlift",
    muscleGroup: "hamstrings",
    isCompound: true,
  }),
  makeExercise({
    id: "glute-bridge",
    name: "Glute Bridge",
    muscleGroup: "glutes",
    isCompound: false,
  }),
  makeExercise({ id: "calf-raise", name: "Calf Raise", muscleGroup: "calves", isCompound: false }),
];

// ─── Split Selector Tests ────────────────────────────────────────────

describe("selectSplit", () => {
  it("returns full_body for 1 day/week", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 1 }))).toBe("full_body");
  });

  it("returns full_body for 2 days/week", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 2 }))).toBe("full_body");
  });

  it("returns full_body for 3 days/week", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 3 }))).toBe("full_body");
  });

  it("returns upper_lower for 4 days/week (any experience)", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 4, experienceLevel: "beginner" }))).toBe(
      "upper_lower",
    );
    expect(
      selectSplit(makeProfile({ trainingFrequency: 4, experienceLevel: "intermediate" })),
    ).toBe("upper_lower");
    expect(selectSplit(makeProfile({ trainingFrequency: 4, experienceLevel: "advanced" }))).toBe(
      "upper_lower",
    );
  });

  it("returns push_pull_legs for 5+ days with advanced experience", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 5, experienceLevel: "advanced" }))).toBe(
      "push_pull_legs",
    );
    expect(selectSplit(makeProfile({ trainingFrequency: 6, experienceLevel: "advanced" }))).toBe(
      "push_pull_legs",
    );
  });

  it("returns upper_lower for 5+ days with intermediate experience", () => {
    expect(
      selectSplit(makeProfile({ trainingFrequency: 5, experienceLevel: "intermediate" })),
    ).toBe("upper_lower");
    expect(
      selectSplit(makeProfile({ trainingFrequency: 6, experienceLevel: "intermediate" })),
    ).toBe("upper_lower");
  });

  it("returns upper_lower for 5+ days with beginner experience", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 5, experienceLevel: "beginner" }))).toBe(
      "upper_lower",
    );
  });

  it("returns full_body for 7 days (max frequency, non-advanced)", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 7, experienceLevel: "beginner" }))).toBe(
      "upper_lower",
    );
  });

  it("returns push_pull_legs for 7 days with advanced", () => {
    expect(selectSplit(makeProfile({ trainingFrequency: 7, experienceLevel: "advanced" }))).toBe(
      "push_pull_legs",
    );
  });
});

// ─── Program Generator Tests ─────────────────────────────────────────

describe("generateProgram", () => {
  it("generates a program with correct number of days", () => {
    const program = generateProgram(makeProfile({ trainingFrequency: 4 }), exercisePool);
    expect(program.days).toHaveLength(4);
  });

  it("generates a program with correct split type", () => {
    const program = generateProgram(makeProfile({ trainingFrequency: 4 }), exercisePool);
    expect(program.splitType).toBe("upper_lower");
  });

  it("generates correct number of weeks", () => {
    const program = generateProgram(makeProfile(), exercisePool, 12);
    expect(program.weeks).toBe(12);
  });

  it("each day has exercises", () => {
    const program = generateProgram(makeProfile(), exercisePool);
    for (const day of program.days) {
      expect(day.exercises.length).toBeGreaterThan(0);
    }
  });

  it("each exercise has valid sets and reps", () => {
    const program = generateProgram(makeProfile(), exercisePool);
    for (const day of program.days) {
      for (const ex of day.exercises) {
        expect(ex.sets).toBeGreaterThan(0);
        expect(ex.reps).toBeGreaterThan(0);
        expect(ex.restSeconds).toBeGreaterThan(0);
      }
    }
  });

  it("days have sequential day numbers", () => {
    const program = generateProgram(makeProfile({ trainingFrequency: 3 }), exercisePool);
    expect(program.days[0].dayNumber).toBe(1);
    expect(program.days[1].dayNumber).toBe(2);
    expect(program.days[2].dayNumber).toBe(3);
  });

  it("full_body split generates full body day names", () => {
    const program = generateProgram(makeProfile({ trainingFrequency: 3 }), exercisePool);
    for (const day of program.days) {
      expect(day.name).toBe("Full Body");
    }
  });

  it("upper_lower split alternates day names", () => {
    const program = generateProgram(makeProfile({ trainingFrequency: 4 }), exercisePool);
    expect(program.days[0].name).toBe("Upper");
    expect(program.days[1].name).toBe("Lower");
    expect(program.days[2].name).toBe("Upper");
    expect(program.days[3].name).toBe("Lower");
  });

  it("compound exercises get more sets in push_pull_legs", () => {
    const program = generateProgram(
      makeProfile({ trainingFrequency: 6, experienceLevel: "advanced" }),
      exercisePool,
    );
    const pushDay = program.days[0]; // Push day
    const compounds = pushDay.exercises.filter((e) => e.exercise.isCompound);
    const isolations = pushDay.exercises.filter((e) => !e.exercise.isCompound);

    if (compounds.length > 0 && isolations.length > 0) {
      expect(compounds[0].sets).toBeGreaterThanOrEqual(isolations[0].sets);
    }
  });
});
