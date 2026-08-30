import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for session tRPC router.
 */

const {
  mockCreate,
  mockFindUnique,
  mockFindFirst,
  mockFindMany,
  mockUpdate,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/infrastructure/prisma/client", () => ({
  prisma: {
    workoutSession: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      update: mockUpdate,
    },
    workoutDay: {
      findUnique: mockFindUnique,
    },
    workoutSet: {
      createMany: vi.fn().mockResolvedValue({ count: 3 }),
      update: mockUpdate,
    },
  },
}));

import { sessionRouter } from "./session";

const mockCtx = {};

const mockSession = {
  id: "sess-1",
  userId: "user-1",
  programId: "prog-1",
  dayId: "day-1",
  startedAt: new Date("2026-01-01T10:00:00"),
  completedAt: null,
};

describe("sessionRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("start", () => {
    it("creates a new workout session", async () => {
      mockFindUnique.mockResolvedValue({
        id: "day-1",
        exercises: [{ id: "we-1", sets: 3 }],
      });
      mockCreate.mockResolvedValue(mockSession);

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.start({
        userId: "user-1",
        programId: "prog-1",
        dayId: "day-1",
      });

      expect(result.id).toBe("sess-1");
    });
  });

  describe("getById", () => {
    it("returns session by ID", async () => {
      mockFindUnique.mockResolvedValue({
        ...mockSession,
        day: { exercises: [] },
      });

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.getById({ id: "sess-1" });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("sess-1");
    });

    it("returns null when not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.getById({ id: "nonexistent" });

      expect(result).toBeNull();
    });
  });

  describe("logSet", () => {
    it("updates a set with logged data", async () => {
      mockUpdate.mockResolvedValue({
        id: "ws-1",
        reps: 10,
        weight: 80,
        rpe: 7,
        completed: true,
      });

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.logSet({
        setId: "ws-1",
        reps: 10,
        weight: 80,
        rpe: 7,
      });

      expect(result.reps).toBe(10);
      expect(result.completed).toBe(true);
    });
  });

  describe("complete", () => {
    it("marks session as completed", async () => {
      mockUpdate.mockResolvedValue({
        ...mockSession,
        completedAt: new Date(),
      });

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.complete({ id: "sess-1", userId: "user-1" });

      expect(result.completedAt).not.toBeNull();
    });
  });

  describe("listByUser", () => {
    it("returns all sessions for a user", async () => {
      mockFindMany.mockResolvedValue([mockSession]);

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.listByUser({ userId: "user-1" });

      expect(result).toHaveLength(1);
    });
  });

  describe("getActive", () => {
    it("returns the active session", async () => {
      mockFindFirst.mockResolvedValue({
        ...mockSession,
        day: { exercises: [] },
      });

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.getActive({ userId: "user-1" });

      expect(result).not.toBeNull();
      expect(result?.completedAt).toBeNull();
    });

    it("returns null when no active session", async () => {
      mockFindFirst.mockResolvedValue(null);

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.getActive({ userId: "user-1" });

      expect(result).toBeNull();
    });
  });
});
