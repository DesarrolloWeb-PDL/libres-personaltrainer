import { describe, it, expect } from "vitest";
import { shouldDeload, applyDeload } from "./deload";
import type { PerformanceSnapshot, WorkoutDay } from "./types";

// ─── Deload Detection Tests ──────────────────────────────────────────

describe("shouldDeload", () => {
  describe("time-based trigger", () => {
    it("returns true when 5 weeks since last deload", () => {
      expect(shouldDeload(5)).toBe(true);
    });

    it("returns true when 6 weeks since last deload", () => {
      expect(shouldDeload(6)).toBe(true);
    });

    it("returns true when more than 6 weeks", () => {
      expect(shouldDeload(10)).toBe(true);
    });

    it("returns false when only 3 weeks since last deload", () => {
      expect(shouldDeload(3)).toBe(false);
    });

    it("returns false when 4 weeks (default interval)", () => {
      // Default interval is 5, so 4 weeks is not yet time
      expect(shouldDeload(4)).toBe(false);
    });
  });

  describe("performance regression trigger", () => {
    it("returns true when >50% of exercises show >10% regression", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "ex1",
          baselineWeight: 100,
          currentWeight: 85,
          baselineRpe: 7,
          currentRpe: 8,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex2",
          baselineWeight: 80,
          currentWeight: 65,
          baselineRpe: 7,
          currentRpe: 8.5,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex3",
          baselineWeight: 60,
          currentWeight: 60,
          baselineRpe: 7,
          currentRpe: 7.5,
          sessionsSinceStart: 10,
        },
      ];
      // 2 out of 3 exercises show >10% regression
      expect(shouldDeload(2, snapshots)).toBe(true);
    });

    it("returns false when <50% of exercises show regression", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "ex1",
          baselineWeight: 100,
          currentWeight: 85,
          baselineRpe: 7,
          currentRpe: 8,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex2",
          baselineWeight: 80,
          currentWeight: 79,
          baselineRpe: 7,
          currentRpe: 7.5,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex3",
          baselineWeight: 60,
          currentWeight: 59,
          baselineRpe: 7,
          currentRpe: 7.5,
          sessionsSinceStart: 10,
        },
      ];
      // Only 1 out of 3 shows regression
      expect(shouldDeload(2, snapshots)).toBe(false);
    });

    it("returns false with empty snapshots", () => {
      expect(shouldDeload(2, [])).toBe(false);
    });
  });

  describe("overreaching trigger", () => {
    it("returns true when all exercises have RPE ≥ 9", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "ex1",
          baselineWeight: 100,
          currentWeight: 100,
          baselineRpe: 7,
          currentRpe: 9,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex2",
          baselineWeight: 80,
          currentWeight: 80,
          baselineRpe: 7,
          currentRpe: 9.5,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex3",
          baselineWeight: 60,
          currentWeight: 60,
          baselineRpe: 7,
          currentRpe: 10,
          sessionsSinceStart: 10,
        },
      ];
      expect(shouldDeload(2, snapshots)).toBe(true);
    });

    it("returns false when some exercises are below RPE 9", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "ex1",
          baselineWeight: 100,
          currentWeight: 100,
          baselineRpe: 7,
          currentRpe: 9,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex2",
          baselineWeight: 80,
          currentWeight: 80,
          baselineRpe: 7,
          currentRpe: 8,
          sessionsSinceStart: 10,
        },
      ];
      expect(shouldDeload(2, snapshots)).toBe(false);
    });

    it("returns false with fewer than 3 exercises (minimum threshold)", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "ex1",
          baselineWeight: 100,
          currentWeight: 100,
          baselineRpe: 7,
          currentRpe: 10,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex2",
          baselineWeight: 80,
          currentWeight: 80,
          baselineRpe: 7,
          currentRpe: 9.5,
          sessionsSinceStart: 10,
        },
      ];
      // Only 2 exercises, threshold is 3
      expect(shouldDeload(2, snapshots)).toBe(false);
    });
  });

  describe("combined triggers", () => {
    it("returns true if any single trigger fires", () => {
      // Only time triggers (4 weeks = not time, but performance regression)
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "ex1",
          baselineWeight: 100,
          currentWeight: 80,
          baselineRpe: 7,
          currentRpe: 9,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex2",
          baselineWeight: 80,
          currentWeight: 60,
          baselineRpe: 7,
          currentRpe: 9.5,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "ex3",
          baselineWeight: 60,
          currentWeight: 50,
          baselineRpe: 7,
          currentRpe: 9,
          sessionsSinceStart: 10,
        },
      ];
      expect(shouldDeload(2, snapshots)).toBe(true);
    });
  });
});

// ─── Deload Application Tests ────────────────────────────────────────

describe("applyDeload", () => {
  it("reduces volume by ~50%", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 4,
            reps: 8,
            weight: 100,
            rpe: 8,
          },
        ],
      },
    ];

    const result = applyDeload(days);
    expect(result[0].exercises[0].sets).toBe(2); // 4 * 0.5 = 2
  });

  it("reduces intensity by ~12%", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 4,
            reps: 8,
            weight: 100,
            rpe: 8,
          },
        ],
      },
    ];

    const result = applyDeload(days);
    // weight: 100 * 0.88 = 88
    expect(result[0].exercises[0].weight).toBe(88);
    // reps: 8 * 0.88 ≈ 7
    expect(result[0].exercises[0].reps).toBe(7);
  });

  it("reduces RPE by 2 points (min 5)", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 4,
            reps: 8,
            rpe: 8,
          },
        ],
      },
    ];

    const result = applyDeload(days);
    expect(result[0].exercises[0].rpe).toBe(6);
  });

  it("never drops below 1 set", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 1,
            reps: 8,
          },
        ],
      },
    ];

    const result = applyDeload(days);
    expect(result[0].exercises[0].sets).toBeGreaterThanOrEqual(1);
  });

  it("never drops below 1 rep", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 4,
            reps: 1,
          },
        ],
      },
    ];

    const result = applyDeload(days);
    expect(result[0].exercises[0].reps).toBeGreaterThanOrEqual(1);
  });

  it("applies to all days and exercises", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "ex1",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 4,
            reps: 8,
            weight: 100,
          },
        ],
      },
      {
        dayNumber: 2,
        name: "Pull",
        exercises: [
          {
            exercise: {
              id: "ex2",
              name: "Row",
              muscleGroup: "back",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 4,
            reps: 8,
            weight: 80,
          },
        ],
      },
    ];

    const result = applyDeload(days);
    expect(result).toHaveLength(2);
    expect(result[0].exercises[0].sets).toBe(2);
    expect(result[1].exercises[0].sets).toBe(2);
  });

  it("handles exercises without weight", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "pushup",
              name: "Push-up",
              muscleGroup: "chest",
              equipment: ["bodyweight_only"],
              isCompound: true,
            },
            sets: 3,
            reps: 15,
          },
        ],
      },
    ];

    const result = applyDeload(days);
    expect(result[0].exercises[0].weight).toBeUndefined();
    expect(result[0].exercises[0].sets).toBe(2);
    expect(result[0].exercises[0].reps).toBe(13);
  });

  it("does not mutate original days", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 4,
            reps: 8,
            weight: 100,
          },
        ],
      },
    ];

    applyDeload(days);
    expect(days[0].exercises[0].sets).toBe(4);
    expect(days[0].exercises[0].weight).toBe(100);
  });
});
