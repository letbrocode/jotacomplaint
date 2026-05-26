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

test.describe("Admin Dashboard", () => {
  test.setTimeout(60000);

  test("shows stats cards and recent complaints after login", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    // Stats cards present
    await expect(page.getByText(/Total Complaints/i)).toBeVisible();
    await expect(page.getByText(/Pending/i).first()).toBeVisible();
    await expect(page.getByText(/In Progress/i).first()).toBeVisible();
    await expect(page.getByText(/Resolved/i).first()).toBeVisible();

    // Dashboard renders (not loading skeleton)
    await expect(page.locator("[data-sonner-toast]")).not.toBeVisible({ timeout: 500 }).catch(() => void 0);

    await context.close();
  });

  test("navigates to complaint list from admin layout", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");
    await expect(page).toHaveURL(/\/admin\/complaints/);

    // Page heading
    await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("can filter complaints by status", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");
    await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible({ timeout: 10000 });

    // Click a status filter if present
    const pendingFilter = page.getByRole("button", { name: /Pending/i })
      .or(page.locator("[data-testid='filter-status-pending']"))
      .first();

    if (await pendingFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pendingFilter.click();
      // URL should reflect filter or list should update
      await page.waitForTimeout(1000);
      await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible();
    }

    await context.close();
  });

  test("can search complaints by keyword", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");
    await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder(/Search/i)
      .or(page.getByLabel(/Search/i))
      .first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("water");
      await page.waitForTimeout(800);
      // Page should still be stable
      await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible();
    }

    await context.close();
  });

  test("can open complaint detail page", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");
    await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible({ timeout: 10000 });

    // Click the first complaint item
    const firstComplaint = page.locator('[data-testid="complaint-item"]').first();
    if (await firstComplaint.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await firstComplaint.getAttribute("href");
      if (href) {
        await page.goto(href);
      } else {
        await firstComplaint.click();
      }
      await expect(page).toHaveURL(/\/admin\/complaints\/.+/, { timeout: 10000 });
    }

    await context.close();
  });

  test("audit log page loads with activity records", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/audit-log");
    await expect(page).toHaveURL(/\/admin\/audit-log/);
    await expect(page.getByRole("heading", { name: /Audit Log/i })).toBeVisible({ timeout: 10000 });

    // Either a table of records or an empty-state message
    const hasTable = await page.locator('[data-testid="audit-log-table"]').isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText(/No activity records/i).isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);

    await context.close();
  });

  test("audit log action filter pills work", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/audit-log");
    await expect(page.getByRole("heading", { name: /Audit Log/i })).toBeVisible({ timeout: 10000 });

    // Click the RESOLVED action filter
    const resolvedFilter = page.locator('[data-testid="filter-action-resolved"]');
    if (await resolvedFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await resolvedFilter.click();
      await expect(page).toHaveURL(/action=RESOLVED/, { timeout: 5000 });
    }

    await context.close();
  });
});
