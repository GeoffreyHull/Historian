"use strict";
/**
 * Claim factory helpers for consistent claim creation in tests.
 * Reduces boilerplate and ensures test claims are deterministic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClaim = createClaim;
exports.createAccurateClaim = createAccurateClaim;
exports.createInaccurateClaim = createInaccurateClaim;
exports.createInsultingClaim = createInsultingClaim;
exports.createUnobservedClaim = createUnobservedClaim;
exports.createMultipleClaims = createMultipleClaims;
const types_1 = require("../../types");
/**
 * createClaim: Factory function with defaults.
 * Default: claim text is generic, event ID is deterministic, turn is 1.
 */
function createClaim(options = {}) {
    return {
        claimText: options.claimText ?? "A claim was made.",
        eventId: options.eventId ?? (0, types_1.createEventId)("evt-default-001"),
        isAboutObservedEvent: options.isAboutObservedEvent ?? true,
        turnNumber: options.turnNumber ?? 1,
    };
}
/**
 * createAccurateClaim: Create a claim that matches event truth value.
 * If event is true, claim affirms; if false, claim denies.
 */
function createAccurateClaim(event, options = {}) {
    const claimText = options.claimText ??
        (event.truthValue === "true"
            ? `This event was true: ${event.description.slice(0, 30)}`
            : `This event was false: ${event.description.slice(0, 30)}`);
    return {
        claimText,
        eventId: options.eventId ?? event.eventId,
        isAboutObservedEvent: options.isAboutObservedEvent ?? true,
        turnNumber: options.turnNumber ?? event.turnNumber,
    };
}
/**
 * createInaccurateClaim: Create a claim that contradicts event truth value.
 * If event is true, claim denies; if false, claim affirms.
 */
function createInaccurateClaim(event, options = {}) {
    const claimText = options.claimText ??
        (event.truthValue === "true"
            ? `This event was false: ${event.description.slice(0, 30)}`
            : `This event was true: ${event.description.slice(0, 30)}`);
    return {
        claimText,
        eventId: options.eventId ?? event.eventId,
        isAboutObservedEvent: options.isAboutObservedEvent ?? true,
        turnNumber: options.turnNumber ?? event.turnNumber,
    };
}
/**
 * createInsultingClaim: Create a claim that contains faction-specific insults.
 * Useful for testing insult detection logic.
 */
function createInsultingClaim(event, faction = "historian", options = {}) {
    const insults = {
        historian: "sloppy",
        scholar: "ignorant",
        witness: "confused",
        scribe: "careless",
    };
    const insult = insults[faction] ?? "dishonest";
    const claimText = options.claimText ?? `The claim is ${insult}: ${event.description.slice(0, 20)}`;
    return {
        claimText,
        eventId: options.eventId ?? event.eventId,
        isAboutObservedEvent: options.isAboutObservedEvent ?? true,
        turnNumber: options.turnNumber ?? event.turnNumber,
    };
}
/**
 * createUnobservedClaim: Create a claim about an event that was NOT observed.
 */
function createUnobservedClaim(event, options = {}) {
    return {
        claimText: options.claimText ?? `Unobserved claim: ${event.description}`,
        eventId: options.eventId ?? event.eventId,
        isAboutObservedEvent: false,
        turnNumber: options.turnNumber ?? event.turnNumber,
    };
}
/**
 * createMultipleClaims: Factory to create multiple claims for batch testing.
 */
function createMultipleClaims(count, baseOptions = {}) {
    return Array.from({ length: count }, (_, i) => createClaim({
        ...baseOptions,
        claimText: `Claim ${i + 1}`,
        turnNumber: (baseOptions.turnNumber ?? 0) + i,
    }));
}
//# sourceMappingURL=claims.js.map