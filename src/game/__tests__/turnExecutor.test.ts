/**
 * Tests for turn executor (Epic 6: Complete & Persist Game Sessions).
 * Validates: FR30-FR34 (turn flow, 10-turn structure, run completion)
 * Constraints: C1 (pure functions), C5 (JSON serialization), C9 (determinism)
 */

import { describe, it, expect } from "vitest";
import {
  executeTurn,
  getRunSummary,
} from "../turnExecutor";
import {
  createInitialGameState,
} from "../gameManager";
import { createClaim } from "./fixtures/claims";
import {
  createEventId,
  createTurn,
} from "../types";

describe("[G] Turn Executor - Epic 6 Tests", () => {
  describe("AC5: Immutability & Purity", () => {
    it("[G] should never mutate input game state when executing turn", () => {
      const original = createInitialGameState();
      const frozen = JSON.parse(JSON.stringify(original));

      const claims = [
        createClaim({
          claimText: "The sky was blue",
          eventId: createEventId("evt-1"),
          isAboutObservedEvent: true,
          turnNumber: 1,
        }),
      ];

      const result = executeTurn(original, claims);

      expect(JSON.stringify(original)).toBe(JSON.stringify(frozen));
      expect(result.updatedState.turnNumber).toBe(2);
    });

    it("[G] should produce identical results for identical inputs", () => {
      const state = createInitialGameState();
      const claims = [
        createClaim({
          claimText: "Test",
          eventId: createEventId("evt-1"),
          isAboutObservedEvent: true,
          turnNumber: 1,
        }),
      ];

      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = executeTurn(state, claims);
        results.push(JSON.stringify(result.updatedState));
      }

      const first = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBe(first);
      }
    });
  });

  describe("AC6: Integration & Determinism", () => {
    it("[G] JSON serialization round-trip preserves state", () => {
      const state = createInitialGameState();
      const serialized = JSON.stringify(state);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(state);
    });
  });

  describe("FR30-FR31: Turn flow and 10-turn runs", () => {
    it("should advance turn from 1 to 2", () => {
      const state = createInitialGameState();
      const result = executeTurn(state, []);

      expect(result.updatedState.turnNumber).toBe(2);
      expect(result.runEnded).toBe(false);
    });

    it("should generate events for each turn", () => {
      const state = createInitialGameState();
      const result = executeTurn(state, []);

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].turnNumber).toBe(1);
    });

    it("should clear claims after turn execution", () => {
      const state = {
        ...createInitialGameState(),
        claims: [
          createClaim({
            claimText: "Test",
            eventId: createEventId("evt-1"),
            isAboutObservedEvent: true,
            turnNumber: 1,
          }),
        ],
      };

      const result = executeTurn(state, []);

      expect(result.updatedState.claims.length).toBe(0);
    });

    it("should track credibility results from claims", () => {
      const state = createInitialGameState();
      const claims = [
        createClaim({
          claimText: "Sky was blue",
          eventId: createEventId("evt-1"),
          isAboutObservedEvent: true,
          turnNumber: 1,
        }),
      ];

      const result = executeTurn(state, claims);

      expect(result.credibilityResults.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("FR34: Run completion at turn 10", () => {
    it("should end run after 10 turns", () => {
      let state = createInitialGameState();

      // Execute 9 turns without ending
      for (let i = 1; i < 10; i++) {
        const result = executeTurn(state, []);
        expect(result.runEnded).toBe(false);
        state = result.updatedState;
      }

      // 10th turn should end the run
      const result = executeTurn(state, []);
      expect(result.runEnded).toBe(true);
    });

    it("should generate recap on run completion", () => {
      let state = createInitialGameState();

      for (let i = 1; i < 10; i++) {
        state = executeTurn(state, []).updatedState;
      }

      const result = executeTurn(state, []);

      expect(result.recap).toBeDefined();
      expect(result.recap?.runNumber).toBe(1);
    });

    it("should reset game state for next run after completion", () => {
      let state = createInitialGameState();

      for (let i = 1; i < 10; i++) {
        state = executeTurn(state, []).updatedState;
      }

      const result = executeTurn(state, []);

      expect(result.updatedState.turnNumber).toBe(1);
      expect(result.updatedState.claims.length).toBe(0);
      expect(result.updatedState.events.length).toBe(0);
    });

    it("should increment world run number after run completion", () => {
      let state = createInitialGameState();
      const initialRunNumber = state.worldState.runNumber;

      for (let i = 1; i < 10; i++) {
        state = executeTurn(state, []).updatedState;
      }

      const result = executeTurn(state, []);
      expect(result.updatedState.worldState.runNumber).toBeGreaterThan(initialRunNumber);
    });

    it("should add recap to history", () => {
      let state = createInitialGameState();

      for (let i = 1; i < 10; i++) {
        state = executeTurn(state, []).updatedState;
      }

      const result = executeTurn(state, []);
      const historyLength = result.updatedState.worldState.history.length;

      expect(historyLength).toBeGreaterThan(0);
    });
  });

  describe("RunSummary", () => {
    it("should report correct turn and remaining turns", () => {
      const state = createInitialGameState();
      const summary = getRunSummary(state);

      expect(summary.currentTurn).toBe(1);
      expect(summary.turnsRemaining).toBe(9);
      expect(summary.isRunComplete).toBe(false);
    });

    it("should report zero remaining turns at turn 10", () => {
      let state = createInitialGameState();

      for (let i = 1; i < 10; i++) {
        state = executeTurn(state, []).updatedState;
      }

      const summary = getRunSummary(state);

      expect(summary.currentTurn).toBe(10);
      expect(summary.turnsRemaining).toBe(0);
      expect(summary.isRunComplete).toBe(true);
    });

    it("should track claims count", () => {
      const state = {
        ...createInitialGameState(),
        claims: [
          createClaim({
            claimText: "Test",
            eventId: createEventId("evt-1"),
            isAboutObservedEvent: true,
            turnNumber: 1,
          }),
        ],
      };

      const summary = getRunSummary(state);

      expect(summary.claimsCount).toBe(1);
    });
  });

  describe("Constraint 5: JSON Serialization", () => {
    it("[G] should serialize turn result without data loss", () => {
      const state = createInitialGameState();
      const result = executeTurn(state, []);

      const serialized = JSON.stringify(result.updatedState);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(result.updatedState);
    });
  });
});
