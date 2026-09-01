import { test, expect } from "@playwright/test";

test.describe("Progress View", () => {
  test("renders progress page with charts", async ({ page }) => {
    await page.goto("/dashboard/progress");

    // Verify page loads
    await expect(page.getByRole("heading", { name: /progress/i })).toBeVisible();
    await expect(page.getByText(/track your body weight/i)).toBeVisible();

    // Verify overview cards are present
    await expect(page.getByText("Current Weight")).toBeVisible();
    await expect(page.getByText("Estimated 1RM")).toBeVisible();
    await expect(page.getByText("Total Volume")).toBeVisible();

    // Verify charts section is present
    await expect(page.getByText("Body Weight Trend")).toBeVisible();
    await expect(page.getByText("Volume Load by Muscle Group")).toBeVisible();

    // Verify date range selector
    await expect(page.getByText("Range:")).toBeVisible();
    await expect(page.locator('button:has-text("3M")')).toBeVisible();
    await expect(page.locator('button:has-text("6M")')).toBeVisible();
    await expect(page.locator('button:has-text("1Y")')).toBeVisible();
    await expect(page.locator('button:has-text("All")')).toBeVisible();
  });

  test("adds body weight entry", async ({ page }) => {
    await page.goto("/dashboard/progress");

    // Verify body weight form is present
    await expect(page.getByText("Log Body Weight")).toBeVisible();

    // Fill in weight
    const weightInput = page.locator('input[id="body-weight"]');
    await weightInput.fill("75.5");

    // Add optional notes
    const notesInput = page.locator('input[id="body-notes"]');
    await notesInput.fill("Morning, fasted");

    // Submit form
    await page.click('button:has-text("Log")');

    // Form should clear after submission
    await expect(weightInput).toHaveValue("");
    await expect(notesInput).toHaveValue("");
  });

  test("validates body weight input", async ({ page }) => {
    await page.goto("/dashboard/progress");

    // Try to submit without weight
    await page.click('button:has-text("Log")');

    // Should show validation error
    await expect(page.getByText("Please enter a valid weight greater than 0")).toBeVisible();
  });

  test("date range selector filters data", async ({ page }) => {
    await page.goto("/dashboard/progress");

    // Click different date ranges
    await page.click('button:has-text("3M")');
    await expect(page.locator('button:has-text("3M")')).toHaveClass(/bg-blue-600/);

    await page.click('button:has-text("6M")');
    await expect(page.locator('button:has-text("6M")')).toHaveClass(/bg-blue-600/);

    await page.click('button:has-text("All")');
    await expect(page.locator('button:has-text("All")')).toHaveClass(/bg-blue-600/);
  });

  test("export CSV button is present", async ({ page }) => {
    await page.goto("/dashboard/progress");

    // Verify export section
    await expect(page.getByText("Export Data")).toBeVisible();
    await expect(page.getByText(/download your progress data as csv/i)).toBeVisible();
    await expect(page.locator('button:has-text("Download CSV")')).toBeVisible();
  });

  test("navigates to progress from dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    // Click Progress nav link
    await page.click('a:has-text("Progress")');
    await expect(page).toHaveURL(/\/dashboard\/progress/);
    await expect(page.getByRole("heading", { name: /progress/i })).toBeVisible();
  });

  test("volume landmarks page is accessible", async ({ page }) => {
    await page.goto("/dashboard/volume");

    // Verify volume page loads
    await expect(page.getByRole("heading", { name: /volume/i })).toBeVisible();
  });
});
