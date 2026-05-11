/**
 * FactionTrustSystem Tests
 * Validates: trust delta computation, clamping, refusal detection, auto-loss,
 * immutability (Constraint 2), and determinism (Constraint 1).
 *
 * Golden tests (marked [G]) protect core FR15-FR18 constraints.
 */

import { describe, it, expect } from "vitest";
import { golden } from "./utils/golden";
import {
  computeTrustDeltas,
  applyTrustDeltas,
  isRefusing,
  getRefusingFactions,
  isAutoLoss,
  createInitialTrustMap,
  REFUSING_TRUST_THRESHOLD,
  FACTION_TRUST_MIN,
  FACTION_TRUST_MAX,
  FactionTrustMap,
} from "../factionTrustSystem";
import { CredibilityResult, Faction } from "../types";
import { SEEDED_EVENTS } from "./fixtures/events";
import { createClaim } from "./fixtures/claims";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(
  finalCredibility: number,
  hasInsult: boolean = false
): CredibilityResult {
  const claim = createClaim({ claimText: "test claim" });
  const event = SEEDED_EVENTS[0];
  return {
    claim,
    event,
    accuracy: finalCredibility,
    hasInsult,
    baseCredibility: 50,
    penalty: Math.max(0, 50 - finalCredibility),
    finalCredibility,
  };
}

const ALL_FACTIONS: readonly Faction[] = ["historian", "scholar", "witness", "scribe", "diplomat", "rebel", "merchant"];

// ---------------------------------------------------------------------------
// createInitialTrustMap
// ---------------------------------------------------------------------------

describe("createInitialTrustMap", () => {
  it("should return all factions at 0", () => {
    const trust = createInitialTrustMap();
    for (const faction of ALL_FACTIONS) {
      expect(trust[faction]).toBe(0);
    }
  });

  it("should include all seven factions", () => {
    const trust = createInitialTrustMap();
    expect(Object.keys(trust)).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// computeTrustDeltas
// ---------------------------------------------------------------------------

describe("computeTrustDeltas", () => {
  it("should return +5 for all factions when credibility >= 70", () => {
    const result = makeResult(75);
    const deltas = computeTrustDeltas([result], "historian");
    for (const faction of ALL_FACTIONS) {
      expect(deltas[faction]).toBe(5);
    }
  });

  it("should return +1 for all factions when credibility is 40–69", () => {
    const result = makeResult(50);
    const deltas = computeTrustDeltas([result], "historian");
    for (const faction of ALL_FACTIONS) {
      expect(deltas[faction]).toBe(1);
    }
  });

  it("should return −10 for all factions when credibility < 40", () => {
    const result = makeResult(30);
    const deltas = computeTrustDeltas([result], "historian");
    for (const faction of ALL_FACTIONS) {
      expect(deltas[faction]).toBe(-10);
    }
  });

  it("should apply −15 extra to player faction when insult detected", () => {
    const result = makeResult(75, true);
    const deltas = computeTrustDeltas([result], "historian");
    // historian = 5 (high credibility) − 15 (insult) = −10
    expect(deltas.historian).toBe(-10);
    // other factions unaffected by insult
    expect(deltas.scholar).toBe(5);
    expect(deltas.witness).toBe(5);
    expect(deltas.scribe).toBe(5);
  });

  it("should accumulate across multiple results", () => {
    const results = [makeResult(75), makeResult(30)]; // +5 then −10 = −5
    const deltas = computeTrustDeltas(results, "historian");
    for (const faction of ALL_FACTIONS) {
      expect(deltas[faction]).toBe(-5);
    }
  });

  it("should return zero deltas for empty results", () => {
    const deltas = computeTrustDeltas([], "historian");
    for (const faction of ALL_FACTIONS) {
      expect(deltas[faction]).toBe(0);
    }
  });

  it("should direct insult penalty only to the player faction, not others", () => {
    const result = makeResult(50, true);
    const deltas = computeTrustDeltas([result], "scribe");
    // scribe gets +1 (medium) − 15 (insult) = −14
    expect(deltas.scribe).toBe(-14);
    // others get only +1
    expect(deltas.historian).toBe(1);
    expect(deltas.scholar).toBe(1);
    expect(deltas.witness).toBe(1);
  });

  it("should return different deltas with world variable modifier when variables are healthy", () => {
    const result = makeResult(75);
    const healthyVars = { morale: 90, infrastructure: 80, economy: 85 };
    const deltas = computeTrustDeltas([result], "historian", healthyVars);
    // historian cares about morale → effective = 90*0.6 + avg(85)*0.4 = 54+34=88 → modifier = 0.6+(88/100)=1.48
    // baseDelta = Math.round(5 * 1.48) = 7
    expect(deltas.historian).toBeGreaterThan(5);
  });

  it("should return different deltas with world variable modifier when variables are poor", () => {
    const result = makeResult(75);
    const poorVars = { morale: 10, infrastructure: 15, economy: 20 };
    const deltas = computeTrustDeltas([result], "historian", poorVars);
    // historian cares about morale → effective = 10*0.6 + avg(15)*0.4 = 6+6=12 → modifier = 0.6+(12/100)=0.72
    // baseDelta = Math.round(5 * 0.72) = 4
    expect(deltas.historian).toBeLessThan(5);
  });

  it("should return standard deltas when world variables are at default (50)", () => {
    const result = makeResult(75);
    const defaultVars = { morale: 50, infrastructure: 50, economy: 50 };
    const deltas = computeTrustDeltas([result], "historian", defaultVars);
    // effective = 50*0.6 + 50*0.4 = 50 → modifier = 0.6 + 0.5 = 1.1
    // baseDelta = Math.round(5 * 1.1) = 6 (slightly above base 5)
    expect(deltas.historian).toBe(6);
  });

  it("should apply different modifiers per faction based on preferred variable", () => {
    const result = makeResult(75);
    const vars = { morale: 90, infrastructure: 10, economy: 50 };
    const deltas = computeTrustDeltas([result], "historian", vars);
    // historian cares about morale → high modifier
    // merchant cares about economy → medium modifier
    expect(deltas.historian).toBeGreaterThan(deltas.merchant);
  });

  it("should amplify penalty when world variables are poor and credibility is low", () => {
    const result = makeResult(20); // low credibility = -10 base
    const poorVars = { morale: 5, infrastructure: 5, economy: 5 };
    const deltas = computeTrustDeltas([result], "historian", poorVars);
    // modifier = 0.6 + (5/100) = 0.65
    // baseDelta = Math.round(-10 * (2 - 0.65)) = Math.round(-10 * 1.35) = Math.round(-13.5) = -14
    expect(deltas.historian).toBeLessThan(-10); // penalty is worse than normal -10
  });

  it("should reduce insult penalty when world variables are healthy", () => {
    const result = makeResult(50, true); // insult
    const healthyVars = { morale: 90, infrastructure: 90, economy: 90 };
    const deltas = computeTrustDeltas([result], "historian", healthyVars);
    // With high effective value, modifier > 1, so (2 - modifier) < 1
    // insult penalty = 15 * (2 - modifier) < 15
    expect(deltas.historian).toBeGreaterThan(-14); // -14 instead of -14 with default
  });

  golden("should produce identical deltas with world variables for same inputs (determinism)", () => {
    const vars = { morale: 30, infrastructure: 70, economy: 50 };
    const results = [makeResult(75)];
    const d1 = computeTrustDeltas(results, "historian", vars);
    const d2 = computeTrustDeltas(results, "historian", vars);
    for (const faction of ALL_FACTIONS) {
      expect(d1[faction]).toBe(d2[faction]);
    }
  });

  golden("should not mutate input results array when computing deltas", () => {
    const result = makeResult(75);
    const originalCredibility = result.finalCredibility;
    const originalHasInsult = result.hasInsult;
    const results = [result];

    computeTrustDeltas(results, "historian");

    expect(results[0].finalCredibility).toBe(originalCredibility);
    expect(results[0].hasInsult).toBe(originalHasInsult);
    expect(results).toHaveLength(1);
  });

  golden("should produce identical deltas for identical inputs (Constraint 1 determinism)", () => {
    const results = [makeResult(75), makeResult(30, true), makeResult(50)];
    const deltas1 = computeTrustDeltas(results, "scholar");
    const deltas2 = computeTrustDeltas(results, "scholar");

    for (const faction of ALL_FACTIONS) {
      expect(deltas1[faction]).toBe(deltas2[faction]);
    }
  });
});

// ---------------------------------------------------------------------------
// applyTrustDeltas
// ---------------------------------------------------------------------------

describe("applyTrustDeltas", () => {
  it("should add deltas to existing trust values", () => {
    const trust: FactionTrustMap = { historian: 10, scholar: 20, witness: 30, scribe: 40 };
    const deltas: FactionTrustMap = { historian: 5, scholar: -5, witness: 0, scribe: -10 };
    const updated = applyTrustDeltas(trust, deltas);

    expect(updated.historian).toBe(15);
    expect(updated.scholar).toBe(15);
    expect(updated.witness).toBe(30);
    expect(updated.scribe).toBe(30);
  });

  it(`should clamp trust at maximum (${FACTION_TRUST_MAX})`, () => {
    const trust: FactionTrustMap = { historian: 99, scholar: 0, witness: 0, scribe: 0 };
    const deltas: FactionTrustMap = { historian: 20, scholar: 0, witness: 0, scribe: 0 };
    const updated = applyTrustDeltas(trust, deltas);
    expect(updated.historian).toBe(FACTION_TRUST_MAX);
  });

  it(`should clamp trust at minimum (${FACTION_TRUST_MIN})`, () => {
    const trust: FactionTrustMap = { historian: -195, scholar: 0, witness: 0, scribe: 0 };
    const deltas: FactionTrustMap = { historian: -20, scholar: 0, witness: 0, scribe: 0 };
    const updated = applyTrustDeltas(trust, deltas);
    expect(updated.historian).toBe(FACTION_TRUST_MIN);
  });

  it("should not affect factions with zero delta", () => {
    const trust: FactionTrustMap = { historian: 50, scholar: -30, witness: 10, scribe: -5, diplomat: 0, rebel: 0, merchant: 0 };
    const deltas: FactionTrustMap = { historian: 0, scholar: 0, witness: 0, scribe: 0, diplomat: 0, rebel: 0, merchant: 0 };
    const updated = applyTrustDeltas(trust, deltas);
    expect(updated).toEqual(trust);
  });

  // ── Golden Tests ──────────────────────────────────────────────────────────

  golden("should not mutate the input trust map (Constraint 2 immutability)", () => {
    const trust: FactionTrustMap = { historian: 50, scholar: 50, witness: 50, scribe: 50 };
    const originalHistorian = trust.historian;
    const deltas: FactionTrustMap = { historian: -10, scholar: -10, witness: -10, scribe: -10 };

    applyTrustDeltas(trust, deltas);

    expect(trust.historian).toBe(originalHistorian);
    expect(trust.scholar).toBe(50);
    expect(trust.witness).toBe(50);
    expect(trust.scribe).toBe(50);
  });

  golden("should produce a new object, not the same reference (Constraint 2)", () => {
    const trust: FactionTrustMap = { historian: 0, scholar: 0, witness: 0, scribe: 0 };
    const deltas: FactionTrustMap = { historian: 5, scholar: 5, witness: 5, scribe: 5 };
    const updated = applyTrustDeltas(trust, deltas);
    expect(updated).not.toBe(trust);
  });
});

// ---------------------------------------------------------------------------
// isRefusing / getRefusingFactions
// ---------------------------------------------------------------------------

describe("isRefusing (FR17)", () => {
  it("should return false when trust is above threshold", () => {
    expect(isRefusing(0)).toBe(false);
    expect(isRefusing(-99)).toBe(false);
    expect(isRefusing(REFUSING_TRUST_THRESHOLD)).toBe(false); // exactly -100 is NOT refusing
  });

  it("should return true when trust is below threshold", () => {
    expect(isRefusing(-101)).toBe(true);
    expect(isRefusing(-200)).toBe(true);
    expect(isRefusing(REFUSING_TRUST_THRESHOLD - 1)).toBe(true);
  });

  it("should treat threshold boundary correctly (−100 is not refusing)", () => {
    expect(isRefusing(-100)).toBe(false);
  });
});

describe("getRefusingFactions (FR17)", () => {
  it("should return empty when all factions have trust above threshold", () => {
    const trust: FactionTrustMap = { historian: 0, scholar: 0, witness: 0, scribe: 0 };
    expect(getRefusingFactions(trust)).toHaveLength(0);
  });

  it("should return only factions below threshold", () => {
    const trust: FactionTrustMap = {
      historian: -150,
      scholar: 50,
      witness: -120,
      scribe: 0,
    };
    const refusing = getRefusingFactions(trust);
    expect(refusing).toContain("historian");
    expect(refusing).toContain("witness");
    expect(refusing).not.toContain("scholar");
    expect(refusing).not.toContain("scribe");
    expect(refusing).toHaveLength(2);
  });

  it("should return all four when all are below threshold", () => {
    const trust: FactionTrustMap = {
      historian: -150,
      scholar: -110,
      witness: -200,
      scribe: -101,
      diplomat: -150,
      rebel: -110,
      merchant: -200,
    };
    expect(getRefusingFactions(trust)).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// isAutoLoss (FR18)
// ---------------------------------------------------------------------------

describe("isAutoLoss (FR18)", () => {
  it("should return false when no factions are refusing", () => {
    const trust = createInitialTrustMap();
    expect(isAutoLoss(trust)).toBe(false);
  });

  it("should return false when only some factions are refusing", () => {
    const trust: FactionTrustMap = { historian: -150, scholar: 50, witness: 0, scribe: 0 };
    expect(isAutoLoss(trust)).toBe(false);
  });

  it("should return false when exactly three factions are refusing", () => {
    const trust: FactionTrustMap = {
      historian: -150,
      scholar: -120,
      witness: -110,
      scribe: 0, // one not refusing
    };
    expect(isAutoLoss(trust)).toBe(false);
  });

  // ── Golden Test ───────────────────────────────────────────────────────────

  golden("should detect auto-loss when all factions are refusing (FR18)", () => {
    const trust: FactionTrustMap = {
      historian: -150,
      scholar: -110,
      witness: -200,
      scribe: -101,
      diplomat: -150,
      rebel: -110,
      merchant: -200,
    };
    expect(isAutoLoss(trust)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration: Full turn cycle
// ---------------------------------------------------------------------------

describe("Trust across multiple turns", () => {
  it("should accumulate trust losses from repeated low-credibility claims", () => {
    let trust = createInitialTrustMap();
    const lowResult = makeResult(20); // −10 per turn
    const deltas = computeTrustDeltas([lowResult], "historian");

    // After 9 turns of low credibility, trust should be −90 (not yet refusing)
    for (let i = 0; i < 9; i++) {
      trust = applyTrustDeltas(trust, deltas);
    }
    expect(isAutoLoss(trust)).toBe(false);

    // After 11 turns, historian trust is below -100 → but not all refuse
    trust = applyTrustDeltas(trust, deltas);
    trust = applyTrustDeltas(trust, deltas);
    // All factions should now be at -110
    expect(isRefusing(trust.historian)).toBe(true);
    expect(isAutoLoss(trust)).toBe(true); // all factions affected equally
  });

  it("should recover trust with high-credibility claims", () => {
    const badTrust: FactionTrustMap = { historian: -50, scholar: -50, witness: -50, scribe: -50, diplomat: -50, rebel: -50, merchant: -50 };
    const goodResult = makeResult(80); // +5 per turn
    const deltas = computeTrustDeltas([goodResult], "historian");
    const recovered = applyTrustDeltas(badTrust, deltas);
    for (const faction of ALL_FACTIONS) {
      expect(recovered[faction]).toBeGreaterThan(badTrust[faction]);
    }
  });
});
