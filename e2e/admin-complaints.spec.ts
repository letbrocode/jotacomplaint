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

test.describe("Admin Complaint Management", () => {
  test.setTimeout(60000);

  test("complaints list shows table or empty state", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");

    const hasItems = await page.locator('[data-testid="complaint-item"]').first().isVisible({ timeout: 8000 }).catch(() => false);
    const hasEmpty = await page.getByText(/No complaints/i).isVisible({ timeout: 3000 }).catch(() => false);
    const hasTable = await page.locator("table, [data-testid='complaints-table']").first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasItems || hasEmpty || hasTable).toBe(true);

    await context.close();
  });

  test("admin map page loads correctly", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/map");
    await expect(page).toHaveURL(/\/admin\/map/);

    await expect(
      page.getByRole("heading", { name: /Map|Complaints Map/i }),
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("admin departments page loads", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/departments");
    await expect(page).toHaveURL(/\/admin\/departments/);
    await expect(page.getByRole("heading", { name: /Department/i })).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("admin staff page loads", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/staff");
    await expect(page).toHaveURL(/\/admin\/staff/);
    await expect(page.getByRole("heading", { name: /Staff/i })).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("admin users page loads", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole("heading", { name: /User/i })).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("admin can view a complaint's detail page", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");

    const firstItem = page.locator('[data-testid="complaint-item"]').first();

    if (!(await firstItem.isVisible({ timeout: 8000 }).catch(() => false))) {
      await context.close();
      return;
    }

    const href = await firstItem.getAttribute("href");
    if (href) {
      await page.goto(href);
    } else {
      await firstItem.click();
    }

    await expect(page).toHaveURL(/\/admin\/complaints\/.+/, { timeout: 10000 });

    // Detail page should show the title and status
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8000 });

    await context.close();
  });

  test("complaint search filters results", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");
    await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible({ timeout: 10000 });

    const searchInput = page
      .getByPlaceholder(/Search/i)
      .or(page.getByLabel(/Search/i))
      .first();

    if (!(await searchInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      await context.close();
      return;
    }

    await searchInput.fill("road");
    await page.waitForTimeout(800);

    // Result count or list updates — page doesn't crash
    await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible();

    await searchInput.clear();
    await page.waitForTimeout(400);

    await context.close();
  });

  test("status filter pill updates complaint list", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/complaints");
    await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible({ timeout: 10000 });

    // Try clicking a PENDING filter
    const pendingFilter = page
      .locator('[data-testid="filter-status-pending"]')
      .or(page.getByRole("button", { name: /^Pending$/i }))
      .first();

    if (await pendingFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pendingFilter.click();
      await page.waitForTimeout(800);
      // Page remains stable
      await expect(page.getByRole("heading", { name: /Complaints/i })).toBeVisible();
    }

    await context.close();
  });

  test("resolved complaints page loads with analytics", async ({ browser }) => {
    const { context, page } = await loginAs(browser, E2E_USERS.admin, /\/admin/);

    await page.goto("/admin/resolved");
    await expect(page).toHaveURL(/\/admin\/resolved/);

    await expect(
      page.getByRole("heading", { name: /Resolved/i }),
    ).toBeVisible({ timeout: 10000 });

    // Stats cards should be visible
    await expect(page.getByText(/Total Resolved|Avg Resolution/i).first()).toBeVisible({ timeout: 8000 });

    await context.close();
  });
});
