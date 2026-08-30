import { describe, it, expect } from "vitest";
import { shouldDeload, applyDeload } from "@/lib/domain/deload";
import type { PerformanceSnapshot, WorkoutDay } from "@/lib/domain/types";

describe("Deload Engine", () => {
  describe("shouldDeload", () => {
    it("returns true when time-based trigger is met", () => {
      expect(shouldDeload(5)).toBe(true);
      expect(shouldDeload(6)).toBe(true);
      expect(shouldDeload(10)).toBe(true);
    });

    it("returns false when time-based trigger is not met", () => {
      expect(shouldDeload(0)).toBe(false);
      expect(shouldDeload(3)).toBe(false);
      expect(shouldDeload(4)).toBe(false);
    });

    it("returns true when performance regression is detected", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "1",
          baselineWeight: 100,
          currentWeight: 85, // 15% drop
          baselineRpe: 7,
          currentRpe: 8,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "2",
          baselineWeight: 80,
          currentWeight: 70, // 12.5% drop
          baselineRpe: 7,
          currentRpe: 8,
          sessionsSinceStart: 10,
        },
      ];

      expect(shouldDeload(3, snapshots)).toBe(true);
    });

    it("returns false when performance regression is not significant", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "1",
          baselineWeight: 100,
          currentWeight: 95, // 5% drop
          baselineRpe: 7,
          currentRpe: 8,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "2",
          baselineWeight: 80,
          currentWeight: 78, // 2.5% drop
          baselineRpe: 7,
          currentRpe: 8,
          sessionsSinceStart: 10,
        },
      ];

      expect(shouldDeload(3, snapshots)).toBe(false);
    });

    it("returns true when overreaching is detected (high RPE sustained)", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "1",
          baselineWeight: 100,
          currentWeight: 98,
          baselineRpe: 7,
          currentRpe: 9.5,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "2",
          baselineWeight: 80,
          currentWeight: 78,
          baselineRpe: 7,
          currentRpe: 9,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "3",
          baselineWeight: 60,
          currentWeight: 58,
          baselineRpe: 7,
          currentRpe: 9.5,
          sessionsSinceStart: 10,
        },
      ];

      expect(shouldDeload(3, snapshots)).toBe(true);
    });

    it("returns false when RPE is not consistently high", () => {
      const snapshots: PerformanceSnapshot[] = [
        {
          exerciseId: "1",
          baselineWeight: 100,
          currentWeight: 98,
          baselineRpe: 7,
          currentRpe: 9.5,
          sessionsSinceStart: 10,
        },
        {
          exerciseId: "2",
          baselineWeight: 80,
          currentWeight: 78,
          baselineRpe: 7,
          currentRpe: 7, // Not high
          sessionsSinceStart: 10,
        },
      ];

      expect(shouldDeload(3, snapshots)).toBe(false);
    });

    it("returns false with no performance data and recent deload", () => {
      expect(shouldDeload(2, [])).toBe(false);
    });
  });

  describe("applyDeload", () => {
    it("reduces volume and intensity during deload", () => {
      const days: WorkoutDay[] = [
        {
          dayNumber: 1,
          name: "Push",
          exercises: [
            {
              exercise: {
                id: "1",
                name: "Bench Press",
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

      const deloadDays = applyDeload(days);

      expect(deloadDays[0].exercises[0].sets).toBeLessThan(4);
      expect(deloadDays[0].exercises[0].reps).toBeLessThan(8);
      expect(deloadDays[0].exercises[0].weight).toBeLessThan(100);
      expect(deloadDays[0].exercises[0].rpe).toBeLessThan(8);
    });

    it("maintains minimum values during deload", () => {
      const days: WorkoutDay[] = [
        {
          dayNumber: 1,
          name: "Push",
          exercises: [
            {
              exercise: {
                id: "1",
                name: "Bench Press",
                muscleGroup: "chest",
                equipment: ["full_gym"],
                isCompound: true,
              },
              sets: 2,
              reps: 6,
              weight: 80,
              rpe: 7,
            },
          ],
        },
      ];

      const deloadDays = applyDeload(days);

      // Should not go below 1 set or 1 rep
      expect(deloadDays[0].exercises[0].sets).toBeGreaterThanOrEqual(1);
      expect(deloadDays[0].exercises[0].reps).toBeGreaterThanOrEqual(1);
    });

    it("does not modify exercises without optional fields", () => {
      const days: WorkoutDay[] = [
        {
          dayNumber: 1,
          name: "Pull",
          exercises: [
            {
              exercise: {
                id: "1",
                name: "Pull-ups",
                muscleGroup: "back",
                equipment: ["full_gym"],
                isCompound: true,
              },
              sets: 3,
              reps: 10,
            },
          ],
        },
      ];

      const deloadDays = applyDeload(days);

      expect(deloadDays[0].exercises[0].weight).toBeUndefined();
      expect(deloadDays[0].exercises[0].rpe).toBeUndefined();
    });

    it("returns empty array for empty workout days", () => {
      const deloadDays = applyDeload([]);
      expect(deloadDays).toHaveLength(0);
    });
  });
});
