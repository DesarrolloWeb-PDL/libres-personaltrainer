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
  mockExerciseFindMany,
  mockExerciseFindUnique,
  mockProfileFindUnique,
  mockWorkoutExerciseUpdate,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockExerciseFindMany: vi.fn(),
  mockExerciseFindUnique: vi.fn(),
  mockProfileFindUnique: vi.fn(),
  mockWorkoutExerciseUpdate: vi.fn(),
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
    exercise: {
      findMany: mockExerciseFindMany,
      findUnique: mockExerciseFindUnique,
    },
    profile: {
      findUnique: mockProfileFindUnique,
    },
    workoutExercise: {
      update: mockWorkoutExerciseUpdate,
    },
  },
}));

import { sessionRouter } from "./session";

const mockCtx = { session: null };

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

  describe("getSuggestions", () => {
    const chestExercises = [
      {
        id: "ex-1",
        name: "Bench Press",
        nameEs: "Press de banca",
        muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
        equipment: { id: "eq-1", name: "Barbell", nameEs: "Barra" },
      },
      {
        id: "ex-2",
        name: "Dumbbell Bench Press",
        nameEs: "Press con mancuernas",
        muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
        equipment: { id: "eq-2", name: "Dumbbell", nameEs: "Mancuerna" },
      },
      {
        id: "ex-3",
        name: "Push-up",
        nameEs: "Flexión",
        muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
        equipment: { id: "eq-3", name: "Bodyweight", nameEs: "Peso corporal" },
      },
      {
        id: "ex-4",
        name: "Cable Fly",
        nameEs: "Aperturas en polea",
        muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
        equipment: { id: "eq-4", name: "Cable", nameEs: "Polea" },
      },
    ];

    beforeEach(() => {
      mockExerciseFindMany.mockResolvedValue(chestExercises);
    });

    it("returns up to 3 suggestions for the current exercise", async () => {
      mockExerciseFindUnique.mockResolvedValue(chestExercises[0]);
      mockProfileFindUnique.mockResolvedValue({
        userId: "user-1",
        equipment: "full_gym",
        injuries: null,
      });

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.getSuggestions({ userId: "user-1", exerciseId: "ex-1" });

      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions[0].id).toBe("ex-2");
      expect(result.suggestions.every((s) => s.muscleGroupName === "Chest")).toBe(true);
    });

    it("filters out injury-restricted alternatives", async () => {
      mockExerciseFindUnique.mockResolvedValue(chestExercises[0]);
      mockProfileFindUnique.mockResolvedValue({
        userId: "user-1",
        equipment: "full_gym",
        injuries: "shoulder",
      });

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.getSuggestions({ userId: "user-1", exerciseId: "ex-1" });

      expect(result.suggestions.every((s) => s.muscleGroupName === "Chest")).toBe(true);
    });

    it("throws NOT_FOUND when the exercise does not exist", async () => {
      mockExerciseFindUnique.mockResolvedValue(null);

      const caller = sessionRouter.createCaller(mockCtx);
      await expect(
        caller.getSuggestions({ userId: "user-1", exerciseId: "missing" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("returns an empty list when no alternatives exist", async () => {
      mockExerciseFindUnique.mockResolvedValue(chestExercises[0]);
      mockProfileFindUnique.mockResolvedValue({
        userId: "user-1",
        equipment: "full_gym",
        injuries: null,
      });
      mockExerciseFindMany.mockResolvedValue([chestExercises[0]]);

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.getSuggestions({ userId: "user-1", exerciseId: "ex-1" });

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe("applySubstitution", () => {
    it("updates only the exerciseId and returns the workout exercise with sets", async () => {
      mockWorkoutExerciseUpdate.mockResolvedValue({
        id: "we-1",
        exerciseId: "ex-2",
        sets: 3,
        reps: 10,
        weight: null,
        rpe: null,
        order: 1,
        exercise: {
          id: "ex-2",
          name: "Dumbbell Bench Press",
          nameEs: "Press con mancuernas",
          muscleGroup: { id: "mg-1", name: "Chest", nameEs: "Pecho", category: "chest" },
        },
        workoutSets: [
          {
            id: "ws-1",
            workoutExerciseId: "we-1",
            setNumber: 1,
            reps: null,
            weight: null,
            rpe: null,
            completed: false,
          },
        ],
      });

      const caller = sessionRouter.createCaller(mockCtx);
      const result = await caller.applySubstitution({
        workoutExerciseId: "we-1",
        newExerciseId: "ex-2",
      });

      expect(result.exerciseId).toBe("ex-2");
      expect(result.exercise.name).toBe("Dumbbell Bench Press");
      expect(result.workoutSets).toHaveLength(1);
      expect(mockWorkoutExerciseUpdate).toHaveBeenCalledWith({
        where: { id: "we-1" },
        data: { exerciseId: "ex-2" },
        include: expect.objectContaining({
          exercise: { include: { muscleGroup: true } },
          workoutSets: { orderBy: { setNumber: "asc" } },
        }),
      });
    });
  });
});
