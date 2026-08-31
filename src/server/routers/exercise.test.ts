import { describe, it, expect, vi } from "vitest";

/**
 * Unit tests for exercise tRPC router.
 *
 * Mocks the PrismaExerciseAdapter as a proper class so `new` works.
 * Uses vi.hoisted() so variables survive vi.mock hoisting.
 */

const { mockData } = vi.hoisted(() => ({
  mockData: [
    {
      id: "ex-1",
      name: "Barbell Bench Press",
      nameEs: "Press de banca con barra",
      instructions: "Lie on bench...",
      muscleGroupId: "mg-1",
      muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
      equipmentId: "eq-1",
      equipment: { id: "eq-1", name: "Barbell", nameEs: "Barra" },
      media: [],
    },
    {
      id: "ex-2",
      name: "Pull-up",
      nameEs: "Dominada",
      instructions: "Hang from bar...",
      muscleGroupId: "mg-2",
      muscleGroup: { id: "mg-2", name: "Lats", nameEs: "Dorsales", category: "back" },
      equipmentId: "eq-2",
      equipment: { id: "eq-2", name: "Pull-up Bar", nameEs: "Barra de dominadas" },
      media: [],
    },
  ],
}));

vi.mock("@/lib/infrastructure/prisma/adapters/exercise", () => {
  class MockPrismaExerciseAdapter {
    findAll = vi.fn().mockResolvedValue(mockData);
    findById = vi.fn().mockImplementation((id: string) =>
      Promise.resolve(mockData.find((e) => e.id === id) ?? null)
    );
    search = vi.fn().mockImplementation((q: string) =>
      Promise.resolve(
        mockData.filter(
          (e) =>
            e.name.toLowerCase().includes(q.toLowerCase()) ||
            e.nameEs?.toLowerCase().includes(q.toLowerCase())
        )
      )
    );
  }

  return {
    PrismaExerciseAdapter: MockPrismaExerciseAdapter,
  };
});

import { exerciseRouter } from "./exercise";

describe("exerciseRouter", () => {
  const caller = exerciseRouter.createCaller({ session: null });

  describe("list", () => {
    it("returns all exercises", async () => {
      const result = await caller.list();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Barbell Bench Press");
    });

    it("returns exercises with filters", async () => {
      const result = await caller.list({ muscleGroupId: "mg-1" });
      expect(result).toHaveLength(2);
    });
  });

  describe("search", () => {
    it("searches exercises by query", async () => {
      const result = await caller.search({ q: "Bench" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Barbell Bench Press");
    });

    it("searches in Spanish name", async () => {
      const result = await caller.search({ q: "Dominada" });
      expect(result).toHaveLength(1);
      expect(result[0].nameEs).toBe("Dominada");
    });

    it("returns empty for no matches", async () => {
      const result = await caller.search({ q: "nonexistent" });
      expect(result).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("returns exercise by ID", async () => {
      const result = await caller.getById({ id: "ex-1" });
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Barbell Bench Press");
    });

    it("returns null for nonexistent ID", async () => {
      const result = await caller.getById({ id: "nonexistent" });
      expect(result).toBeNull();
    });
  });

  describe("byMuscleGroup", () => {
    it("filters exercises by muscle group", async () => {
      const result = await caller.byMuscleGroup({ muscleGroupId: "mg-1" });
      expect(result).toHaveLength(2);
    });
  });

  describe("byEquipment", () => {
    it("filters exercises by equipment", async () => {
      const result = await caller.byEquipment({ equipmentId: "eq-1" });
      expect(result).toHaveLength(2);
    });
  });
});
