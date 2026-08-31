import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for program tRPC router.
 */

const { mockCreate, mockFindUnique, mockFindFirst, mockFindMany, mockFindAll, mockProfileFindUnique } = vi.hoisted(
  () => ({
    mockCreate: vi.fn(),
    mockFindUnique: vi.fn(),
    mockFindFirst: vi.fn(),
    mockFindMany: vi.fn(),
    mockFindAll: vi.fn(),
    mockProfileFindUnique: vi.fn(),
  }),
);

vi.mock("@/lib/infrastructure/prisma/client", () => ({
  prisma: {
    trainingProgram: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
      findMany: mockFindMany,
    },
    profile: {
      findUnique: mockProfileFindUnique,
    },
  },
}));

vi.mock("@/lib/infrastructure/prisma/adapters/exercise", () => ({
  PrismaExerciseAdapter: class {
    findAll = mockFindAll;
  },
}));

vi.mock("@/lib/domain/training-engine", () => ({
  generateProgram: vi.fn().mockReturnValue({
    splitType: "upper_lower",
    weeks: 8,
    days: [
      {
        dayNumber: 1,
        name: "Upper",
        exercises: [
          {
            exercise: { id: "ex-1", name: "Bench Press" },
            sets: 3,
            reps: 10,
            rpe: 7,
          },
        ],
      },
    ],
  }),
  selectSplit: vi.fn().mockReturnValue("upper_lower"),
}));

import { programRouter } from "./program";

const mockCtx = { session: null };

describe("programRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrent", () => {
    it("returns the active program for a user", async () => {
      mockFindFirst.mockResolvedValue({
        id: "prog-1",
        userId: "user-1",
        name: "My Program",
        days: [],
      });

      const caller = programRouter.createCaller(mockCtx);
      const result = await caller.getCurrent({ userId: "user-1" });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("prog-1");
    });

    it("returns null when no program exists", async () => {
      mockFindFirst.mockResolvedValue(null);

      const caller = programRouter.createCaller(mockCtx);
      const result = await caller.getCurrent({ userId: "user-1" });

      expect(result).toBeNull();
    });
  });

  describe("getById", () => {
    it("returns a program by ID", async () => {
      mockFindUnique.mockResolvedValue({
        id: "prog-1",
        userId: "user-1",
        name: "My Program",
        days: [],
      });

      const caller = programRouter.createCaller(mockCtx);
      const result = await caller.getById({ id: "prog-1" });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("prog-1");
    });
  });

  describe("listByUser", () => {
    it("returns all programs for a user", async () => {
      mockFindMany.mockResolvedValue([
        { id: "prog-1", userId: "user-1", name: "Program 1" },
      ]);

      const caller = programRouter.createCaller(mockCtx);
      const result = await caller.listByUser({ userId: "user-1" });

      expect(result).toHaveLength(1);
    });
  });

  describe("generate", () => {
    it("creates a program from user profile", async () => {
      mockFindAll.mockResolvedValue([
        {
          id: "ex-1",
          name: "Bench Press",
          muscleGroup: { category: "chest" },
          equipment: { name: "Barbell" },
        },
      ]);
      mockProfileFindUnique.mockResolvedValue({
        userId: "user-1",
        age: 25,
        experienceLevel: "intermediate",
        goals: "muscle_gain",
        equipment: "full_gym",
      });
      mockCreate.mockResolvedValue({
        id: "prog-1",
        userId: "user-1",
        name: "Test Program",
        days: [],
      });

      const caller = programRouter.createCaller(mockCtx);
      const result = await caller.generate({
        userId: "user-1",
        name: "Test Program",
        trainingFrequency: 4,
        experienceLevel: "intermediate",
      });

      expect(result).not.toBeNull();
      expect(result.id).toBe("prog-1");
    });
  });
});
