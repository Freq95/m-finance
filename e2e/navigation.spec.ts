import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("sidebar links navigate to Dashboard, Monthly input, Settings", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByRole("navigation");

    await sidebar.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL("/");

    await sidebar.getByRole("link", { name: "Monthly input" }).click();
    await expect(page).toHaveURL("/monthly-input");
    await expect(page.getByRole("main").getByRole("heading", { name: "Monthly Input" })).toBeVisible({ timeout: 5000 });

    await sidebar.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("main").getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 5000 });
  });

  test("direct URL to monthly-input works", async ({ page }) => {
    await page.goto("/monthly-input");
    await expect(page).toHaveURL("/monthly-input");
    await expect(page.getByRole("main").getByRole("heading", { name: "Monthly Input" })).toBeVisible({ timeout: 10000 });
  });

  test("direct URL to settings works", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("main").getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });
  });
});
