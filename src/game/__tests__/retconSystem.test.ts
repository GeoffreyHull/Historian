/**
 * RetconSystem tests (Phase 4).
 * Validates:
 *  - takeSnapshot captures correct state
 *  - canRetcon checks influence and snapshot availability
 *  - getRetconTargets lists available turns
 *  - enterRetcon restores state and deducts influence
 *  - commitRetcon trims future snapshots
 *  - cancelRetcon restores original state
 *  - Determinism: same claims + same rewind → same results
 *  - Golden: immutability (snapshot doesn't share refs), JSON serialization
 */

import { describe, it, expect } from "vitest";
import { golden } from "./utils/golden";
import {
  takeSnapshot,
  canRetcon,
  getRetconTargets,
  enterRetcon,
  commitRetcon,
  cancelRetcon,
  RETCON_COST,
} from "../retconSystem";
import { createInitialGameState } from "../gameManager";
import { createInitialWorldState } from "../worldStateManager";
import { createEventId, createTurn, GameState, TurnSnapshot } from "../types";
import { WEATHER_RAIN, LOCATION_CASTLE } from "./fixtures/events";

function makeStateWithSnapshots(influence = 20, snapshotTurns: number[] = [1, 2]): GameState {
  const base = createInitialGameState("historian");
  const snapshots: TurnSnapshot[] = snapshotTurns.map((turn) => ({
    turnNumber: createTurn(turn),
    events: [WEATHER_RAIN],
    claims: [],
    influence: 30,
    factionTrust: { historian: 0, scholar: 0, witness: 0, scribe: 0, diplomat: 0, rebel: 0, merchant: 0 },
    credibilityMap: {},
    worldState: createInitialWorldState(42),
  }));
  return { ...base, influence, turnSnapshots: snapshots, turnNumber: createTurn(3) };
}

describe("takeSnapshot", () => {
  it("should capture current turn number", () => {
    const state = { ...createInitialGameState("historian"), turnNumber: createTurn(4) };
    const snapshot = takeSnapshot(state);
    expect(snapshot.turnNumber).toBe(4);
  });

  it("should capture influence", () => {
    const state = { ...createInitialGameState("historian"), influence: 37.5 };
    const snapshot = takeSnapshot(state);
    expect(snapshot.influence).toBe(37.5);
  });

  it("should capture events and claims", () => {
    const state = {
      ...createInitialGameState("historian"),
      events: [WEATHER_RAIN, LOCATION_CASTLE],
      claims: [],
    };
    const snapshot = takeSnapshot(state);
    expect(snapshot.events).toHaveLength(2);
  });

  golden("[G] snapshot should be JSON-serializable", () => {
    const state = createInitialGameState("historian");
    const snapshot = takeSnapshot(state);
    const serialized = JSON.stringify(snapshot);
    const restored = JSON.parse(serialized);
    expect(restored.turnNumber).toBe(snapshot.turnNumber);
    expect(restored.influence).toBe(snapshot.influence);
  });

  golden("[G] snapshot should not share mutable references with original state", () => {
    const state = {
      ...createInitialGameState("historian"),
      factionTrust: { historian: 10, scholar: 20, witness: 30, scribe: 40, diplomat: 50, rebel: 60, merchant: 70 },
    };
    const snapshot = takeSnapshot(state);
    // Verify deep-equality but structural independence
    expect(snapshot.factionTrust.historian).toBe(10);
    // The snapshot trust is a copy
    expect(snapshot.factionTrust).not.toBe(state.factionTrust);
  });
});

describe("canRetcon", () => {
  it("should return true when influence >= cost and snapshot exists", () => {
    const state = makeStateWithSnapshots(RETCON_COST + 1, [1]);
    expect(canRetcon(state, createTurn(1))).toBe(true);
  });

  it("should return false when influence < cost", () => {
    const state = makeStateWithSnapshots(RETCON_COST - 0.1, [1]);
    expect(canRetcon(state, createTurn(1))).toBe(false);
  });

  it("should return false when no snapshot for that turn", () => {
    const state = makeStateWithSnapshots(RETCON_COST + 10, [2, 3]);
    expect(canRetcon(state, createTurn(1))).toBe(false);
  });

  it("should return false when no snapshots at all", () => {
    const state = { ...createInitialGameState("historian"), influence: 100 };
    expect(canRetcon(state, createTurn(1))).toBe(false);
  });
});

describe("getRetconTargets", () => {
  it("should return turn numbers from snapshots", () => {
    const state = makeStateWithSnapshots(50, [1, 2, 3]);
    const targets = getRetconTargets(state);
    expect(targets).toContain(1);
    expect(targets).toContain(2);
    expect(targets).toContain(3);
  });

  it("should return empty array when no snapshots", () => {
    const state = createInitialGameState("historian");
    const targets = getRetconTargets(state);
    expect(targets).toHaveLength(0);
  });
});

describe("enterRetcon", () => {
  it("should restore state from snapshot of target turn", () => {
    const state = makeStateWithSnapshots(RETCON_COST + 10, [1, 2]);
    const rewound = enterRetcon(state, createTurn(1));
    expect(rewound.turnNumber).toBe(1);
  });

  it("should deduct retcon cost from influence", () => {
    const state = makeStateWithSnapshots(RETCON_COST + 10, [1]);
    const originalInfluence = 30; // snapshot influence is 30
    const rewound = enterRetcon(state, createTurn(1));
    expect(rewound.influence).toBe(originalInfluence - RETCON_COST);
  });

  it("should not mutate original state", () => {
    const state = makeStateWithSnapshots(RETCON_COST + 10, [1]);
    const originalTurn = state.turnNumber;
    enterRetcon(state, createTurn(1));
    expect(state.turnNumber).toBe(originalTurn);
  });

  it("should return original state when no matching snapshot", () => {
    const state = makeStateWithSnapshots(50, [2]);
    const result = enterRetcon(state, createTurn(99));
    expect(result).toBe(state); // Same reference — no change
  });

  it("should return original state when insufficient influence", () => {
    const state = makeStateWithSnapshots(RETCON_COST - 1, [1]);
    const result = enterRetcon(state, createTurn(1));
    expect(result.influence).toBe(RETCON_COST - 1); // unchanged
  });

  golden("[G] enterRetcon should produce deterministic results from same input", () => {
    const state = makeStateWithSnapshots(50, [1, 2]);
    const result1 = enterRetcon(state, createTurn(1));
    const result2 = enterRetcon(state, createTurn(1));
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });
});

describe("commitRetcon", () => {
  it("should trim snapshots newer than target turn", () => {
    const state = makeStateWithSnapshots(50, [1, 2, 3]);
    const committed = commitRetcon(state, createTurn(2));
    const turns = committed.turnSnapshots.map((s) => s.turnNumber);
    expect(turns).not.toContain(2);
    expect(turns).not.toContain(3);
    expect(turns).toContain(1);
  });

  it("should not mutate original state", () => {
    const state = makeStateWithSnapshots(50, [1, 2]);
    const originalLength = state.turnSnapshots.length;
    commitRetcon(state, createTurn(2));
    expect(state.turnSnapshots).toHaveLength(originalLength);
  });

  golden("[G] commitRetcon should be deterministic", () => {
    const state = makeStateWithSnapshots(50, [1, 2, 3]);
    const r1 = commitRetcon(state, createTurn(2));
    const r2 = commitRetcon(state, createTurn(2));
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

describe("cancelRetcon", () => {
  it("should restore state from original snapshot", () => {
    const state = makeStateWithSnapshots(50, [1, 2]);
    const originalSnapshot: TurnSnapshot = {
      turnNumber: createTurn(3),
      events: [LOCATION_CASTLE],
      claims: [],
      influence: 40,
      factionTrust: { historian: 5, scholar: 5, witness: 5, scribe: 5, diplomat: 5, rebel: 5, merchant: 5 },
      credibilityMap: {},
      worldState: createInitialWorldState(42),
    };
    const restored = cancelRetcon(state, originalSnapshot);
    expect(restored.turnNumber).toBe(3);
    expect(restored.influence).toBe(40);
  });

  it("should not mutate input state", () => {
    const state = makeStateWithSnapshots(50, [1]);
    const originalSnapshot: TurnSnapshot = {
      turnNumber: createTurn(5),
      events: [],
      claims: [],
      influence: 99,
      factionTrust: { historian: 0, scholar: 0, witness: 0, scribe: 0, diplomat: 0, rebel: 0, merchant: 0 },
      credibilityMap: {},
      worldState: createInitialWorldState(1),
    };
    const originalInfluence = state.influence;
    cancelRetcon(state, originalSnapshot);
    expect(state.influence).toBe(originalInfluence);
  });
});

describe("JSON serialization", () => {
  golden("[G] GameState with retcon fields should round-trip through JSON", () => {
    const state = makeStateWithSnapshots(50, [1, 2]);
    const serialized = JSON.stringify(state);
    const restored = JSON.parse(serialized) as GameState;
    expect(restored.turnSnapshots).toHaveLength(2);
    expect(restored.turnSnapshots[0].turnNumber).toBe(1);
    expect(restored.influence).toBe(50);
  });
});
