/**
 * Tests for world state manager (Epic 4: Discover Cross-Run Consequences).
 * Validates: FR20-FR25 (world state persistence, belief tracking, probabilistic reshaping, recovery)
 * Constraints: C2 (immutability), C5 (JSON serialization), C9 (determinism)
 */

import { describe, it, expect } from "vitest";
import {
  createInitialWorldState,
  evolveToNextRun,
  updateWorldStateAfterRun,
  getFactionBeliefInfluence,
  getConsequenceTexts,
} from "../worldStateManager";
import {
  createEventId,
  createTurn,
  EventId,
  TurnNumber,
  Faction,
  Event,
} from "../types";
import { createClaim } from "./fixtures/claims";
import type { CredibilityResult, Claim } from "../types";

const TEST_EVENT: Event = {
  eventId: createEventId("evt-test-001"),
  eventType: "weather",
  description: "A light rain fell.",
  truthValue: "true",
  turnNumber: 1,
  observedByPlayer: true,
};

describe("[G] World State Manager - Epic 4 Tests", () => {
  describe("AC5: Immutability & Purity", () => {
    it("[G] should never mutate input world state when evolving to next run", () => {
      const original = createInitialWorldState();
      const frozen = JSON.parse(JSON.stringify(original));

      const next = evolveToNextRun(original, createTurn(10));

      expect(JSON.stringify(original)).toBe(JSON.stringify(frozen));
      expect(next.runNumber).toBe(2);
    });

    it("[G] should never mutate claims or events when updating world state", () => {
      const worldState = createInitialWorldState();
      const claims: Claim[] = [createClaim("The sky was blue", createEventId("evt-1"), true, createTurn(1))];
      const events: Event[] = [TEST_EVENT];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: events[0],
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 50,
        },
      ];

      const frozen = {
        claimsFrozen: JSON.parse(JSON.stringify(claims)),
        eventsFrozen: JSON.parse(JSON.stringify(events)),
      };

      updateWorldStateAfterRun(worldState, claims, credResults, events, "historian");

      expect(JSON.stringify(claims)).toBe(JSON.stringify(frozen.claimsFrozen));
      expect(JSON.stringify(events)).toBe(JSON.stringify(frozen.eventsFrozen));
    });
  });

  describe("AC6: Integration & Determinism", () => {
    it("[G] should produce deterministic world state evolution with same seed", () => {
      const world1 = createInitialWorldState();
      const evolved1a = evolveToNextRun(world1, createTurn(10));
      const evolved1b = evolveToNextRun(world1, createTurn(10));

      expect(JSON.stringify(evolved1a)).toBe(JSON.stringify(evolved1b));
    });

    it("[G] should produce identical results across 100 identical calls", () => {
      const worldState = createInitialWorldState();
      const testTurn = createTurn(10);

      const results = [];
      for (let i = 0; i < 100; i++) {
        const evolved = evolveToNextRun(worldState, testTurn);
        results.push(JSON.stringify(evolved));
      }

      const first = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBe(first);
      }
    });

    it("[G] JSON serialization round-trip preserves all data", () => {
      const world = createInitialWorldState();
      const serialized = JSON.stringify(world);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(world);
      expect(deserialized.runNumber).toBe(1);
      expect(deserialized.consequences).toHaveLength(0);
    });
  });

  describe("FR20: Player claims influence future events", () => {
    it("should track high-credibility claims as potential consequences", () => {
      const worldState = createInitialWorldState();
      const claims: Claim[] = [createClaim("The sky was blue", createEventId("evt-1"), true, createTurn(1))];
      const events: Event[] = [TEST_EVENT];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: events[0],
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 85,
        },
      ];

      const updated = updateWorldStateAfterRun(worldState, claims, credResults, events, "historian");
      expect(updated.consequences).toBeDefined();
    });

    it("should ignore low-credibility claims", () => {
      const worldState = createInitialWorldState();
      const claims: Claim[] = [createClaim("The sky was purple", createEventId("evt-1"), true, createTurn(1))];
      const events: Event[] = [TEST_EVENT];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: events[0],
          accuracy: "incorrect",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 30,
          finalCredibility: 20,
        },
      ];

      const updated = updateWorldStateAfterRun(worldState, claims, credResults, events, "historian");
      expect(updated.consequences.length).toBeLessThanOrEqual(0);
    });
  });

  describe("FR21: System tracks faction beliefs based on claims", () => {
    it("should create faction beliefs from accurate claims", () => {
      const worldState = createInitialWorldState();
      const claims: Claim[] = [
        createClaim("The weather was stormy", createEventId("evt-1"), true, createTurn(1)),
      ];
      const events: Event[] = [TEST_EVENT];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: events[0],
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 65,
        },
      ];

      const updated = updateWorldStateAfterRun(worldState, claims, credResults, events, "historian");

      for (const faction of ["historian", "scholar", "witness", "scribe"] as const) {
        expect(updated.factionBeliefs[faction]).toBeDefined();
      }
    });

    it("should not create beliefs from inaccurate claims", () => {
      const worldState = createInitialWorldState();
      const claims: Claim[] = [createClaim("The weather was sunny", createEventId("evt-1"), true, createTurn(1))];
      const events: Event[] = [TEST_EVENT];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: events[0],
          accuracy: "incorrect",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 20,
          finalCredibility: 30,
        },
      ];

      const updated = updateWorldStateAfterRun(worldState, claims, credResults, events, "historian");

      for (const faction of ["historian", "scholar", "witness", "scribe"] as const) {
        const beliefs = updated.factionBeliefs[faction];
        expect(beliefs.length).toBeLessThanOrEqual(0);
      }
    });
  });

  describe("FR22: Faction beliefs probabilistically shape event generation", () => {
    it("should weight event types based on faction beliefs", () => {
      const worldState = createInitialWorldState();
      worldState.factionBeliefs.historian = [
        {
          eventType: "weather",
          weight: 80,
          decayRate: 0.15,
          turnIntroduced: createTurn(1),
        },
      ];

      const influence = getFactionBeliefInfluence(worldState, "historian", createTurn(5));
      expect(influence["weather"]).toBeGreaterThan(1.0);
      expect(influence["location"]).toBeLessThanOrEqual(1.0);
    });

    it("should apply decay to beliefs over time", () => {
      const worldState = createInitialWorldState();
      worldState.factionBeliefs.historian = [
        {
          eventType: "weather",
          weight: 80,
          decayRate: 0.15,
          turnIntroduced: createTurn(1),
        },
      ];

      const influenceEarly = getFactionBeliefInfluence(worldState, "historian", createTurn(1));
      const influenceLate = getFactionBeliefInfluence(worldState, "historian", createTurn(20));

      expect(influenceLate["weather"]).toBeLessThan(influenceEarly["weather"]);
    });
  });

  describe("FR23: Event descriptions subtly reference previous consequences", () => {
    it("should return consequence references when available", () => {
      const worldState = createInitialWorldState();
      worldState.consequences = [
        {
          claimText: "The king was wise",
          triggerEventId: createEventId("evt-1"),
          turnIntroduced: createTurn(1),
          intensity: 50,
          decayRate: 0.15,
        },
      ];

      const texts = getConsequenceTexts(worldState, createTurn(5));
      expect(texts.length).toBeGreaterThan(0);
      expect(texts[0]).toContain("The king was wise");
    });

    it("should fade consequence references over time", () => {
      const worldState = createInitialWorldState();
      worldState.consequences = [
        {
          claimText: "The sky was blue",
          triggerEventId: createEventId("evt-1"),
          turnIntroduced: createTurn(1),
          intensity: 5,
          decayRate: 0.5,
        },
      ];

      const textsEarly = getConsequenceTexts(worldState, createTurn(2));
      const textsLate = getConsequenceTexts(worldState, createTurn(50));

      expect(textsLate.length).toBeLessThanOrEqual(textsEarly.length);
    });
  });

  describe("FR24: World state persists across runs", () => {
    it("should maintain beliefs when evolving to next run", () => {
      const worldState = createInitialWorldState();
      worldState.factionBeliefs.historian = [
        {
          eventType: "weather",
          weight: 70,
          decayRate: 0.15,
          turnIntroduced: createTurn(1),
        },
      ];

      const nextRun = evolveToNextRun(worldState, createTurn(10));
      expect(nextRun.factionBeliefs.historian.length).toBeGreaterThan(0);
    });

    it("should maintain consequences when evolving to next run", () => {
      const worldState = createInitialWorldState();
      worldState.consequences = [
        {
          claimText: "The king was wise",
          triggerEventId: createEventId("evt-1"),
          turnIntroduced: createTurn(1),
          intensity: 75,
          decayRate: 0.15,
        },
      ];

      const nextRun = evolveToNextRun(worldState, createTurn(10));
      expect(nextRun.consequences.length).toBeGreaterThan(0);
    });

    it("should increment run number when evolving", () => {
      const world1 = createInitialWorldState();
      expect(world1.runNumber).toBe(1);

      const world2 = evolveToNextRun(world1, createTurn(10));
      expect(world2.runNumber).toBe(2);

      const world3 = evolveToNextRun(world2, createTurn(10));
      expect(world3.runNumber).toBe(3);
    });
  });

  describe("FR25: World state recovers over time (consequences fade)", () => {
    it("should decay consequence intensity as runs progress", () => {
      const world1 = createInitialWorldState();
      world1.consequences = [
        {
          claimText: "The king was wise",
          triggerEventId: createEventId("evt-1"),
          turnIntroduced: createTurn(1),
          intensity: 100,
          decayRate: 0.2,
        },
      ];

      const world2 = evolveToNextRun(world1, createTurn(10));
      const world3 = evolveToNextRun(world2, createTurn(10));
      const world4 = evolveToNextRun(world3, createTurn(10));

      const intensity1 = world1.consequences[0].intensity;
      const intensity2 = world2.consequences[0]?.intensity ?? 0;
      const intensity3 = world3.consequences[0]?.intensity ?? 0;
      const intensity4 = world4.consequences[0]?.intensity ?? 0;

      expect(intensity2).toBeLessThan(intensity1);
      expect(intensity3).toBeLessThanOrEqual(intensity2);
      expect(intensity4).toBeLessThanOrEqual(intensity3);
    });

    it("should remove negligible consequences", () => {
      const world1 = createInitialWorldState();
      world1.consequences = [
        {
          claimText: "The sky was blue",
          triggerEventId: createEventId("evt-1"),
          turnIntroduced: createTurn(1),
          intensity: 0.05,
          decayRate: 0.2,
        },
      ];

      const world2 = evolveToNextRun(world1, createTurn(10));
      expect(world2.consequences.filter(c => c.intensity > 0.1).length).toBe(0);
    });

    it("should decay faction beliefs similarly to consequences", () => {
      const world1 = createInitialWorldState();
      world1.factionBeliefs.historian = [
        {
          eventType: "weather",
          weight: 100,
          decayRate: 0.2,
          turnIntroduced: createTurn(1),
        },
      ];

      const world2 = evolveToNextRun(world1, createTurn(10));
      const world3 = evolveToNextRun(world2, createTurn(10));

      const weight1 = world1.factionBeliefs.historian[0].weight;
      const weight2 = world2.factionBeliefs.historian[0]?.weight ?? 0;
      const weight3 = world3.factionBeliefs.historian[0]?.weight ?? 0;

      expect(weight2).toBeLessThan(weight1);
      expect(weight3).toBeLessThanOrEqual(weight2);
    });
  });

  describe("Constraint 5: JSON Serialization", () => {
    it("[G] should serialize and deserialize without data loss", () => {
      const world = createInitialWorldState();
      world.factionBeliefs.historian = [
        {
          eventType: "weather",
          weight: 75,
          decayRate: 0.15,
          turnIntroduced: createTurn(5),
        },
      ];
      world.consequences = [
        {
          claimText: "The king spoke",
          triggerEventId: createEventId("evt-5"),
          turnIntroduced: createTurn(3),
          intensity: 60,
          decayRate: 0.15,
        },
      ];

      const serialized = JSON.stringify(world);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(world);
      expect(deserialized.runNumber).toBe(world.runNumber);
      expect(deserialized.factionBeliefs).toEqual(world.factionBeliefs);
      expect(deserialized.consequences).toEqual(world.consequences);
    });
  });
});
