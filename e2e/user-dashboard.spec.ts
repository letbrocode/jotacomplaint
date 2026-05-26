import { test, expect, type Browser } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users";

async function loginAs(
  browser: Browser,
  user: { email: string; password: string },
  expectedPath: RegExp,
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/signin");
  await page.getByLabel(/Email/i).fill(user.email);
  await page.getByLabel(/Password/i).fill(user.password);
  await page.getByRole("button", { name: /Sign In/i }).click();
  await expect(page).toHaveURL(expectedPath, { timeout: 20000 });
  return { context, page };
}

test.describe("User Dashboard", () => {
  test.setTimeout(60000);

  test("shows stats and recent complaints after login", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.citizen, /\/dashboard/);

    // Stats present
    await expect(page.getByText(/Total Complaints/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Pending/i).first()).toBeVisible();
    await expect(page.getByText(/Resolved/i).first()).toBeVisible();

    // Welcome message
    await expect(page.getByText(/Welcome back/i)).toBeVisible();

    await context.close();
  });

  test("can navigate to complaint registration form", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.citizen, /\/dashboard/);

    const newComplaintBtn = page.getByRole("link", { name: /New Complaint|Submit/i })
      .or(page.getByRole("button", { name: /New Complaint/i }))
      .first();

    await expect(newComplaintBtn).toBeVisible({ timeout: 5000 });
    await newComplaintBtn.click();

    await expect(page).toHaveURL(/\/(dashboard\/register|register|new-complaint)/, { timeout: 10000 });

    await context.close();
  });

  test("complaint registration form has required fields", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.citizen, /\/dashboard/);

    await page.goto("/dashboard/register");

    await expect(page.getByLabel(/Title/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/Description|Details/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit/i })).toBeVisible();

    await context.close();
  });

  test("validation prevents submitting empty complaint form", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.citizen, /\/dashboard/);

    await page.goto("/dashboard/register");
    await page.getByRole("button", { name: /Submit Complaint/i }).click();

    // Should still be on the form page — not navigated away
    await expect(page).toHaveURL(/register/, { timeout: 5000 });

    await context.close();
  });

  test("can view complaints list page", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.citizen, /\/dashboard/);

    await page.goto("/dashboard/complaints");
    await expect(page).toHaveURL(/\/dashboard\/complaints/);

    // Either shows complaints or an empty-state
    const hasComplaints = await page.locator('[data-testid="complaint-item"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText(/No complaints/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasComplaints || hasEmpty).toBe(true);

    await context.close();
  });

  test("notifications page loads for user", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.citizen, /\/dashboard/);

    await page.goto("/dashboard/notifications");
    await expect(page).toHaveURL(/\/dashboard\/notifications/);

    // Either a list of notifications or an empty state
    const hasContent = await page.getByRole("heading").first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBe(true);

    await context.close();
  });
});
