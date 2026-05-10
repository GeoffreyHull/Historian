/**
 * EventGenerator: Deterministic event generation with seeded randomness.
 * Constraint 3: Uses SeededRNG for all randomness.
 * Constraint 9: Same seed → identical events (determinism).
 * Supports probabilistic shaping via faction beliefs (Epic 4).
 */

import { Event, EventId, TurnNumber, TruthValue, createEventId, Faction } from "./types";
import { SeededRNG } from "./rng";
import { EVENT_TYPE_KEYWORDS } from "./constants";
import { getFactionBeliefInfluence, getConsequenceTexts, getWorldVariableEventWeights } from "./worldStateManager";
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
  embargo: [
    "Trade routes were severed",
    "A blockade was enforced",
    "Sanctions were declared",
    "Markets closed their gates",
    "The treasury halted foreign exchange",
  ],
  rebellion: [
    "The people rose in defiance",
    "Whispers of revolt spread",
    "A coup was attempted",
    "Insurrection flared in the streets",
    "The loyalists routed the uprising",
  ],
  plague: [
    "A sickness crept through the city",
    "The pestilence claimed many souls",
    "An outbreak spread unchecked",
    "The infirmaries overflowed",
    "A strange disease appeared",
  ],
  trade: [
    "A caravan arrived with rare goods",
    "The market bustled with activity",
    "Merchants struck a lucrative deal",
    "Goods were exchanged at the fair",
    "A trade route was established",
  ],
  diplomacy: [
    "An envoy delivered a message",
    "A treaty was signed",
    "An alliance was proposed",
    "Negotiations began",
    "A pact was sealed",
  ],
  military: [
    "The army marched at dawn",
    "A siege encirled the fortress",
    "A great battle was joined",
    "The garrison stood watch",
    "A campaign was launched",
  ],
  religion: [
    "A temple was consecrated",
    "A sacred ritual was performed",
    "Heresy was denounced",
    "A schism divided the faithful",
    "A pilgrimage began",
  ],
  culture: [
    "A festival brought joy",
    "A tradition was observed",
    "A masterpiece of art was unveiled",
    "Music filled the halls",
    "A theatrical performance captivated",
  ],
  economy: [
    "The royal mint issued new coin",
    "Taxes were levied",
    "The treasury was counted",
    "Debts were called due",
    "Inflation gripped the markets",
  ],
  infrastructure: [
    "A new road was completed",
    "A bridge was built",
    "The harbor was expanded",
    "The city wall was reinforced",
    "An aqueduct channeled fresh water",
  ],
  intrigue: [
    "A conspiracy was uncovered",
    "A betrayal shook the court",
    "Espionage was detected",
    "An assassination was foiled",
    "Blackmail threatened the noble",
  ],
  migration: [
    "A great exodus began",
    "Refugees sought shelter",
    "A settlement was founded",
    "Nomads arrived at the gates",
    "A resettlement was organized",
  ],
  magic: [
    "An omen appeared in the sky",
    "A curse befell the land",
    "A prophecy was spoken",
    "An enchantment was woven",
    "A ritual summoned strange forces",
  ],
  disaster: [
    "The earth trembled violently",
    "A famine gripped the region",
    "Floodwaters rose",
    "A wildfire consumed the forest",
    "A drought parched the fields",
  ],
  innovation: [
    "A new invention was revealed",
    "A discovery changed understanding",
    "A breakthrough was achieved",
    "A master craft was displayed",
    "An engineering marvel was built",
  ],
  exploration: [
    "An expedition set forth",
    "A voyage to unknown lands began",
    "A frontier was charted",
    "A cartographer surveyed new ground",
    "A survey revealed hidden terrain",
  ],
  justice: [
    "A trial was held",
    "A verdict was delivered",
    "A decree was proclaimed",
    "A new law was enacted",
    "A sentence was passed",
  ],
  education: [
    "An academy was founded",
    "A rare manuscript was copied",
    "A library was opened",
    "A scholar arrived to teach",
    "A curriculum was established",
  ],
  romance: [
    "A courtship was announced",
    "A marriage united the houses",
    "A scandal erupted",
    "An alliance was sealed with love",
    "An affair was revealed",
  ],
  succession: [
    "An heir was born",
    "A throne was claimed",
    "A dynasty continued",
    "A coronation was held",
    "A regent was appointed",
  ],
  naval: [
    "A fleet set sail",
    "A ship was launched",
    "Pirates raided the coast",
    "The navy patrolled the waters",
    "A coastal fort was manned",
  ],
  agriculture: [
    "The harvest was bountiful",
    "Crops withered in the fields",
    "A new crop was planted",
    "Livestock multiplied",
    "Irrigation channels were dug",
  ],
  mining: [
    "A mine was opened",
    "A quarry yielded fine stone",
    "Ore was smelted",
    "Deep excavation revealed veins",
    "A rich seam was discovered",
  ],
  hunting: [
    "A great hunt was organized",
    "Game was plentiful in the woods",
    "Poachers were caught",
    "The wilds were explored for game",
    "A tracking expedition returned",
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
   * If forcedEventType is provided, the first event is guaranteed to be that type (FR20).
   */
  generateEvents(turnNumber: TurnNumber, count: number = 3, forcedEventType?: string | null): Event[] {
    const events: Event[] = [];

    // Get faction belief influence if world state is set
    const beliefInfluence = this.worldState
      ? getFactionBeliefInfluence(this.worldState, this.currentFaction!, turnNumber)
      : {};

    // Get world variable weights for cascading consequence influence
    const variableWeights = this.worldState
      ? getWorldVariableEventWeights(this.worldState.worldVariables)
      : {};

    // Get consequence texts for description enrichment
    const consequenceTexts = this.worldState
      ? getConsequenceTexts(this.worldState, turnNumber)
      : [];

    for (let i = 0; i < count; i++) {
      // FR20: first event uses forced type if specified; remaining use weighted selection
      const eventType =
        i === 0 && forcedEventType
          ? forcedEventType
          : this.pickWeightedEventType(beliefInfluence, variableWeights);

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
    beliefInfluence: Readonly<Record<string, number>>,
    variableWeights: Readonly<Record<string, number>>
  ): string {
    if (Object.keys(beliefInfluence).length === 0) {
      return this.rng.pick(EVENT_TYPES);
    }

    // Combine belief influence with variable weights multiplicatively
    const types = EVENT_TYPES;
    const weights = types.map((t) => {
      const belief = beliefInfluence[t] || 1.0;
      const variable = variableWeights[t] || 1.0;
      return belief * variable;
    });

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
