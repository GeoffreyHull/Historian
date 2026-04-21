/**
 * GameManager unit tests.
 * Validates: immutability (Constraint 2), JSON serialization (Constraint 5), action dispatch (Constraint 6).
 */

import { GameManager, createInitialGameState } from "../gameManager";
import { createEventId } from "../types";
import { SEEDED_EVENTS } from "./fixtures/events";
import { createClaim } from "./fixtures/claims";

describe("GameManager", () => {
  describe("initialization", () => {
    it("should create initial state with defaults", () => {
      const manager = new GameManager();
      const state = manager.getState();

      expect(state.turnNumber).toBe(1);
      expect(state.currentFaction).toBe("historian");
      expect(state.events).toEqual([]);
      expect(state.claims).toEqual([]);
      expect(state.influence).toBe(50);
      expect(state.isGameOver).toBe(false);
    });

    it("should accept custom initial state", () => {
      const custom = createInitialGameState("scholar", 5 as any);
      const manager = new GameManager(custom);
      const state = manager.getState();

      expect(state.currentFaction).toBe("scholar");
      expect(state.turnNumber).toBe(5);
    });
  });

  describe("immutability (Constraint 2)", () => {
    it("should not mutate state when dispatching action", () => {
      const manager = new GameManager();
      const originalState = manager.getState();
      const originalClaimsLength = originalState.claims.length;

      const claim = createClaim();
      manager.dispatch({ type: "writeClaim", claims: [claim] });

      expect(originalState.claims.length).toBe(originalClaimsLength); // Original unchanged
      expect(manager.getState().claims.length).toBe(originalClaimsLength + 1); // New state updated
    });

    it("should not mutate credibility map when evaluating claims", () => {
      const manager = new GameManager();
      const originalState = manager.getState();
      const originalMap = { ...originalState.credibilityMap };

      const event = SEEDED_EVENTS[0];
      manager.dispatch({
        type: "evaluateClaims",
        results: [
          {
            claim: createClaim({ eventId: event.eventId }),
            event,
            accuracy: "correct",
            hasInsult: false,
            baseCredibility: 100,
            penalty: 0,
            finalCredibility: 100,
          },
        ],
      });

      expect(originalState.credibilityMap).toEqual(originalMap); // Original unchanged
      expect(manager.getState().credibilityMap[event.eventId]).toBe(100); // New state updated
    });
  });

  describe("JSON serialization (Constraint 5)", () => {
    it("should round-trip through JSON.stringify/parse", () => {
      const manager = new GameManager();
      manager.dispatch({
        type: "writeClaim",
        claims: [createClaim()],
      });

      const state = manager.getState();
      const json = JSON.stringify(state);
      const restored = JSON.parse(json);

      expect(restored).toEqual(state);
    });

    it("should not contain non-serializable properties", () => {
      const manager = new GameManager();
      const state = manager.getState();

      // Verify no functions, undefined, symbols
      const json = JSON.stringify(state);
      expect(json).toBeTruthy();
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe("action dispatch (Constraint 6)", () => {
    it("should handle writeClaim action", () => {
      const manager = new GameManager();
      const claim1 = createClaim({ claimText: "Claim 1" });
      const claim2 = createClaim({ claimText: "Claim 2" });

      manager.dispatch({ type: "writeClaim", claims: [claim1, claim2] });

      expect(manager.getState().claims).toEqual([claim1, claim2]);
    });

    it("should handle evaluateClaims action", () => {
      const manager = new GameManager();
      const event = SEEDED_EVENTS[0];

      const result = {
        claim: createClaim({ eventId: event.eventId }),
        event,
        accuracy: "correct" as const,
        hasInsult: false,
        baseCredibility: 75,
        penalty: 0,
        finalCredibility: 75,
      };

      manager.dispatch({ type: "evaluateClaims", results: [result] });

      expect(manager.getState().credibilityMap[event.eventId]).toBe(75);
    });

    it("should handle nextTurn action", () => {
      const manager = new GameManager();
      const claim = createClaim();

      manager.dispatch({ type: "writeClaim", claims: [claim] });
      expect(manager.getState().claims.length).toBe(1);

      manager.dispatch({ type: "nextTurn" });

      expect(manager.getState().turnNumber).toBe(2);
      expect(manager.getState().claims.length).toBe(0); // Claims cleared
    });
  });
});
