/**
 * Seeded event fixtures for testing.
 * 15 deterministic events covering all event types, edge cases, and conflict scenarios.
 */

import { Event, EventId, TruthValue, createEventId } from "../../types";

// Weather events (3)
export const WEATHER_RAIN: Event = {
  eventId: createEventId("evt-weather-001"),
  eventType: "weather",
  description: "A light rain fell on the castle grounds throughout the morning.",
  truthValue: "true",
  turnNumber: 1,
  observedByPlayer: true,
};

export const WEATHER_WIND: Event = {
  eventId: createEventId("evt-weather-002"),
  eventType: "weather",
  description: "Strong winds gusted through the forest, bending tree branches.",
  truthValue: "false", // Actually, it was calm
  turnNumber: 2,
  observedByPlayer: false,
};

export const WEATHER_CLEAR: Event = {
  eventId: createEventId("evt-weather-003"),
  eventType: "weather",
  description: "The sky was clear and sunny, perfect for travel.",
  truthValue: "true",
  turnNumber: 3,
  observedByPlayer: true,
};

// Location events (3)
export const LOCATION_CASTLE: Event = {
  eventId: createEventId("evt-location-001"),
  eventType: "location",
  description: "The party arrived at the castle gates.",
  truthValue: "true",
  turnNumber: 4,
  observedByPlayer: true,
};

export const LOCATION_FOREST: Event = {
  eventId: createEventId("evt-location-002"),
  eventType: "location",
  description: "The forest was dark and impassable.",
  truthValue: "false", // Path was clear
  turnNumber: 5,
  observedByPlayer: false,
};

export const LOCATION_VILLAGE: Event = {
  eventId: createEventId("evt-location-003"),
  eventType: "location",
  description: "They found shelter in a small village by the river.",
  truthValue: "true",
  turnNumber: 6,
  observedByPlayer: true,
};

// Character events (3)
export const CHARACTER_APPEARANCE: Event = {
  eventId: createEventId("evt-character-001"),
  eventType: "character",
  description: "A stranger appeared from the shadows.",
  truthValue: "true",
  turnNumber: 7,
  observedByPlayer: true,
};

export const CHARACTER_ACTION: Event = {
  eventId: createEventId("evt-character-002"),
  eventType: "character",
  description: "The merchant spoke with a thick accent.",
  truthValue: "true",
  turnNumber: 8,
  observedByPlayer: true,
};

export const CHARACTER_CONVERSATION: Event = {
  eventId: createEventId("evt-character-003"),
  eventType: "character",
  description: "They debated the price for an hour.",
  truthValue: "false", // Only 10 minutes
  turnNumber: 9,
  observedByPlayer: false,
};

// Edge case events (3)
export const EDGE_EMPTY_DESCRIPTION: Event = {
  eventId: createEventId("evt-edge-001"),
  eventType: "discovery",
  description: "", // Empty but valid
  truthValue: "true",
  turnNumber: 10,
  observedByPlayer: true,
};

export const EDGE_MAX_LENGTH: Event = {
  eventId: createEventId("evt-edge-002"),
  eventType: "discovery",
  description:
    "They discovered a vast treasure trove filled with ancient relics, magical artifacts, " +
    "maps to distant lands, and chronicles of civilizations long forgotten, spanning millennia of history.",
  truthValue: "true",
  turnNumber: 11,
  observedByPlayer: false,
};

export const EDGE_SPECIAL_CHARS: Event = {
  eventId: createEventId("evt-edge-003"),
  eventType: "discovery",
  description: "Found: 'Tome of Lore' (cost: 500¢, value: ∞)",
  truthValue: "true",
  turnNumber: 12,
  observedByPlayer: true,
};

// Conflict events (3)
export const CONFLICT_CONTRADICTORY_1: Event = {
  eventId: createEventId("evt-conflict-001"),
  eventType: "action",
  description: "The knight attacked the dragon.",
  truthValue: "true",
  turnNumber: 13,
  observedByPlayer: true,
};

export const CONFLICT_CONTRADICTORY_2: Event = {
  eventId: createEventId("evt-conflict-002"),
  eventType: "action",
  description: "The knight attacked the dragon.",
  truthValue: "false", // Same event, opposite truth
  turnNumber: 14,
  observedByPlayer: false,
};

export const CONFLICT_AMBIGUOUS: Event = {
  eventId: createEventId("evt-conflict-003"),
  eventType: "discovery",
  description: "The crown was lost in the tower.",
  truthValue: "true", // Lost in tower but later recovered elsewhere?
  turnNumber: 15,
  observedByPlayer: true,
};

/**
 * SEEDED_EVENTS: Array of all fixture events for parametrized testing.
 * Deterministic, reproducible, covers all types and edge cases.
 */
export const SEEDED_EVENTS: Event[] = [
  WEATHER_RAIN,
  WEATHER_WIND,
  WEATHER_CLEAR,
  LOCATION_CASTLE,
  LOCATION_FOREST,
  LOCATION_VILLAGE,
  CHARACTER_APPEARANCE,
  CHARACTER_ACTION,
  CHARACTER_CONVERSATION,
  EDGE_EMPTY_DESCRIPTION,
  EDGE_MAX_LENGTH,
  EDGE_SPECIAL_CHARS,
  CONFLICT_CONTRADICTORY_1,
  CONFLICT_CONTRADICTORY_2,
  CONFLICT_AMBIGUOUS,
];
