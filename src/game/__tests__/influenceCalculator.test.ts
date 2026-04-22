/**
 * Tests for influenceCalculator (FR19: influence earned = credibility % × faction multiplier).
 * Validates: pure functions, immutability, determinism, edge cases.
 */

import { describe, it, expect } from "vitest";
import { calculateInfluence, aggregateInfluence } from "../influenceCalculator";
import { WEATHER_RAIN, WEATHER_WIND, LOCATION_CASTLE } from "./fixtures/events";
import { createAccurateClaim, createInaccurateClaim } from "./fixtures/claims";
import { CredibilityResult, Faction } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(
  finalCredibility: number,
  overrides: Partial<CredibilityResult> = {}
): CredibilityResult {
  const claim = createAccurateClaim(WEATHER_RAIN);
  return {
    claim,
    event: WEATHER_RAIN,
    accuracy: "correct",
    hasInsult: false,
    baseCredibility: finalCredibility,
    penalty: 0,
    finalCredibility,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateInfluence
// ---------------------------------------------------------------------------

describe("calculateInfluence (FR19)", () => {
  it("should return influence = credibilityScore × multiplier (1.0 for historian)", () => {
    const result = makeResult(80);
    const calc = calculateInfluence(result, "historian");

    expect(calc.influence).toBeCloseTo(0.8);
    expect(calc.multiplier).toBe(1.0);
    expect(calc.credibilityScore).toBe(80);
  });

  it("should return 0 influence for 0 credibility", () => {
    const result = makeResult(0);
    const calc = calculateInfluence(result, "historian");

    expect(calc.influence).toBe(0);
  });

  it("should return 1.0 influence for 100 credibility", () => {
    const result = makeResult(100);
    const calc = calculateInfluence(result, "historian");

    expect(calc.influence).toBeCloseTo(1.0);
  });

  it("should apply multiplier 1.0 for all MVP factions", () => {
    const factions: Faction[] = ["historian", "scholar", "witness", "scribe"];
    const result = makeResult(60);

    for (const faction of factions) {
      const calc = calculateInfluence(result, faction);
      expect(calc.multiplier).toBe(1.0);
      expect(calc.influence).toBeCloseTo(0.6);
    }
  });

  it("should carry claim and credibilityResult in output", () => {
    const result = makeResult(50);
    const calc = calculateInfluence(result, "scholar");

    expect(calc.claim).toBe(result.claim);
    expect(calc.credibilityResult).toBe(result);
    expect(calc.faction).toBe("scholar");
  });

  it("should not mutate the input credibilityResult", () => {
    const result = makeResult(75);
    const frozen = JSON.parse(JSON.stringify(result)) as CredibilityResult;

    calculateInfluence(result, "historian");

    expect(JSON.stringify(result)).toBe(JSON.stringify(frozen));
  });

  it("should produce identical output for identical inputs (determinism)", () => {
    const result = makeResult(42);
    const a = calculateInfluence(result, "historian");
    const b = calculateInfluence(result, "historian");

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------------
// aggregateInfluence
// ---------------------------------------------------------------------------

describe("aggregateInfluence (FR19)", () => {
  it("should return 0 for empty results array", () => {
    expect(aggregateInfluence([], "historian")).toBe(0);
  });

  it("should sum influence from multiple results", () => {
    const results = [makeResult(100), makeResult(50)];
    // (100/100 * 1.0) + (50/100 * 1.0) = 1.0 + 0.5 = 1.5
    expect(aggregateInfluence(results, "historian")).toBeCloseTo(1.5);
  });

  it("should return 0 for all-zero credibility", () => {
    const results = [makeResult(0), makeResult(0), makeResult(0)];
    expect(aggregateInfluence(results, "historian")).toBe(0);
  });

  it("should handle a single result correctly", () => {
    const results = [makeResult(80)];
    expect(aggregateInfluence(results, "historian")).toBeCloseTo(0.8);
  });

  it("should not mutate input array", () => {
    const results = [makeResult(60), makeResult(40)];
    const frozen = JSON.parse(JSON.stringify(results)) as CredibilityResult[];

    aggregateInfluence(results, "historian");

    expect(JSON.stringify(results)).toBe(JSON.stringify(frozen));
  });

  it("should be deterministic across repeated calls", () => {
    const results = [makeResult(70), makeResult(30)];
    const a = aggregateInfluence(results, "historian");
    const b = aggregateInfluence(results, "historian");

    expect(a).toBe(b);
  });

  it("should work with results from different events", () => {
    const claim1 = createAccurateClaim(WEATHER_WIND);
    const claim2 = createInaccurateClaim(LOCATION_CASTLE);
    const result1: CredibilityResult = {
      claim: claim1,
      event: WEATHER_WIND,
      accuracy: "correct",
      hasInsult: false,
      baseCredibility: 90,
      penalty: 0,
      finalCredibility: 90,
    };
    const result2: CredibilityResult = {
      claim: claim2,
      event: LOCATION_CASTLE,
      accuracy: "incorrect",
      hasInsult: false,
      baseCredibility: 0,
      penalty: 0,
      finalCredibility: 0,
    };

    const total = aggregateInfluence([result1, result2], "witness");
    expect(total).toBeCloseTo(0.9);
  });
});
