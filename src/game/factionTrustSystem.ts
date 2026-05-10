/**
 * FactionTrustSystem: Pure functions for managing faction trust across turns.
 * FR15: Each faction has a trust value in the range [-200, +100].
 * FR16: Trust changes based on credibility scores and claim content.
 * FR17: Factions below -100 trust refuse to buy the next book (loss condition).
 * FR18: All factions refusing = influence multiplier 0 (auto-loss).
 * Constraint 1: Pure functions, no I/O, no side effects.
 * Constraint 2: All outputs are new objects; inputs are never mutated.
 */

import { CredibilityResult, Faction, WorldVariables } from "./types";

export type FactionTrustMap = Readonly<Record<string, number>>;

export const FACTION_TRUST_MIN = -200;
export const FACTION_TRUST_MAX = 100;
export const REFUSING_TRUST_THRESHOLD = -100;

const ALL_FACTIONS: readonly Faction[] = ["historian", "scholar", "witness", "scribe", "diplomat", "rebel", "merchant"];

/**
 * CreateInitialTrustMap: All factions start at neutral trust (0).
 */
export function createInitialTrustMap(): FactionTrustMap {
  return { historian: 0, scholar: 0, witness: 0, scribe: 0, diplomat: 0, rebel: 0, merchant: 0 };
}

/**
 * ComputeTrustDeltas: Derive per-faction trust changes from credibility results.
 *
 * Rules:
 * - High credibility (≥70): +5 trust for all factions
 * - Medium credibility (40–69): +1 trust for all factions
 * - Low credibility (<40): −10 trust for all factions
 * - Insult detected in claim: additional −15 trust for the player's faction
 *
 * World variable modifier (cascading consequences):
 * - When world variables are healthy (avg ≥ 65), factions are generous: +20% gains, -20% penalties
 * - When world variables are poor (avg < 35), factions are harsh: -20% gains, +20% penalties
 * - Some factions care more about specific variables
 */
export function computeTrustDeltas(
  results: readonly CredibilityResult[],
  playerFaction: Faction,
  worldVariables?: WorldVariables
): FactionTrustMap {
  const deltas: Record<Faction, number> = Object.fromEntries(ALL_FACTIONS.map((f) => [f, 0])) as Record<Faction, number>;

  for (const result of results) {
    const { finalCredibility, hasInsult } = result;

    for (const faction of ALL_FACTIONS) {
      // Compute per-faction modifier based on each faction's preferred world variable
      const modifier = worldVariables ? computeVariableTrustModifier(worldVariables, faction) : 1.0;

      let baseDelta: number;
      if (finalCredibility >= 70) {
        baseDelta = Math.round(5 * modifier);
      } else if (finalCredibility >= 40) {
        baseDelta = Math.round(1 * modifier);
      } else {
        baseDelta = Math.round(-10 * (2 - modifier));
      }

      deltas[faction] += baseDelta;
    }

    if (hasInsult) {
      const insultModifier = worldVariables
        ? computeVariableTrustModifier(worldVariables, playerFaction)
        : 1.0;
      deltas[playerFaction] -= Math.round(15 * (2 - insultModifier));
    }
  }

  return deltas;
}

/**
 * ComputeVariableTrustModifier: Returns a trust modifier [0.6, 1.6] based on world variables.
 * 1.0 = neutral (average 50). Values below 1.0 make factions harsher; above 1.0 make them more generous.
 * Each faction has a preferred variable they care most about.
 */
function computeVariableTrustModifier(
  worldVariables: WorldVariables,
  faction: Faction
): number {
  // Map each faction to the world variable they care most about
  const factionVarMap: Record<Faction, keyof WorldVariables> = {
    historian: "morale",
    scholar: "infrastructure",
    witness: "morale",
    scribe: "infrastructure",
    diplomat: "economy",
    rebel: "morale",
    merchant: "economy",
  };

  const primaryVar = factionVarMap[faction] || "morale";
  const primaryValue = worldVariables[primaryVar];
  const avgValue = (worldVariables.morale + worldVariables.infrastructure + worldVariables.economy) / 3;

  // Use a blend: 60% primary variable, 40% average
  const effectiveValue = primaryValue * 0.6 + avgValue * 0.4;

  // Scale: 0 → 0.6, 50 → 1.0, 100 → 1.6
  return 0.6 + (effectiveValue / 100) * 1.0;
}

/**
 * ApplyTrustDeltas: Produce a new FactionTrustMap with deltas applied.
 * Clamps each faction's trust to [FACTION_TRUST_MIN, FACTION_TRUST_MAX] (FR15).
 */
export function applyTrustDeltas(
  trustMap: FactionTrustMap,
  deltas: FactionTrustMap
): FactionTrustMap {
  return Object.fromEntries(
    ALL_FACTIONS.map((f) => [f, clampTrust(trustMap[f] + deltas[f])])
  ) as FactionTrustMap;
}

/**
 * IsRefusing: Returns true if a faction's trust is below the refusal threshold (FR17).
 */
export function isRefusing(trust: number): boolean {
  return trust < REFUSING_TRUST_THRESHOLD;
}

/**
 * GetRefusingFactions: Returns all factions currently below the refusal threshold (FR17).
 */
export function getRefusingFactions(trustMap: FactionTrustMap): readonly Faction[] {
  return ALL_FACTIONS.filter((f) => isRefusing(trustMap[f]));
}

/**
 * IsAutoLoss: Returns true when every faction refuses — influence multiplier becomes 0 (FR18).
 */
export function isAutoLoss(trustMap: FactionTrustMap): boolean {
  return ALL_FACTIONS.every((f) => isRefusing(trustMap[f]));
}

function clampTrust(value: number): number {
  return Math.max(FACTION_TRUST_MIN, Math.min(FACTION_TRUST_MAX, value));
}
