import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CoachWidget } from "./coach-widget";

const mockUseQuery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/trpc-client", () => ({
  api: {
    coach: {
      getAvailability: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn().mockReturnValue({
    messages: [],
    status: "ready",
    error: undefined,
    sendMessage: vi.fn(),
    stop: vi.fn(),
    regenerate: vi.fn(),
    setMessages: vi.fn(),
    id: "chat-1",
  }),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: vi.fn(function () {
    return { sendMessages: vi.fn() };
  }),
}));

describe("CoachWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render the FAB while availability is loading", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    render(<CoachWidget />);

    expect(
      screen.queryByRole("button", { name: /open coach/i }),
    ).toBeNull();
  });

  it("hides the FAB when the coach is not available", () => {
    mockUseQuery.mockReturnValue({ data: { enabled: false }, isLoading: false });

    render(<CoachWidget />);

    expect(
      screen.queryByRole("button", { name: /open coach/i }),
    ).toBeNull();
  });

  it("shows the FAB when the coach is available", () => {
    mockUseQuery.mockReturnValue({ data: { enabled: true }, isLoading: false });

    render(<CoachWidget />);

    expect(
      screen.getByRole("button", { name: /open coach/i }),
    ).toBeInTheDocument();
  });

  it("opens the drawer when the FAB is clicked", async () => {
    mockUseQuery.mockReturnValue({ data: { enabled: true }, isLoading: false });

    render(<CoachWidget />);

    fireEvent.click(screen.getByRole("button", { name: /open coach/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /coach/i })).toBeInTheDocument();
    });
  });
});
