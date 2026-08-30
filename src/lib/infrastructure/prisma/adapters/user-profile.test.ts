import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for PrismaProfileAdapter.
 *
 * Uses vi.hoisted() so mock functions survive vi.mock hoisting.
 */

const { mockFindUnique, mockCreate, mockUpsert } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock("@/lib/infrastructure/prisma/client", () => ({
  prisma: {
    profile: {
      findUnique: mockFindUnique,
      create: mockCreate,
      upsert: mockUpsert,
    },
  },
}));

import { PrismaProfileAdapter } from "./user-profile";

const mockProfile = {
  id: "profile-1",
  userId: "user-1",
  age: 28,
  experienceLevel: "intermediate",
  goals: "muscle_gain,strength",
  equipment: "full_gym",
  injuries: null,
};

describe("PrismaProfileAdapter", () => {
  let adapter: PrismaProfileAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PrismaProfileAdapter();
  });

  describe("findByUserId", () => {
    it("returns profile when found", async () => {
      mockFindUnique.mockResolvedValue(mockProfile);

      const result = await adapter.findByUserId("user-1");

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-1");
      expect(result?.age).toBe(28);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
    });

    it("returns null when not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await adapter.findByUserId("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates a new profile", async () => {
      mockCreate.mockResolvedValue(mockProfile);

      const result = await adapter.create({
        userId: "user-1",
        age: 28,
        experienceLevel: "intermediate",
        goals: "muscle_gain,strength",
        equipment: "full_gym",
      });

      expect(result.id).toBe("profile-1");
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          age: 28,
          experienceLevel: "intermediate",
          goals: "muscle_gain,strength",
          equipment: "full_gym",
        },
      });
    });

    it("creates profile with minimal data", async () => {
      const minimalProfile = { ...mockProfile, age: null, experienceLevel: null, goals: null, equipment: null, injuries: null };
      mockCreate.mockResolvedValue(minimalProfile);

      const result = await adapter.create({ userId: "user-1" });

      expect(result.userId).toBe("user-1");
    });
  });

  describe("update", () => {
    it("upserts profile data", async () => {
      const updatedProfile = { ...mockProfile, age: 30 };
      mockUpsert.mockResolvedValue(updatedProfile);

      const result = await adapter.update("user-1", { age: 30 });

      expect(result.age).toBe(30);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        create: { userId: "user-1", age: 30 },
        update: { age: 30 },
      });
    });

    it("updates multiple fields", async () => {
      mockUpsert.mockResolvedValue(mockProfile);

      await adapter.update("user-1", {
        experienceLevel: "advanced",
        goals: "strength",
        equipment: "home_gym",
      });

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        create: {
          userId: "user-1",
          experienceLevel: "advanced",
          goals: "strength",
          equipment: "home_gym",
        },
        update: {
          experienceLevel: "advanced",
          goals: "strength",
          equipment: "home_gym",
        },
      });
    });
  });
});
