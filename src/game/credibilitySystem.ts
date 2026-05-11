/**
 * Credibility System: Core game logic for claim evaluation.
 * Constraint 1: Pure functions (no I/O, no side effects).
 * Constraint 2: All outputs immutable.
 * Constraint 5: JSON serializable results.
 */

import { Claim, Event, CredibilityResult, Faction } from "./types";
import { INSULTING_PHRASES, FACTION_MULTIPLIERS, STOP_WORDS } from "./constants";

/**
 * Tokenize text: lowercase, strip punctuation, remove stop words and single chars.
 * Used by computeSemanticSimilarity for both claim and event description.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  );
}

/**
 * Compute semantic similarity between claim text and event description.
 * Phase 1: Jaccard similarity on stop-word-filtered token sets. Range [0, 100].
 * Phase 2 (follow-up): replace body with Transformers.js cosine similarity.
 */
export function computeSemanticSimilarity(
  claimText: string,
  eventDescription: string
): number {
  if (!claimText || !eventDescription) return 0;
  const claimTokens = tokenize(claimText);
  const eventTokens = tokenize(eventDescription);
  if (claimTokens.size === 0 || eventTokens.size === 0) return 0;
  const intersection = [...claimTokens].filter((t) => eventTokens.has(t)).length;
  const union = new Set([...claimTokens, ...eventTokens]).size;
  return Math.round((intersection / union) * 100);
}

/**
 * Evaluate claim accuracy as semantic similarity to event description.
 * Returns [0, 100] — higher means the claim better captures the event's meaning.
 */
export function evaluateClaimAccuracy(claim: Claim, event: Event): number {
  return computeSemanticSimilarity(claim.claimText, event.description);
}

/**
 * Detect if claim contains faction-specific insults.
 */
export function detectInsult(claim: Claim, faction: Faction): boolean {
  const insults = INSULTING_PHRASES[faction] || [];
  const claimLower = claim.claimText.toLowerCase();
  return insults.some((insult) => claimLower.includes(insult.toLowerCase()));
}

/**
 * Calculate credibility penalty.
 * Only insult incurs a penalty — similarity score already encodes accuracy.
 */
export function calculatePenalty(similarity: number, hasInsult: boolean): number {
  void similarity; // similarity informs baseCredibility, not the penalty formula
  return hasInsult ? 10 : 0;
}

/**
 * Calculate final credibility score from similarity and penalty.
 * Clamped to [0, 100].
 */
export function calculateCredibility(similarity: number, penalty: number): number {
  return Math.min(100, Math.max(0, similarity - penalty));
}

/**
 * Evaluate a single claim against an event.
 * Returns comprehensive credibility result.
 */
export function evaluateClaim(claim: Claim, event: Event, faction: Faction): CredibilityResult {
  const accuracy = evaluateClaimAccuracy(claim, event);
  const hasInsult = detectInsult(claim, faction);
  const penalty = calculatePenalty(accuracy, hasInsult);
  const finalCredibility = calculateCredibility(accuracy, penalty);

  return {
    claim,
    event,
    accuracy,
    hasInsult,
    baseCredibility: accuracy,
    penalty,
    finalCredibility,
  };
}

/**
 * Calculate influence from credibility result.
 * Influence = credibility × faction multiplier.
 */
export function calculateInfluence(
  credibilityResult: CredibilityResult,
  faction: Faction
): number {
  const multiplier = FACTION_MULTIPLIERS[faction] || 1.0;
  return credibilityResult.finalCredibility * multiplier;
}

/**
 * Batch evaluate multiple claims.
 * Pure function: doesn't mutate inputs, returns new array.
 */
export function evaluateClaimsBatch(
  claims: readonly Claim[],
  events: readonly Event[],
  faction: Faction
): CredibilityResult[] {
  return claims
    .map((claim) => {
      const event = events.find((e) => e.eventId === claim.eventId);
      if (!event) {
        return {
          claim,
          event: null as any,
          accuracy: 0,
          hasInsult: false,
          baseCredibility: 0,
          penalty: 0,
          finalCredibility: 0,
        };
      }
      return evaluateClaim(claim, event, faction);
    })
    .filter((result) => result.event);
}
