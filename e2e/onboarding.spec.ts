import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any persisted wizard state
    await page.goto("/onboarding");
    await page.evaluate(() => {
      localStorage.removeItem("onboarding-wizard-data");
      localStorage.removeItem("onboarding-wizard-step");
    });
    await page.reload();
  });

  test("completes all 5 steps and redirects to dashboard", async ({ page }) => {
    await page.goto("/onboarding");

    // Verify onboarding page loads
    await expect(page.getByRole("heading", { name: /welcome to libres/i })).toBeVisible();
    await expect(page.getByText(/let.*set up your profile/i)).toBeVisible();

    // Step 1: Profile (age required, name optional)
    await expect(page.getByText("Basic Information")).toBeVisible();
    await page.fill('input[id="age"]', "28");
    await page.fill('input[id="name"]', "Test User");
    await page.click('button:has-text("Next")');

    // Step 2: Experience Level
    await expect(page.getByText("Experience")).toBeVisible();
    await page.click('button:has-text("Intermediate")');
    await page.click('button:has-text("Next")');

    // Step 3: Goals
    await expect(page.getByText("Goals")).toBeVisible();
    await page.click('button:has-text("Muscle Gain")');
    await page.click('button:has-text("Next")');

    // Step 4: Equipment
    await expect(page.getByText("Equipment")).toBeVisible();
    await page.click('button:has-text("Full Gym")');
    await page.click('button:has-text("Next")');

    // Step 5: Medical/Limitations (optional, can proceed without filling)
    await expect(page.getByText("Medical")).toBeVisible();
    await page.click('button:has-text("Complete Setup")');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("validates age is required on step 1", async ({ page }) => {
    await page.goto("/onboarding");

    // Try to proceed without age
    const nextButton = page.locator('button:has-text("Next")').first();
    await expect(nextButton).toBeDisabled();

    // Fill age
    await page.fill('input[id="age"]', "25");
    await expect(nextButton).toBeEnabled();
  });

  test("validates age range (10-100)", async ({ page }) => {
    await page.goto("/onboarding");

    await page.fill('input[id="age"]', "5");
    await page.click('input[id="age"]');
    await expect(page.getByText("Age must be between 10 and 100")).toBeVisible();

    await page.fill('input[id="age"]', "101");
    await page.click('input[id="age"]');
    await expect(page.getByText("Age must be between 10 and 100")).toBeVisible();
  });

  test("can navigate back between steps", async ({ page }) => {
    await page.goto("/onboarding");

    // Complete step 1
    await page.fill('input[id="age"]', "30");
    await page.click('button:has-text("Next")');

    // Step 2 visible
    await expect(page.getByText("Experience")).toBeVisible();

    // Go back
    await page.click('button:has-text("Back")');
    await expect(page.getByText("Basic Information")).toBeVisible();
  });

  test("persists wizard state in localStorage", async ({ page }) => {
    await page.goto("/onboarding");

    // Fill step 1
    await page.fill('input[id="age"]', "22");
    await page.fill('input[id="name"]', "Persist Test");
    await page.click('button:has-text("Next")');

    // Reload page
    await page.reload();

    // Verify state is restored (should be on step 2)
    await expect(page.getByText("Experience")).toBeVisible();
  });

  test("progress indicator shows correct steps", async ({ page }) => {
    await page.goto("/onboarding");

    // Step 1 should be active
    const step1Circle = page.locator("text=Profile").first();
    await expect(step1Circle).toBeVisible();

    // Complete step 1
    await page.fill('input[id="age"]', "28");
    await page.click('button:has-text("Next")');

    // Step 2 should be active, step 1 completed
    await expect(page.getByText("Experience")).toBeVisible();
  });
});
