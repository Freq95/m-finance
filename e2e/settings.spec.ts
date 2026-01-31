import { test, expect } from "@playwright/test";

test.describe("Settings modal", () => {
  test("opens from header and shows Settings heading", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("has export and import actions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole("button", { name: "Export full backup" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Export data only" })).toBeVisible();
    await expect(dialog.getByText("Import from file")).toBeVisible();
  });

  test("toggles notifications and days", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const notificationsToggle = dialog.getByLabel("Remind before upcoming payments");
    await expect(notificationsToggle).toBeVisible();

    const daysText = dialog.getByText(/Notifications will remind you/i);
    await expect(daysText).toBeVisible();

    await notificationsToggle.click();
    await expect(notificationsToggle).toBeChecked();

    await dialog.getByRole("button", { name: "3 days" }).click();
    await expect(daysText).toContainText("3 day(s)");
  });

  test("opens import confirmation after selecting a file", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const fileInput = dialog.locator("#settings-modal-import-file");
    await fileInput.setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ version: 3, data: [] })),
    });

    const importHeading = page.getByRole("heading", { name: "Import from file?" });
    await expect(importHeading).toBeVisible();
    const confirm = page.getByRole("dialog").filter({ has: importHeading });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(confirm).toBeHidden();
  });
});
