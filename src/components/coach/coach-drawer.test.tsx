import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { UIMessage } from "ai";
import { CoachDrawer } from "./coach-drawer";

const mockUseChat = vi.hoisted(() => vi.fn());
const mockDefaultChatTransport = vi.hoisted(() =>
  vi.fn(function () {
    return { sendMessages: vi.fn() };
  }),
);

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: mockDefaultChatTransport,
}));

function textMessage(
  id: string,
  role: "user" | "assistant",
  text: string,
): UIMessage {
  return {
    id,
    role,
    parts: [{ type: "text", text }],
  };
}

const baseHelpers = {
  messages: [] as UIMessage[],
  status: "ready" as const,
  error: undefined as Error | undefined,
  sendMessage: vi.fn(),
  stop: vi.fn(),
  regenerate: vi.fn(),
  setMessages: vi.fn(),
  id: "chat-1",
};

describe("CoachDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChat.mockReturnValue({ ...baseHelpers, messages: [] });
  });

  it("does not render when closed", () => {
    render(<CoachDrawer isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the header and empty state when open", () => {
    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: /coach/i })).toBeInTheDocument();
    expect(
      screen.getByText(/consultá gratis con tu coach/i),
    ).toBeInTheDocument();
  });

  it("renders user and assistant messages", () => {
    mockUseChat.mockReturnValue({
      ...baseHelpers,
      messages: [
        textMessage("m1", "user", "¿Cuánto volumen hice?"),
        textMessage(
          "m2",
          "assistant",
          "Hiciste 12 series de pecho esta semana.",
        ),
      ],
    });

    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    expect(
      screen.getByText("¿Cuánto volumen hice?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hiciste 12 series de pecho esta semana."),
    ).toBeInTheDocument();
  });

  it("sends a message when the form is submitted", async () => {
    const sendMessage = vi.fn();
    mockUseChat.mockReturnValue({ ...baseHelpers, sendMessage });

    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/escribí tu pregunta/i);
    fireEvent.change(input, { target: { value: "¿Qué ejercicio hacer?" } });
    fireEvent.submit(screen.getByRole("form"));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({
        text: "¿Qué ejercicio hacer?",
      });
    });
  });

  it("shows a streaming indicator and stop button while streaming", () => {
    mockUseChat.mockReturnValue({
      ...baseHelpers,
      status: "streaming",
    });

    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/coach está escribiendo/i)).toBeInTheDocument();
    const stopButton = screen.getByRole("button", { name: /detener/i });
    expect(stopButton).toBeInTheDocument();

    fireEvent.click(stopButton);
    expect(baseHelpers.stop).toHaveBeenCalledTimes(1);
  });

  it("shows a submit spinner while submitted and before streaming starts", () => {
    mockUseChat.mockReturnValue({
      ...baseHelpers,
      status: "submitted",
    });

    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/coach está escribiendo/i)).toBeInTheDocument();
  });

  it("disables the input when not ready", () => {
    mockUseChat.mockReturnValue({
      ...baseHelpers,
      status: "submitted",
    });

    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByPlaceholderText(/escribí tu pregunta/i)).toBeDisabled();
  });

  it("shows a Spanish error notice and retries on click", () => {
    const regenerate = vi.fn();
    mockUseChat.mockReturnValue({
      ...baseHelpers,
      status: "error",
      error: new Error("provider error"),
      regenerate,
    });

    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    expect(
      screen.getByText(/no se pudo contactar al coach/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(regenerate).toHaveBeenCalledTimes(1);
  });

  it("closes on the X button click", () => {
    const onClose = vi.fn();
    render(<CoachDrawer isOpen onClose={onClose} />);

    fireEvent.click(screen.getByLabelText(/close coach drawer/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click", () => {
    const onClose = vi.fn();
    render(<CoachDrawer isOpen onClose={onClose} />);

    fireEvent.click(screen.getByTestId("coach-drawer-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps partial assistant text while streaming", () => {
    mockUseChat.mockReturnValue({
      ...baseHelpers,
      status: "streaming",
      messages: [textMessage("m1", "assistant", "Respuesta parcial...")],
    });

    render(<CoachDrawer isOpen onClose={vi.fn()} />);

    expect(
      screen.getByText("Respuesta parcial..."),
    ).toBeInTheDocument();
  });
});
