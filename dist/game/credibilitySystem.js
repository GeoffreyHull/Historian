"use strict";
/**
 * Credibility System: Core game logic for claim evaluation.
 * Constraint 1: Pure functions (no I/O, no side effects).
 * Constraint 2: All outputs immutable.
 * Constraint 5: JSON serializable results.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateClaimAccuracy = evaluateClaimAccuracy;
exports.detectInsult = detectInsult;
exports.calculatePenalty = calculatePenalty;
exports.calculateCredibility = calculateCredibility;
exports.evaluateClaim = evaluateClaim;
exports.calculateInfluence = calculateInfluence;
exports.evaluateClaimsBatch = evaluateClaimsBatch;
const constants_1 = require("./constants");
/**
 * Evaluate claim accuracy by comparing claim text keywords to event truth.
 * 60% match threshold: if ≥60% of claim keywords match event type, accuracy depends on event truth.
 */
function evaluateClaimAccuracy(claim, event) {
    const keywords = constants_1.EVENT_TYPE_KEYWORDS[event.eventType] || [];
    if (keywords.length === 0) {
        return "incorrect"; // No keywords for this event type
    }
    // Count how many event keywords appear in claim text (case-insensitive)
    const claimLower = claim.claimText.toLowerCase();
    const matchedKeywords = keywords.filter((kw) => claimLower.includes(kw.toLowerCase()));
    const matchRatio = matchedKeywords.length / keywords.length;
    // If ≥60% keywords match, treat claim as affirming the event
    const claimAffirmsEvent = matchRatio >= 0.6;
    // Compare to event truth value
    const eventIsTrue = event.truthValue === "true";
    const isAccurate = claimAffirmsEvent === eventIsTrue;
    return isAccurate ? "correct" : "incorrect";
}
/**
 * Detect if claim contains faction-specific insults.
 * Checks if claim text contains any phrase from faction's insult list.
 */
function detectInsult(claim, faction) {
    const insults = constants_1.INSULTING_PHRASES[faction] || [];
    const claimLower = claim.claimText.toLowerCase();
    return insults.some((insult) => claimLower.includes(insult.toLowerCase()));
}
/**
 * Calculate credibility penalty based on accuracy and insults.
 * Base penalty: 0% if correct, 20% if incorrect.
 * Insult penalty: additional 5-10% per insult.
 * Clamped to [0, 100].
 */
function calculatePenalty(accuracy, hasInsult) {
    let penalty = accuracy === "correct" ? 0 : 20;
    if (hasInsult) {
        penalty += 10;
    }
    return Math.min(penalty, 100); // Clamp to [0, 100]
}
/**
 * Calculate final credibility score.
 * Starts at 50 (neutral), adjusts based on penalty.
 */
function calculateCredibility(penalty) {
    const baseCredibility = 50; // Neutral starting point
    const finalCredibility = Math.max(0, baseCredibility - penalty); // Clamp to [0, 100]
    return Math.min(finalCredibility, 100);
}
/**
 * Evaluate a single claim against an event.
 * Returns comprehensive credibility result.
 */
function evaluateClaim(claim, event, faction) {
    const accuracy = evaluateClaimAccuracy(claim, event);
    const hasInsult = detectInsult(claim, faction);
    const penalty = calculatePenalty(accuracy, hasInsult);
    const finalCredibility = calculateCredibility(penalty);
    return {
        claim,
        event,
        accuracy,
        hasInsult,
        baseCredibility: 50,
        penalty,
        finalCredibility,
    };
}
/**
 * Calculate influence from credibility result.
 * Influence = credibility × faction.multiplier
 */
function calculateInfluence(credibilityResult, faction) {
    const multiplier = constants_1.FACTION_MULTIPLIERS[faction] || 1.0;
    return credibilityResult.finalCredibility * multiplier;
}
/**
 * Batch evaluate multiple claims.
 * Pure function: doesn't mutate inputs, returns new array.
 */
function evaluateClaimsBatch(claims, events, faction) {
    return claims
        .map((claim) => {
        const event = events.find((e) => e.eventId === claim.eventId);
        if (!event) {
            // Event not found: treat as incorrect
            return {
                claim,
                event: null, // This shouldn't happen with valid data
                accuracy: "incorrect",
                hasInsult: false,
                baseCredibility: 50,
                penalty: 20,
                finalCredibility: 30,
            };
        }
        return evaluateClaim(claim, event, faction);
    })
        .filter((result) => result.event); // Filter out missing events
}
//# sourceMappingURL=credibilitySystem.js.map