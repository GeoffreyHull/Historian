import { test, expect } from "@playwright/test";

test.describe("History Book", () => {
  test.setTimeout(60000);

  test("History Book button is visible during game play", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    const historyButton = page.locator("button[aria-label='View history book']");
    await expect(historyButton).toBeVisible({ timeout: 10000 });
  });

  test("clicking History Book opens the history screen", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    await page.locator("button[aria-label='View history book']").click();

    await expect(page.locator("text=The Historical Record")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=No completed runs yet")).toBeVisible({ timeout: 10000 });
  });

  test("Back to Game button returns from history to playing screen", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    await page.locator("button[aria-label='View history book']").click();
    await expect(page.locator("text=The Historical Record")).toBeVisible({ timeout: 10000 });

    await page.locator("button[aria-label='Back to game']").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });
  });

  test("history screen is accessible from within the playing screen", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();

    const historyButton = page.locator("button[aria-label='View history book']");
    await expect(historyButton).toBeVisible({ timeout: 10000 });
    await expect(historyButton).toBeEnabled();

    // Should be accessible at any point — no claims needed
    await historyButton.click();
    await expect(page.locator('[role="article"][aria-label="History book"]')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Save Game", () => {
  test.setTimeout(60000);

  test("Save Game button is visible during game play", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    const saveButton = page.locator("button[aria-label='Save game']");
    await expect(saveButton).toBeVisible({ timeout: 10000 });
  });

  test("clicking Save Game shows a confirmation message", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    await page.locator("button[aria-label='Save game']").click();

    // Use specific locator scoped to header actions to avoid char-counter conflict
    const saveStatus = page.locator("span[role='status']");
    await expect(saveStatus).toBeVisible({ timeout: 5000 });
    await expect(saveStatus).toContainText("saved");
  });

  test("save confirmation message disappears after a few seconds", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    await page.locator("button[aria-label='Save game']").click();
    const saveStatus = page.locator("span[role='status']");
    await expect(saveStatus).toBeVisible({ timeout: 5000 });

    // Message should auto-clear after 3 seconds
    await expect(saveStatus).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Continue Saved Game", () => {
  test.setTimeout(60000);

  test("Continue button does not show on fresh main menu", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const continueButton = page.locator("button[aria-label='Continue saved game']");
    await expect(continueButton).not.toBeVisible({ timeout: 5000 });
  });

  test("Continue button appears on main menu after saving", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Start and save a game
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });
    await page.locator("button[aria-label='Save game']").click();
    await expect(page.locator("span[role='status']")).toBeVisible({ timeout: 5000 });

    // Navigate back to menu
    await page.goto("/", { waitUntil: "networkidle" });

    // Continue button should now appear
    const continueButton = page.locator("button[aria-label='Continue saved game']");
    await expect(continueButton).toBeVisible({ timeout: 10000 });
  });

  test("clicking Continue resumes game from saved state", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Start, advance a turn, and save
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    const textarea = page.locator("textarea");
    await textarea.fill("The winds shifted from the east");
    await page.locator("button:has-text('Submit Claim')").click();
    await expect(page.locator("text=C1")).toBeVisible({ timeout: 10000 });
    await page.locator("button:has-text('End Turn')").click();
    await expect(page.locator("text=Turn 2 / 10")).toBeVisible({ timeout: 10000 });

    await page.locator("button[aria-label='Save game']").click();
    await expect(page.locator("span[role='status']")).toBeVisible({ timeout: 5000 });

    // Navigate back to menu
    await page.goto("/", { waitUntil: "networkidle" });

    // Continue should load turn 2
    const continueButton = page.locator("button[aria-label='Continue saved game']");
    await expect(continueButton).toBeVisible({ timeout: 10000 });
    await continueButton.click();

    await expect(page.locator("text=Turn 2 / 10")).toBeVisible({ timeout: 10000 });
  });
});
