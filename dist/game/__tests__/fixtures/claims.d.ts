/**
 * Claim factory helpers for consistent claim creation in tests.
 * Reduces boilerplate and ensures test claims are deterministic.
 */
import { Claim, Event, EventId } from "../../types";
interface ClaimFactoryOptions {
    claimText?: string;
    eventId?: EventId;
    isAboutObservedEvent?: boolean;
    turnNumber?: number;
}
/**
 * createClaim: Factory function with defaults.
 * Default: claim text is generic, event ID is deterministic, turn is 1.
 */
export declare function createClaim(options?: ClaimFactoryOptions): Claim;
/**
 * createAccurateClaim: Create a claim that matches event truth value.
 * If event is true, claim affirms; if false, claim denies.
 */
export declare function createAccurateClaim(event: Event, options?: ClaimFactoryOptions): Claim;
/**
 * createInaccurateClaim: Create a claim that contradicts event truth value.
 * If event is true, claim denies; if false, claim affirms.
 */
export declare function createInaccurateClaim(event: Event, options?: ClaimFactoryOptions): Claim;
/**
 * createInsultingClaim: Create a claim that contains faction-specific insults.
 * Useful for testing insult detection logic.
 */
export declare function createInsultingClaim(event: Event, faction?: string, options?: ClaimFactoryOptions): Claim;
/**
 * createUnobservedClaim: Create a claim about an event that was NOT observed.
 */
export declare function createUnobservedClaim(event: Event, options?: ClaimFactoryOptions): Claim;
/**
 * createMultipleClaims: Factory to create multiple claims for batch testing.
 */
export declare function createMultipleClaims(count: number, baseOptions?: ClaimFactoryOptions): Claim[];
export {};
//# sourceMappingURL=claims.d.ts.map