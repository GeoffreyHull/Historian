/**
 * Credibility System: Core game logic for claim evaluation.
 * Constraint 1: Pure functions (no I/O, no side effects).
 * Constraint 2: All outputs immutable.
 * Constraint 5: JSON serializable results.
 *
 * Phase 2: Async embedding service integration.
 * Functions accept an optional EmbeddingService for dependency injection.
 * Defaults to JaccardEmbeddingService (deterministic, dev-mode).
 */

import { Claim, Event, CredibilityResult, Faction } from "./types";
import { INSULTING_PHRASES, FACTION_MULTIPLIERS } from "./constants";
import {
  EmbeddingService,
  defaultEmbeddingService,
} from "./embeddingService";

/**
 * Compute semantic similarity between claim text and event description.
 * Phase 2: Delegates to injected EmbeddingService (Transformers.js in production,
 * Jaccard stub in tests). Default is synchronous Jaccard.
 */
export async function computeSemanticSimilarity(
  claimText: string,
  eventDescription: string,
  embeddingService: EmbeddingService = defaultEmbeddingService
): Promise<number> {
  return embeddingService.computeSimilarity(claimText, eventDescription);
}

/**
 * Evaluate claim accuracy as semantic similarity to event description.
 * Returns [0, 100] — higher means the claim better captures the event's meaning.
 */
export async function evaluateClaimAccuracy(
  claim: Claim,
  event: Event,
  embeddingService?: EmbeddingService
): Promise<number> {
  return computeSemanticSimilarity(
    claim.claimText,
    event.description,
    embeddingService
  );
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
export async function evaluateClaim(
  claim: Claim,
  event: Event,
  faction: Faction,
  embeddingService?: EmbeddingService
): Promise<CredibilityResult> {
  const accuracy = await evaluateClaimAccuracy(claim, event, embeddingService);
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
export async function evaluateClaimsBatch(
  claims: readonly Claim[],
  events: readonly Event[],
  faction: Faction,
  embeddingService?: EmbeddingService
): Promise<CredibilityResult[]> {
  const results: CredibilityResult[] = [];
  for (const claim of claims) {
    const event = events.find((e) => e.eventId === claim.eventId);
    if (!event) {
      results.push({
        claim,
        event: null as any,
        accuracy: 0,
        hasInsult: false,
        baseCredibility: 0,
        penalty: 0,
        finalCredibility: 0,
      });
      continue;
    }
    results.push(await evaluateClaim(claim, event, faction, embeddingService));
  }
  return results.filter((result) => result.event);
}
