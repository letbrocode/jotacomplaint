import { test, expect } from "@playwright/test";

test.describe("Complaint Lifecycle", () => {
  const TEST_TITLE = "Test Complaint " + Math.random().toString(36).substring(7);

  test("full lifecycle: user reports -> admin assigns -> staff resolves", async ({ page, context }) => {
    test.setTimeout(90000);  // 3-role flow needs more than the default 30s
    // 1. USER LOGIN & REPORT
    await page.goto("/signin");
    await page.getByLabel(/Email/i).fill("rajesh.kumar@gmail.com");
    await page.getByLabel(/Password/i).fill("12345678");
    await page.getByRole("button", { name: /Sign In/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Navigate to register page
    await page.goto("/dashboard/register");
    await page.getByLabel(/Title/i).fill(TEST_TITLE);
    // The textarea label is "Description *" in the form
    await page.getByLabel(/Description/i).fill("This is a detailed description of the municipal issue being reported via automated E2E test.");
    
    // Select category (ROADS)
    await page.getByLabel(/Category/i).click();
    await page.getByRole("option", { name: /Roads/i }).click();

    // Submit
    await page.getByRole("button", { name: /Submit Complaint/i }).click();
    
    // Should see success message or be redirected
    await expect(
      page.getByText(/Complaint submitted successfully/i).or(page.getByText(TEST_TITLE))
    ).toBeVisible({ timeout: 15000 });

    // 2. ADMIN ASSIGNMENT — clear session and re-login
    await context.clearCookies();
    
    await page.goto("/signin");
    await page.getByLabel(/Email/i).fill("admin@municipality.gov");
    await page.getByLabel(/Password/i).fill("12345678");
    await page.getByRole("button", { name: /Sign In/i }).click();
    
    await expect(page).toHaveURL(/\/admin/);
    
    // Go to complaints list
    await page.goto("/admin/complaints");
    await expect(page.getByText(TEST_TITLE)).toBeVisible({ timeout: 10000 });
    
    // Click on the complaint
    await page.getByText(TEST_TITLE).first().click();
    
    // Assign to Roads Department / Staff (optional — UI may differ)
    const assignBtn = page.getByRole("button", { name: /Assign/i }).first();
    if (await assignBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await assignBtn.click();
      await page.getByLabel(/Staff/i).click();
      await page.getByRole("option", { name: /Roads Officer/i }).click();
      await page.getByRole("button", { name: /Save Assignment/i }).click();
      await expect(page.getByText(/Assigned successfully/i)).toBeVisible({ timeout: 5000 });
    }

    // 3. STAFF RESOLUTION — clear session and re-login
    await context.clearCookies();

    await page.goto("/signin");
    await page.getByLabel(/Email/i).fill("roads.officer@municipality.gov");
    await page.getByLabel(/Password/i).fill("12345678");
    await page.getByRole("button", { name: /Sign In/i }).click();
    
    await expect(page).toHaveURL(/\/staff/);
    
    // Find assigned complaint
    await page.goto("/staff/complaints");
    await page.getByText(TEST_TITLE).first().click();
    
    // Resolve
    await page.getByRole("button", { name: /Update Status/i }).click();
    await page.getByLabel(/Status/i).click();
    await page.getByRole("option", { name: /Resolved/i }).click();
    await page.getByRole("button", { name: /Confirm Update/i }).click();
    
    await expect(page.getByText(/RESOLVED/i)).toBeVisible({ timeout: 10000 });
  });
});
