import { describe, it, expect } from "vitest";
import { mapEquipment, toDomainExercise } from "./mappers";
import type { Exercise as DomainExercise } from "@/lib/domain/types";

/**
 * Golden tests for the shared Prisma → domain exercise mapper.
 * These cases lock the behavior consumed by program.ts and session.ts.
 */

describe("mapEquipment", () => {
  it.each([
    ["Barbell", "full_gym"],
    ["Dumbbell", "full_gym"],
    ["Cable", "full_gym"],
    ["Machine", "full_gym"],
    ["Pull-up Bar", "full_gym"],
    ["Bodyweight", "bodyweight_only"],
    ["Resistance", "home_gym"],
    ["Unknown Gizmo", "full_gym"],
    ["", "full_gym"],
  ])("maps %p -> %p", (name, expected) => {
    expect(mapEquipment(name)).toBe(expected);
  });
});

describe("toDomainExercise", () => {
  it("maps a fully populated DB exercise to the domain type", () => {
    const result = toDomainExercise({
      id: "ex-1",
      name: "Bench Press",
      muscleGroup: { category: "chest" },
      equipment: { name: "Barbell" },
    });

    expect(result).toEqual({
      id: "ex-1",
      name: "Bench Press",
      muscleGroup: "chest",
      equipment: ["full_gym"],
      isCompound: true,
    });
  });

  it("defaults null muscleGroup to chest", () => {
    const result = toDomainExercise({
      id: "ex-2",
      name: "Mystery Exercise",
      muscleGroup: null,
      equipment: { name: "Dumbbell" },
    });

    expect(result.muscleGroup).toBe("chest");
  });

  it("defaults null equipment to full_gym", () => {
    const result = toDomainExercise({
      id: "ex-3",
      name: "No Equipment Listed",
      muscleGroup: { category: "back" },
      equipment: null,
    });

    expect(result.equipment).toEqual(["full_gym"]);
  });

  it("defaults unknown equipment to full_gym", () => {
    const result = toDomainExercise({
      id: "ex-4",
      name: "Futuristic Press",
      muscleGroup: { category: "shoulders" },
      equipment: { name: "Anti-Gravity Machine" },
    });

    expect(result.equipment).toEqual(["full_gym"]);
  });

  it("maps Bodyweight equipment to bodyweight_only", () => {
    const result = toDomainExercise({
      id: "ex-5",
      name: "Push-up",
      muscleGroup: { category: "chest" },
      equipment: { name: "Bodyweight" },
    });

    expect(result.equipment).toEqual(["bodyweight_only"]);
  });

  it("respects an explicit isCompound override", () => {
    const result = toDomainExercise(
      {
        id: "ex-6",
        name: "Cable Fly",
        muscleGroup: { category: "chest" },
        equipment: { name: "Cable" },
      },
      false,
    );

    expect(result.isCompound).toBe(false);
  });

  it("returns a valid DomainExercise shape", () => {
    const result = toDomainExercise({
      id: "ex-7",
      name: "Squat",
      muscleGroup: { category: "quadriceps" },
      equipment: { name: "Barbell" },
    });

    const muscleGroups: DomainExercise["muscleGroup"][] = [
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "core",
    ];
    expect(muscleGroups).toContain(result.muscleGroup);
    expect(
      result.equipment.every((e) => ["full_gym", "home_gym", "bodyweight_only"].includes(e)),
    ).toBe(true);
  });
});
