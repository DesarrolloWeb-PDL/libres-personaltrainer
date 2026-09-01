// @vitest-environment node

import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { POST } from "./route";
import { auth } from "@/lib/auth";
import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

type MockAuth = MockedFunction<() => Promise<{ user: { id: string } } | null>>;

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/ai/context-builder", () => ({
  gatherCoachContextData: vi.fn().mockResolvedValue({
    profile: null,
    program: null,
    currentWeekVolume: [],
    lastDeloadWeek: null,
    recentSessions: [],
  }),
  buildCoachSystemPrompt: vi.fn().mockReturnValue("system prompt"),
}));

vi.mock("ai", async () => {
  const actual = (await vi.importActual("ai")) as Record<string, unknown>;
  return {
    ...actual,
    streamText: vi.fn(),
    convertToModelMessages: vi.fn((messages) => messages),
  };
});

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(),
}));

const mockedAuth = auth as unknown as MockAuth;
const mockedStreamText = vi.mocked(streamText);
const mockedConvertToModelMessages = vi.mocked(convertToModelMessages);
const mockedOpenai = vi.mocked(openai);

function createChatRequest(messages: { role: "user" | "assistant"; content: string }[]) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
    mockedOpenai.mockReturnValue({ provider: "openai-mock" } as unknown as ReturnType<typeof openai>);
    mockedStreamText.mockReturnValue({
      toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response("stream")),
    } as unknown as ReturnType<typeof streamText>);
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await POST(createChatRequest([{ role: "user", content: "hola" }]));

    expect(response.status).toBe(401);
    expect(mockedStreamText).not.toHaveBeenCalled();
  });

  it("returns a Spanish fallback stream when OPENAI_API_KEY is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });
    process.env.OPENAI_API_KEY = "";

    const response = await POST(createChatRequest([{ role: "user", content: "hola" }]));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("El coach no está disponible");
    expect(mockedStreamText).not.toHaveBeenCalled();
  });

  it("caps history to the last 20 messages", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });

    const messages = Array.from({ length: 25 }, (_, i) => ({
      role: "user" as const,
      content: `message ${i}`,
    }));

    await POST(createChatRequest(messages));

    expect(mockedConvertToModelMessages).toHaveBeenCalledWith(
      messages.slice(-20),
    );
    expect(mockedStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: messages.slice(-20),
      }),
    );
  });

  it("streams via streamText when configured", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(createChatRequest([{ role: "user", content: "hola" }]));

    expect(mockedStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        system: "system prompt",
        maxOutputTokens: 500,
      }),
    );
    expect(response.status).toBe(200);
  });
});
