/**
 * Test utilities for parametrized testing, immutability checks, and determinism validation.
 * Supports S4 credibility system testing with 120+ parametrized test cases.
 */
import { Claim, Event } from "../../types";
/**
 * Deep clone utility: Create independent copy of object.
 * Used for immutability testing: mutate the copy, verify original unchanged.
 */
export declare function deepClone<T>(obj: T): T;
/**
 * assertImmutable: Verify that a function doesn't mutate its inputs.
 * Pattern: Clone inputs, call function, verify original unchanged, mutant changed.
 */
export declare function assertImmutable<T extends object>(original: T, mutateAndTest: (clone: T) => void): void;
/**
 * assertDeterministic: Verify that a function produces identical output
 * when called multiple times with identical inputs.
 * Calls function repeatCount times (default 100), compares all outputs.
 */
export declare function assertDeterministic<T>(fn: () => T, repeatCount?: number): void;
/**
 * hashGameState: Create deterministic hash of game state.
 * Used for validating turn-phase determinism (same seed = identical state hash).
 */
export declare function hashGameState(state: unknown): string;
/**
 * TestCase: Generic parametrized test case structure.
 * Subclasses define specific test case formats (accuracy, penalty, insult, etc.)
 */
export interface TestCase {
    description: string;
}
/**
 * AccuracyTestCase: Test case for accuracy evaluation.
 */
export interface AccuracyTestCase extends TestCase {
    claim: Claim;
    event: Event;
    expectedAccuracy: "correct" | "incorrect";
}
/**
 * PenaltyTestCase: Test case for penalty calculation.
 */
export interface PenaltyTestCase extends TestCase {
    baseCredibility: number;
    hasInsult: boolean;
    expectedPenalty: number;
    expectedFinal: number;
}
/**
 * InsultTestCase: Test case for insult detection.
 */
export interface InsultTestCase extends TestCase {
    claimText: string;
    faction: string;
    expectedHasInsult: boolean;
}
/**
 * InfluenceTestCase: Test case for influence calculation.
 */
export interface InfluenceTestCase extends TestCase {
    credibilityScore: number;
    faction: string;
    expectedMultiplier: number;
    expectedInfluence: number;
}
/**
 * generateAccuracyTestCases: Parametrized test cases for accuracy evaluation.
 * Returns iterator yielding 30–40 cases covering exact match, keyword, partial, no match, edge cases.
 */
export declare function generateAccuracyTestCases(): Generator<AccuracyTestCase>;
/**
 * generatePenaltyTestCases: Parametrized test cases for penalty calculation.
 * Returns iterator yielding 25–30 cases for single error, insults, stacking, clamping.
 */
export declare function generatePenaltyTestCases(): Generator<PenaltyTestCase>;
/**
 * generateInsultTestCases: Parametrized test cases for insult detection.
 * Returns iterator yielding 20–25 cases per faction.
 */
export declare function generateInsultTestCases(faction?: string): Generator<InsultTestCase>;
/**
 * generateInfluenceTestCases: Parametrized test cases for influence calculation.
 * Returns iterator yielding 10–15 cases per faction.
 */
export declare function generateInfluenceTestCases(): Generator<InfluenceTestCase>;
//# sourceMappingURL=testHelpers.d.ts.map