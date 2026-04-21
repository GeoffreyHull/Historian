"use strict";
/**
 * EventGenerator tests: Verify determinism (Constraint 9).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const eventGenerator_1 = require("../eventGenerator");
const rng_1 = require("../rng");
describe("SeededRNG", () => {
    it("should produce identical sequences with same seed", () => {
        const rng1 = new rng_1.SeededRNG(42);
        const seq1 = [rng1.next(), rng1.next(), rng1.next()];
        const rng2 = new rng_1.SeededRNG(42);
        const seq2 = [rng2.next(), rng2.next(), rng2.next()];
        expect(seq1).toEqual(seq2);
    });
    it("should produce different sequences with different seeds", () => {
        const rng1 = new rng_1.SeededRNG(42);
        const seq1 = [rng1.next(), rng1.next(), rng1.next()];
        const rng2 = new rng_1.SeededRNG(99);
        const seq2 = [rng2.next(), rng2.next(), rng2.next()];
        expect(seq1).not.toEqual(seq2);
    });
    it("should generate random integers in range", () => {
        const rng = new rng_1.SeededRNG(42);
        for (let i = 0; i < 100; i++) {
            const val = rng.nextInt(10, 20);
            expect(val).toBeGreaterThanOrEqual(10);
            expect(val).toBeLessThan(20);
        }
    });
    it("should generate booleans", () => {
        const rng = new rng_1.SeededRNG(42);
        const bools = Array.from({ length: 100 }, () => rng.nextBool(0.5));
        expect(bools.some((b) => b === true)).toBe(true);
        expect(bools.some((b) => b === false)).toBe(true);
    });
    it("should pick random elements from array", () => {
        const arr = ["a", "b", "c", "d", "e"];
        const rng = new rng_1.SeededRNG(42);
        const picks = Array.from({ length: 100 }, () => rng.pick(arr));
        expect(picks.every((p) => arr.includes(p))).toBe(true);
    });
});
describe("EventGenerator", () => {
    it("should produce identical events with same seed", () => {
        const gen1 = new eventGenerator_1.EventGenerator(42);
        const events1 = gen1.generateEvents(1, 5);
        const gen2 = new eventGenerator_1.EventGenerator(42);
        const events2 = gen2.generateEvents(1, 5);
        expect(events1.length).toBe(events2.length);
        for (let i = 0; i < events1.length; i++) {
            expect(events1[i]).toEqual(events2[i]);
        }
    });
    it("should produce different events with different seeds", () => {
        const gen1 = new eventGenerator_1.EventGenerator(42);
        const events1 = gen1.generateEvents(1, 5);
        const gen2 = new eventGenerator_1.EventGenerator(99);
        const events2 = gen2.generateEvents(1, 5);
        // At least some event should differ
        const diffs = events1.filter((e, i) => e.eventType !== events2[i].eventType ||
            e.truthValue !== events2[i].truthValue);
        expect(diffs.length).toBeGreaterThan(0);
    });
    it("should generate valid event types", () => {
        const gen = new eventGenerator_1.EventGenerator(42);
        const events = gen.generateEvents(1, 10);
        const validTypes = [
            "weather",
            "location",
            "character",
            "conversation",
            "action",
            "discovery",
        ];
        expect(events.every((e) => validTypes.includes(e.eventType))).toBe(true);
    });
    it("should mark events with observation flags", () => {
        const gen = new eventGenerator_1.EventGenerator(42);
        const events = gen.generateEvents(1, 20);
        const observed = events.filter((e) => e.observedByPlayer);
        const unobserved = events.filter((e) => !e.observedByPlayer);
        // With ~70% observation rate and 20 events, expect most observed
        expect(observed.length).toBeGreaterThan(5); // At least some observed
        expect(unobserved.length).toBeGreaterThan(0); // At least some unobserved
    });
    it("should generate events with deterministic descriptions", () => {
        const gen1 = new eventGenerator_1.EventGenerator(42);
        const events1 = gen1.generateEvents(1, 3);
        const gen2 = new eventGenerator_1.EventGenerator(42);
        const events2 = gen2.generateEvents(1, 3);
        events1.forEach((e1, i) => {
            expect(e1.description).toBe(events2[i].description);
        });
    });
    it("should increment event IDs", () => {
        const gen = new eventGenerator_1.EventGenerator(42);
        const events1 = gen.generateEvents(1, 3);
        const events2 = gen.generateEvents(2, 2);
        const allIds = [...events1, ...events2].map((e) => e.eventId);
        const uniqueIds = new Set(allIds);
        expect(allIds.length).toBe(uniqueIds.size); // All IDs unique
    });
});
//# sourceMappingURL=eventGenerator.test.js.map