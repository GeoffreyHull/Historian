/**
 * Credibility System: Core game logic for claim evaluation.
 * Constraint 1: Pure functions (no I/O, no side effects).
 * Constraint 2: All outputs immutable.
 * Constraint 5: JSON serializable results.
 */
import { Claim, Event, CredibilityResult, Faction } from "./types";
/**
 * Evaluate claim accuracy by comparing claim text keywords to event truth.
 * 60% match threshold: if ≥60% of claim keywords match event type, accuracy depends on event truth.
 */
export declare function evaluateClaimAccuracy(claim: Claim, event: Event): "correct" | "incorrect";
/**
 * Detect if claim contains faction-specific insults.
 * Checks if claim text contains any phrase from faction's insult list.
 */
export declare function detectInsult(claim: Claim, faction: Faction): boolean;
/**
 * Calculate credibility penalty based on accuracy and insults.
 * Base penalty: 0% if correct, 20% if incorrect.
 * Insult penalty: additional 5-10% per insult.
 * Clamped to [0, 100].
 */
export declare function calculatePenalty(accuracy: "correct" | "incorrect", hasInsult: boolean): number;
/**
 * Calculate final credibility score.
 * Starts at 50 (neutral), adjusts based on penalty.
 */
export declare function calculateCredibility(penalty: number): number;
/**
 * Evaluate a single claim against an event.
 * Returns comprehensive credibility result.
 */
export declare function evaluateClaim(claim: Claim, event: Event, faction: Faction): CredibilityResult;
/**
 * Calculate influence from credibility result.
 * Influence = credibility × faction.multiplier
 */
export declare function calculateInfluence(credibilityResult: CredibilityResult, faction: Faction): number;
/**
 * Batch evaluate multiple claims.
 * Pure function: doesn't mutate inputs, returns new array.
 */
export declare function evaluateClaimsBatch(claims: readonly Claim[], events: readonly Event[], faction: Faction): CredibilityResult[];
//# sourceMappingURL=credibilitySystem.d.ts.map