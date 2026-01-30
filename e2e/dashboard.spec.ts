import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads and shows main content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("main")).toBeVisible();
    await page.waitForTimeout(2000);
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main.locator("text=RON").or(main.locator("text=Împreună")).first()).toBeVisible({ timeout: 15000 });
  });

  test("shows either skeleton or content", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    const skeletonOrContent = main.locator("[class*='animate-pulse'], [class*='glass-surface']").first();
    await expect(skeletonOrContent).toBeVisible({ timeout: 10000 });
  });
});
