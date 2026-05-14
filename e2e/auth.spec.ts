import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should show sign in page", async ({ page }) => {
    await page.goto("/signin");
    await expect(page).toHaveTitle(/Sign In/);
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("should show error on invalid login", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/Email/i).fill("nonexistent@example.com");
    await page.getByLabel(/Password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // The actual error message depends on Auth.js configuration
    await expect(page.getByText(/Invalid credentials/i).or(page.getByText(/Error/i))).toBeVisible();
  });
});
