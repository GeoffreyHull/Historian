/**
 * EventGenerator: Deterministic event generation with seeded randomness.
 * Constraint 3: Uses SeededRNG for all randomness.
 * Constraint 9: Same seed → identical events (determinism).
 */

import { Event, EventId, TurnNumber, TruthValue, createEventId } from "./types";
import { SeededRNG } from "./rng";
import { EVENT_TYPE_KEYWORDS } from "./constants";

const EVENT_TYPES = Object.keys(EVENT_TYPE_KEYWORDS);

const EVENT_DESCRIPTIONS_BY_TYPE: Record<string, string[]> = {
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
  conversation: [
    "A conversation began",
    "Words were exchanged",
    "A dialog occurred",
    "A discussion took place",
    "People talked",
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
export class EventGenerator {
  private rng: SeededRNG;
  private eventCounter: number = 0;

  constructor(seed: number) {
    this.rng = new SeededRNG(seed);
  }

  /**
   * Generate events for a turn.
   */
  generateEvents(turnNumber: TurnNumber, count: number = 3): Event[] {
    const events: Event[] = [];

    for (let i = 0; i < count; i++) {
      const eventType = this.rng.pick(EVENT_TYPES);
      const description = this.rng.pick(EVENT_DESCRIPTIONS_BY_TYPE[eventType] || []);
      const truthValue: TruthValue = this.rng.nextBool(0.5) ? "true" : "false";
      // Observation: 70% chance to observe
      const observedByPlayer = this.rng.nextBool(0.7);

      const eventId = createEventId(`evt-${turnNumber}-${this.eventCounter++}`);

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
