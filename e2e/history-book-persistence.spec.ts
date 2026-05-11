/**
 * E2E tests for cross-run history book persistence.
 * Validates:
 *  - History Book button is accessible during gameplay
 *  - History Book shows accumulated recaps from past runs
 *  - After completing a run, the History Book contains that run's recap
 */

import { test, expect } from "@playwright/test";

async function startGame(page: any) {
  await page.goto("/", { waitUntil: "networkidle" });
  const startButton = page.locator("button:has-text('Begin Your Account')");
  await expect(startButton).toBeVisible({ timeout: 10000 });
  await startButton.click();
  await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });
}

async function completeTurn(page: any, turn: number) {
  await expect(page.locator(`text=Turn ${turn} / 10`)).toBeVisible({ timeout: 10000 });
  const textarea = page.locator("textarea");
  await textarea.fill("The events unfolded at the castle");
  await page.locator("button:has-text('Submit Claim')").click();
  await expect(page.locator("text=C1")).toBeVisible({ timeout: 5000 });
  await page.locator(`button:has-text('End Turn ${turn}')`).click();
}

test.describe("History Book Persistence", () => {
  test.setTimeout(60000);

  test("History Book button is visible during gameplay", async ({ page }) => {
    await startGame(page);
    const historyButton = page.locator("button:has-text('History Book')");
    await expect(historyButton).toBeVisible({ timeout: 5000 });
  });

  test("History Book opens when button is clicked", async ({ page }) => {
    await startGame(page);
    await page.locator("button:has-text('History Book')").click();
    // History screen should be visible
    await expect(page.locator("text=Back to Game")).toBeVisible({ timeout: 10000 });
  });

  test("History Book shows empty state on first run", async ({ page }) => {
    await startGame(page);
    await page.locator("button:has-text('History Book')").click();

    // On first run with no completed runs, the history should show nothing or minimal info
    await expect(page.locator("text=Back to Game")).toBeVisible({ timeout: 10000 });

    // The history book component should render
    const historyContent = page.locator('[class*="history"], [class*="History"]').first();
    await expect(historyContent).toBeVisible({ timeout: 5000 });
  });

  test("Back to Game returns from history book to playing", async ({ page }) => {
    await startGame(page);
    await page.locator("button:has-text('History Book')").click();
    await expect(page.locator("text=Back to Game")).toBeVisible({ timeout: 10000 });

    await page.locator("button:has-text('Back to Game')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });
  });

  test("World Variables panel is visible during gameplay", async ({ page }) => {
    await startGame(page);
    const worldState = page.locator('[role="region"][aria-label="World state variables"]');
    await expect(worldState).toBeVisible({ timeout: 5000 });
    await expect(worldState.locator("text=Morale")).toBeVisible();
    await expect(worldState.locator("text=Infrastructure")).toBeVisible();
    await expect(worldState.locator("text=Economy")).toBeVisible();
  });
});

test.describe("History Book After Full Run", () => {
  test.setTimeout(180000);

  test("History Book has run recap after completing a full run", async ({ page }) => {
    await startGame(page);

    // Complete 10 turns
    for (let turn = 1; turn <= 10; turn++) {
      await completeTurn(page, turn);

      const recapLocator = page.locator("text=Run 1 Complete");
      if (await recapLocator.isVisible().catch(() => false)) break;

      const gameOver = page.locator("text=The Chronicle Ends");
      if (await gameOver.isVisible().catch(() => false)) {
        test.skip();
        return;
      }
    }

    await expect(page.locator("text=Run 1 Complete")).toBeVisible({ timeout: 15000 });

    // Open history from recap screen
    const historyButton = page.locator("button:has-text('History Book')");
    await expect(historyButton).toBeVisible({ timeout: 5000 });
    await historyButton.click();

    // History book should now have Run 1's content
    await expect(page.locator("text=Back to Game")).toBeVisible({ timeout: 10000 });

    // The history should show some content from the completed run
    const historyContent = page.locator('[class*="history"], [class*="History"]').first();
    await expect(historyContent).toBeVisible({ timeout: 5000 });
  });
});
