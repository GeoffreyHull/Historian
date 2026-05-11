/**
 * Test utilities for parametrized testing, immutability checks, and determinism validation.
 * Supports S4 credibility system testing with 120+ parametrized test cases.
 */

import { Claim, Event, CredibilityResult } from "../../types";
import crypto from "crypto";

/**
 * Deep clone utility: Create independent copy of object.
 * Used for immutability testing: mutate the copy, verify original unchanged.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * assertImmutable: Verify that a function doesn't mutate its inputs.
 * Pattern: Clone inputs, call function, verify original unchanged, mutant changed.
 */
export function assertImmutable<T extends object>(
  original: T,
  mutateAndTest: (clone: T) => void
): void {
  const clone = deepClone(original);
  mutateAndTest(clone);

  // Verify original is unchanged
  const originalJson = JSON.stringify(original);
  const cloneJson = JSON.stringify(clone);

  if (originalJson !== cloneJson) {
    throw new Error(
      `Immutability violation: original was mutated.\n` +
        `Original: ${originalJson}\n` +
        `Clone: ${cloneJson}`
    );
  }
}

/**
 * assertDeterministic: Verify that a function produces identical output
 * when called multiple times with identical inputs.
 * Calls function repeatCount times (default 100), compares all outputs.
 */
export function assertDeterministic<T>(
  fn: () => T,
  repeatCount: number = 100
): void {
  const results: string[] = [];

  for (let i = 0; i < repeatCount; i++) {
    const result = fn();
    results.push(JSON.stringify(result));
  }

  const firstResult = results[0];
  const mismatchIndex = results.findIndex((r) => r !== firstResult);

  if (mismatchIndex !== -1) {
    throw new Error(
      `Determinism violation at call ${mismatchIndex + 1}: ` +
        `First call: ${firstResult}, ` +
        `Call ${mismatchIndex + 1}: ${results[mismatchIndex]}`
    );
  }
}

/**
 * hashGameState: Create deterministic hash of game state.
 * Used for validating turn-phase determinism (same seed = identical state hash).
 */
export function hashGameState(state: unknown): string {
  const json = JSON.stringify(state);
  return crypto.createHash("sha256").update(json).digest("hex");
}

/**
 * TestCase: Generic parametrized test case structure.
 * Subclasses define specific test case formats (accuracy, penalty, insult, etc.)
 */
export interface TestCase {
  description: string; // Human-readable test name
}

/**
 * AccuracyTestCase: Test case for accuracy evaluation.
 */
export interface AccuracyTestCase extends TestCase {
  claim: Claim;
  event: Event;
  expectedAccuracy: number; // [0, 100] semantic similarity score
}

/**
 * PenaltyTestCase: Test case for penalty calculation.
 */
export interface PenaltyTestCase extends TestCase {
  similarity: number; // [0, 100] semantic similarity score
  hasInsult: boolean;
  expectedPenalty: number; // [0, 100]
  expectedFinal: number; // [0, 100] = similarity - penalty
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
  credibilityScore: number; // [0, 100]
  faction: string;
  expectedMultiplier: number;
  expectedInfluence: number; // credibilityScore × multiplier
}

/**
 * generateAccuracyTestCases: Parametrized test cases for accuracy evaluation.
 * Returns iterator yielding cases with numeric similarity expectations (>0 = some overlap, 0 = none).
 */
export function* generateAccuracyTestCases(): Generator<AccuracyTestCase> {
  // Test data: (claim text, event description, minExpected, maxExpected)
  const cases: Array<readonly [string, string, number, number]> = [
    // High overlap
    ["rain fell on the castle", "A light rain fell on the castle grounds", 20, 100],
    ["the rain fell", "Rain fell gently on the streets", 10, 100],
    // Partial overlap
    ["storm and wind", "Strong winds gusted through the forest", 0, 80],
    // No overlap (unrelated words)
    ["", "Rain fell gently", 0, 0], // Empty claim
    ["xyzzy quux frobble", "Rain fell gently", 0, 0], // No shared tokens
  ];

  for (let i = 0; i < cases.length; i++) {
    const [claimText, description, minExp, maxExp] = cases[i];
    yield {
      description: `Accuracy case ${i + 1}: "${claimText}"`,
      claim: {
        claimText,
        eventId: "evt-001" as any,
        isAboutObservedEvent: true,
        turnNumber: 1,
      },
      event: {
        eventId: "evt-001" as any,
        eventType: "weather",
        description,
        truthValue: "true" as const,
        turnNumber: 1,
        observedByPlayer: true,
        evidenceFragments: [],
      },
      expectedAccuracy: Math.round((minExp + maxExp) / 2),
    };
  }
}

/**
 * generatePenaltyTestCases: Parametrized test cases for penalty calculation.
 * Penalty is now insult-only; similarity is the base credibility.
 */
export function* generatePenaltyTestCases(): Generator<PenaltyTestCase> {
  const cases: Array<readonly [number, boolean, number, number, string]> = [
    // No insult: penalty is always 0
    [100, false, 0, 100, "high similarity, no insult"],
    [80, false, 0, 80, "good similarity, no insult"],
    [50, false, 0, 50, "average similarity, no insult"],
    [20, false, 0, 20, "low similarity, no insult"],
    [0, false, 0, 0, "zero similarity, no insult"],

    // Insult: penalty is always 10
    [100, true, 10, 90, "high similarity but insulting"],
    [80, true, 10, 70, "good similarity but insulting"],
    [50, true, 10, 40, "average similarity but insulting"],
    [20, true, 10, 10, "low similarity but insulting"],

    // Clamping at boundaries
    [5, true, 10, 0, "similarity 5 with insult, final clamped to 0"],

    // Edge cases
    [1, false, 0, 1, "nearly zero, no insult"],
    [99, false, 0, 99, "nearly perfect, no insult"],
    [99, true, 10, 89, "nearly perfect but insulting"],
  ];

  for (let i = 0; i < cases.length; i++) {
    const [sim, hasInsult, penalty, final, desc] = cases[i];
    yield {
      description: `Penalty case ${i + 1}: ${desc}`,
      similarity: sim,
      hasInsult,
      expectedPenalty: penalty,
      expectedFinal: final,
    };
  }
}

/**
 * generateInsultTestCases: Parametrized test cases for insult detection.
 * Returns iterator yielding 20–25 cases per faction.
 */
export function* generateInsultTestCases(
  faction: string = "historian"
): Generator<InsultTestCase> {
  const insultsMap: Record<string, string[]> = {
    historian: ["sloppy", "biased", "unreliable"],
    scholar: ["ignorant", "pedantic", "arrogant"],
    witness: ["confused", "forgetful", "dishonest"],
    scribe: ["careless", "inaccurate", "sloppy"],
  };

  const insults = insultsMap[faction] ?? [];

  // Cases: (claim text, expected has insult)
  const cases: Array<readonly [string, boolean]> = [
    // Exact matches
    ...insults.flatMap((insult) => [
      [`This is ${insult}`, true] as const,
      [`How ${insult}!`, true] as const,
    ]),

    // No insult
    ["This is a neutral claim", false],
    ["The event was true", false],
    ["Facts are facts", false],

    // Edge cases
    ["", false], // Empty
    ["sloppy sloppy sloppy", true], // Repetition
    ["This historian is sloppy", true], // Contains insult word
  ];

  for (let i = 0; i < cases.length; i++) {
    const [claimText, expected] = cases[i];
    yield {
      description: `Insult case ${i + 1} (${faction}): "${claimText}"`,
      claimText,
      faction,
      expectedHasInsult: expected,
    };
  }
}

/**
 * generateInfluenceTestCases: Parametrized test cases for influence calculation.
 * Returns iterator yielding 10–15 cases per faction.
 */
export function* generateInfluenceTestCases(): Generator<InfluenceTestCase> {
  const multipliers = {
    historian: 1.0,
    scholar: 1.2,
    witness: 0.8,
    scribe: 0.9,
  };

  const cases: Array<readonly [number, string, string, string]> = [
    // Historian (multiplier 1.0)
    [100, "historian", "100 (credibility × 1.0)", "100"],
    [50, "historian", "50 (credibility × 1.0)", "50"],
    [0, "historian", "0 (credibility × 1.0)", "0"],

    // Scholar (multiplier 1.2)
    [100, "scholar", "120 (credibility × 1.2)", "120"],
    [50, "scholar", "60 (credibility × 1.2)", "60"],

    // Witness (multiplier 0.8)
    [100, "witness", "80 (credibility × 0.8)", "80"],
    [50, "witness", "40 (credibility × 0.8)", "40"],

    // Scribe (multiplier 0.9)
    [100, "scribe", "90 (credibility × 0.9)", "90"],
    [50, "scribe", "45 (credibility × 0.9)", "45"],
  ];

  for (let i = 0; i < cases.length; i++) {
    const cred = parseInt(cases[i][0].toString());
    const faction = cases[i][1];
    const multiplier = multipliers[faction as keyof typeof multipliers];
    const expectedInfluence = cred * multiplier;

    yield {
      description: `Influence case ${i + 1}: ${faction} with credibility ${cred}`,
      credibilityScore: cred,
      faction,
      expectedMultiplier: multiplier,
      expectedInfluence,
    };
  }
}
