"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

interface CoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-up chat drawer powered by the AI SDK useChat hook.
 *
 * - Streams Spanish responses from /api/chat.
 * - Keeps partial text when the stream is interrupted.
 * - Shows a Spanish error notice with retry on failures.
 * - Starts with a welcome empty state.
 */
export function CoachDrawer({ isOpen, onClose }: CoachDrawerProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        credentials: "include",
      }),
    [],
  );

  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    regenerate,
  } = useChat({
    transport,
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isBusy = status === "submitted" || status === "streaming";
  const showError = status === "error" || error != null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    sendMessage({ text });
    setInput("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="presentation"
      data-testid="coach-drawer"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
        data-testid="coach-drawer-backdrop"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-title"
        className="relative flex w-full max-w-2xl flex-col rounded-t-xl border-x border-t border-zinc-800 bg-zinc-900 shadow-2xl"
        style={{ maxHeight: "85vh", height: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2
              id="coach-title"
              className="text-lg font-bold text-zinc-50"
            >
              Coach
            </h2>
            <p className="text-xs text-zinc-400">
              Consulta gratuita en español
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close coach drawer"
            className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg
              className="mx-auto h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 013.75 21.75v-3.75c0-2.9 2.35-5.25 5.25-5.25h6c2.9 0 5.25 2.35 5.25 5.25V21a5.972 5.972 0 01-1.695 3.337A9.764 9.764 0 0112 20.25c4.97 0 9-3.694 9-8.25z"
                  />
                </svg>
              </div>
              <p className="max-w-xs text-sm text-zinc-300">
                Consultá gratis con tu coach. Podés preguntar sobre tu plan o
                cómo empezar.
              </p>
            </div>
          ) : (
            messages.map((message: UIMessage) => {
              const isUser = message.role === "user";
              const text = message.parts
                .filter((part) => part.type === "text")
                .map((part) => (part as { text: string }).text)
                .join("");

              if (!text) return null;

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isUser
                        ? "rounded-br-sm bg-blue-500 text-white"
                        : "rounded-bl-sm border border-zinc-700 bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })
          )}

          {isBusy && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="h-4 w-4 animate-pulse rounded-full bg-blue-500" />
              <span>El coach está escribiendo…</span>
            </div>
          )}

          {showError && (
            <div
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4"
              role="alert"
            >
              <p className="text-sm font-medium text-rose-400">
                No se pudo contactar al coach.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Volvé a intentar en unos segundos.
              </p>
              <button
                type="button"
                onClick={() => regenerate()}
                className="mt-3 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/30"
              >
                Reintentar
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          role="form"
          className="border-t border-zinc-800 p-4"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isBusy}
              placeholder="Escribí tu pregunta…"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none disabled:opacity-60"
            />
            {isBusy ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Detener respuesta"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isBusy}
                aria-label="Enviar mensaje"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition-colors hover:bg-blue-400 disabled:opacity-50"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
