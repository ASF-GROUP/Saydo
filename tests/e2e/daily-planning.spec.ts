import { test, expect } from "@playwright/test";
import { setupPage, createTaskViaApi, navigateTo } from "./helpers.js";

test.describe("Daily Planning Modal", () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test("Plan My Day button visible in Today view", async ({ page }) => {
    await navigateTo(page, "Today");
    await expect(page.getByRole("button", { name: "Plan My Day" })).toBeVisible();
  });

  test("opens modal with overdue step", async ({ page }) => {
    // Create an overdue task (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTaskViaApi(page, "Overdue planning task", {
      dueDate: yesterday.toISOString(),
    });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, "Today");
    await page.getByRole("button", { name: "Plan My Day" }).click();

    // Modal should be visible with the overdue task
    await expect(page.getByText("Review Overdue")).toBeVisible();
    await expect(page.getByText("Overdue planning task")).toBeVisible();
  });

  test("navigate through all steps", async ({ page }) => {
    await navigateTo(page, "Today");
    await page.getByRole("button", { name: "Plan My Day" }).click();

    // Step 0: Review Overdue
    await expect(page.getByText("Review Overdue")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 1: Today's Focus
    await expect(page.getByText("Today's Focus")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: Time Budget
    await expect(page.getByText("Time Budget")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 3: Ready!
    await expect(page.getByText("Ready!")).toBeVisible();
    await page.getByRole("button", { name: "Start My Day" }).click();

    // Modal should close
    await expect(page.getByText("Ready!")).not.toBeVisible();
  });

  test("reschedule overdue task", async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await createTaskViaApi(page, "Rescue this task", {
      dueDate: yesterday.toISOString(),
    });

    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });

    await navigateTo(page, "Today");
    await page.getByRole("button", { name: "Plan My Day" }).click();

    // Click reschedule on the overdue task
    await page.getByRole("button", { name: "Reschedule to today" }).click();

    // Complete the flow
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Start My Day" }).click();

    // Reload and verify the task is now in the Today section
    await page.reload();
    await expect(page.getByText("Inbox").first()).toBeVisible({ timeout: 10000 });
    await navigateTo(page, "Today");

    await expect(page.getByText("Rescue this task")).toBeVisible({ timeout: 5000 });
  });
});
