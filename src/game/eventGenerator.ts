/**
 * EventGenerator: Deterministic event generation with seeded randomness.
 * Constraint 3: Uses SeededRNG for all randomness.
 * Constraint 9: Same seed → identical events (determinism).
 * Supports probabilistic shaping via faction beliefs (Epic 4).
 */

import { Event, EventId, TurnNumber, TruthValue, createEventId, Faction } from "./types";
import { SeededRNG } from "./rng";
import { EVENT_TYPE_KEYWORDS } from "./constants";
import { getFactionBeliefInfluence, getConsequenceTexts } from "./worldStateManager";
import type { WorldState } from "./types";

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
 * Supports probabilistic shaping via faction beliefs and consequence references.
 */
export class EventGenerator {
  private rng: SeededRNG;
  private eventCounter: number = 0;
  private worldState: WorldState | null = null;
  private currentFaction: Faction | null = null;

  constructor(seed: number) {
    this.rng = new SeededRNG(seed);
  }

  /**
   * Set world state for faction belief influence (optional, for Epic 4).
   */
  setWorldState(worldState: WorldState, currentFaction: Faction): void {
    this.worldState = worldState;
    this.currentFaction = currentFaction;
  }

  /**
   * Generate events for a turn, optionally influenced by faction beliefs.
   */
  generateEvents(turnNumber: TurnNumber, count: number = 3): Event[] {
    const events: Event[] = [];

    // Get faction belief influence if world state is set
    const beliefInfluence = this.worldState
      ? getFactionBeliefInfluence(this.worldState, this.currentFaction!, turnNumber)
      : {};

    // Get consequence texts for description enrichment
    const consequenceTexts = this.worldState
      ? getConsequenceTexts(this.worldState, turnNumber)
      : [];

    for (let i = 0; i < count; i++) {
      // Pick event type, weighted by faction beliefs
      const eventType = this.pickWeightedEventType(beliefInfluence);
      let description = this.rng.pick(EVENT_DESCRIPTIONS_BY_TYPE[eventType] || []);

      // Optionally add consequence reference to description
      if (consequenceTexts.length > 0 && this.rng.nextBool(0.3)) {
        const reference = this.rng.pick(consequenceTexts);
        description = `${description} (${reference})`;
      }

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

  /**
   * Pick an event type weighted by faction beliefs.
   */
  private pickWeightedEventType(
    beliefInfluence: Readonly<Record<string, number>>
  ): string {
    if (Object.keys(beliefInfluence).length === 0) {
      // No beliefs, use uniform distribution
      return this.rng.pick(EVENT_TYPES);
    }

    // Weighted random selection based on belief influence
    const types = EVENT_TYPES;
    const weights = types.map((t) => beliefInfluence[t] || 1.0);

    // Normalize weights
    const sum = weights.reduce((a, b) => a + b, 0);
    const normalized = weights.map((w) => w / sum);

    // Cumulative distribution
    let cumsum = 0;
    const roll = this.rng.next();

    for (let i = 0; i < types.length; i++) {
      cumsum += normalized[i];
      if (roll < cumsum) {
        return types[i];
      }
    }

    return types[types.length - 1];
  }
}
