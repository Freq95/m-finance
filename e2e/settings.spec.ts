import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("loads and shows Settings heading", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("main").getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });
  });

  test("has export backup action", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("main").getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("main").getByRole("button", { name: "Export backup" })).toBeVisible();
  });

  test("has import from file control", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("main").getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("main").getByText("Import from file")).toBeVisible();
  });
});
