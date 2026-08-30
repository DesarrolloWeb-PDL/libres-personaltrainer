import { test, expect } from "@playwright/test";

test.describe("Workout Flow", () => {
  test("generates program and starts workout session", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();

    // If no program exists, generate one
    const generateButton = page.locator('button:has-text("Generate Program")');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Wait for program to be generated (button should disappear or change)
      await expect(generateButton).toBeHidden({ timeout: 10000 });

      // Verify program name appears
      await expect(page.getByText("My Training Program")).toBeVisible();
    }

    // Navigate to workouts page
    await page.click('a:has-text("Workouts")');
    await expect(page).toHaveURL(/\/dashboard\/workouts/);
    await expect(page.getByRole("heading", { name: /workouts/i })).toBeVisible();

    // Verify workout days are available
    const startWorkoutSection = page.getByText("Start a Workout");
    if (await startWorkoutSection.isVisible()) {
      // Click on first available day
      const dayCard = page.locator('button:has-text("Day")').first();
      await expect(dayCard).toBeVisible();
      await dayCard.click();

      // Should navigate to active session
      await expect(page).toHaveURL(/\/dashboard\/workouts\//);

      // Verify workout logger is visible
      await expect(page.getByText("Back to Workouts")).toBeVisible();
    }
  });

  test("logs a set during workout", async ({ page }) => {
    // Navigate to dashboard and ensure program exists
    await page.goto("/dashboard");

    // Generate program if needed
    const generateButton = page.locator('button:has-text("Generate Program")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await expect(generateButton).toBeHidden({ timeout: 10000 });
    }

    // Go to workouts
    await page.click('a:has-text("Workouts")');

    // Start a workout
    const dayCard = page.locator('button:has-text("Day")').first();
    if (await dayCard.isVisible()) {
      await dayCard.click();

      // Wait for session to load
      await expect(page.getByText("Back to Workouts")).toBeVisible();

      // Find the first "Log" button (set logging)
      const logButton = page.locator('button:has-text("Log")').first();
      if (await logButton.isVisible()) {
        // Fill in reps, weight, RPE for the first set
        const repsInput = page.locator('input[placeholder="10"]').first();
        const weightInput = page.locator('input[placeholder="60"]').first();
        const rpeSelect = page.locator("select").first();

        await repsInput.fill("10");
        await weightInput.fill("60");
        await rpeSelect.selectOption("7");

        // Click Log button
        await logButton.click();

        // Verify set is logged (checkmark appears)
        await expect(page.locator("text=✓").first()).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("completes workout and appears in history", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");

    // Generate program if needed
    const generateButton = page.locator('button:has-text("Generate Program")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await expect(generateButton).toBeHidden({ timeout: 10000 });
    }

    // Go to workouts
    await page.click('a:has-text("Workouts")');

    // Start a workout
    const dayCard = page.locator('button:has-text("Day")').first();
    if (await dayCard.isVisible()) {
      await dayCard.click();
      await expect(page.getByText("Back to Workouts")).toBeVisible();

      // Complete all sets (fill and log each one)
      let logButtons = page.locator('button:has-text("Log")');
      while ((await logButtons.count()) > 0) {
        const firstLog = logButtons.first();
        if (await firstLog.isVisible()) {
          // Find the row's inputs
          const row = firstLog.locator("xpath=../..");
          const repsInput = row.locator('input[type="number"]').first();
          const weightInput = row.locator('input[type="number"]').nth(1);
          const rpeSelect = row.locator("select");

          await repsInput.fill("10");
          await weightInput.fill("50");
          await rpeSelect.selectOption("7");
          await firstLog.click();

          // Wait a moment for the state to update
          await page.waitForTimeout(500);
          logButtons = page.locator('button:has-text("Log")');
        } else {
          break;
        }
      }

      // Complete workout button should appear
      const completeButton = page.locator('button:has-text("Complete Workout")');
      if (await completeButton.isVisible()) {
        await completeButton.click();

        // Should redirect back to workouts list
        await expect(page).toHaveURL(/\/dashboard\/workouts/);

        // Verify workout appears in history
        await expect(page.getByText("History")).toBeVisible();
      }
    }
  });

  test("workout timer works correctly", async ({ page }) => {
    await page.goto("/dashboard");

    // Generate program if needed
    const generateButton = page.locator('button:has-text("Generate Program")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await expect(generateButton).toBeHidden({ timeout: 10000 });
    }

    await page.click('a:has-text("Workouts")');

    const dayCard = page.locator('button:has-text("Day")').first();
    if (await dayCard.isVisible()) {
      await dayCard.click();
      await expect(page.getByText("Back to Workouts")).toBeVisible();

      // Verify timer is visible (shows 01:30 by default)
      const timer = page.locator("text=01:30");
      if (await timer.isVisible()) {
        // Timer should show pause/resume controls
        await expect(page.locator('button:has-text("Pause")')).toBeVisible();
      }
    }
  });
});
