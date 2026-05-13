/**
 * Core type definitions for the game.
 * All types are JSON-serializable (no Date, Function, Symbol).
 * All types are immutable (use readonly for objects and arrays).
 */

export type EventId = string & { readonly __brand: "EventId" };
export type TurnNumber = number;
export type TruthValue = "true" | "false";
export type ClaimReliability = "high" | "medium" | "low";
export type Faction = "historian" | "scholar" | "witness" | "scribe" | "diplomat" | "rebel" | "merchant";

export const createEventId = (id: string): EventId => id as EventId;
export const createTurn = (turn: number): TurnNumber => turn;

/**
 * EvidenceFragment: A named witness or source account attached to an event.
 * Players see available fragments before writing their claim.
 */
export interface EvidenceFragment {
  readonly witnessName: string;
  readonly role: string;
  readonly account: string;
  readonly reliability: ClaimReliability;
  readonly available: boolean;
}

/**
 * PendingClaim: A claim awaiting retroactive score revelation.
 * Score is hidden until revealTurn; revealed automatically by nextTurn.
 */
export interface PendingClaim {
  readonly claim: Claim;
  readonly evidenceFragments: readonly EvidenceFragment[];
  readonly revealTurn: TurnNumber;
}

/**
 * Event: Represents a historical event that occurred in the world.
 */
export interface Event {
  readonly eventId: EventId;
  readonly eventType: string; // e.g., "weather", "location", "character", or LLM-generated type
  readonly description: string; // e.g., "A light rain fell on the castle"
  readonly truthValue: TruthValue; // The ground truth: "true" or "false"
  readonly turnNumber: TurnNumber; // Turn when event occurred
  readonly observedByPlayer: boolean; // Whether player witnessed this event
  readonly evidenceFragments: readonly EvidenceFragment[]; // Named witness accounts
  readonly eventTypeSource?: "hardcoded" | "llm-generated"; // Track origin for debugging
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
  readonly accuracy: number; // [0, 100] semantic similarity to event description
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
 * WorldVariables: Aggregate state of the world tracked across runs.
 * Each variable is 0-100. Events affect these values, which in turn
 * influence future event probabilities (cascading consequences).
 */
export interface WorldVariables {
  readonly morale: number; // 0-100: Population satisfaction, hope, will to continue
  readonly infrastructure: number; // 0-100: Physical state of roads, walls, buildings
  readonly economy: number; // 0-100: Economic health, trade, treasury
}

/**
 * WorldState: Persistent state across runs. Shaped by player claims and consequences.
 */
export interface WorldState {
  readonly initialSeed: number; // Seed for deterministic event generation (set at game start, persisted across runs)
  readonly runNumber: number; // Which run is this (1, 2, 3, etc.)
  readonly factionBeliefs: Readonly<Record<Faction, readonly FactionBelief[]>>; // What each faction believes
  readonly consequences: readonly CascadingConsequence[]; // Events triggered by past claims (may cascade)
  readonly lastUpdateTurn: TurnNumber; // When world state was last updated
  readonly history: readonly RunRecap[]; // Accumulated recaps from all completed runs
  readonly worldVariables: WorldVariables; // Aggregate world state (Phase 2)
}

/**
 * RunRecap: A lore-narrative summary of what happened in a run.
 */
export interface RunRecap {
  readonly runNumber: number; // Which run (1, 2, 3, etc.)
  readonly narrative: string; // Lore-style summary (not mechanics language)
  readonly majorClaims: readonly string[]; // High-credibility claims made
  readonly triggeredEvents: readonly string[]; // Events that were consequences
  readonly previousRunReferences: readonly string[]; // References to prior runs
  readonly timestamp: number; // When this recap was generated (milliseconds since epoch)
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
 * CascadingConsequence: A consequence that can trigger further consequences.
 * Extends ConsequenceRecord with cascade-specific metadata.
 * depth=0 means root (from player claim), depth=1 first cascade, etc.
 * Max cascade depth is 3 per Phase 3 spec.
 */
export interface CascadingConsequence extends ConsequenceRecord {
  readonly depth?: number; // How many cascade levels deep (0 = root claim)
  readonly triggeredEventType?: string; // Event type this consequence manifests as
  readonly affectedVariable?: keyof WorldVariables | null; // World variable affected
  readonly variableDelta?: number; // [-50, +50] change applied to affectedVariable
}

/**
 * FactionTrustMap: Per-faction trust values. Range: [-200, +100] per FR15.
 */
export type FactionTrustMap = Readonly<Record<string, number>>;


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
  readonly factionTrust: FactionTrustMap; // Per-faction trust [-200, +100] (FR15)
  readonly isGameOver: boolean; // Game end state
  readonly worldState: WorldState; // Persistent state across runs
  readonly pendingForcedEventType: string | null; // FR20: event type guaranteed next turn (null = none)
  readonly pendingClaims: readonly PendingClaim[]; // Claims awaiting retroactive score revelation
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
  | { type: "endRun"; newWorldState: WorldState }
  | { type: "updateFactionTrust"; deltas: FactionTrustMap };

/**
 * Reducer: Pure function for state updates.
 */
export type Reducer = (state: GameState, action: Action) => GameState;
