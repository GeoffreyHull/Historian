"use strict";
/**
 * EventGenerator: Deterministic event generation with seeded randomness.
 * Constraint 3: Uses SeededRNG for all randomness.
 * Constraint 9: Same seed → identical events (determinism).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventGenerator = void 0;
const types_1 = require("./types");
const rng_1 = require("./rng");
const constants_1 = require("./constants");
const EVENT_TYPES = Object.keys(constants_1.EVENT_TYPE_KEYWORDS);
const EVENT_DESCRIPTIONS_BY_TYPE = {
    weather: [
        "Rain fell gently",
        "Wind howled through",
        "Clear skies appeared",
        "Clouds gathered ominously",
        "Storm clouds approached",
    ],
    location: [
        "The party arrived at a landmark",
        "They entered a new area",
        "A location was discovered",
        "The terrain changed",
        "A settlement appeared",
    ],
    character: [
        "A stranger appeared",
        "Someone spoke",
        "A character acted",
        "An encounter occurred",
        "A person was met",
    ],
    action: [
        "An action was taken",
        "Something happened",
        "A decision was made",
        "An event unfolded",
        "Movement occurred",
    ],
    discovery: [
        "Something was found",
        "A secret was revealed",
        "An artifact was discovered",
        "Something unexpected happened",
        "A revelation occurred",
    ],
};
/**
 * EventGenerator: Generate deterministic events with seeded randomness.
 */
class EventGenerator {
    constructor(seed) {
        this.eventCounter = 0;
        this.rng = new rng_1.SeededRNG(seed);
    }
    /**
     * Generate events for a turn.
     */
    generateEvents(turnNumber, count = 3) {
        const events = [];
        for (let i = 0; i < count; i++) {
            const eventType = this.rng.pick(EVENT_TYPES);
            const description = this.rng.pick(EVENT_DESCRIPTIONS_BY_TYPE[eventType] || []);
            const truthValue = this.rng.nextBool(0.5) ? "true" : "false";
            // Observation: 70% chance to observe
            const observedByPlayer = this.rng.nextBool(0.7);
            const eventId = (0, types_1.createEventId)(`evt-${turnNumber}-${this.eventCounter++}`);
            events.push({
                eventId,
                eventType,
                description,
                truthValue,
                turnNumber,
                observedByPlayer,
            });
        }
        return events;
    }
}
exports.EventGenerator = EventGenerator;
//# sourceMappingURL=eventGenerator.js.map