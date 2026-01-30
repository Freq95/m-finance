import { test, expect } from "@playwright/test";

test.describe("Monthly Input", () => {
  test("loads and shows page heading", async ({ page }) => {
    await page.goto("/monthly-input");
    await expect(page).toHaveURL("/monthly-input");
    await expect(page.getByRole("main").getByRole("heading", { name: "Monthly Input" })).toBeVisible({ timeout: 10000 });
  });

  test("has month navigation", async ({ page }) => {
    await page.goto("/monthly-input");
    await expect(page.getByRole("main").getByRole("heading", { name: "Monthly Input" })).toBeVisible({ timeout: 10000 });
    const monthNav = page.getByRole("group", { name: "Lună" });
    await expect(monthNav).toBeVisible();
  });
});
