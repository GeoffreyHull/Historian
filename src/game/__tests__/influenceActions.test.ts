/**
 * Tests for influenceActions (Buy Intel + Force Event features).
 * Validates: pure functions, immutability, edge cases, golden constraints.
 *
 * Golden tests (AC5/Constraint 2 — immutability):
 *   [G] buyIntel should not mutate the input GameState
 *   [G] buyIntel should not mutate the input events array
 *   [G] canBuyIntel is deterministic for the same inputs
 *   [G] forceEvent should not mutate the input GameState
 *   [G] canForceEvent is deterministic for the same inputs
 */

import { describe, it, expect } from "vitest";
import { golden } from "./utils/golden";
import {
  canBuyIntel, buyIntel, BUY_INTEL_COST,
  canForceEvent, forceEvent, FORCE_EVENT_COST,
} from "../influenceActions";
import { createInitialGameState } from "../gameManager";
import { GameState, Event, EventId, createEventId } from "../types";
import { WEATHER_RAIN, WEATHER_WIND, LOCATION_CASTLE } from "./fixtures/events";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState("historian");
  return {
    ...base,
    influence: 10,
    events: [WEATHER_RAIN, WEATHER_WIND, LOCATION_CASTLE],
    ...overrides,
  };
}

const HIDDEN_EVENT_ID = WEATHER_WIND.eventId; // observedByPlayer: false
const OBSERVED_EVENT_ID = WEATHER_RAIN.eventId; // observedByPlayer: true

// ---------------------------------------------------------------------------
// canBuyIntel
// ---------------------------------------------------------------------------

describe("canBuyIntel", () => {
  it("should return true when event is hidden and influence is sufficient", () => {
    const state = makeState({ influence: BUY_INTEL_COST });
    expect(canBuyIntel(state, HIDDEN_EVENT_ID)).toBe(true);
  });

  it("should return false when event is already observed", () => {
    const state = makeState({ influence: 10 });
    expect(canBuyIntel(state, OBSERVED_EVENT_ID)).toBe(false);
  });

  it("should return false when influence is less than cost", () => {
    const state = makeState({ influence: BUY_INTEL_COST - 1 });
    expect(canBuyIntel(state, HIDDEN_EVENT_ID)).toBe(false);
  });

  it("should return false when influence is exactly 0", () => {
    const state = makeState({ influence: 0 });
    expect(canBuyIntel(state, HIDDEN_EVENT_ID)).toBe(false);
  });

  it("should return false when event does not exist in state", () => {
    const state = makeState({ influence: 10 });
    const unknownId = createEventId("non-existent-event");
    expect(canBuyIntel(state, unknownId)).toBe(false);
  });

  it("should return false when events array is empty", () => {
    const state = makeState({ influence: 10, events: [] });
    expect(canBuyIntel(state, HIDDEN_EVENT_ID)).toBe(false);
  });

  it("should return true when influence is exactly equal to cost", () => {
    const state = makeState({ influence: BUY_INTEL_COST });
    expect(canBuyIntel(state, HIDDEN_EVENT_ID)).toBe(true);
  });

  it("should return true when influence is well above cost", () => {
    const state = makeState({ influence: 100 });
    expect(canBuyIntel(state, HIDDEN_EVENT_ID)).toBe(true);
  });

  golden("canBuyIntel is deterministic for the same inputs", () => {
    const state = makeState({ influence: 5 });
    const result1 = canBuyIntel(state, HIDDEN_EVENT_ID);
    const result2 = canBuyIntel(state, HIDDEN_EVENT_ID);
    const result3 = canBuyIntel(state, HIDDEN_EVENT_ID);
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });
});

// ---------------------------------------------------------------------------
// buyIntel
// ---------------------------------------------------------------------------

describe("buyIntel", () => {
  it("should deduct BUY_INTEL_COST from influence", () => {
    const state = makeState({ influence: 10 });
    const result = buyIntel(state, HIDDEN_EVENT_ID);
    expect(result.influence).toBe(10 - BUY_INTEL_COST);
  });

  it("should set observedByPlayer to true on the targeted event", () => {
    const state = makeState({ influence: 10 });
    const result = buyIntel(state, HIDDEN_EVENT_ID);
    const revealedEvent = result.events.find((e) => e.eventId === HIDDEN_EVENT_ID);
    expect(revealedEvent?.observedByPlayer).toBe(true);
  });

  it("should not change observedByPlayer on other events", () => {
    const state = makeState({ influence: 10 });
    const result = buyIntel(state, HIDDEN_EVENT_ID);

    const rainEvent = result.events.find((e) => e.eventId === OBSERVED_EVENT_ID);
    expect(rainEvent?.observedByPlayer).toBe(true); // still true

    const castleEvent = result.events.find((e) => e.eventId === LOCATION_CASTLE.eventId);
    expect(castleEvent?.observedByPlayer).toBe(LOCATION_CASTLE.observedByPlayer); // unchanged
  });

  it("should return original state unchanged when influence is insufficient", () => {
    const state = makeState({ influence: BUY_INTEL_COST - 1 });
    const result = buyIntel(state, HIDDEN_EVENT_ID);
    expect(result).toBe(state);
  });

  it("should return original state unchanged when event is already observed", () => {
    const state = makeState({ influence: 10 });
    const result = buyIntel(state, OBSERVED_EVENT_ID);
    expect(result).toBe(state);
  });

  it("should return original state unchanged when event does not exist", () => {
    const state = makeState({ influence: 10 });
    const unknownId = createEventId("ghost-event");
    const result = buyIntel(state, unknownId);
    expect(result).toBe(state);
  });

  it("should preserve all other state fields unchanged", () => {
    const state = makeState({ influence: 10 });
    const result = buyIntel(state, HIDDEN_EVENT_ID);
    expect(result.turnNumber).toBe(state.turnNumber);
    expect(result.currentFaction).toBe(state.currentFaction);
    expect(result.claims).toBe(state.claims);
    expect(result.credibilityMap).toBe(state.credibilityMap);
    expect(result.isGameOver).toBe(state.isGameOver);
    expect(result.worldState).toBe(state.worldState);
  });

  it("should allow buying intel after accumulating enough influence", () => {
    const poor = makeState({ influence: 0 });
    expect(canBuyIntel(poor, HIDDEN_EVENT_ID)).toBe(false);

    const rich = { ...poor, influence: BUY_INTEL_COST };
    expect(canBuyIntel(rich, HIDDEN_EVENT_ID)).toBe(true);

    const result = buyIntel(rich, HIDDEN_EVENT_ID);
    expect(result.influence).toBe(0);
    expect(result.events.find((e) => e.eventId === HIDDEN_EVENT_ID)?.observedByPlayer).toBe(true);
  });

  it("should support buying intel on multiple separate events sequentially", () => {
    const hiddenCastle: Event = { ...LOCATION_CASTLE, observedByPlayer: false };
    const state = makeState({
      influence: 10,
      events: [WEATHER_RAIN, WEATHER_WIND, hiddenCastle],
    });

    const after1 = buyIntel(state, WEATHER_WIND.eventId);
    expect(after1.influence).toBe(10 - BUY_INTEL_COST);

    const after2 = buyIntel(after1, hiddenCastle.eventId);
    expect(after2.influence).toBe(10 - BUY_INTEL_COST * 2);
    expect(after2.events.find((e) => e.eventId === WEATHER_WIND.eventId)?.observedByPlayer).toBe(true);
    expect(after2.events.find((e) => e.eventId === hiddenCastle.eventId)?.observedByPlayer).toBe(true);
  });

  golden("buyIntel should not mutate the input GameState", () => {
    const state = makeState({ influence: 10 });
    const stateBefore = JSON.parse(JSON.stringify(state));

    buyIntel(state, HIDDEN_EVENT_ID);

    expect(state.influence).toBe(stateBefore.influence);
    expect(state.events).toEqual(stateBefore.events);
    expect(state.events.find((e) => e.eventId === HIDDEN_EVENT_ID)?.observedByPlayer).toBe(false);
  });

  golden("buyIntel should not mutate the input events array", () => {
    const state = makeState({ influence: 10 });
    const originalEvents = state.events;
    const originalEventSnapshots = state.events.map((e) => ({ ...e }));

    buyIntel(state, HIDDEN_EVENT_ID);

    expect(state.events).toBe(originalEvents);
    state.events.forEach((event, i) => {
      expect(event.observedByPlayer).toBe(originalEventSnapshots[i].observedByPlayer);
    });
  });
});

// ---------------------------------------------------------------------------
// BUY_INTEL_COST constant
// ---------------------------------------------------------------------------

describe("BUY_INTEL_COST", () => {
  it("should be a positive number", () => {
    expect(BUY_INTEL_COST).toBeGreaterThan(0);
  });

  it("should be affordable from the starting influence (50)", () => {
    expect(BUY_INTEL_COST).toBeLessThanOrEqual(50);
  });
});

// ---------------------------------------------------------------------------
// canForceEvent
// ---------------------------------------------------------------------------

describe("canForceEvent", () => {
  function makeForceState(overrides: Partial<GameState> = {}): GameState {
    const base = createInitialGameState("historian");
    return { ...base, influence: 10, ...overrides };
  }

  it("should return true when event type is valid and influence is sufficient", () => {
    const state = makeForceState({ influence: FORCE_EVENT_COST });
    expect(canForceEvent(state, "weather")).toBe(true);
  });

  it("should return false when influence is less than cost", () => {
    const state = makeForceState({ influence: FORCE_EVENT_COST - 1 });
    expect(canForceEvent(state, "weather")).toBe(false);
  });

  it("should return false when event type is not in the registry", () => {
    const state = makeForceState({ influence: 10 });
    expect(canForceEvent(state, "dragons")).toBe(false);
  });

  it("should return false when a force is already pending", () => {
    const state = makeForceState({ influence: 10, pendingForcedEventType: "weather" });
    expect(canForceEvent(state, "location")).toBe(false);
  });

  it("should return false when influence is exactly 0", () => {
    const state = makeForceState({ influence: 0 });
    expect(canForceEvent(state, "weather")).toBe(false);
  });

  it("should return true when influence exactly equals cost", () => {
    const state = makeForceState({ influence: FORCE_EVENT_COST });
    expect(canForceEvent(state, "discovery")).toBe(true);
  });

  it("should accept any valid event type from the registry", () => {
    const state = makeForceState({ influence: 100 });
    expect(canForceEvent(state, "action")).toBe(true);
    expect(canForceEvent(state, "conversation")).toBe(true);
    expect(canForceEvent(state, "character")).toBe(true);
  });

  golden("canForceEvent is deterministic for the same inputs", () => {
    const state = makeForceState({ influence: 5 });
    const r1 = canForceEvent(state, "weather");
    const r2 = canForceEvent(state, "weather");
    const r3 = canForceEvent(state, "weather");
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });
});

// ---------------------------------------------------------------------------
// forceEvent
// ---------------------------------------------------------------------------

describe("forceEvent", () => {
  function makeForceState(overrides: Partial<GameState> = {}): GameState {
    const base = createInitialGameState("historian");
    return { ...base, influence: 10, ...overrides };
  }

  it("should set pendingForcedEventType to the chosen type", () => {
    const state = makeForceState({ influence: 10 });
    const result = forceEvent(state, "weather");
    expect(result.pendingForcedEventType).toBe("weather");
  });

  it("should deduct FORCE_EVENT_COST from influence", () => {
    const state = makeForceState({ influence: 10 });
    const result = forceEvent(state, "location");
    expect(result.influence).toBe(10 - FORCE_EVENT_COST);
  });

  it("should return original state unchanged when influence is insufficient", () => {
    const state = makeForceState({ influence: FORCE_EVENT_COST - 1 });
    const result = forceEvent(state, "weather");
    expect(result).toBe(state);
  });

  it("should return original state unchanged when event type is invalid", () => {
    const state = makeForceState({ influence: 10 });
    const result = forceEvent(state, "dragons");
    expect(result).toBe(state);
  });

  it("should return original state unchanged when force is already pending", () => {
    const state = makeForceState({ influence: 10, pendingForcedEventType: "weather" });
    const result = forceEvent(state, "location");
    expect(result).toBe(state);
  });

  it("should preserve all other state fields unchanged", () => {
    const state = makeForceState({ influence: 10 });
    const result = forceEvent(state, "action");
    expect(result.turnNumber).toBe(state.turnNumber);
    expect(result.currentFaction).toBe(state.currentFaction);
    expect(result.claims).toBe(state.claims);
    expect(result.events).toBe(state.events);
    expect(result.credibilityMap).toBe(state.credibilityMap);
    expect(result.isGameOver).toBe(state.isGameOver);
    expect(result.worldState).toBe(state.worldState);
  });

  it("should allow forcing different types on consecutive turns", () => {
    let state = makeForceState({ influence: 20, pendingForcedEventType: null });
    state = forceEvent(state, "weather");
    expect(state.pendingForcedEventType).toBe("weather");
    // Simulate clearing after turn
    state = { ...state, pendingForcedEventType: null };
    state = forceEvent(state, "discovery");
    expect(state.pendingForcedEventType).toBe("discovery");
  });

  golden("forceEvent should not mutate the input GameState", () => {
    const state = makeForceState({ influence: 10 });
    const stateBefore = JSON.parse(JSON.stringify(state));

    forceEvent(state, "weather");

    expect(state.influence).toBe(stateBefore.influence);
    expect(state.pendingForcedEventType).toBe(stateBefore.pendingForcedEventType);
  });
});

// ---------------------------------------------------------------------------
// FORCE_EVENT_COST constant
// ---------------------------------------------------------------------------

describe("FORCE_EVENT_COST", () => {
  it("should be a positive number", () => {
    expect(FORCE_EVENT_COST).toBeGreaterThan(0);
  });

  it("should be affordable from the starting influence (50)", () => {
    expect(FORCE_EVENT_COST).toBeLessThanOrEqual(50);
  });

  it("should be more expensive than BUY_INTEL_COST (more strategic)", () => {
    expect(FORCE_EVENT_COST).toBeGreaterThanOrEqual(BUY_INTEL_COST);
  });
});
