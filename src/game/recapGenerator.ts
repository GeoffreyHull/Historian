/**
 * RecapGenerator: Create end-of-run narratives in lore language.
 * Generates RunRecap from claims, events, and world state changes.
 * Constraint 1 (pure), Constraint 5 (JSON serializable).
 */

import type {
  RunRecap,
  CredibilityResult,
  Claim,
  Event,
  WorldState,
  TurnNumber,
} from "./types";

/**
 * Generate end-of-run recap from claims and consequences.
 * FR35: System generates a recap showing major impacts
 * FR36: Recap describes consequences in lore language
 * FR37: Recap references previous run consequences
 */
export function generateRunRecap(
  claims: readonly Claim[],
  credibilityResults: readonly CredibilityResult[],
  events: readonly Event[],
  worldState: WorldState,
  runNumber: number
): RunRecap {
  // Extract high-credibility claims
  const majorClaims = extractMajorClaims(credibilityResults);

  // Find triggered events (consequences)
  const triggeredEvents = extractTriggeredEvents(credibilityResults, worldState);

  // Find references to previous run consequences
  const previousRunReferences = extractPreviousRunReferences(
    worldState,
    credibilityResults
  );

  // Generate lore-style narrative
  const narrative = generateNarrative(
    majorClaims,
    triggeredEvents,
    previousRunReferences,
    runNumber,
    worldState.runNumber
  );

  return {
    runNumber,
    narrative,
    majorClaims,
    triggeredEvents,
    previousRunReferences,
    timestamp: Date.now(),
  };
}

/**
 * Extract high-credibility claims (>60%) for recap inclusion.
 */
function extractMajorClaims(
  credibilityResults: readonly CredibilityResult[]
): string[] {
  return credibilityResults
    .filter((r) => r.finalCredibility > 60)
    .map((r) => r.claim.claimText)
    .slice(0, 5); // Top 5 claims
}

/**
 * Extract events that were consequences of claims.
 * These are derived from high-credibility claims that likely triggered events.
 */
function extractTriggeredEvents(
  credibilityResults: readonly CredibilityResult[],
  worldState: WorldState
): string[] {
  const triggered: string[] = [];

  // For each consequence, see if it matches a high-credibility claim
  for (const consequence of worldState.consequences) {
    const relatedClaim = credibilityResults.find(
      (r) => r.claim.claimText === consequence.claimText
    );

    if (relatedClaim && relatedClaim.finalCredibility > 60) {
      triggered.push(consequence.triggerEventId);
    }
  }

  return triggered.slice(0, 5);
}

/**
 * Extract references to consequences from previous runs.
 */
function extractPreviousRunReferences(
  worldState: WorldState,
  credibilityResults: readonly CredibilityResult[]
): string[] {
  const references: string[] = [];

  // Look at older consequences (from earlier runs)
  for (const consequence of worldState.consequences) {
    // If consequence is old (from many turns ago), it's from a previous run
    if (consequence.intensity < 50) {
      // Low intensity = aged consequence
      references.push(
        `"${consequence.claimText}" from a prior age still echoes`
      );
    }
  }

  return references.slice(0, 3);
}

/**
 * Generate lore-style narrative text.
 * FR36: Describe in lore language, not mechanics.
 */
function generateNarrative(
  majorClaims: string[],
  triggeredEvents: string[],
  previousRunReferences: string[],
  completedRunNumber: number,
  currentRunNumber: number
): string {
  const parts: string[] = [];

  // Opening
  const runOrdinal = getOrdinal(completedRunNumber);
  parts.push(`# Chronicles of the ${runOrdinal} Age`);
  parts.push("");

  // Summary of major claims
  if (majorClaims.length > 0) {
    parts.push("## What Was Told");
    parts.push(
      "The scribes recorded these accounts of truth and consequence:"
    );
    for (const claim of majorClaims) {
      parts.push(`- "${claim}"`);
    }
    parts.push("");
  }

  // Summary of consequences
  if (triggeredEvents.length > 0) {
    parts.push("## The Echo of Words");
    parts.push("Your accounts shaped the unfolding of history:");
    for (const event of triggeredEvents) {
      parts.push(`- The mention of ${event.split("-")[1]} came to pass`);
    }
    parts.push("");
  }

  // References to prior consequences
  if (previousRunReferences.length > 0) {
    parts.push("## Echoes From the Past");
    parts.push("The weight of previous ages still pressed upon this run:");
    for (const reference of previousRunReferences) {
      parts.push(`- ${reference}`);
    }
    parts.push("");
  }

  // Closing
  parts.push("## The End of the Age");
  parts.push(
    `This account concludes the ${runOrdinal} age. What comes next remains unwritten.`
  );

  return parts.join("\n");
}

/**
 * Convert number to ordinal string (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinal(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return (
    num +
    (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
  );
}

/**
 * Create a readable history from accumulated recaps.
 * FR38: Player can access history book anytime
 * FR39: History book accumulates recaps from all previous runs
 */
export function formatHistoryBook(recaps: readonly RunRecap[]): string {
  if (recaps.length === 0) {
    return "## The History Book\n\nNo tales have yet been recorded.";
  }

  const parts: string[] = [];
  parts.push("# The Complete History Book");
  parts.push("");
  parts.push("## All Recorded Ages");
  parts.push("");

  for (const recap of recaps) {
    parts.push("---");
    parts.push(recap.narrative);
    parts.push("");
  }

  parts.push("---");
  parts.push(
    "## The Unfinished Tale\n\nYour current actions will shape the next chapter."
  );

  return parts.join("\n");
}
