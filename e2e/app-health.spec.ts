import { test, expect } from "@playwright/test";

test.describe("Main Menu", () => {
  test.setTimeout(60000);

  test("main menu loads with title and rules", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check title
    await expect(page.locator("h1")).toContainText("Historian");

    // Check tagline
    await expect(page.locator("text=A game of narrative and consequence")).toBeVisible();

    // Check section headers
    await expect(page.locator("text=Choose Your Voice")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Faction Disposition")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=How to Play")).toBeVisible({ timeout: 10000 });
  });

  test("faction card is selectable", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Historian faction card should be visible and clickable
    const factionCard = page.locator("text=Historian").first();
    await expect(factionCard).toBeVisible({ timeout: 10000 });

    // Card should have proper accessibility attributes
    const radioButton = page.locator('[role="radio"]').first();
    await expect(radioButton).toHaveAttribute("aria-checked", "true");
  });

  test("all faction trust levels display", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for trust grid section
    const dispositionSection = page.locator("text=Faction Disposition");
    await expect(dispositionSection).toBeVisible({ timeout: 10000 });

    // Each should show a percentage - check the trust cards specifically
    const trustCards = page.locator('[class*="trustCard"]');
    expect(await trustCards.count()).toBe(4);

    // Verify all faction names appear in trust cards
    const trustSection = page.locator('[class*="trustGrid"]');
    await expect(trustSection.locator("text=historian")).toBeVisible();
    await expect(trustSection.locator("text=scholar")).toBeVisible();
    await expect(trustSection.locator("text=witness")).toBeVisible();
    await expect(trustSection.locator("text=scribe")).toBeVisible();
  });

  test("start button launches the game", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Find and click start button
    const startButton = page.locator("button:has-text('Begin Your Account')");
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();

    // Game screen should appear
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Make Your Claims")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("App Health & Startup", () => {
  test.setTimeout(60000);

  test("game loads without errors after menu", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check page title
    await expect(page).toHaveTitle("Historian - A Game of Narrative and Consequence");

    // Start game
    const startButton = page.locator("button:has-text('Begin Your Account')");
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();

    // Game screen loads
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    // Check no fatal console errors
    const consoleMessages: { type: string; text: string }[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.waitForTimeout(500);
    const errors = consoleMessages.filter((m) => m.type === "error");
    expect(errors).toEqual([]);
  });

  test("events render on the board", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Start game
    await page.locator("button:has-text('Begin Your Account')").click();

    // Wait for events section
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    // Check at least one event exists
    const eventElements = page.locator('[role="article"]');
    await expect(eventElements.first()).toBeVisible({ timeout: 10000 });
  });

  test("can submit a claim and see credibility result", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Start game
    await page.locator("button:has-text('Begin Your Account')").click();

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

    // Start game
    await page.locator("button:has-text('Begin Your Account')").click();

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

    // Start game
    await page.locator("button:has-text('Begin Your Account')").click();

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

    // Start game
    await page.locator("button:has-text('Begin Your Account')").click();

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

test.describe("Turn Progression", () => {
  test.setTimeout(60000);

  test("End Turn button is visible but disabled before any claims", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    const endTurnButton = page.locator("button:has-text('End Turn')");
    await expect(endTurnButton).toBeVisible({ timeout: 10000 });
    await expect(endTurnButton).toBeDisabled();
    await expect(page.locator("text=Write at least one claim to end the turn")).toBeVisible();
  });

  test("End Turn button enables after submitting a claim", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill("The storm approached from the north");
    await page.locator("button:has-text('Submit Claim')").click();
    await expect(page.locator("text=C1")).toBeVisible({ timeout: 10000 });

    const endTurnButton = page.locator("button:has-text('End Turn')");
    await expect(endTurnButton).toBeEnabled({ timeout: 5000 });
  });

  test("clicking End Turn advances to the next turn", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();
    await expect(page.locator("text=Turn 1 / 10")).toBeVisible({ timeout: 10000 });

    const textarea = page.locator("textarea");
    await textarea.fill("The storm approached from the north");
    await page.locator("button:has-text('Submit Claim')").click();
    await expect(page.locator("text=C1")).toBeVisible({ timeout: 10000 });

    await page.locator("button:has-text('End Turn')").click();

    await expect(page.locator("text=Turn 2 / 10")).toBeVisible({ timeout: 10000 });
    // Claim ledger resets for new turn
    await expect(page.locator("text=No claims yet this turn")).toBeVisible({ timeout: 5000 });
  });

  test("can progress through multiple turns", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("button:has-text('Begin Your Account')").click();

    for (let turn = 1; turn <= 3; turn++) {
      await expect(page.locator(`text=Turn ${turn} / 10`)).toBeVisible({ timeout: 10000 });
      const textarea = page.locator("textarea");
      await textarea.fill(`Claim for turn ${turn}`);
      await page.locator("button:has-text('Submit Claim')").click();
      await expect(page.locator("text=C1")).toBeVisible({ timeout: 10000 });
      await page.locator("button:has-text('End Turn')").click();
    }

    await expect(page.locator("text=Turn 4 / 10")).toBeVisible({ timeout: 10000 });
  });
});
