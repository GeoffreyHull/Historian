/**
 * FactionTrustSystem: Pure functions for managing faction trust across turns.
 * FR15: Each faction has a trust value in the range [-200, +100].
 * FR16: Trust changes based on credibility scores and claim content.
 * FR17: Factions below -100 trust refuse to buy the next book (loss condition).
 * FR18: All factions refusing = influence multiplier 0 (auto-loss).
 * Constraint 1: Pure functions, no I/O, no side effects.
 * Constraint 2: All outputs are new objects; inputs are never mutated.
 */

import { CredibilityResult, Faction } from "./types";

export type FactionTrustMap = Readonly<Record<Faction, number>>;

export const FACTION_TRUST_MIN = -200;
export const FACTION_TRUST_MAX = 100;
export const REFUSING_TRUST_THRESHOLD = -100;

const ALL_FACTIONS: readonly Faction[] = ["historian", "scholar", "witness", "scribe"];

/**
 * CreateInitialTrustMap: All factions start at neutral trust (0).
 */
export function createInitialTrustMap(): FactionTrustMap {
  return { historian: 0, scholar: 0, witness: 0, scribe: 0 };
}

/**
 * ComputeTrustDeltas: Derive per-faction trust changes from credibility results.
 *
 * Rules:
 * - High credibility (≥70): +5 trust for all factions
 * - Medium credibility (40–69): +1 trust for all factions
 * - Low credibility (<40): −10 trust for all factions
 * - Insult detected in claim: additional −15 trust for the player's faction
 */
export function computeTrustDeltas(
  results: readonly CredibilityResult[],
  playerFaction: Faction
): FactionTrustMap {
  const deltas: Record<Faction, number> = { historian: 0, scholar: 0, witness: 0, scribe: 0 };

  for (const result of results) {
    const { finalCredibility, hasInsult } = result;

    let baseDelta: number;
    if (finalCredibility >= 70) {
      baseDelta = 5;
    } else if (finalCredibility >= 40) {
      baseDelta = 1;
    } else {
      baseDelta = -10;
    }

    for (const faction of ALL_FACTIONS) {
      deltas[faction] += baseDelta;
    }

    if (hasInsult) {
      deltas[playerFaction] -= 15;
    }
  }

  return deltas;
}

/**
 * ApplyTrustDeltas: Produce a new FactionTrustMap with deltas applied.
 * Clamps each faction's trust to [FACTION_TRUST_MIN, FACTION_TRUST_MAX] (FR15).
 */
export function applyTrustDeltas(
  trustMap: FactionTrustMap,
  deltas: FactionTrustMap
): FactionTrustMap {
  return {
    historian: clampTrust(trustMap.historian + deltas.historian),
    scholar: clampTrust(trustMap.scholar + deltas.scholar),
    witness: clampTrust(trustMap.witness + deltas.witness),
    scribe: clampTrust(trustMap.scribe + deltas.scribe),
  };
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
