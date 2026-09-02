import { test, expect, type Page } from "@playwright/test";

/**
 * Coach chat E2E spec.
 *
 * Requires OPENAI_API_KEY to be set in the test environment so the coach
 * availability query returns enabled=true and the FAB is rendered.
 * The actual /api/chat endpoint is mocked via page.route so no live LLM
 * calls are made during tests.
 */

function sseBody(parts: Array<Record<string, unknown>>): string {
  const lines = parts.map((part) => `data: ${JSON.stringify(part)}`);
  lines.push("data: [DONE]");
  lines.push("");
  return lines.join("\n\n");
}

async function mockChatStream(
  page: Page,
  deltas: string[],
  errorText?: string,
) {
  await page.route("/api/chat", async (route) => {
    const parts: Array<Record<string, unknown>> = [
      { type: "text-start", id: "msg-1" },
      ...deltas.map((delta) => ({
        type: "text-delta",
        id: "msg-1",
        delta,
      })),
      { type: "text-end", id: "msg-1" },
    ];

    if (errorText) {
      parts.push({ type: "error", errorText });
    }

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        "cache-control": "no-cache",
        connection: "keep-alive",
        "x-vercel-ai-ui-message-stream": "v1",
      },
      body: sseBody(parts),
    });
  });
}

async function openCoach(page: Page) {
  await page.goto("/dashboard");
  const fab = page.getByRole("button", { name: /open coach/i });
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(page.getByRole("dialog", { name: /coach/i })).toBeVisible();
}

test.describe("Coach Chat", () => {
  test.describe.configure({ mode: "serial" });

  test("streams a Spanish response token by token", async ({ page }) => {
    await mockChatStream(page, ["Hola", ", ", "¿en qué puedo ayudarte?"]);

    await openCoach(page);

    await page
      .getByPlaceholder(/escribí tu pregunta/i)
      .fill("¿Cuánto volumen de pecho hice esta semana?");
    await page.getByRole("button", { name: /enviar mensaje/i }).click();

    await expect(
      page.getByText("Hola, ¿en qué puedo ayudarte?"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows Spanish fallback and retry on provider error", async ({
    page,
  }) => {
    await mockChatStream(
      page,
      [
        "El coach no está disponible en este momento. Volvé a intentar más tarde.",
      ],
      "Provider error",
    );

    await openCoach(page);

    await page.getByPlaceholder(/escribí tu pregunta/i).fill("Hola");
    await page.getByRole("button", { name: /enviar mensaje/i }).click();

    await expect(
      page.getByText(/no se pudo contactar al coach/i),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: /reintentar/i }),
    ).toBeVisible();
  });

  test("reload clears the conversation", async ({ page }) => {
    await mockChatStream(page, ["Respuesta de prueba"]);

    await openCoach(page);

    await page.getByPlaceholder(/escribí tu pregunta/i).fill("Pregunta");
    await page.getByRole("button", { name: /enviar mensaje/i }).click();

    await expect(page.getByText("Respuesta de prueba")).toBeVisible({
      timeout: 5000,
    });

    await page.reload();

    await page.getByRole("button", { name: /open coach/i }).click();
    await expect(page.getByRole("dialog", { name: /coach/i })).toBeVisible();
    await expect(
      page.getByText(/consultá gratis con tu coach/i),
    ).toBeVisible();
  });
});
