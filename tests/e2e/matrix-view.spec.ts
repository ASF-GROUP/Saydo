import { test, expect } from "@playwright/test";
import { setupPage, createTaskViaApi, navigateTo } from "./helpers.js";

test.describe("Eisenhower Matrix view", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("renders 4 quadrants", async ({ page }) => {
    await navigateTo(page, "Matrix");

    await expect(page.getByText("Do First")).toBeVisible();
    await expect(page.getByText("Schedule")).toBeVisible();
    await expect(page.getByText("Delegate")).toBeVisible();
    await expect(page.getByText("Eliminate")).toBeVisible();
  });

  test("high priority overdue task in Q1", async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTaskViaApi(page, "Urgent important task", {
      priority: 1,
      dueDate: yesterday.toISOString(),
    });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, "Matrix");

    // The task should be in Q1 (Do First quadrant)
    const q1 = page.locator("[class*='bg-error']").first();
    await expect(q1.getByText("Urgent important task")).toBeVisible({ timeout: 5000 });
  });

  test("high priority future task in Q2", async ({ page }) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await createTaskViaApi(page, "Important not urgent", {
      priority: 2,
      dueDate: nextWeek.toISOString(),
    });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, "Matrix");

    // The task should be in Q2 (Schedule quadrant)
    const q2 = page.locator("[class*='bg-accent']").first();
    await expect(q2.getByText("Important not urgent")).toBeVisible({ timeout: 5000 });
  });

  test("low priority overdue task in Q3", async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTaskViaApi(page, "Urgent not important", {
      priority: 4,
      dueDate: yesterday.toISOString(),
    });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, "Matrix");

    // The task should be in Q3 (Delegate quadrant)
    const q3 = page.locator("[class*='bg-warning']").first();
    await expect(q3.getByText("Urgent not important")).toBeVisible({ timeout: 5000 });
  });

  test("feature flag hides nav item", async ({ page }) => {
    // Verify the Matrix button exists in the sidebar
    await expect(page.getByRole("button", { name: "Matrix", exact: true })).toBeVisible();

    // Disable the feature via API
    await page.request.put("/api/settings/feature_matrix", {
      data: { value: "false" },
    });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    // The Matrix nav item should be hidden
    await expect(page.getByRole("button", { name: "Matrix", exact: true })).not.toBeVisible();

    // Re-enable for cleanup
    await page.request.put("/api/settings/feature_matrix", {
      data: { value: "true" },
    });
  });
});
