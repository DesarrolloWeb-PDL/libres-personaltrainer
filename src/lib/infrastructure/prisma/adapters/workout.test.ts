import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for PrismaWorkoutAdapter.
 */

const {
  mockCreate,
  mockCreateMany,
  mockFindUnique,
  mockFindFirst,
  mockFindMany,
  mockUpdate,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockCreateMany: vi.fn(),
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
      createMany: mockCreateMany,
      update: mockUpdate,
    },
  },
}));

import { PrismaWorkoutAdapter } from "./workout";

const mockSession = {
  id: "sess-1",
  userId: "user-1",
  programId: "prog-1",
  dayId: "day-1",
  startedAt: new Date("2026-01-01T10:00:00"),
  completedAt: null,
};

const mockDay = {
  id: "day-1",
  programId: "prog-1",
  dayNumber: 1,
  name: "Push",
  exercises: [
    {
      id: "we-1",
      dayId: "day-1",
      exerciseId: "ex-1",
      sets: 3,
      reps: 10,
      weight: null,
      rpe: null,
      order: 1,
    },
  ],
};

const mockSessionWithExercises = {
  ...mockSession,
  day: {
    ...mockDay,
    exercises: [
      {
        ...mockDay.exercises[0],
        exercise: {
          id: "ex-1",
          name: "Bench Press",
          nameEs: "Press",
          muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
        },
        workoutSets: [
          { id: "ws-1", workoutExerciseId: "we-1", setNumber: 1, reps: null, weight: null, rpe: null, completed: false },
          { id: "ws-2", workoutExerciseId: "we-1", setNumber: 2, reps: null, weight: null, rpe: null, completed: false },
          { id: "ws-3", workoutExerciseId: "we-1", setNumber: 3, reps: null, weight: null, rpe: null, completed: false },
        ],
      },
    ],
  },
};

describe("PrismaWorkoutAdapter", () => {
  let adapter: PrismaWorkoutAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PrismaWorkoutAdapter();
  });

  describe("startSession", () => {
    it("creates a session and pre-creates sets for each exercise", async () => {
      mockFindUnique.mockResolvedValue(mockDay);
      mockCreate.mockResolvedValue(mockSession);
      mockCreateMany.mockResolvedValue({ count: 3 });

      const result = await adapter.startSession({
        userId: "user-1",
        programId: "prog-1",
        dayId: "day-1",
      });

      expect(result.id).toBe("sess-1");
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          programId: "prog-1",
          dayId: "day-1",
        }),
      });
      expect(mockCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            workoutExerciseId: "we-1",
            setNumber: 1,
            completed: false,
          }),
          expect.objectContaining({
            workoutExerciseId: "we-1",
            setNumber: 2,
            completed: false,
          }),
          expect.objectContaining({
            workoutExerciseId: "we-1",
            setNumber: 3,
            completed: false,
          }),
        ]),
      });
    });

    it("throws when day not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        adapter.startSession({
          userId: "user-1",
          programId: "prog-1",
          dayId: "nonexistent",
        }),
      ).rejects.toThrow("WorkoutDay nonexistent not found");
    });
  });

  describe("findSessionById", () => {
    it("returns session with exercises and sets", async () => {
      mockFindUnique.mockResolvedValue(mockSessionWithExercises);

      const result = await adapter.findSessionById("sess-1");

      expect(result).not.toBeNull();
      expect(result?.day?.exercises).toHaveLength(1);
      expect(result?.day?.exercises[0].workoutSets).toHaveLength(3);
    });

    it("returns null when not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await adapter.findSessionById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("logSet", () => {
    it("updates set with reps, weight, RPE and marks completed", async () => {
      mockUpdate.mockResolvedValue({
        id: "ws-1",
        reps: 10,
        weight: 80,
        rpe: 7,
        completed: true,
      });

      const result = await adapter.logSet({
        setId: "ws-1",
        reps: 10,
        weight: 80,
        rpe: 7,
      });

      expect(result.reps).toBe(10);
      expect(result.weight).toBe(80);
      expect(result.rpe).toBe(7);
      expect(result.completed).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "ws-1" },
        data: {
          reps: 10,
          weight: 80,
          rpe: 7,
          completed: true,
        },
      });
    });
  });

  describe("completeSession", () => {
    it("sets completedAt to current date", async () => {
      mockUpdate.mockResolvedValue({
        ...mockSession,
        completedAt: new Date(),
      });

      const result = await adapter.completeSession("sess-1");

      expect(result.completedAt).not.toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "sess-1" },
        data: { completedAt: expect.any(Date) },
      });
    });
  });

  describe("findSessionsByUserId", () => {
    it("returns sessions ordered by most recent", async () => {
      mockFindMany.mockResolvedValue([mockSession]);

      const result = await adapter.findSessionsByUserId("user-1");

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { startedAt: "desc" },
      });
    });
  });

  describe("findActiveSession", () => {
    it("returns the incomplete session", async () => {
      mockFindFirst.mockResolvedValue(mockSessionWithExercises);

      const result = await adapter.findActiveSession("user-1");

      expect(result).not.toBeNull();
      expect(result?.completedAt).toBeNull();
    });

    it("returns null when no active session", async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await adapter.findActiveSession("user-1");

      expect(result).toBeNull();
    });
  });
});
