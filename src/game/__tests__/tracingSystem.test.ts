/**
 * Tests for tracing system (Epic 7: Debug Game Determinism).
 * Validates: FR26-FR29 (action logging, causal tracing, confidence, verification)
 * Constraints: C1 (pure functions), C5 (JSON serialization)
 */

import { describe, it, expect } from "vitest";
import {
  TracingSystem,
  getGlobalTracingSystem,
  resetGlobalTracingSystem,
} from "../tracingSystem";
import { createClaim } from "./fixtures/claims";
import {
  createEventId,
  createTurn,
} from "../types";

const TEST_EVENT = {
  eventId: createEventId("evt-test-001"),
  eventType: "weather",
  description: "A light rain fell.",
  truthValue: "true" as const,
  turnNumber: 1,
  observedByPlayer: true,
};

describe("[G] Tracing System - Epic 7 Tests", () => {
  describe("AC5: Immutability & Purity", () => {
    it("[G] should not mutate when logging", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });
      const frozen = JSON.parse(JSON.stringify(claim));

      system.logClaim(claim, 1);

      expect(JSON.stringify(claim)).toBe(JSON.stringify(frozen));
    });
  });

  describe("AC6: JSON Serialization", () => {
    it("[G] should serialize logs without data loss", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);

      const serialized = JSON.stringify(system.toJSON());
      const deserialized = JSON.parse(serialized);

      expect(deserialized[0].claim.claimText).toBe("Test");
    });
  });

  describe("FR26: System logs every player claim with event ID", () => {
    it("should log claims with full details", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "The sky was blue",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);
      const logs = system.getLogs();

      expect(logs.length).toBe(1);
      expect(logs[0].type).toBe("claim");
      expect((logs[0] as any).claim.claimText).toBe("The sky was blue");
      expect((logs[0] as any).eventId).toBe("evt-1");
    });

    it("should include turn number in claim logs", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 5,
      });

      system.logClaim(claim, 5);
      const logs = system.getLogs();

      expect(logs[0].turnNumber).toBe(5);
    });
  });

  describe("FR27: System logs events triggered by claims with confidence", () => {
    it("should log consequence with confidence score", () => {
      const system = new TracingSystem();
      system.logConsequence("claim-1", TEST_EVENT, 85);

      const logs = system.getLogs();

      expect(logs.length).toBe(1);
      expect(logs[0].type).toBe("consequence");
      expect((logs[0] as any).confidence).toBe(85);
      expect((logs[0] as any).triggeredEventId).toBe("evt-test-001");
    });

    it("should log multiple consequences", () => {
      const system = new TracingSystem();
      system.logConsequence("claim-1", TEST_EVENT, 75);
      system.logConsequence("claim-2", { ...TEST_EVENT, eventId: createEventId("evt-2") }, 65);

      const logs = system.getLogs();

      expect(logs.length).toBe(2);
      expect(logs.filter((l) => l.type === "consequence").length).toBe(2);
    });
  });

  describe("FR28: Tracing logs are available for debugging", () => {
    it("should return all logs", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);
      system.logConsequence("claim-1", TEST_EVENT, 80);

      const logs = system.getLogs();

      expect(logs.length).toBe(2);
      expect(logs[0].type).toBe("claim");
      expect(logs[1].type).toBe("consequence");
    });

    it("should filter logs by type", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);
      system.logConsequence("claim-1", TEST_EVENT, 80);

      const claimLogs = system.getLogsByType("claim");
      const consequenceLogs = system.getLogsByType("consequence");

      expect(claimLogs.length).toBe(1);
      expect(consequenceLogs.length).toBe(1);
    });

    it("should export logs as JSON", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);

      const json = system.toJSON();

      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBe(1);
    });
  });

  describe("FR29: Developer can verify causal chains between claims and events", () => {
    it("should trace causal chain from claim to events", () => {
      const system = new TracingSystem();

      system.logConsequence("claim-123", TEST_EVENT, 90);
      system.logConsequence("claim-123", { ...TEST_EVENT, eventId: createEventId("evt-2") }, 80);
      system.logConsequence("claim-456", { ...TEST_EVENT, eventId: createEventId("evt-3") }, 70);

      const chain = system.traceCausalChain("claim-123");

      expect(chain.length).toBe(2);
      expect(chain.filter((c) => c.triggeredEventId === "evt-test-001").length).toBe(1);
      expect(chain.filter((c) => c.triggeredEventId === "evt-2").length).toBe(1);
    });

    it("should return empty chain for non-existent claim", () => {
      const system = new TracingSystem();

      const chain = system.traceCausalChain("non-existent");

      expect(chain.length).toBe(0);
    });

    it("should verify determinism from logs", () => {
      const system = new TracingSystem();

      // Add some logs
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);
      system.logConsequence("claim-1", TEST_EVENT, 85);

      const confidence = system.verifyDeterminism();

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it("should report high confidence with no logs", () => {
      const system = new TracingSystem();

      const confidence = system.verifyDeterminism();

      expect(confidence).toBe(100);
    });
  });

  describe("Global Tracing System", () => {
    it("[G] should provide singleton instance", () => {
      resetGlobalTracingSystem();
      const system1 = getGlobalTracingSystem();
      const system2 = getGlobalTracingSystem();

      expect(system1).toBe(system2);
    });

    it("[G] should clear global system", () => {
      resetGlobalTracingSystem();
      const system = getGlobalTracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);
      expect(system.getLogs().length).toBe(1);

      system.clear();
      expect(system.getLogs().length).toBe(0);
    });
  });

  describe("Evaluation Logging", () => {
    it("should log credibility evaluations", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      const credResult = {
        claim,
        event: TEST_EVENT,
        accuracy: "correct" as const,
        hasInsult: false,
        baseCredibility: 50,
        penalty: 0,
        finalCredibility: 75,
      };

      system.logEvaluation(claim, credResult, 1);
      const logs = system.getLogs();

      expect(logs.length).toBe(1);
      expect(logs[0].type).toBe("evaluate");
      expect((logs[0] as any).credibilityResult.finalCredibility).toBe(75);
    });
  });

  describe("Constraint 5: JSON Serialization", () => {
    it("[G] should serialize all log types", () => {
      const system = new TracingSystem();
      const claim = createClaim({
        claimText: "Test",
        eventId: createEventId("evt-1"),
        isAboutObservedEvent: true,
        turnNumber: 1,
      });

      system.logClaim(claim, 1);
      system.logConsequence("claim-1", TEST_EVENT, 80);

      const serialized = JSON.stringify(system.toJSON());
      const deserialized = JSON.parse(serialized);

      expect(deserialized.length).toBe(2);
      expect(deserialized[0].type).toBe("claim");
      expect(deserialized[1].type).toBe("consequence");
    });
  });
});
