import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for PrismaUserAdapter.
 *
 * Uses vi.hoisted() so mock functions survive vi.mock hoisting.
 */

const { mockFindUnique, mockCreate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/infrastructure/prisma/client", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

import { PrismaUserAdapter } from "./user";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("PrismaUserAdapter", () => {
  let adapter: PrismaUserAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PrismaUserAdapter();
  });

  describe("findById", () => {
    it("returns user when found", async () => {
      mockFindUnique.mockResolvedValue(mockUser);

      const result = await adapter.findById("user-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-1");
      expect(result?.email).toBe("test@example.com");
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });

    it("returns null when not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await adapter.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("returns user when found", async () => {
      mockFindUnique.mockResolvedValue(mockUser);

      const result = await adapter.findByEmail("test@example.com");

      expect(result).not.toBeNull();
      expect(result?.email).toBe("test@example.com");
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("returns null when not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await adapter.findByEmail("missing@example.com");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates a new user", async () => {
      mockCreate.mockResolvedValue(mockUser);

      const result = await adapter.create({
        email: "test@example.com",
        name: "Test User",
      });

      expect(result.id).toBe("user-1");
      expect(mockCreate).toHaveBeenCalledWith({
        data: { email: "test@example.com", name: "Test User" },
      });
    });

    it("creates user without name", async () => {
      const userWithoutName = { ...mockUser, name: null };
      mockCreate.mockResolvedValue(userWithoutName);

      const result = await adapter.create({ email: "test@example.com" });

      expect(result.name).toBeNull();
    });
  });
});
