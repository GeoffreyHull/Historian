/**
 * Tests for historyBookUtils (FR38-FR40: History book access, accumulation, read-only).
 * Validates transformation of RunRecap[] into HistoryBook UI component props.
 * Constraint 1: Pure functions (no mutations, deterministic).
 */

import { describe, it, expect } from "vitest";
import { buildHistoryBookData } from "../historyBookUtils";
import type { RunRecap } from "../types";
import { golden } from "./utils/golden";

const makeRecap = (overrides: Partial<RunRecap> = {}): RunRecap => ({
  runNumber: 1,
  narrative: "# Chronicles of the First Age\n\nThe realm stood firm.",
  majorClaims: ["The king was wise", "The harvest was plentiful"],
  triggeredEvents: ["evt-001"],
  previousRunReferences: [],
  timestamp: 1000000000000,
  ...overrides,
});

describe("buildHistoryBookData", () => {
  describe("PastRunSummary derivation", () => {
    golden("should return empty pastRuns for empty history", () => {
      const { pastRuns } = buildHistoryBookData([]);
      expect(pastRuns).toHaveLength(0);
    });

    golden("should map each RunRecap to a PastRunSummary", () => {
      const recaps = [makeRecap({ runNumber: 1 }), makeRecap({ runNumber: 2 })];
      const { pastRuns } = buildHistoryBookData(recaps);
      expect(pastRuns).toHaveLength(2);
      expect(pastRuns[0].runId).toBe("run-1");
      expect(pastRuns[1].runId).toBe("run-2");
    });

    golden("should set turnsCompleted to 10 (runs only end at turn 10)", () => {
      const { pastRuns } = buildHistoryBookData([makeRecap()]);
      expect(pastRuns[0].turnsCompleted).toBe(10);
    });

    golden("should derive finalCredibility from major claim count", () => {
      const noClaimsRecap = makeRecap({ majorClaims: [] });
      const fiveClaimsRecap = makeRecap({ majorClaims: Array(5).fill("A claim") });
      const { pastRuns: [noClaims] } = buildHistoryBookData([noClaimsRecap]);
      const { pastRuns: [fiveClaims] } = buildHistoryBookData([fiveClaimsRecap]);
      // More major claims → higher credibility estimate
      expect(fiveClaims.finalCredibility).toBeGreaterThan(noClaims.finalCredibility);
    });

    golden("should cap finalCredibility at 95", () => {
      const manyClaimsRecap = makeRecap({ majorClaims: Array(20).fill("A claim") });
      const { pastRuns: [run] } = buildHistoryBookData([manyClaimsRecap]);
      expect(run.finalCredibility).toBeLessThanOrEqual(95);
    });

    golden("should include a readable title with run number", () => {
      const { pastRuns } = buildHistoryBookData([makeRecap({ runNumber: 3 })]);
      expect(pastRuns[0].title).toContain("3");
    });

    golden("should format completedDate as a non-empty string", () => {
      const { pastRuns } = buildHistoryBookData([makeRecap({ timestamp: 1700000000000 })]);
      expect(typeof pastRuns[0].completedDate).toBe("string");
      expect(pastRuns[0].completedDate.length).toBeGreaterThan(0);
    });
  });

  describe("BeliefTrend derivation", () => {
    golden("should return empty beliefTrends for empty history", () => {
      const { beliefTrends } = buildHistoryBookData([]);
      expect(beliefTrends).toHaveLength(0);
    });

    golden("should include all 4 factions per trend entry", () => {
      const { beliefTrends } = buildHistoryBookData([makeRecap()]);
      expect(beliefTrends[0]).toHaveProperty("historian");
      expect(beliefTrends[0]).toHaveProperty("scholar");
      expect(beliefTrends[0]).toHaveProperty("witness");
      expect(beliefTrends[0]).toHaveProperty("scribe");
    });

    golden("should cap all faction beliefs at 100", () => {
      const recapWithManyClaims = makeRecap({ majorClaims: Array(20).fill("A claim") });
      const { beliefTrends: [trend] } = buildHistoryBookData([recapWithManyClaims]);
      expect(trend.historian).toBeLessThanOrEqual(100);
      expect(trend.scholar).toBeLessThanOrEqual(100);
      expect(trend.witness).toBeLessThanOrEqual(100);
      expect(trend.scribe).toBeLessThanOrEqual(100);
    });

    golden("should have higher beliefs with more major claims", () => {
      const few = makeRecap({ runNumber: 1, majorClaims: [] });
      const many = makeRecap({ runNumber: 1, majorClaims: Array(5).fill("Claim") });
      const { beliefTrends: [fewTrend] } = buildHistoryBookData([few]);
      const { beliefTrends: [manyTrend] } = buildHistoryBookData([many]);
      expect(manyTrend.historian).toBeGreaterThan(fewTrend.historian);
    });
  });

  describe("ClaimFrequency derivation", () => {
    golden("should return empty claimFrequencies for empty history", () => {
      const { claimFrequencies } = buildHistoryBookData([]);
      expect(claimFrequencies).toHaveLength(0);
    });

    golden("should return empty frequencies when no major claims exist", () => {
      const { claimFrequencies } = buildHistoryBookData([makeRecap({ majorClaims: [] })]);
      expect(claimFrequencies).toHaveLength(0);
    });

    golden("should count word occurrences across all claims and runs", () => {
      const recaps = [
        makeRecap({ runNumber: 1, majorClaims: ["The storm arrived", "The storm was fierce"] }),
        makeRecap({ runNumber: 2, majorClaims: ["Another storm appeared"] }),
      ];
      const { claimFrequencies } = buildHistoryBookData(recaps);
      const storm = claimFrequencies.find((f) => f.word === "storm");
      expect(storm).toBeDefined();
      expect(storm!.count).toBe(3);
    });

    golden("should exclude stop words from frequencies", () => {
      const recap = makeRecap({ majorClaims: ["The king and the queen"] });
      const { claimFrequencies } = buildHistoryBookData([recap]);
      const stopWordEntries = claimFrequencies.filter((f) =>
        ["the", "and", "was", "is"].includes(f.word)
      );
      expect(stopWordEntries).toHaveLength(0);
    });

    golden("should return at most 10 frequencies", () => {
      const manyWords = Array.from({ length: 20 }, (_, i) => `unique${i} occurred`).join(". ");
      const recap = makeRecap({ majorClaims: [manyWords] });
      const { claimFrequencies } = buildHistoryBookData([recap]);
      expect(claimFrequencies.length).toBeLessThanOrEqual(10);
    });

    golden("should sort frequencies descending by count", () => {
      const recap = makeRecap({
        majorClaims: ["storm storm storm rain rain sun"],
      });
      const { claimFrequencies } = buildHistoryBookData([recap]);
      for (let i = 1; i < claimFrequencies.length; i++) {
        expect(claimFrequencies[i - 1].count).toBeGreaterThanOrEqual(claimFrequencies[i].count);
      }
    });

    golden("should include percentage values that sum to <= 100", () => {
      const recap = makeRecap({ majorClaims: ["storm rain sun wind"] });
      const { claimFrequencies } = buildHistoryBookData([recap]);
      const total = claimFrequencies.reduce((sum, f) => sum + f.percentage, 0);
      expect(total).toBeLessThanOrEqual(100);
    });
  });

  describe("Constraint 1: Pure functions", () => {
    golden("should not mutate input history array", () => {
      const recaps = [makeRecap({ runNumber: 1 }), makeRecap({ runNumber: 2 })];
      const frozen = JSON.stringify(recaps);
      buildHistoryBookData(recaps);
      expect(JSON.stringify(recaps)).toBe(frozen);
    });

    golden("should produce identical output for identical inputs", () => {
      const recaps = [
        makeRecap({ runNumber: 1, majorClaims: ["The throne was contested"] }),
      ];
      const result1 = buildHistoryBookData(recaps);
      const result2 = buildHistoryBookData(recaps);
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });
});
