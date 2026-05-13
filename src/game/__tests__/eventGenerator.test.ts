/**
 * EventGenerator tests
 */

import { EventGenerator } from "../eventGenerator";
import { EVENT_TYPE_KEYWORDS } from "../constants";

describe("EventGenerator", () => {

  it("should generate valid event types", () => {
    const gen = new EventGenerator();
    const events = gen.generateEvents(1 as any, 10);

    const validTypes = Object.keys(EVENT_TYPE_KEYWORDS);
    expect(events.every((e) => validTypes.includes(e.eventType))).toBe(true);
  });

  it("should attach exactly 3 evidence fragments to each event", () => {
    const gen = new EventGenerator();
    const events = gen.generateEvents(1 as any, 5);

    for (const event of events) {
      expect(event.evidenceFragments).toHaveLength(3);
    }
  });

  it("should produce fragments with all required fields", () => {
    const gen = new EventGenerator();
    const [event] = gen.generateEvents(1 as any, 1);

    for (const frag of event.evidenceFragments) {
      expect(typeof frag.witnessName).toBe("string");
      expect(typeof frag.role).toBe("string");
      expect(typeof frag.account).toBe("string");
      expect(["high", "medium", "low"]).toContain(frag.reliability);
      expect(typeof frag.available).toBe("boolean");
    }
  });

  it("should mark events with observation flags", () => {
    const gen = new EventGenerator();
    const events = gen.generateEvents(1 as any, 20);

    const observed = events.filter((e) => e.observedByPlayer);
    const unobserved = events.filter((e) => !e.observedByPlayer);

    // With ~70% observation rate and 20 events, expect most observed
    expect(observed.length).toBeGreaterThan(5); // At least some observed
    expect(unobserved.length).toBeGreaterThan(0); // At least some unobserved
  });

  it("should increment event IDs", () => {
    const gen = new EventGenerator();
    const events1 = gen.generateEvents(1 as any, 3);
    const events2 = gen.generateEvents(2 as any, 2);

    const allIds = [...events1, ...events2].map((e) => e.eventId);
    const uniqueIds = new Set(allIds);

    expect(allIds.length).toBe(uniqueIds.size); // All IDs unique
  });
});
