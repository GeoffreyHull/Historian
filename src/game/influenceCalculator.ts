/**
 * InfluenceCalculator: Calculate player influence from credibility results.
 * Constraint 1: Pure functions, no mutations.
 * FR19: System calculates influence earned = credibility % × faction multiplier
 */

import { CredibilityResult, InfluenceCalculation, Faction } from "./types";

/**
 * Faction multiplier table: How much each faction rewards influence.
 * MVP: All factions use 1.0 multiplier. Post-MVP: varies by relationship.
 */
const FACTION_MULTIPLIER: Record<Faction, number> = {
  historian: 1.0,
  scholar: 1.0,
  witness: 1.0,
  scribe: 1.0,
};

/**
 * CalculateInfluence: Compute influence earned from a credibility result.
 * Formula: influence = (finalCredibility / 100) × faction_multiplier
 */
export function calculateInfluence(
  credibilityResult: CredibilityResult,
  faction: Faction
): InfluenceCalculation {
  const credibilityScore = credibilityResult.finalCredibility;
  const multiplier = FACTION_MULTIPLIER[faction] ?? 1.0;
  const influence = (credibilityScore / 100) * multiplier;

  return {
    claim: credibilityResult.claim,
    credibilityResult,
    faction,
    credibilityScore,
    multiplier,
    influence,
  };
}

/**
 * AggregateInfluence: Sum all influence from multiple results.
 */
export function aggregateInfluence(
  credibilityResults: CredibilityResult[],
  faction: Faction
): number {
  return credibilityResults.reduce((total, result) => {
    const calculation = calculateInfluence(result, faction);
    return total + calculation.influence;
  }, 0);
}
