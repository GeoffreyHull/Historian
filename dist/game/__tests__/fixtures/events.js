"use strict";
/**
 * Seeded event fixtures for testing.
 * 15 deterministic events covering all event types, edge cases, and conflict scenarios.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEEDED_EVENTS = exports.CONFLICT_AMBIGUOUS = exports.CONFLICT_CONTRADICTORY_2 = exports.CONFLICT_CONTRADICTORY_1 = exports.EDGE_SPECIAL_CHARS = exports.EDGE_MAX_LENGTH = exports.EDGE_EMPTY_DESCRIPTION = exports.CHARACTER_CONVERSATION = exports.CHARACTER_ACTION = exports.CHARACTER_APPEARANCE = exports.LOCATION_VILLAGE = exports.LOCATION_FOREST = exports.LOCATION_CASTLE = exports.WEATHER_CLEAR = exports.WEATHER_WIND = exports.WEATHER_RAIN = void 0;
const types_1 = require("../../types");
// Weather events (3)
exports.WEATHER_RAIN = {
    eventId: (0, types_1.createEventId)("evt-weather-001"),
    eventType: "weather",
    description: "A light rain fell on the castle grounds throughout the morning.",
    truthValue: "true",
    turnNumber: 1,
};
exports.WEATHER_WIND = {
    eventId: (0, types_1.createEventId)("evt-weather-002"),
    eventType: "weather",
    description: "Strong winds gusted through the forest, bending tree branches.",
    truthValue: "false", // Actually, it was calm
    turnNumber: 2,
};
exports.WEATHER_CLEAR = {
    eventId: (0, types_1.createEventId)("evt-weather-003"),
    eventType: "weather",
    description: "The sky was clear and sunny, perfect for travel.",
    truthValue: "true",
    turnNumber: 3,
};
// Location events (3)
exports.LOCATION_CASTLE = {
    eventId: (0, types_1.createEventId)("evt-location-001"),
    eventType: "location",
    description: "The party arrived at the castle gates.",
    truthValue: "true",
    turnNumber: 4,
};
exports.LOCATION_FOREST = {
    eventId: (0, types_1.createEventId)("evt-location-002"),
    eventType: "location",
    description: "The forest was dark and impassable.",
    truthValue: "false", // Path was clear
    turnNumber: 5,
};
exports.LOCATION_VILLAGE = {
    eventId: (0, types_1.createEventId)("evt-location-003"),
    eventType: "location",
    description: "They found shelter in a small village by the river.",
    truthValue: "true",
    turnNumber: 6,
};
// Character events (3)
exports.CHARACTER_APPEARANCE = {
    eventId: (0, types_1.createEventId)("evt-character-001"),
    eventType: "character",
    description: "A stranger appeared from the shadows.",
    truthValue: "true",
    turnNumber: 7,
};
exports.CHARACTER_ACTION = {
    eventId: (0, types_1.createEventId)("evt-character-002"),
    eventType: "character",
    description: "The merchant spoke with a thick accent.",
    truthValue: "true",
    turnNumber: 8,
};
exports.CHARACTER_CONVERSATION = {
    eventId: (0, types_1.createEventId)("evt-character-003"),
    eventType: "character",
    description: "They debated the price for an hour.",
    truthValue: "false", // Only 10 minutes
    turnNumber: 9,
};
// Edge case events (3)
exports.EDGE_EMPTY_DESCRIPTION = {
    eventId: (0, types_1.createEventId)("evt-edge-001"),
    eventType: "discovery",
    description: "", // Empty but valid
    truthValue: "true",
    turnNumber: 10,
};
exports.EDGE_MAX_LENGTH = {
    eventId: (0, types_1.createEventId)("evt-edge-002"),
    eventType: "discovery",
    description: "They discovered a vast treasure trove filled with ancient relics, magical artifacts, " +
        "maps to distant lands, and chronicles of civilizations long forgotten, spanning millennia of history.",
    truthValue: "true",
    turnNumber: 11,
};
exports.EDGE_SPECIAL_CHARS = {
    eventId: (0, types_1.createEventId)("evt-edge-003"),
    eventType: "discovery",
    description: "Found: 'Tome of Lore' (cost: 500¢, value: ∞)",
    truthValue: "true",
    turnNumber: 12,
};
// Conflict events (3)
exports.CONFLICT_CONTRADICTORY_1 = {
    eventId: (0, types_1.createEventId)("evt-conflict-001"),
    eventType: "action",
    description: "The knight attacked the dragon.",
    truthValue: "true",
    turnNumber: 13,
};
exports.CONFLICT_CONTRADICTORY_2 = {
    eventId: (0, types_1.createEventId)("evt-conflict-002"),
    eventType: "action",
    description: "The knight attacked the dragon.",
    truthValue: "false", // Same event, opposite truth
    turnNumber: 14,
};
exports.CONFLICT_AMBIGUOUS = {
    eventId: (0, types_1.createEventId)("evt-conflict-003"),
    eventType: "discovery",
    description: "The crown was lost in the tower.",
    truthValue: "true", // Lost in tower but later recovered elsewhere?
    turnNumber: 15,
};
/**
 * SEEDED_EVENTS: Array of all fixture events for parametrized testing.
 * Deterministic, reproducible, covers all types and edge cases.
 */
exports.SEEDED_EVENTS = [
    exports.WEATHER_RAIN,
    exports.WEATHER_WIND,
    exports.WEATHER_CLEAR,
    exports.LOCATION_CASTLE,
    exports.LOCATION_FOREST,
    exports.LOCATION_VILLAGE,
    exports.CHARACTER_APPEARANCE,
    exports.CHARACTER_ACTION,
    exports.CHARACTER_CONVERSATION,
    exports.EDGE_EMPTY_DESCRIPTION,
    exports.EDGE_MAX_LENGTH,
    exports.EDGE_SPECIAL_CHARS,
    exports.CONFLICT_CONTRADICTORY_1,
    exports.CONFLICT_CONTRADICTORY_2,
    exports.CONFLICT_AMBIGUOUS,
];
//# sourceMappingURL=events.js.map