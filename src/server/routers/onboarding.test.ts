import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for onboarding tRPC router.
 *
 * Mocks the PrismaProfileAdapter as a proper class so `new` works.
 */

const { mockFindByUserId, mockUpdate } = vi.hoisted(() => ({
  mockFindByUserId: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/infrastructure/prisma/adapters/user-profile", () => {
  class MockPrismaProfileAdapter {
    findByUserId = mockFindByUserId;
    update = mockUpdate;
    create = vi.fn();
  }

  return {
    PrismaProfileAdapter: MockPrismaProfileAdapter,
  };
});

import { onboardingRouter } from "./onboarding";

const mockProfile = {
  id: "profile-1",
  userId: "user-1",
  age: 28,
  experienceLevel: "intermediate",
  goals: "muscle_gain,strength",
  equipment: "full_gym",
  injuries: null,
};

describe("onboardingRouter", () => {
  let caller: ReturnType<typeof onboardingRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    caller = onboardingRouter.createCaller({});
  });

  describe("getProfile", () => {
    it("returns profile by userId", async () => {
      mockFindByUserId.mockResolvedValue(mockProfile);

      const result = await caller.getProfile({ userId: "user-1" });

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-1");
      expect(result?.age).toBe(28);
    });

    it("returns null for nonexistent user", async () => {
      mockFindByUserId.mockResolvedValue(null);

      const result = await caller.getProfile({ userId: "nonexistent" });

      expect(result).toBeNull();
    });
  });

  describe("submitWizard", () => {
    it("submits wizard data and creates profile", async () => {
      mockUpdate.mockResolvedValue(mockProfile);

      const result = await caller.submitWizard({
        userId: "user-1",
        age: 28,
        experienceLevel: "intermediate",
        goals: ["muscle_gain", "strength"],
        equipment: "full_gym",
      });

      expect(result).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith("user-1", {
        age: 28,
        experienceLevel: "intermediate",
        goals: "muscle_gain,strength",
        equipment: "full_gym",
      });
    });

    it("handles optional fields", async () => {
      mockUpdate.mockResolvedValue(mockProfile);

      await caller.submitWizard({
        userId: "user-1",
        injuries: "Lower back pain",
      });

      expect(mockUpdate).toHaveBeenCalledWith("user-1", {
        injuries: "Lower back pain",
        goals: null,
      });
    });
  });

  describe("updateProfile", () => {
    it("updates profile fields", async () => {
      mockUpdate.mockResolvedValue(mockProfile);

      const result = await caller.updateProfile({
        userId: "user-1",
        age: 30,
      });

      expect(result).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith("user-1", {
        age: 30,
      });
    });
  });
});
