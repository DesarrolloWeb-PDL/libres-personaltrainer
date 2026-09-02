import { describe, it, expect, vi } from "vitest";
import { coachRouter } from "./coach";

const caller = coachRouter.createCaller({ session: null });

describe("coachRouter", () => {
  it("returns enabled=true when OPENAI_API_KEY is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");

    const result = await caller.getAvailability();

    expect(result.enabled).toBe(true);
  });

  it("returns enabled=false when OPENAI_API_KEY is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    const result = await caller.getAvailability();

    expect(result.enabled).toBe(false);
  });
});
