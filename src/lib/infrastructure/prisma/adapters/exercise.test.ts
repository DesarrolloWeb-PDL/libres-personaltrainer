import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for PrismaExerciseAdapter.
 *
 * Uses vi.hoisted() so mock functions survive vi.mock hoisting.
 */

const { mockFindMany, mockFindUnique } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/infrastructure/prisma/client", () => ({
  prisma: {
    exercise: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
    },
  },
}));

import { PrismaExerciseAdapter } from "./exercise";

const mockMuscleGroup = {
  id: "mg-1",
  name: "Chest",
  nameEs: "Pecho",
  category: "chest",
};

const mockEquipment = {
  id: "eq-1",
  name: "Barbell",
  nameEs: "Barra",
};

const mockExercise = {
  id: "ex-1",
  name: "Barbell Bench Press",
  nameEs: "Press de banca con barra",
  instructions: "Lie on bench...",
  muscleGroupId: "mg-1",
  muscleGroup: mockMuscleGroup,
  equipmentId: "eq-1",
  equipment: mockEquipment,
  media: [{ id: "m-1", type: "gif", url: "https://example.com/bench.gif", isPrimary: true }],
};

describe("PrismaExerciseAdapter", () => {
  let adapter: PrismaExerciseAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PrismaExerciseAdapter();
  });

  describe("findAll", () => {
    it("returns all exercises when no filters provided", async () => {
      mockFindMany.mockResolvedValue([mockExercise]);

      const result = await adapter.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Barbell Bench Press");
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        include: { muscleGroup: true, equipment: true, media: true },
        orderBy: { name: "asc" },
      });
    });

    it("filters by muscleGroupId", async () => {
      mockFindMany.mockResolvedValue([mockExercise]);

      const result = await adapter.findAll({ muscleGroupId: "mg-1" });

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ muscleGroupId: "mg-1" }),
        }),
      );
    });

    it("filters by equipmentId", async () => {
      mockFindMany.mockResolvedValue([mockExercise]);

      await adapter.findAll({ equipmentId: "eq-1" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ equipmentId: "eq-1" }),
        }),
      );
    });

    it("filters by search term in name and nameEs", async () => {
      mockFindMany.mockResolvedValue([mockExercise]);

      await adapter.findAll({ search: "bench" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ name: { contains: "bench" } }, { nameEs: { contains: "bench" } }],
          }),
        }),
      );
    });

    it("combines multiple filters", async () => {
      mockFindMany.mockResolvedValue([mockExercise]);

      await adapter.findAll({
        muscleGroupId: "mg-1",
        equipmentId: "eq-1",
        search: "bench",
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            muscleGroupId: "mg-1",
            equipmentId: "eq-1",
            OR: [{ name: { contains: "bench" } }, { nameEs: { contains: "bench" } }],
          }),
        }),
      );
    });
  });

  describe("findById", () => {
    it("returns exercise when found", async () => {
      mockFindUnique.mockResolvedValue(mockExercise);

      const result = await adapter.findById("ex-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("ex-1");
      expect(result?.muscleGroup?.name).toBe("Chest");
      expect(result?.equipment?.name).toBe("Barbell");
    });

    it("returns null when not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await adapter.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("search", () => {
    it("searches by name and nameEs", async () => {
      mockFindMany.mockResolvedValue([mockExercise]);

      const result = await adapter.search("Press");

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ name: { contains: "Press" } }, { nameEs: { contains: "Press" } }],
          }),
          include: { muscleGroup: true, equipment: true, media: true },
          orderBy: { name: "asc" },
        }),
      );
    });

    it("returns empty array for no matches", async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await adapter.search("nonexistent");

      expect(result).toHaveLength(0);
    });
  });
});
