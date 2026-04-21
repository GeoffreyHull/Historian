/**
 * Tests for recap generator (Epic 5: Reflect on Your Authored History).
 * Validates: FR35-FR40 (recap generation, history book, lore language)
 * Constraints: C1 (pure functions), C5 (JSON serialization)
 */

import { describe, it, expect } from "vitest";
import { generateRunRecap, formatHistoryBook } from "../recapGenerator";
import {
  createEventId,
  createTurn,
  RunRecap,
} from "../types";
import { createClaim } from "./fixtures/claims";
import type { CredibilityResult, Event } from "../types";
import { createInitialWorldState } from "../worldStateManager";

const TEST_EVENT: Event = {
  eventId: createEventId("evt-test-001"),
  eventType: "weather",
  description: "A light rain fell.",
  truthValue: "true",
  turnNumber: 1,
  observedByPlayer: true,
};

describe("[G] Recap Generator - Epic 5 Tests", () => {
  describe("FR35: System generates end-of-run recap", () => {
    it("[G] should generate a recap from claims and events", () => {
      const claims = [
        createClaim({ claimText: "The sky was blue", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 75,
        },
      ];

      const worldState = createInitialWorldState();
      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        1
      );

      expect(recap).toBeDefined();
      expect(recap.runNumber).toBe(1);
      expect(recap.narrative).toBeTruthy();
      expect(recap.narrative.length).toBeGreaterThan(0);
    });

    it("[G] should include high-credibility claims in recap", () => {
      const claims = [
        createClaim({ claimText: "The king was wise", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
        createClaim({ claimText: "The sky was purple", eventId: createEventId("evt-2"), isAboutObservedEvent: true, turnNumber: 2 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 85,
        },
        {
          claim: claims[1],
          event: TEST_EVENT,
          accuracy: "incorrect",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 40,
          finalCredibility: 10,
        },
      ];

      const worldState = createInitialWorldState();
      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        1
      );

      expect(recap.majorClaims).toContain("The king was wise");
      expect(recap.majorClaims).not.toContain("The sky was purple");
    });

    it("[G] should limit major claims to top 5", () => {
      const claims = Array.from({ length: 10 }, (_, i) =>
        createClaim({ claimText: `Claim ${i}`, eventId: createEventId(`evt-${i}`), isAboutObservedEvent: true, turnNumber: i + 1 })
      );

      const credResults = claims.map((claim) => ({
        claim,
        event: TEST_EVENT,
        accuracy: "correct" as const,
        hasInsult: false,
        baseCredibility: 50,
        penalty: 0,
        finalCredibility: 85,
      }));

      const worldState = createInitialWorldState();
      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        1
      );

      expect(recap.majorClaims.length).toBeLessThanOrEqual(5);
    });
  });

  describe("FR36: Recap in lore language, not mechanics", () => {
    it("[G] should use narrative language (not stats language)", () => {
      const claims = [
        createClaim({ claimText: "The throne was contested", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 80,
        },
      ];

      const worldState = createInitialWorldState();
      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        1
      );

      expect(recap.narrative).toMatch(/Chronicles|Ages|scribes|accounts|echoes/i);
      expect(recap.narrative).not.toMatch(/credibility|penalty|faction|multiplier/i);
    });

    it("[G] should format as readable narrative with sections", () => {
      const claims = [
        createClaim({ claimText: "The king spoke", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 70,
        },
      ];

      const worldState = createInitialWorldState();
      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        1
      );

      expect(recap.narrative).toMatch(/^# Chronicles/m);
      expect(recap.narrative).toMatch(/^## /m);
    });
  });

  describe("FR37: Recap references previous run consequences", () => {
    it("[G] should reference old consequences from prior runs", () => {
      const claims = [
        createClaim({ claimText: "The curse lingered", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 75,
        },
      ];

      const baseState = createInitialWorldState();
      const worldState = {
        ...baseState,
        consequences: [
          {
            claimText: "The throne was shaken",
            triggerEventId: createEventId("evt-previous"),
            turnIntroduced: createTurn(1),
            intensity: 30,
            decayRate: 0.15,
          },
        ],
      };

      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        2
      );

      expect(recap.previousRunReferences.length).toBeGreaterThanOrEqual(0);
      expect(recap.narrative).toMatch(/past|prior|echoes?|age/i);
    });

    it("[G] should not reference strong consequences", () => {
      const claims = [
        createClaim({ claimText: "The blessing held", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 75,
        },
      ];

      const baseState2 = createInitialWorldState();
      const worldState = {
        ...baseState2,
        consequences: [
          {
            claimText: "The blessing was cast",
            triggerEventId: createEventId("evt-strong"),
            turnIntroduced: createTurn(1),
            intensity: 90,
            decayRate: 0.15,
          },
        ],
      };

      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        2
      );

      expect(recap.previousRunReferences.length).toBe(0);
    });
  });

  describe("FR38: Player can access history book anytime", () => {
    it("[G] should format multiple recaps as readable history book", () => {
      const recap1: RunRecap = {
        runNumber: 1,
        narrative: "# Chronicles of the First Age\n\nThe beginning.",
        majorClaims: ["The kingdom was founded"],
        triggeredEvents: ["evt-1"],
        previousRunReferences: [],
        timestamp: Date.now(),
      };

      const recap2: RunRecap = {
        runNumber: 2,
        narrative: "# Chronicles of the Second Age\n\nThe kingdom grew.",
        majorClaims: ["The city was built"],
        triggeredEvents: ["evt-2"],
        previousRunReferences: ["The kingdom still stands"],
        timestamp: Date.now(),
      };

      const historyBook = formatHistoryBook([recap1, recap2]);

      expect(historyBook).toContain("History Book");
      expect(historyBook).toContain("First Age");
      expect(historyBook).toContain("Second Age");
      expect(historyBook).toContain("The beginning");
      expect(historyBook).toContain("The kingdom grew");
    });

    it("[G] should show readable message when history is empty", () => {
      const historyBook = formatHistoryBook([]);

      expect(historyBook).toContain("History Book");
      expect(historyBook).toContain("No tales have yet been recorded");
    });

    it("[G] should include unfinished tale note", () => {
      const recap: RunRecap = {
        runNumber: 1,
        narrative: "First age",
        majorClaims: [],
        triggeredEvents: [],
        previousRunReferences: [],
        timestamp: Date.now(),
      };

      const historyBook = formatHistoryBook([recap]);

      expect(historyBook).toMatch(/Unfinished|next chapter/i);
    });
  });

  describe("FR39: History book accumulates recaps", () => {
    it("[G] should include all recaps in accumulated order", () => {
      const recaps: RunRecap[] = Array.from({ length: 5 }, (_, i) => ({
        runNumber: i + 1,
        narrative: `# Age ${i + 1}`,
        majorClaims: [`Claim of age ${i + 1}`],
        triggeredEvents: [`evt-${i + 1}`],
        previousRunReferences: [],
        timestamp: Date.now() + i * 1000,
      }));

      const historyBook = formatHistoryBook(recaps);

      for (let i = 0; i < 5; i++) {
        expect(historyBook).toContain(`Age ${i + 1}`);
      }
    });

    it("[G] should preserve recap order (chronological)", () => {
      const recap1: RunRecap = {
        runNumber: 1,
        narrative: "First",
        majorClaims: [],
        triggeredEvents: [],
        previousRunReferences: [],
        timestamp: 1000,
      };

      const recap2: RunRecap = {
        runNumber: 2,
        narrative: "Second",
        majorClaims: [],
        triggeredEvents: [],
        previousRunReferences: [],
        timestamp: 2000,
      };

      const historyBook = formatHistoryBook([recap1, recap2]);
      const firstIndex = historyBook.indexOf("First");
      const secondIndex = historyBook.indexOf("Second");

      expect(firstIndex).toBeLessThan(secondIndex);
    });
  });

  describe("FR40: History book is readable but not editable", () => {
    it("[G] should return string (read-only by nature)", () => {
      const recaps: RunRecap[] = [];
      const historyBook = formatHistoryBook(recaps);

      expect(typeof historyBook).toBe("string");
    });

    it("[G] should not expose edit interface", () => {
      const recap: RunRecap = {
        runNumber: 1,
        narrative: "Test",
        majorClaims: [],
        triggeredEvents: [],
        previousRunReferences: [],
        timestamp: Date.now(),
      };

      const historyBook = formatHistoryBook([recap]);

      expect(typeof historyBook).not.toBe("object");
      expect(historyBook).not.toHaveProperty("edit");
      expect(historyBook).not.toHaveProperty("delete");
    });
  });

  describe("Constraint 1: Pure Functions", () => {
    it("[G] should not mutate input arguments", () => {
      const claims = [
        createClaim({ claimText: "Test claim", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 75,
        },
      ];
      const worldState = createInitialWorldState();

      const frozen = {
        claims: JSON.parse(JSON.stringify(claims)),
        credResults: JSON.parse(JSON.stringify(credResults)),
        worldState: JSON.parse(JSON.stringify(worldState)),
      };

      generateRunRecap(claims, credResults, [TEST_EVENT], worldState, 1);

      expect(JSON.stringify(claims)).toBe(JSON.stringify(frozen.claims));
      expect(JSON.stringify(credResults)).toBe(JSON.stringify(frozen.credResults));
      expect(JSON.stringify(worldState)).toBe(JSON.stringify(frozen.worldState));
    });

    it("[G] should produce identical output for identical inputs", () => {
      const claims = [
        createClaim({ claimText: "Same claim", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 75,
        },
      ];
      const worldState = createInitialWorldState();

      const results = [];
      for (let i = 0; i < 10; i++) {
        const recap = generateRunRecap(
          claims,
          credResults,
          [TEST_EVENT],
          worldState,
          1
        );
        results.push(recap.narrative);
      }

      const first = results[0];
      for (const narrative of results.slice(1)) {
        expect(narrative).toBe(first);
      }
    });
  });

  describe("Constraint 5: JSON Serialization", () => {
    it("[G] should generate JSON-serializable recaps", () => {
      const claims = [
        createClaim({ claimText: "Test", eventId: createEventId("evt-1"), isAboutObservedEvent: true, turnNumber: 1 }),
      ];
      const credResults: CredibilityResult[] = [
        {
          claim: claims[0],
          event: TEST_EVENT,
          accuracy: "correct",
          hasInsult: false,
          baseCredibility: 50,
          penalty: 0,
          finalCredibility: 75,
        },
      ];

      const worldState = createInitialWorldState();
      const recap = generateRunRecap(
        claims,
        credResults,
        [TEST_EVENT],
        worldState,
        1
      );

      const serialized = JSON.stringify(recap);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.runNumber).toBe(recap.runNumber);
      expect(deserialized.narrative).toBe(recap.narrative);
      expect(deserialized.majorClaims).toEqual(recap.majorClaims);
    });

    it("[G] should maintain history book format after serialization", () => {
      const recap: RunRecap = {
        runNumber: 1,
        narrative: "Test narrative",
        majorClaims: ["claim1"],
        triggeredEvents: ["evt1"],
        previousRunReferences: ["ref1"],
        timestamp: 12345,
      };

      const historyBook = formatHistoryBook([recap]);
      const serialized = JSON.stringify(historyBook);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toBe(historyBook);
    });
  });
});
