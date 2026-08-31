import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for progress tRPC router.
 *
 * Mocks the Prisma client (same pattern as session.test.ts).
 */

const {
  mockCreate,
  mockFindMany,
  mockFindFirst,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/infrastructure/prisma/client", () => ({
  prisma: {
    progress: {
      create: mockCreate,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
    },
    workoutSet: {
      findMany: mockFindMany,
    },
  },
}));

vi.mock("@/lib/domain/plateau", () => ({
  detectPlateau: vi.fn().mockReturnValue({
    isPlateau: false,
    weeksSinceImprovement: 0,
    lastImprovementDate: null,
    currentValue: 0,
    peakValue: 0,
    percentChange: 0,
    suggestion: null,
  }),
}));

import { progressRouter } from "./progress";

const mockCtx = { session: null };

const mockProgressEntry = {
  id: "prog-1",
  userId: "user-1",
  date: new Date("2026-08-30T10:00:00"),
  bodyWeight: 75.5,
  estimated1RM: 100,
  notes: "Morning weigh-in",
};

describe("progressRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("record", () => {
    it("creates a new progress entry", async () => {
      mockCreate.mockResolvedValue(mockProgressEntry);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.record({
        userId: "user-1",
        bodyWeight: 75.5,
        estimated1RM: 100,
        notes: "Morning weigh-in",
      });

      expect(result.id).toBe("prog-1");
      expect(result.bodyWeight).toBe(75.5);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          bodyWeight: 75.5,
          estimated1RM: 100,
          notes: "Morning weigh-in",
        }),
      });
    });
  });

  describe("getWeightHistory", () => {
    it("returns weight history for a user", async () => {
      mockFindMany.mockResolvedValue([mockProgressEntry]);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.getWeightHistory({
        userId: "user-1",
      });

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            bodyWeight: { not: null },
          }),
          orderBy: { date: "asc" },
        }),
      );
    });
  });

  describe("get1RMHistory", () => {
    it("returns 1RM history for a user", async () => {
      mockFindMany.mockResolvedValue([mockProgressEntry]);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.get1RMHistory({
        userId: "user-1",
      });

      expect(result).toHaveLength(1);
    });
  });

  describe("getVolumeHistory", () => {
    it("returns volume history for a user", async () => {
      mockFindMany.mockResolvedValue([]);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.getVolumeHistory({
        userId: "user-1",
      });

      expect(result).toHaveLength(0);
    });
  });

  describe("getLatest", () => {
    it("returns latest progress entry", async () => {
      mockFindFirst.mockResolvedValue(mockProgressEntry);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.getLatest({
        userId: "user-1",
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("prog-1");
    });

    it("returns null when no entries exist", async () => {
      mockFindFirst.mockResolvedValue(null);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.getLatest({
        userId: "user-1",
      });

      expect(result).toBeNull();
    });
  });

  describe("detectPlateau", () => {
    it("returns plateau detection results", async () => {
      mockFindMany.mockResolvedValue([]);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.detectPlateau({
        userId: "user-1",
      });

      expect(result).toHaveProperty("oneRMPlateau");
      expect(result).toHaveProperty("weightPlateau");
    });
  });

  describe("exportCSV", () => {
    it("returns CSV string", async () => {
      mockFindMany.mockResolvedValue([mockProgressEntry]);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.exportCSV({
        userId: "user-1",
      });

      expect(result).toContain("Date,Body Weight,Estimated 1RM,Notes");
      expect(result).toContain("2026-08-30");
    });

    it("returns CSV with only header when no data", async () => {
      mockFindMany.mockResolvedValue([]);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.exportCSV({
        userId: "user-1",
      });

      expect(result).toBe("Date,Body Weight,Estimated 1RM,Notes");
    });
  });

  describe("getAll", () => {
    it("returns all progress entries", async () => {
      mockFindMany.mockResolvedValue([mockProgressEntry]);

      const caller = progressRouter.createCaller(mockCtx);
      const result = await caller.getAll({
        userId: "user-1",
      });

      expect(result).toHaveLength(1);
    });
  });
});
