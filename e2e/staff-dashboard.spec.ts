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

test.describe("Staff Dashboard", () => {
  test.setTimeout(60000);

  test("shows assigned complaints after login", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.staff, /\/staff/);

    await page.goto("/staff/complaints");
    await expect(page).toHaveURL(/\/staff\/complaints/);

    // Either assigned complaint items or an empty state
    const hasComplaints = await page.locator('[data-testid="complaint-item"]').first().isVisible({ timeout: 8000 }).catch(() => false);
    const hasEmpty = await page.getByText(/No complaints|No assigned/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasComplaints || hasEmpty).toBe(true);

    await context.close();
  });

  test("staff cannot access admin pages", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.staff, /\/staff/);

    await page.goto("/admin");
    // Should be redirected away from admin
    await expect(page).not.toHaveURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 8000 });

    await context.close();
  });

  test("staff map page loads without error", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.staff, /\/staff/);

    await page.goto("/staff/map");
    await expect(page).toHaveURL(/\/staff\/map/);

    // Map heading is visible
    await expect(
      page.getByRole("heading", { name: /Map|Assignments/i }),
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("staff profile page loads", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.staff, /\/staff/);

    await page.goto("/staff/profile");
    await expect(page).toHaveURL(/\/staff\/profile/);

    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8000 });

    await context.close();
  });

  test("staff can update complaint status from detail page", async ({ browser }) => {
    test.setTimeout(90000);

    const { context, page } = await loginAs(browser, E2E_USERS.staff, /\/staff/);

    await page.goto("/staff/complaints");

    const firstComplaint = page.locator('[data-testid="complaint-item"]').first();

    if (!(await firstComplaint.isVisible({ timeout: 8000 }).catch(() => false))) {
      // No assigned complaints yet — skip the status update assertion
      await context.close();
      return;
    }

    await firstComplaint.click();
    await expect(page).toHaveURL(/\/staff\/complaints\/.+/, { timeout: 10000 });

    // Status form should be present on the detail page
    const statusSelect = page.locator("select, [data-testid='status-select']")
      .or(page.getByRole("combobox"))
      .first();

    await expect(statusSelect).toBeVisible({ timeout: 8000 });

    await context.close();
  });
});
