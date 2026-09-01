import { describe, it, expect } from "vitest";
import {
  getLandmarks,
  getLandmarksForMuscle,
  calculateWeeklyVolume,
  checkVolumeStatus,
  checkAllVolumeStatuses,
  applyVolumeLandmarks,
} from "./volume";
import type { WorkoutDay } from "./types";

// ─── Landmarks Tests ─────────────────────────────────────────────────

describe("getLandmarks", () => {
  it("returns 10 muscle groups for beginner", () => {
    const landmarks = getLandmarks("beginner");
    expect(landmarks).toHaveLength(10);
  });

  it("returns 10 muscle groups for intermediate", () => {
    const landmarks = getLandmarks("intermediate");
    expect(landmarks).toHaveLength(10);
  });

  it("returns 10 muscle groups for advanced", () => {
    const landmarks = getLandmarks("advanced");
    expect(landmarks).toHaveLength(10);
  });

  it("beginner MEV is lower than intermediate", () => {
    const b = getLandmarks("beginner").find((l) => l.muscleGroup === "chest")!;
    const i = getLandmarks("intermediate").find((l) => l.muscleGroup === "chest")!;
    expect(b.MEV).toBeLessThan(i.MEV);
  });

  it("intermediate MEV is lower than advanced", () => {
    const i = getLandmarks("intermediate").find((l) => l.muscleGroup === "chest")!;
    const a = getLandmarks("advanced").find((l) => l.muscleGroup === "chest")!;
    expect(i.MEV).toBeLessThan(a.MEV);
  });

  it("MEV < MAV < MRV for all muscle groups at all levels", () => {
    for (const level of ["beginner", "intermediate", "advanced"] as const) {
      const landmarks = getLandmarks(level);
      for (const l of landmarks) {
        if (l.MEV === 0) continue; // skip core
        expect(l.MEV).toBeLessThan(l.MAV);
        expect(l.MAV).toBeLessThan(l.MRV);
      }
    }
  });
});

describe("getLandmarksForMuscle", () => {
  it("returns landmarks for a specific muscle", () => {
    const l = getLandmarksForMuscle("intermediate", "chest");
    expect(l).toBeDefined();
    expect(l!.muscleGroup).toBe("chest");
    expect(l!.MEV).toBe(10);
  });

  it("returns undefined for non-existent muscle", () => {
    const l = getLandmarksForMuscle("beginner", "core");
    expect(l).toBeDefined();
    expect(l!.MEV).toBe(0);
  });
});

// ─── Volume Calculation Tests ────────────────────────────────────────

describe("calculateWeeklyVolume", () => {
  it("returns empty array for empty days", () => {
    const volume = calculateWeeklyVolume([]);
    expect(volume).toHaveLength(0);
  });

  it("counts sets per muscle group correctly", () => {
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
            weight: 80,
          },
          {
            exercise: {
              id: "ohp",
              name: "OHP",
              muscleGroup: "shoulders",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 3,
            reps: 10,
            weight: 40,
          },
        ],
      },
      {
        dayNumber: 2,
        name: "Push",
        exercises: [
          {
            exercise: {
              id: "bench2",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 3,
            reps: 10,
            weight: 80,
          },
        ],
      },
    ];

    const volume = calculateWeeklyVolume(days);

    const chest = volume.find((v) => v.muscleGroup === "chest");
    expect(chest).toBeDefined();
    expect(chest!.weeklySets).toBe(7); // 4 + 3
  });

  it("calculates volume load correctly", () => {
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

    const volume = calculateWeeklyVolume(days);
    const chest = volume.find((v) => v.muscleGroup === "chest")!;
    expect(chest.volumeLoad).toBe(3200); // 4 * 8 * 100
  });
});

// ─── Volume Status Tests ─────────────────────────────────────────────

describe("checkVolumeStatus", () => {
  it("returns undertraining when below MEV", () => {
    const landmark = { muscleGroup: "chest" as const, MEV: 10, MAV: 16, MRV: 20 };
    expect(checkVolumeStatus(5, landmark)).toBe("undertraining");
  });

  it("returns optimal when at MEV", () => {
    const landmark = { muscleGroup: "chest" as const, MEV: 10, MAV: 16, MRV: 20 };
    expect(checkVolumeStatus(10, landmark)).toBe("optimal");
  });

  it("returns optimal when at MAV", () => {
    const landmark = { muscleGroup: "chest" as const, MEV: 10, MAV: 16, MRV: 20 };
    expect(checkVolumeStatus(16, landmark)).toBe("optimal");
  });

  it("returns overreaching when above MAV", () => {
    const landmark = { muscleGroup: "chest" as const, MEV: 10, MAV: 16, MRV: 20 };
    expect(checkVolumeStatus(18, landmark)).toBe("overreaching");
  });

  it("returns overreaching at exactly MRV", () => {
    const landmark = { muscleGroup: "chest" as const, MEV: 10, MAV: 16, MRV: 20 };
    expect(checkVolumeStatus(20, landmark)).toBe("overreaching");
  });

  it("returns undertraining at 0 sets", () => {
    const landmark = { muscleGroup: "chest" as const, MEV: 10, MAV: 16, MRV: 20 };
    expect(checkVolumeStatus(0, landmark)).toBe("undertraining");
  });
});

describe("checkAllVolumeStatuses", () => {
  it("returns status for all 10 muscle groups", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Full Body",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 10,
            reps: 8,
          },
        ],
      },
    ];

    const statuses = checkAllVolumeStatuses(days, "intermediate");
    expect(statuses).toHaveLength(10);
  });

  it("marks untrained muscles as undertraining", () => {
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
            sets: 12,
            reps: 8,
          },
        ],
      },
    ];

    const statuses = checkAllVolumeStatuses(days, "intermediate");
    const backStatus = statuses.find((s) => s.muscleGroup === "back");
    expect(backStatus!.status).toBe("undertraining");
    expect(backStatus!.sets).toBe(0);
  });
});

// ─── Volume Application Tests ────────────────────────────────────────

describe("applyVolumeLandmarks", () => {
  it("returns same days if all volumes are optimal", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Full Body",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 12,
            reps: 8, // Intermediate MAV is 16, 12 is optimal
          },
        ],
      },
    ];

    const result = applyVolumeLandmarks(days, "intermediate");
    expect(result).toEqual(days);
  });

  it("adds sets for undertrained muscles", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Full Body",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 3,
            reps: 8, // Intermediate MEV is 10, 3 is undertraining
          },
        ],
      },
    ];

    const result = applyVolumeLandmarks(days, "intermediate");
    expect(result[0].exercises[0].sets).toBeGreaterThan(3);
  });

  it("does not add more than 6 sets", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Full Body",
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

    const result = applyVolumeLandmarks(days, "intermediate");
    expect(result[0].exercises[0].sets).toBeLessThanOrEqual(6);
  });

  it("never drops below 1 set", () => {
    const days: WorkoutDay[] = [
      {
        dayNumber: 1,
        name: "Full Body",
        exercises: [
          {
            exercise: {
              id: "bench",
              name: "Bench",
              muscleGroup: "chest",
              equipment: ["full_gym"],
              isCompound: true,
            },
            sets: 25,
            reps: 8, // Way over MAV
          },
        ],
      },
    ];

    const result = applyVolumeLandmarks(days, "intermediate");
    expect(result[0].exercises[0].sets).toBeGreaterThanOrEqual(1);
  });
});
