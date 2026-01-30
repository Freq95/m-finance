import { test, expect } from "@playwright/test";

test.describe("Monthly Input", () => {
  test("loads and shows main controls", async ({ page }) => {
    await page.goto("/monthly-input");
    await expect(page).toHaveURL("/monthly-input");
    await expect(page.getByRole("main").getByRole("button", { name: "Luna curentă" })).toBeVisible({ timeout: 10000 });
  });

  test("has month navigation", async ({ page }) => {
    await page.goto("/monthly-input");
    const monthNav = page.getByRole("group", { name: "Lună" });
    await expect(monthNav).toBeVisible({ timeout: 10000 });
  });
});
