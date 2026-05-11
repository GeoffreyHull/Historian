/**
 * World Variables tests (Phase 2: Morale, Infrastructure, Economy).
 * Validates:
 *  - Variable initialization to default (50)
 *  - Event effects on variables (positive/negative deltas)
 *  - Variable clamping to [0, 100]
 *  - Variable decay between runs
 *  - Variable influence on event type weighting
 *  - Determinism & immutability (golden)
 *  - JSON serialization (golden)
 */

import { describe, it, expect } from "vitest";
import { golden } from "./utils/golden";
import {
  createInitialWorldState,
  evolveToNextRun,
  updateWorldStateAfterRun,
  applyEventVariableEffects,
  getWorldVariableEventWeights,
} from "../worldStateManager";
import { createEventId, WorldVariables } from "../types";
import { createClaim } from "./fixtures/claims";
import { EVENT_VARIABLE_EFFECTS, DEFAULT_VARIABLE_VALUE, LOW_VARIABLE_THRESHOLD, HIGH_VARIABLE_THRESHOLD } from "../constants";
import type { Event, CredibilityResult, Claim } from "../types";

function makeEvent(eventType: string): Event {
  return {
    eventId: createEventId(`evt-${eventType}`),
    eventType,
    description: `Test ${eventType}`,
    truthValue: "true",
    turnNumber: 1,
    observedByPlayer: true,
  evidenceFragments: [],
  };
}

describe("World Variable Initialization", () => {
  it("should initialize all variables to default (50)", () => {
    const state = createInitialWorldState();
    expect(state.worldVariables.morale).toBe(DEFAULT_VARIABLE_VALUE);
    expect(state.worldVariables.infrastructure).toBe(DEFAULT_VARIABLE_VALUE);
    expect(state.worldVariables.economy).toBe(DEFAULT_VARIABLE_VALUE);
  });

  it("should be JSON-serializable in initial state", () => {
    const state = createInitialWorldState();
    const json = JSON.stringify(state);
    const restored = JSON.parse(json);
    expect(restored.worldVariables).toEqual(state.worldVariables);
  });

  golden("should produce identical world variables with deterministic initialization", () => {
    const state1 = createInitialWorldState(42);
    const state2 = createInitialWorldState(42);
    expect(JSON.stringify(state1.worldVariables)).toBe(JSON.stringify(state2.worldVariables));
  });
});

describe("Event Variable Effects", () => {
  it("should increase morale on positive events", () => {
    const initial: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const events = [makeEvent("culture")]; // culture: [+5, 0, +1]
    const result = applyEventVariableEffects(initial, events);
    expect(result.morale).toBe(55);
    expect(result.economy).toBe(51);
  });

  it("should decrease morale on negative events", () => {
    const initial: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const events = [makeEvent("plague")]; // plague: [-8, 0, -4]
    const result = applyEventVariableEffects(initial, events);
    expect(result.morale).toBe(42);
    expect(result.economy).toBe(46);
  });

  it("should decrease infrastructure on disaster", () => {
    const initial: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const events = [makeEvent("disaster")]; // disaster: [-8, -8, -5]
    const result = applyEventVariableEffects(initial, events);
    expect(result.infrastructure).toBe(42);
  });

  it("should apply effects from multiple events", () => {
    const initial: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const events = [makeEvent("culture"), makeEvent("plague"), makeEvent("trade")];
    // culture: [+5, 0, +1], plague: [-8, 0, -4], trade: [+2, 0, +5]
    const result = applyEventVariableEffects(initial, events);
    expect(result.morale).toBe(49);  // 50 + 5 - 8 + 2
    expect(result.infrastructure).toBe(50); // 50 + 0 + 0 + 0
    expect(result.economy).toBe(52);   // 50 + 1 - 4 + 5
  });

  it("should clamp morale at 0 minimum", () => {
    const initial: WorldVariables = { morale: 5, infrastructure: 50, economy: 50 };
    const events = [makeEvent("disaster")]; // disaster: [-8, -8, -5]
    const result = applyEventVariableEffects(initial, events);
    expect(result.morale).toBe(0);
  });

  it("should clamp morale at 100 maximum", () => {
    const initial: WorldVariables = { morale: 98, infrastructure: 50, economy: 50 };
    const events = [makeEvent("culture")]; // culture: [+5, 0, +1]
    const result = applyEventVariableEffects(initial, events);
    expect(result.morale).toBe(100);
  });

  it("should handle neutral event types (no effect)", () => {
    const initial: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const events = [makeEvent("weather")]; // weather: [0, 0, 0]
    const result = applyEventVariableEffects(initial, events);
    expect(result).toEqual(initial);
  });

  golden("should not mutate input variables", () => {
    const initial: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const frozen = { ...initial };
    const events = [makeEvent("plague")];
    applyEventVariableEffects(initial, events);
    expect(initial).toEqual(frozen);
  });

  golden("should be deterministic: same events → identical results", () => {
    const initial: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const events = [makeEvent("plague"), makeEvent("culture")];
    const result1 = applyEventVariableEffects(initial, events);
    const result2 = applyEventVariableEffects(initial, events);
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });
});

describe("Variable Decay Between Runs", () => {
  it("should decay variables toward default after evolveToNextRun", () => {
    const world = {
      ...createInitialWorldState(),
      worldVariables: { morale: 20, infrastructure: 30, economy: 80 },
    };
    const evolved = evolveToNextRun(world, 10);
    // decay at 20%: 20 -> 20 + (50-20)*0.2 = 20 + 6 = 26
    expect(evolved.worldVariables.morale).toBe(26);
    // 30 -> 30 + (50-30)*0.2 = 30 + 4 = 34
    expect(evolved.worldVariables.infrastructure).toBe(34);
    // 80 -> 80 + (50-80)*0.2 = 80 - 6 = 74
    expect(evolved.worldVariables.economy).toBe(74);
  });

  it("should preserve variables at default if already at default", () => {
    const world = {
      ...createInitialWorldState(),
      worldVariables: { morale: 50, infrastructure: 50, economy: 50 },
    };
    const evolved = evolveToNextRun(world, 10);
    expect(evolved.worldVariables.morale).toBe(50);
    expect(evolved.worldVariables.infrastructure).toBe(50);
    expect(evolved.worldVariables.economy).toBe(50);
  });

  golden("should produce identical variable decay across 100 runs", () => {
    const world = {
      ...createInitialWorldState(),
      worldVariables: { morale: 10, infrastructure: 10, economy: 10 },
    };
    const results: string[] = [];
    for (let i = 0; i < 100; i++) {
      results.push(JSON.stringify(evolveToNextRun(world, 10).worldVariables));
    }
    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBe(first);
    }
  });
});

describe("Variable Event Weight Influence", () => {
  it("should boost low-variable event types when variable is low", () => {
    const variables: WorldVariables = { morale: 10, infrastructure: 50, economy: 50 };
    const weights = getWorldVariableEventWeights(variables);
    // low morale boosts: rebellion, intrigue, migration, disaster, plague
    expect(weights["rebellion"]).toBeGreaterThan(1.0);
    // unbiased event types should remain at 1.0
    expect(weights["weather"]).toBe(1.0);
    expect(weights["location"]).toBe(1.0);
  });

  it("should boost high-variable event types when variable is high", () => {
    const variables: WorldVariables = { morale: 90, infrastructure: 50, economy: 50 };
    const weights = getWorldVariableEventWeights(variables);
    // high morale boosts: culture, religion, romance, innovation, education
    expect(weights["culture"]).toBeGreaterThan(1.0);
    expect(weights["weather"]).toBe(1.0);
  });

  it("should apply no boosts when all variables are at default", () => {
    const variables: WorldVariables = { morale: 50, infrastructure: 50, economy: 50 };
    const weights = getWorldVariableEventWeights(variables);
    for (const w of Object.values(weights)) {
      expect(w).toBe(1.0);
    }
  });

  it("should combine multiple variable boosts", () => {
    const variables: WorldVariables = { morale: 10, infrastructure: 10, economy: 50 };
    const weights = getWorldVariableEventWeights(variables);
    // low morale + low infrastructure boost
    expect(weights["disaster"]).toBeGreaterThan(1.0); // in both low lists
    expect(weights["rebellion"]).toBeGreaterThan(1.0); // low morale
    expect(weights["plague"]).toBeGreaterThan(1.0); // low morale + low infra
  });

  golden("should be deterministic: same variables → identical weights", () => {
    const variables: WorldVariables = { morale: 15, infrastructure: 80, economy: 45 };
    const w1 = getWorldVariableEventWeights(variables);
    const w2 = getWorldVariableEventWeights(variables);
    expect(JSON.stringify(w1)).toBe(JSON.stringify(w2));
  });
});

describe("End-to-End: World Variables in Game Flow", () => {
  it("should include worldVariables in updateWorldStateAfterRun", () => {
    const worldState = createInitialWorldState();
    const claims: Claim[] = [createClaim({ claimText: "test", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 })];
    const events: Event[] = [makeEvent("culture"), makeEvent("plague")];
    const credResults: CredibilityResult[] = [{
      claim: claims[0],
      event: events[0],
      accuracy: 100,
      hasInsult: false,
      baseCredibility: 50,
      penalty: 0,
      finalCredibility: 65,
    }];

    const updated = updateWorldStateAfterRun(worldState, claims, credResults, events, "historian");
    expect(updated.worldVariables).toBeDefined();
    expect(updated.worldVariables.morale).not.toBe(DEFAULT_VARIABLE_VALUE); // changed from events
  });

  golden("should produce deterministic variable evolution with same seed", () => {
    // evolveToNextRun is deterministic (no RNG used)
    const world1 = createInitialWorldState();
    const evolved1a = evolveToNextRun(world1, 10);
    const evolved1b = evolveToNextRun(world1, 10);
    expect(JSON.stringify(evolved1a.worldVariables)).toBe(JSON.stringify(evolved1b.worldVariables));
  });

  golden("JSON serialization round-trip preserves world variables", () => {
    const state = createInitialWorldState();
    const modified = {
      ...state,
      worldVariables: { morale: 25, infrastructure: 70, economy: 45 },
    };
    const serialized = JSON.stringify(modified);
    const deserialized = JSON.parse(serialized);
    expect(deserialized.worldVariables).toEqual(modified.worldVariables);
  });
});
