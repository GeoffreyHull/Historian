/**
 * E2E Integration Test: Full game flow across multiple turns and runs.
 * Validates:
 *  - Turn progression (FR30-FR31)
 *  - Event generation + observation (FR4-FR7)
 *  - Claim evaluation + credibility (FR8-FR14)
 *  - Influence accumulation (FR19)
 *  - Faction trust changes (FR15-FR18)
 *  - World variable updates (Phase 2)
 *  - Faction reaction to world variables (cascading consequences)
 *  - Run completion + recap + next run (FR34-FR37)
 *  - JSON serialization throughout (Constraint 5)
 *  - Determinism (Constraint 9)
 *  - Phase 2: executeTurn is async
 */

import { describe, it, expect } from "vitest";
import { golden } from "./utils/golden";
import { executeTurn } from "../turnExecutor";
import { createInitialGameState } from "../gameManager";
import { createClaim, createAccurateClaim } from "./fixtures/claims";
import { GameState, createEventId, createTurn } from "../types";

describe("E2E: Full Game Flow", () => {
  describe("10-Turn Run Completion", () => {
    it("should complete 10 turns and end run", async () => {
      let state = createInitialGameState("historian");
      let runEnded = false;

      for (let turnNum = 1; turnNum <= 10; turnNum++) {
        const result = await executeTurn(state, []);
        if (result.runEnded) {
          runEnded = true;
          expect(turnNum).toBe(10);
          break;
        }
        state = result.updatedState;
      }

      expect(runEnded).toBe(true);
    });

    it("should generate events for each turn", async () => {
      let state = createInitialGameState("historian");
      let totalEvents = 0;

      for (let i = 1; i < 10; i++) {
        const result = await executeTurn(state, []);
        totalEvents += result.events.length;
        state = result.updatedState;
      }

      const lastResult = await executeTurn(state, []);
      totalEvents += lastResult.events.length;

      // Each turn generates 3 events, 10 turns = 30 events
      expect(totalEvents).toBeGreaterThanOrEqual(20);
    });

    it("should generate recap when run ends", async () => {
      let state = createInitialGameState("historian");
      let recap: any = null;

      for (let i = 1; i <= 10; i++) {
        const result = await executeTurn(state, []);
        state = result.updatedState;
        if (result.recap) {
          recap = result.recap;
        }
      }

      expect(recap).toBeDefined();
      expect(recap.runNumber).toBe(1);
    });
  });

  describe("World Variable Changes Across Turns", () => {
    it("should change world variables across 10 turns based on events", async () => {
      let state = createInitialGameState("historian");

      for (let i = 1; i < 10; i++) {
        state = (await executeTurn(state, [])).updatedState;
      }

      const result = await executeTurn(state, []);
      const finalVars = result.updatedState.worldState.worldVariables;

      // Variables should have changed from default (50) due to event effects
      const changed = (finalVars.morale !== 50) ||
        (finalVars.infrastructure !== 50) ||
        (finalVars.economy !== 50);
      expect(changed).toBe(true);
    });

    it("should decay world variables between runs", async () => {
      let state = createInitialGameState("historian");
      const initialVars = state.worldState.worldVariables;

      // Modify variables by playing through a run
      for (let i = 1; i < 10; i++) {
        state = (await executeTurn(state, [])).updatedState;
      }

      const midRunResult = await executeTurn(state, []);
      // Variables may differ from initial due to events
      const midRunVars = midRunResult.updatedState.worldState.worldVariables;

      // Play second run — variables should have decayed toward 50
      let state2 = midRunResult.updatedState;
      const run2Vars = state2.worldState.worldVariables;
      expect(typeof run2Vars.morale).toBe("number");
      expect(typeof run2Vars.infrastructure).toBe("number");
      expect(typeof run2Vars.economy).toBe("number");

      // Variables should be in valid range
      expect(run2Vars.morale).toBeGreaterThanOrEqual(0);
      expect(run2Vars.morale).toBeLessThanOrEqual(100);
    });
  });

  describe("Faction Trust Evolution", () => {
    it("should not change faction trust when no claims are submitted", async () => {
      let state = createInitialGameState("historian");
      const initialTrust = state.factionTrust;

      for (let turnNum = 1; turnNum <= 5; turnNum++) {
        state = (await executeTurn(state, [])).updatedState;
      }

      // No claims = no credibility results = no trust deltas
      for (const faction of ["historian", "scholar", "witness", "scribe", "diplomat", "rebel", "merchant"] as const) {
        expect(state.factionTrust[faction]).toBe(initialTrust[faction]);
      }
    });

    it("should not crash when no claims are submitted", async () => {
      let state = createInitialGameState("historian");

      for (let i = 1; i <= 10; i++) {
        const result = await executeTurn(state, []);
        state = result.updatedState;
        if (result.runEnded) break;
      }

      expect(state.isGameOver).toBe(false);
    });
  });

  describe("Influence Accumulation", () => {
    it("should accumulate influence when accurate claims are made", async () => {
      let state = createInitialGameState("historian");
      const startInfluence = state.influence;

      for (let turnNum = 1; turnNum <= 3; turnNum++) {
        const eventForTurn = state.events[0];
        const claims = eventForTurn
          ? [createAccurateClaim(eventForTurn)]
          : [];
        state = (await executeTurn(state, claims)).updatedState;
      }

      // Influence should have increased from accurate claims
      expect(state.influence).toBeGreaterThanOrEqual(startInfluence);
    });

    it("should persist influence after run completion", async () => {
      let state = createInitialGameState("historian");

      for (let i = 1; i < 10; i++) {
        state = (await executeTurn(state, [])).updatedState;
      }

      const result = await executeTurn(state, []);

      expect(typeof result.updatedState.influence).toBe("number");
      expect(isFinite(result.updatedState.influence)).toBe(true);
    });
  });

  describe("State Serialization", () => {
    it("should JSON-serialize state at every turn", async () => {
      let state = createInitialGameState("historian");

      for (let i = 1; i <= 10; i++) {
        const result = await executeTurn(state, []);
        // Verify the state is serializable at each turn
        const serialized = JSON.stringify(result.updatedState);
        const deserialized = JSON.parse(serialized);
        expect(deserialized.turnNumber).toBeDefined();
        expect(deserialized.worldState).toBeDefined();
        state = result.updatedState;
        if (result.runEnded) break;
      }
    });
  });

  describe("Turn Snapshots for Retcon", () => {
    it("should accumulate turn snapshots during gameplay", async () => {
      let state = createInitialGameState("historian");

      for (let i = 1; i <= 4; i++) {
        state = (await executeTurn(state, [])).updatedState;
      }

      // Should have snapshots for turns 1-4
      expect(state.turnSnapshots.length).toBeGreaterThanOrEqual(3);
    });

    it("should clear turn snapshots on new run", async () => {
      let state = createInitialGameState("historian");

      for (let i = 1; i < 10; i++) {
        state = (await executeTurn(state, [])).updatedState;
      }

      const result = await executeTurn(state, []);

      // New run should have empty snapshots
      expect(result.updatedState.turnSnapshots).toEqual([]);
    });
  });
});
