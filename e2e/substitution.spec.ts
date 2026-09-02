import { test, expect, type Page } from "@playwright/test";

async function ensureProgram(page: Page) {
  await page.goto("/dashboard");

  const generateButton = page.locator('button:has-text("Generate Program")');
  if (await generateButton.isVisible().catch(() => false)) {
    await generateButton.click();
    await expect(generateButton).toBeHidden({ timeout: 10000 });
  }
}

async function startWorkout(page: Page) {
  await page.click('a:has-text("Workouts")');
  await expect(page).toHaveURL(/\/dashboard\/workouts/);

  const dayCard = page.locator('button:has-text("Day")').first();
  await expect(dayCard).toBeVisible();
  await dayCard.click();

  await expect(page.getByText("Back to Workouts")).toBeVisible();
}

test.describe("Exercise Substitution", () => {
  test.describe.configure({ mode: "serial" });

  test("cancelling the sheet does not mutate the workout", async ({ page }) => {
    await ensureProgram(page);
    await startWorkout(page);

    const exerciseHeader = page.locator("section h3").first();
    const originalName = await exerciseHeader.textContent();
    expect(originalName).not.toBeNull();

    await page.locator('button:has-text("Cambiar")').first().click();

    await expect(
      page.getByRole("dialog", { name: "Cambiar ejercicio" }),
    ).toBeVisible();

    await page.getByLabel("Close substitution sheet").click();

    await expect(
      page.getByRole("dialog", { name: "Cambiar ejercicio" }),
    ).toBeHidden();

    await expect(page.locator("section h3").first()).toHaveText(originalName!);
  });

  test("applying a substitution changes the exercise and keeps sets intact", async ({
    page,
  }) => {
    await ensureProgram(page);
    await startWorkout(page);

    const exerciseHeader = page.locator("section h3").first();
    const originalName = await exerciseHeader.textContent();
    expect(originalName).not.toBeNull();

    const completedBadge = page
      .locator('span[aria-label*="sets completed"]')
      .first();
    const originalBadge = await completedBadge.textContent();

    await page.locator('button:has-text("Cambiar")').first().click();

    await expect(
      page.getByRole("dialog", { name: "Cambiar ejercicio" }),
    ).toBeVisible();

    const firstSuggestion = page
      .locator('[role="listitem"]')
      .first()
      .locator("p")
      .first();
    await expect(firstSuggestion).toBeVisible();
    const newName = await firstSuggestion.textContent();
    expect(newName).not.toBeNull();
    expect(newName).not.toBe(originalName);

    await firstSuggestion.click();

    await expect(
      page.getByRole("dialog", { name: "Cambiar ejercicio" }),
    ).toBeHidden();

    await expect(page.locator("section h3").first()).toHaveText(newName!);
    await expect(completedBadge).toHaveText(originalBadge!);
  });

  test("shows no-alternatives state when suggestions are empty", async ({
    page,
  }) => {
    await page.route("/api/trpc", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fallback();
        return;
      }

      const body = await request.postDataJSON().catch(() => null);
      if (!Array.isArray(body)) {
        await route.fallback();
        return;
      }

      const isSuggestionBatch = body.every(
        (item: unknown) =>
          typeof item === "object" &&
          item !== null &&
          "method" in item &&
          item.method === "session.getSuggestions",
      );

      if (!isSuggestionBatch) {
        await route.fallback();
        return;
      }

      const responses = body.map((item: { id: unknown }) => ({
        jsonrpc: "2.0",
        id: item.id,
        result: {
          data: {
            json: {
              suggestions: [],
            },
          },
        },
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(responses),
      });
    });

    await ensureProgram(page);
    await startWorkout(page);

    const exerciseHeader = page.locator("section h3").first();
    const originalName = await exerciseHeader.textContent();
    expect(originalName).not.toBeNull();

    await page.locator('button:has-text("Cambiar")').first().click();

    await expect(
      page.getByRole("dialog", { name: "Cambiar ejercicio" }),
    ).toBeVisible();

    await expect(
      page.getByText("No hay alternativas disponibles"),
    ).toBeVisible();

    await page.getByLabel("Close substitution sheet").click();

    await expect(
      page.getByRole("dialog", { name: "Cambiar ejercicio" }),
    ).toBeHidden();

    await expect(page.locator("section h3").first()).toHaveText(originalName!);
  });
});
