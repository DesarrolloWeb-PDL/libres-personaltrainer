import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for PrismaProgramAdapter.
 */

const { mockCreate, mockFindUnique, mockFindFirst, mockFindMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/infrastructure/prisma/client", () => ({
  prisma: {
    trainingProgram: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
      findMany: mockFindMany,
    },
  },
}));

import { PrismaProgramAdapter } from "./program";

const mockProgram = {
  id: "prog-1",
  userId: "user-1",
  name: "My Program",
  splitType: "push_pull_legs",
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  days: [
    {
      id: "day-1",
      programId: "prog-1",
      dayNumber: 1,
      name: "Push",
      exercises: [],
    },
  ],
};

describe("PrismaProgramAdapter", () => {
  let adapter: PrismaProgramAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PrismaProgramAdapter();
  });

  describe("findById", () => {
    it("returns program with days and exercises", async () => {
      mockFindUnique.mockResolvedValue(mockProgram);

      const result = await adapter.findById("prog-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("prog-1");
      expect(result?.days).toHaveLength(1);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: "prog-1" },
        include: expect.objectContaining({
          days: expect.any(Object),
        }),
      });
    });

    it("returns null when not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await adapter.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findActiveByUserId", () => {
    it("finds the most recent program for user", async () => {
      mockFindFirst.mockResolvedValue(mockProgram);

      const result = await adapter.findActiveByUserId("user-1");

      expect(result).not.toBeNull();
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { startDate: "desc" },
        include: expect.objectContaining({
          days: expect.any(Object),
        }),
      });
    });

    it("returns null when no programs exist", async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await adapter.findActiveByUserId("user-1");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates a program with nested days and exercises", async () => {
      mockCreate.mockResolvedValue(mockProgram);

      const result = await adapter.create({
        userId: "user-1",
        name: "My Program",
        splitType: "push_pull_legs",
        days: [
          {
            dayNumber: 1,
            name: "Push",
            exercises: [{ exerciseId: "ex-1", sets: 3, reps: 10, order: 1 }],
          },
        ],
      });

      expect(result).not.toBeNull();
      expect(result.id).toBe("prog-1");
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          name: "My Program",
          splitType: "push_pull_legs",
          days: {
            create: expect.arrayContaining([
              expect.objectContaining({
                dayNumber: 1,
                name: "Push",
                exercises: {
                  create: expect.arrayContaining([
                    expect.objectContaining({
                      exerciseId: "ex-1",
                      sets: 3,
                      reps: 10,
                    }),
                  ]),
                },
              }),
            ]),
          },
        }),
        include: expect.objectContaining({
          days: expect.any(Object),
        }),
      });
    });
  });

  describe("findByUserId", () => {
    it("returns all programs for a user", async () => {
      mockFindMany.mockResolvedValue([mockProgram]);

      const result = await adapter.findByUserId("user-1");

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { startDate: "desc" },
      });
    });
  });
});
