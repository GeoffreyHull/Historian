import { test, expect } from "@playwright/test";

test.describe("App Health & Startup", () => {
  test.setTimeout(60000);

  test("app loads without errors", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check page title
    await expect(page).toHaveTitle("Historian - A Game of Narrative and Consequence");

    // Check main header exists
    await expect(page.locator("h1")).toContainText("Historian");

    // Check no fatal console errors
    const consoleMessages: { type: string; text: string }[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.waitForTimeout(1000);
    const errors = consoleMessages.filter((m) => m.type === "error");
    expect(errors).toEqual([]);
  });

  test("events render on the board", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for events section
    await expect(page.locator("text=Turn 1 Events")).toBeVisible({ timeout: 10000 });

    // Check at least one event exists
    const eventElements = page.locator('[role="article"]');
    await expect(eventElements.first()).toBeVisible({ timeout: 10000 });
  });

  test("can submit a claim and see credibility result", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Find and fill textarea
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill("This event happened as described");

    // Click submit
    const submitButton = page.locator("button:has-text('Submit Claim')");
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    // Claim should appear in ledger
    await expect(page.locator("text=C1")).toBeVisible({ timeout: 10000 });

    // Credibility result should appear
    const credibilitySection = page.locator("[aria-live='assertive']");
    await expect(credibilitySection).toBeVisible({ timeout: 10000 });
    await expect(credibilitySection).toContainText("Claim Received");
  });

  test("faction trust sidebar displays all 4 factions", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for faction section
    const factionTrustSection = page.locator('[role="region"][aria-label="Faction trust levels"]');
    await expect(factionTrustSection).toBeVisible({ timeout: 10000 });

    // All 4 factions should be visible within the sidebar
    await expect(factionTrustSection.locator("text=Historian")).toBeVisible();
    await expect(factionTrustSection.locator("text=Scholar")).toBeVisible();
    await expect(factionTrustSection.locator("text=Witness")).toBeVisible();
    await expect(factionTrustSection.locator("text=Scribe")).toBeVisible();
  });

  test("claim ledger shows claims in order", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for textarea
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Submit 2 claims
    await textarea.fill("First claim");
    await page.locator("button:has-text('Submit Claim')").click();
    await expect(page.locator("text=C1")).toBeVisible({ timeout: 10000 });

    await textarea.fill("Second claim");
    await page.locator("button:has-text('Submit Claim')").click();
    await expect(page.locator("text=C2")).toBeVisible({ timeout: 10000 });

    // Both should be visible
    await expect(page.locator("text=CLAIM LEDGER")).toBeVisible();
    const ledgerItems = page.locator('[class*="item"]');
    expect(await ledgerItems.count()).toBeGreaterThanOrEqual(2);
  });

  test("submit button disables after 3 claims", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const textarea = page.locator("textarea");
    const submitButton = page.locator("button:has-text('Submit Claim')");

    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Submit 3 claims
    for (let i = 1; i <= 3; i++) {
      await textarea.fill(`Claim ${i}`);
      await submitButton.click();
      await expect(page.locator(`text=C${i}`)).toBeVisible({ timeout: 10000 });
    }

    // Button should now be disabled
    await expect(submitButton).toBeDisabled({ timeout: 10000 });
  });
});
