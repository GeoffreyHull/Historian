import {
  getRecentEventsSummary,
  getConsequencesSummary,
  getRunHistorySummary,
  formatWorldStateForPrompt,
  buildEventTypeSuggestionContext,
  buildEventDescriptionContext,
  buildWitnessContext,
} from "../eventHistoryHelper";
import { createEventId, Event, WorldState, CascadingConsequence, RunRecap } from "../types";

describe("eventHistoryHelper", () => {
  const mockEvent = (turn: number, type: string = "military"): Event => ({
    eventId: createEventId(`evt-${turn}-0`),
    eventType: type,
    description: "A soldier marched into the city.",
    truthValue: "true",
    turnNumber: turn as any,
    observedByPlayer: true,
    evidenceFragments: [],
  });

  const mockConsequence = (claim: string, intensity: number = 0.8): CascadingConsequence => ({
    claimText: claim,
    triggerEventId: createEventId("evt-trigger"),
    turnIntroduced: 3 as any,
    intensity,
    decayRate: 0.1,
  });

  const mockRunRecap = (num: number): RunRecap => ({
    runNumber: num,
    narrative: `In run ${num}, the kingdom faced many trials.`,
    majorClaims: ["The king was wise"],
    triggeredEvents: ["A rebellion"],
    previousRunReferences: [],
    timestamp: Date.now(),
  });

  const mockWorldState = (): WorldState => ({
    runNumber: 1,
    factionBeliefs: {
      historian: [],
      scholar: [],
      witness: [],
      scribe: [],
      diplomat: [],
      rebel: [],
      merchant: [],
    },
    consequences: [],
    lastUpdateTurn: 1 as any,
    history: [],
    worldVariables: {
      morale: 50,
      infrastructure: 60,
      economy: 70,
    },
  });

  describe("getRecentEventsSummary", () => {
    it("should return 'No recent history' for empty events", () => {
      const summary = getRecentEventsSummary([], 5);
      expect(summary).toBe("No recent history.");
    });

    it("should summarize recent events by turn", () => {
      const events = [
        mockEvent(2, "weather"),
        mockEvent(3, "military"),
        mockEvent(3, "discovery"),
      ];
      const summary = getRecentEventsSummary(events, 4, 3);
      expect(summary).toContain("Turn 2:");
      expect(summary).toContain("Turn 3:");
    });

    it("should respect the depth parameter", () => {
      const events = [
        mockEvent(1),
        mockEvent(2),
        mockEvent(3),
        mockEvent(4),
        mockEvent(5),
      ];
      const summary = getRecentEventsSummary(events, 5, 2); // Look back 2 turns
      expect(summary).toContain("Turn 4:");
      expect(summary).toContain("Turn 5:");
      expect(summary).not.toContain("Turn 1:");
    });

    it("should not mutate input events", () => {
      const events = [mockEvent(1), mockEvent(2)];
      const original = JSON.stringify(events);
      getRecentEventsSummary(events, 2);
      expect(JSON.stringify(events)).toBe(original);
    });
  });

  describe("getConsequencesSummary", () => {
    it("should return 'No active consequences' for empty array", () => {
      const summary = getConsequencesSummary([]);
      expect(summary).toBe("No active consequences.");
    });

    it("should summarize consequences by intensity", () => {
      const consequences = [
        mockConsequence("The embargo was declared", 0.9),
        mockConsequence("Trade routes shifted", 0.5),
        mockConsequence("Old feud resurfaces", 0.2),
      ];
      const summary = getConsequencesSummary(consequences);
      expect(summary).toContain("significant");
      expect(summary).toContain("notable");
      expect(summary).toContain("lingering");
    });

    it("should filter out low-intensity consequences", () => {
      const consequences = [
        mockConsequence("High impact", 0.9),
        mockConsequence("Zero impact", 0),
      ];
      const summary = getConsequencesSummary(consequences);
      expect(summary).toContain("High impact");
      expect(summary).not.toContain("Zero impact");
    });

    it("should not mutate input consequences", () => {
      const consequences = [mockConsequence("Test")];
      const original = JSON.stringify(consequences);
      getConsequencesSummary(consequences);
      expect(JSON.stringify(consequences)).toBe(original);
    });
  });

  describe("getRunHistorySummary", () => {
    it("should return first era message for empty history", () => {
      const summary = getRunHistorySummary([]);
      expect(summary).toContain("first era");
    });

    it("should include recent run recaps", () => {
      const recaps = [mockRunRecap(1), mockRunRecap(2), mockRunRecap(3)];
      const summary = getRunHistorySummary(recaps, 2);
      expect(summary).toContain("Run 2:");
      expect(summary).toContain("Run 3:");
      expect(summary).not.toContain("Run 1:");
    });

    it("should respect maxRuns parameter", () => {
      const recaps = [mockRunRecap(1), mockRunRecap(2), mockRunRecap(3)];
      const summary1 = getRunHistorySummary(recaps, 1);
      const summary2 = getRunHistorySummary(recaps, 3);
      expect(summary2.length).toBeGreaterThan(summary1.length);
    });

    it("should not mutate input recaps", () => {
      const recaps = [mockRunRecap(1)];
      const original = JSON.stringify(recaps);
      getRunHistorySummary(recaps);
      expect(JSON.stringify(recaps)).toBe(original);
    });
  });

  describe("formatWorldStateForPrompt", () => {
    it("should describe morale levels", () => {
      const base1 = mockWorldState();
      const state1 = { ...base1, worldVariables: { ...base1.worldVariables, morale: 90 } };
      const summary1 = formatWorldStateForPrompt(state1);
      expect(summary1).toContain("very high");

      const base2 = mockWorldState();
      const state2 = { ...base2, worldVariables: { ...base2.worldVariables, morale: 20 } };
      const summary2 = formatWorldStateForPrompt(state2);
      expect(summary2).toContain("very low");
    });

    it("should describe infrastructure", () => {
      const base = mockWorldState();
      const state = { ...base, worldVariables: { ...base.worldVariables, infrastructure: 80 } };
      const summary = formatWorldStateForPrompt(state);
      expect(summary).toContain("well-maintained");
    });

    it("should describe economy", () => {
      const base = mockWorldState();
      const state = { ...base, worldVariables: { ...base.worldVariables, economy: 30 } };
      const summary = formatWorldStateForPrompt(state);
      expect(summary).toContain("struggling");
    });

    it("should include numeric values", () => {
      const state = mockWorldState();
      const summary = formatWorldStateForPrompt(state);
      expect(summary).toContain("50");
      expect(summary).toContain("60");
      expect(summary).toContain("70");
    });

    it("should not mutate input world state", () => {
      const state = mockWorldState();
      const original = JSON.stringify(state);
      formatWorldStateForPrompt(state);
      expect(JSON.stringify(state)).toBe(original);
    });
  });

  describe("buildEventTypeSuggestionContext", () => {
    it("should combine all context elements", () => {
      const state = mockWorldState();
      const events = [mockEvent(3), mockEvent(4)];
      const consequences = [mockConsequence("The war began", 0.8)];
      const history = [mockRunRecap(1)];

      const context = buildEventTypeSuggestionContext(
        state,
        events,
        5,
        consequences,
        history
      );

      expect(context).toContain("Morale");
      expect(context).toContain("Turn 3:");
      expect(context).toContain("The war began");
      expect(context).toContain("Run 1:");
    });

    it("should not mutate any input parameters", () => {
      const state = mockWorldState();
      const events = [mockEvent(3)];
      const consequences = [mockConsequence("Test")];
      const history = [mockRunRecap(1)];

      const stateStr = JSON.stringify(state);
      const eventsStr = JSON.stringify(events);
      const consStr = JSON.stringify(consequences);
      const histStr = JSON.stringify(history);

      buildEventTypeSuggestionContext(state, events, 5, consequences, history);

      expect(JSON.stringify(state)).toBe(stateStr);
      expect(JSON.stringify(events)).toBe(eventsStr);
      expect(JSON.stringify(consequences)).toBe(consStr);
      expect(JSON.stringify(history)).toBe(histStr);
    });
  });

  describe("buildEventDescriptionContext", () => {
    it("should combine world state, recent events, and consequences", () => {
      const state = mockWorldState();
      const events = [mockEvent(4)];
      const consequences = [mockConsequence("Trade collapsed", 0.7)];

      const context = buildEventDescriptionContext(
        state,
        events,
        5,
        consequences
      );

      expect(context).toContain("World state:");
      expect(context).toContain("Turn 4:");
      expect(context).toContain("Trade collapsed");
    });
  });

  describe("buildWitnessContext", () => {
    it("should produce similar context to description context", () => {
      const state = mockWorldState();
      const events = [mockEvent(3)];
      const consequences = [mockConsequence("Rebellion", 0.5)];

      const descContext = buildEventDescriptionContext(state, events, 4, consequences);
      const witnessContext = buildWitnessContext(state, events, 4, consequences);

      // Should contain similar information
      expect(witnessContext).toContain("Morale");
      expect(witnessContext).toContain("Turn 3:");
    });
  });
});
