import { test, expect } from "@playwright/test";
import { setupPage, createTaskViaApi } from "./helpers.js";

test.describe("Task duration / time estimates", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("shows 30m duration badge when task has estimatedMinutes", async ({ page }) => {
    await createTaskViaApi(page, "Review PR", { estimatedMinutes: 30 });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    const taskItem = page.locator('[aria-label^="Task: Review PR"]').first();
    await expect(taskItem).toBeVisible();
    await expect(taskItem.getByText("30m").first()).toBeVisible({ timeout: 5000 });
  });

  test("shows 2h duration badge when task has 120 estimatedMinutes", async ({ page }) => {
    await createTaskViaApi(page, "Write documentation", { estimatedMinutes: 120 });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    const taskItem = page.locator('[aria-label^="Task: Write documentation"]').first();
    await expect(taskItem).toBeVisible();
    await expect(taskItem.getByText("2h").first()).toBeVisible({ timeout: 5000 });
  });

  test("duration badges disappear when feature_duration is disabled", async ({ page }) => {
    // Create tasks with durations via API
    await createTaskViaApi(page, "Quick fix", { estimatedMinutes: 15 });
    await createTaskViaApi(page, "Long meeting", { estimatedMinutes: 180 });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    // Verify badges are visible
    const quickFixItem = page.locator('[aria-label^="Task: Quick fix"]').first();
    await expect(quickFixItem).toBeVisible();
    await expect(quickFixItem.getByText("15m").first()).toBeVisible({ timeout: 5000 });

    const meetingItem = page.locator('[aria-label^="Task: Long meeting"]').first();
    await expect(meetingItem).toBeVisible();
    await expect(meetingItem.getByText("3h").first()).toBeVisible({ timeout: 5000 });

    // Disable the feature via API
    await page.request.put("/api/settings/feature_duration", {
      data: { value: "false" },
    });

    // Reload to pick up the setting change
    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    // Verify badges are gone
    const quickFixAfter = page.locator('[aria-label^="Task: Quick fix"]').first();
    await expect(quickFixAfter).toBeVisible();
    await expect(quickFixAfter.getByText("15m").first()).not.toBeVisible();

    const meetingAfter = page.locator('[aria-label^="Task: Long meeting"]').first();
    await expect(meetingAfter).toBeVisible();
    await expect(meetingAfter.getByText("3h").first()).not.toBeVisible();

    // Re-enable the feature for cleanup
    await page.request.put("/api/settings/feature_duration", {
      data: { value: "true" },
    });
  });
});
