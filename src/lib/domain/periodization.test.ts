import { describe, it, expect } from "vitest";
import { applyPeriodization } from "./periodization";
import type { WorkoutDay } from "./types";

// ─── Fixtures ────────────────────────────────────────────────────────

const makeDays = (count: number): WorkoutDay[] =>
  Array.from({ length: count }, (_, i) => ({
    dayNumber: i + 1,
    name: `Day ${i + 1}`,
    exercises: [
      {
        exercise: {
          id: `ex-${i}`,
          name: `Exercise ${i}`,
          muscleGroup: "chest" as const,
          equipment: ["full_gym" as const],
          isCompound: true,
        },
        sets: 3,
        reps: 10,
        rpe: 7,
      },
    ],
  }));

// ─── Linear Periodization Tests ──────────────────────────────────────

describe("applyPeriodization — linear", () => {
  it("generates week 1 with high reps and low RPE", () => {
    const days = makeDays(3);
    const result = applyPeriodization(days, "linear", 1, 8);

    expect(result[0].exercises[0].reps).toBe(10);
    expect(result[0].exercises[0].rpe).toBe(6);
  });

  it("generates final week with low reps and high RPE", () => {
    const days = makeDays(3);
    const result = applyPeriodization(days, "linear", 8, 8);

    expect(result[0].exercises[0].reps).toBe(6);
    expect(result[0].exercises[0].rpe).toBe(9);
  });

  it("interpolates correctly in middle week", () => {
    const days = makeDays(3);
    const result = applyPeriodization(days, "linear", 4, 8);

    // Week 4 is 50% through 8-week program
    // Reps: 10 + 0.5 * (6 - 10) = 8
    expect(result[0].exercises[0].reps).toBe(8);
    // RPE: 6 + (3/7) * 3 ≈ 7.3 (rounded to 1 decimal)
    expect(result[0].exercises[0].rpe).toBeCloseTo(7.3, 0);
  });

  it("handles single-week program", () => {
    const days = makeDays(3);
    const result = applyPeriodization(days, "linear", 1, 1);

    // Single week → progress = 0
    expect(result[0].exercises[0].reps).toBe(10);
    expect(result[0].exercises[0].rpe).toBe(6);
  });

  it("does not modify exercise references", () => {
    const days = makeDays(3);
    const original = { ...days[0].exercises[0] };
    applyPeriodization(days, "linear", 4, 8);

    // Original should be unchanged
    expect(days[0].exercises[0].reps).toBe(original.reps);
    expect(days[0].exercises[0].rpe).toBe(original.rpe);
  });

  it("applies to all days", () => {
    const days = makeDays(3);
    const result = applyPeriodization(days, "linear", 4, 8);

    expect(result).toHaveLength(3);
    for (const day of result) {
      expect(day.exercises[0].reps).toBe(8);
    }
  });
});

// ─── DUP Periodization Tests ─────────────────────────────────────────

describe("applyPeriodization — DUP", () => {
  it("rotates heavy/moderate/light across days", () => {
    const days = makeDays(3);
    const result = applyPeriodization(days, "dup", 1, 8);

    // Day 1: heavy (1-5 → midpoint 3)
    expect(result[0].exercises[0].reps).toBe(3);
    expect(result[0].exercises[0].sets).toBe(5);
    expect(result[0].exercises[0].rpe).toBe(8.5);

    // Day 2: moderate (8-12 → midpoint 10)
    expect(result[1].exercises[0].reps).toBe(10);
    expect(result[1].exercises[0].sets).toBe(4);
    expect(result[1].exercises[0].rpe).toBe(7.5);

    // Day 3: light (12-20 → midpoint 16)
    expect(result[2].exercises[0].reps).toBe(16);
    expect(result[2].exercises[0].sets).toBe(3);
    expect(result[2].exercises[0].rpe).toBe(6.5);
  });

  it("cycle 2 shifts toward heavier loads", () => {
    const days = makeDays(3);
    const resultWeek1 = applyPeriodization(days, "dup", 1, 8);
    const resultWeek4 = applyPeriodization(days, "dup", 4, 8);

    // Week 4 is start of cycle 2 (cycleNumber=1)
    // Heavy day should have fewer reps (heavier)
    expect(resultWeek4[0].exercises[0].reps).toBeLessThanOrEqual(resultWeek1[0].exercises[0].reps);
  });

  it("cycle 3 continues progression", () => {
    const days = makeDays(3);
    const resultWeek7 = applyPeriodization(days, "dup", 7, 8);

    // Cycle 2 (cycleNumber=2), heavy day
    // Should be even heavier than cycle 1
    expect(resultWeek7[0].exercises[0].reps).toBeLessThanOrEqual(3);
  });

  it("wraps rotation correctly with 6+ days", () => {
    const days = makeDays(6);
    const result = applyPeriodization(days, "dup", 1, 8);

    // Day 4 should wrap back to heavy
    expect(result[3].exercises[0].sets).toBe(5);
    // Day 5 should wrap to moderate
    expect(result[4].exercises[0].sets).toBe(4);
    // Day 6 should wrap to light
    expect(result[5].exercises[0].sets).toBe(3);
  });

  it("isolations get higher reps than compounds", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Day 1",
        exercises: [
          {
            exercise: {
              id: "compound",
              name: "Bench Press",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 3,
            reps: 10,
          },
          {
            exercise: {
              id: "isolation",
              name: "Cable Fly",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: false,
            },
            sets: 3,
            reps: 10,
          },
        ],
      },
    ];

    const result = applyPeriodization(days, "dup", 1, 8);

    // Isolation should have reps + 4 (capped at 20)
    expect(result[0].exercises[1].reps).toBeGreaterThan(result[0].exercises[0].reps);
  });

  it("does not mutate original days", () => {
    const days = makeDays(3);
    const originalReps = days[0].exercises[0].reps;
    applyPeriodization(days, "dup", 1, 8);

    expect(days[0].exercises[0].reps).toBe(originalReps);
  });
});
