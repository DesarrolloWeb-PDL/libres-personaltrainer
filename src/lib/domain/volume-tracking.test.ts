import { describe, it, expect } from "vitest";
import {
  checkVolumeStatus,
  calculateWeeklyVolume,
  getLandmarks,
  getLandmarksForMuscle,
} from "@/lib/domain/volume";
import type { MuscleGroup, VolumeLandmarks, WorkoutDay } from "@/lib/domain/types";

describe("Volume Engine", () => {
  describe("getLandmarks", () => {
    it("returns landmarks for beginner level", () => {
      const landmarks = getLandmarks("beginner");
      expect(landmarks).toHaveLength(10);
      expect(landmarks[0]).toHaveProperty("muscleGroup");
      expect(landmarks[0]).toHaveProperty("MEV");
      expect(landmarks[0]).toHaveProperty("MAV");
      expect(landmarks[0]).toHaveProperty("MRV");
    });

    it("returns landmarks for intermediate level", () => {
      const landmarks = getLandmarks("intermediate");
      expect(landmarks).toHaveLength(10);
      // Intermediate should have higher MEV than beginner
      const beginnerLandmarks = getLandmarks("beginner");
      expect(landmarks[0].MEV).toBeGreaterThan(beginnerLandmarks[0].MEV);
    });

    it("returns landmarks for advanced level", () => {
      const landmarks = getLandmarks("advanced");
      expect(landmarks).toHaveLength(10);
      // Advanced should have higher MEV than intermediate
      const intermediateLandmarks = getLandmarks("intermediate");
      expect(landmarks[0].MEV).toBeGreaterThan(intermediateLandmarks[0].MEV);
    });
  });

  describe("getLandmarksForMuscle", () => {
    it("returns landmarks for a specific muscle group", () => {
      const landmarks = getLandmarksForMuscle("beginner", "chest");
      expect(landmarks).toBeDefined();
      expect(landmarks?.muscleGroup).toBe("chest");
      expect(landmarks?.MEV).toBe(8);
      expect(landmarks?.MAV).toBe(12);
      expect(landmarks?.MRV).toBe(16);
    });

    it("returns undefined for non-existent muscle group", () => {
      const landmarks = getLandmarksForMuscle("beginner", "forearms" as MuscleGroup);
      expect(landmarks).toBeUndefined();
    });
  });

  describe("checkVolumeStatus", () => {
    const landmark: VolumeLandmarks = {
      muscleGroup: "chest",
      MEV: 10,
      MAV: 16,
      MRV: 20,
    };

    it("returns undertraining when sets < MEV", () => {
      expect(checkVolumeStatus(8, landmark)).toBe("undertraining");
      expect(checkVolumeStatus(0, landmark)).toBe("undertraining");
      expect(checkVolumeStatus(9, landmark)).toBe("undertraining");
    });

    it("returns optimal when sets >= MEV and <= MAV", () => {
      expect(checkVolumeStatus(10, landmark)).toBe("optimal");
      expect(checkVolumeStatus(13, landmark)).toBe("optimal");
      expect(checkVolumeStatus(16, landmark)).toBe("optimal");
    });

    it("returns overreaching when sets > MAV", () => {
      expect(checkVolumeStatus(17, landmark)).toBe("overreaching");
      expect(checkVolumeStatus(20, landmark)).toBe("overreaching");
      expect(checkVolumeStatus(25, landmark)).toBe("overreaching");
    });
  });

  describe("calculateWeeklyVolume", () => {
    it("calculates volume from workout days", () => {
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
              weight: 80,
            },
            {
              exercise: {
                id: "2",
                name: "Overhead Press",
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
      ];

      const volume = calculateWeeklyVolume(days);
      expect(volume).toHaveLength(2);

      const chestVolume = volume.find((v) => v.muscleGroup === "chest");
      expect(chestVolume?.weeklySets).toBe(4);
      expect(chestVolume?.volumeLoad).toBe(4 * 8 * 80);

      const shoulderVolume = volume.find((v) => v.muscleGroup === "shoulders");
      expect(shoulderVolume?.weeklySets).toBe(3);
      expect(shoulderVolume?.volumeLoad).toBe(3 * 10 * 40);
    });

    it("aggregates volume across multiple days", () => {
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
              weight: 80,
            },
          ],
        },
        {
          dayNumber: 4,
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
              sets: 3,
              reps: 10,
              weight: 75,
            },
          ],
        },
      ];

      const volume = calculateWeeklyVolume(days);
      const chestVolume = volume.find((v) => v.muscleGroup === "chest");
      expect(chestVolume?.weeklySets).toBe(7);
      expect(chestVolume?.volumeLoad).toBe(4 * 8 * 80 + 3 * 10 * 75);
    });

    it("handles exercises without weight", () => {
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

      const volume = calculateWeeklyVolume(days);
      const backVolume = volume.find((v) => v.muscleGroup === "back");
      expect(backVolume?.weeklySets).toBe(3);
      expect(backVolume?.volumeLoad).toBe(0);
    });

    it("returns empty array for empty workout days", () => {
      const volume = calculateWeeklyVolume([]);
      expect(volume).toHaveLength(0);
    });
  });
});
