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

test.describe("Complaint Lifecycle", () => {
  test("full lifecycle: user reports -> admin assigns -> staff resolves", async ({ browser }) => {
    test.setTimeout(90000);

    const testTitle = `Test Complaint ${Math.random().toString(36).slice(2, 8)}`;

    // 1. USER LOGIN & REPORT
    const userSession = await loginAs(browser, E2E_USERS.citizen, /\/dashboard/);
    await userSession.page.goto("/dashboard/register");
    await userSession.page.getByLabel(/Title/i).fill(testTitle);
    await userSession.page
      .getByLabel(/Description/i)
      .fill("This is a detailed description of the municipal issue being reported via automated E2E test.");

    await userSession.page.getByLabel(/Category/i).click();
    await userSession.page.getByRole("option", { name: /Roads/i }).click();
    await userSession.page.getByRole("button", { name: /Submit Complaint/i }).click();

    await expect(
      userSession.page
        .getByText(/Complaint submitted successfully/i)
        .or(userSession.page.getByText(testTitle)),
    ).toBeVisible({ timeout: 15000 });
    await userSession.context.close();

    // 2. ADMIN ASSIGNS
    const adminSession = await loginAs(browser, E2E_USERS.admin, /\/admin/);
    await adminSession.page.goto("/admin/complaints");

    const complaintCard = adminSession.page
      .locator('[data-testid="complaint-item"]')
      .filter({ hasText: testTitle })
      .first();

    await expect(complaintCard).toBeVisible({ timeout: 15000 });

    await complaintCard.getByTestId("assign-staff-trigger").click();
    await adminSession.page.getByRole("option", { name: E2E_USERS.staff.displayName }).click();

    await expect(complaintCard.getByText(/Assigned to:/i)).toBeVisible({ timeout: 10000 });
    await expect(complaintCard.getByText(E2E_USERS.staff.displayName).first()).toBeVisible({ timeout: 10000 });
    await adminSession.context.close();

    // 3. STAFF RESOLVES
    const staffSession = await loginAs(browser, E2E_USERS.staff, /\/staff/);
    await staffSession.page.goto("/staff/complaints");

    const staffComplaintCard = staffSession.page
      .locator('[data-testid="complaint-item"]')
      .filter({ hasText: testTitle })
      .first();

    await expect(staffComplaintCard).toBeVisible({ timeout: 15000 });

    await staffComplaintCard.getByLabel(/Update complaint status/i).click();
    await staffSession.page.getByRole("option", { name: /Resolved/i }).click();

    await expect(staffComplaintCard.getByTestId("complaint-status-badge")).toContainText(/resolved/i);
    await staffSession.context.close();
  });
});
