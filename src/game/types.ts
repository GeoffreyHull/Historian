/**
 * Core type definitions for the game.
 * All types are JSON-serializable (no Date, Function, Symbol).
 * All types are immutable (use readonly for objects and arrays).
 */

export type EventId = string & { readonly __brand: "EventId" };
export type TurnNumber = number;
export type TruthValue = "true" | "false";
export type Faction = "historian" | "scholar" | "witness" | "scribe";

export const createEventId = (id: string): EventId => id as EventId;
export const createTurn = (turn: number): TurnNumber => turn;

/**
 * Event: Represents a historical event that occurred in the world.
 */
export interface Event {
  readonly eventId: EventId;
  readonly eventType: string; // e.g., "weather", "location", "character"
  readonly description: string; // e.g., "A light rain fell on the castle"
  readonly truthValue: TruthValue; // The ground truth: "true" or "false"
  readonly turnNumber: TurnNumber; // Turn when event occurred
  readonly observedByPlayer: boolean; // Whether player witnessed this event
}

/**
 * Claim: A narrative claim about an event.
 */
export interface Claim {
  readonly claimText: string; // e.g., "It was raining"
  readonly eventId: EventId; // Which event is this claim about?
  readonly isAboutObservedEvent: boolean; // Was this event observable?
  readonly turnNumber: TurnNumber; // Turn when claim was made
}

/**
 * CredibilityResult: Output of credibility evaluation.
 */
export interface CredibilityResult {
  readonly claim: Claim;
  readonly event: Event;
  readonly accuracy: "correct" | "incorrect"; // Was the claim accurate?
  readonly hasInsult: boolean; // Did the claim contain an insult?
  readonly baseCredibility: number; // [0, 100]
  readonly penalty: number; // [0, 100] credibility reduction
  readonly finalCredibility: number; // [0, 100] = baseCredibility - penalty
}

/**
 * InfluenceCalculation: Result of influence calculation.
 */
export interface InfluenceCalculation {
  readonly claim: Claim;
  readonly credibilityResult: CredibilityResult;
  readonly faction: Faction;
  readonly credibilityScore: number; // [0, 100]
  readonly multiplier: number; // faction multiplier
  readonly influence: number; // credibilityScore × multiplier
}

/**
 * FactionBelief: What a faction believes about events (shaped by player claims).
 */
export interface FactionBelief {
  readonly eventType: string; // e.g., "weather", "location"
  readonly weight: number; // [0, 100] how likely to appear in future events
  readonly decayRate: number; // [0, 1] how fast belief fades over time
  readonly turnIntroduced: TurnNumber; // When this belief was established
}

/**
 * WorldState: Persistent state across runs. Shaped by player claims and consequences.
 */
export interface WorldState {
  readonly runNumber: number; // Which run is this (1, 2, 3, etc.)
  readonly factionBeliefs: Readonly<Record<Faction, readonly FactionBelief[]>>; // What each faction believes
  readonly consequences: readonly ConsequenceRecord[]; // Events triggered by past claims
  readonly lastUpdateTurn: TurnNumber; // When world state was last updated
}

/**
 * ConsequenceRecord: Tracks that a past claim triggered a future event.
 */
export interface ConsequenceRecord {
  readonly claimText: string; // The original claim
  readonly triggerEventId: EventId; // Event that was triggered
  readonly turnIntroduced: TurnNumber; // When the consequence started
  readonly intensity: number; // [0, 100] how strong the consequence is
  readonly decayRate: number; // [0, 1] how fast it fades
}

/**
 * GameState: Complete game state, 100% JSON-serializable.
 */
export interface GameState {
  readonly turnNumber: TurnNumber; // Current turn
  readonly currentFaction: Faction; // Player faction
  readonly events: readonly Event[]; // All events
  readonly claims: readonly Claim[]; // All claims made
  readonly credibilityMap: Readonly<Record<EventId, number>>; // event -> credibility [0, 100]
  readonly influence: number; // [0, 100] current influence
  readonly isGameOver: boolean; // Game end state
  readonly worldState: WorldState; // Persistent state across runs
}

/**
 * Action: Generic action for state updates.
 */
export type Action =
  | { type: "writeClaim"; claims: Claim[] }
  | { type: "evaluateClaims"; results: CredibilityResult[] }
  | { type: "nextTurn" }
  | { type: "updateEvents"; events: Event[] }
  | { type: "updateWorldState"; worldState: WorldState }
  | { type: "endRun"; newWorldState: WorldState };

/**
 * Reducer: Pure function for state updates.
 */
export type Reducer = (state: GameState, action: Action) => GameState;
