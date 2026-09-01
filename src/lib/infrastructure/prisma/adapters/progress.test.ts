import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for PrismaProgressAdapter.
 */

const { mockCreate, mockFindMany, mockFindFirst } = vi.hoisted(() => ({
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

import { PrismaProgressAdapter } from "./progress";

const mockProgressEntry = {
  id: "prog-1",
  userId: "user-1",
  date: new Date("2026-08-30T10:00:00"),
  bodyWeight: 75.5,
  estimated1RM: 100,
  notes: "Morning weigh-in",
};

describe("PrismaProgressAdapter", () => {
  let adapter: PrismaProgressAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PrismaProgressAdapter();
  });

  describe("record", () => {
    it("creates a new progress entry", async () => {
      mockCreate.mockResolvedValue(mockProgressEntry);

      const result = await adapter.record({
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

    it("sets date to now when not provided", async () => {
      mockCreate.mockResolvedValue(mockProgressEntry);

      await adapter.record({
        userId: "user-1",
        bodyWeight: 75.5,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          date: expect.any(Date),
        }),
      });
    });
  });

  describe("getWeightHistory", () => {
    it("returns weight history ordered by date ascending", async () => {
      mockFindMany.mockResolvedValue([mockProgressEntry]);

      const result = await adapter.getWeightHistory("user-1");

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: "user-1",
          bodyWeight: { not: null },
        }),
        orderBy: { date: "asc" },
      });
    });

    it("filters by date range when provided", async () => {
      mockFindMany.mockResolvedValue([]);

      const start = new Date("2026-08-01");
      const end = new Date("2026-08-31");

      await adapter.getWeightHistory("user-1", start, end);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: "user-1",
          bodyWeight: { not: null },
        }),
        orderBy: { date: "asc" },
      });
    });
  });

  describe("get1RMHistory", () => {
    it("returns 1RM history ordered by date ascending", async () => {
      mockFindMany.mockResolvedValue([mockProgressEntry]);

      const result = await adapter.get1RMHistory("user-1");

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: "user-1",
          estimated1RM: { not: null },
        }),
        orderBy: { date: "asc" },
      });
    });
  });

  describe("getLatest", () => {
    it("returns the most recent entry", async () => {
      mockFindFirst.mockResolvedValue(mockProgressEntry);

      const result = await adapter.getLatest("user-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("prog-1");
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { date: "desc" },
      });
    });

    it("returns null when no entries exist", async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await adapter.getLatest("user-1");

      expect(result).toBeNull();
    });
  });

  describe("getAllByUserId", () => {
    it("returns all entries ordered by most recent", async () => {
      mockFindMany.mockResolvedValue([mockProgressEntry]);

      const result = await adapter.getAllByUserId("user-1");

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { date: "desc" },
      });
    });
  });

  describe("exportCSV", () => {
    it("generates CSV with header and rows", async () => {
      mockFindMany.mockResolvedValue([
        mockProgressEntry,
        {
          ...mockProgressEntry,
          id: "prog-2",
          bodyWeight: 76.0,
          estimated1RM: 102,
          notes: null,
        },
      ]);

      const csv = await adapter.exportCSV("user-1");

      expect(csv).toContain("Date,Body Weight,Estimated 1RM,Notes");
      expect(csv).toContain("2026-08-30");
      expect(csv).toContain("75.5");
      expect(csv).toContain("100");
    });

    it("returns CSV with only header when no data", async () => {
      mockFindMany.mockResolvedValue([]);

      const csv = await adapter.exportCSV("user-1");

      expect(csv).toBe("Date,Body Weight,Estimated 1RM,Notes");
    });
  });
});
