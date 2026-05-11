/**
 * WorldStateManager: Manages persistent game state across runs.
 * Tracks faction beliefs shaped by player claims and consequences.
 * Implements state recovery over time (consequences fade).
 */

import {
  WorldState,
  WorldVariables,
  FactionBelief,
  ConsequenceRecord,
  CascadingConsequence,
  Claim,
  Event,
  EventId,
  Faction,
  TurnNumber,
  CredibilityResult,
} from "./types";
import {
  EVENT_TYPE_KEYWORDS,
  EVENT_VARIABLE_EFFECTS,
  VARIABLE_EVENT_BOOSTS,
  LOW_VARIABLE_THRESHOLD,
  HIGH_VARIABLE_THRESHOLD,
  DEFAULT_VARIABLE_VALUE,
} from "./constants";

/**
 * Create initial world state for run 1.
 * initialSeed: Deterministic seed for event generation across all runs.
 * FR46-FR47: Same seed ensures identical event sequences on resumption.
 */
export function createInitialWorldState(initialSeed: number = Math.floor(Math.random() * 1000000)): WorldState {
  const factionList: readonly Faction[] = ["historian", "scholar", "witness", "scribe", "diplomat", "rebel", "merchant"];
  const factionBeliefs = Object.fromEntries(
    factionList.map((f) => [f, [] as readonly FactionBelief[]])
  ) as unknown as Record<Faction, readonly FactionBelief[]>;

  const initialVariables: WorldVariables = {
    morale: DEFAULT_VARIABLE_VALUE,
    infrastructure: DEFAULT_VARIABLE_VALUE,
    economy: DEFAULT_VARIABLE_VALUE,
  };

  return {
    initialSeed,
    runNumber: 1,
    factionBeliefs,
    consequences: [],
    lastUpdateTurn: 0,
    history: [],
    worldVariables: initialVariables,
  };
}

/**
 * Create next run's world state, decaying consequences and beliefs.
 */
export function evolveToNextRun(
  currentWorldState: WorldState,
  lastTurnNumber: TurnNumber
): WorldState {
  const nextRun = currentWorldState.runNumber + 1;

  // Decay consequences: reduce intensity by decay rate
  const decayedConsequences = currentWorldState.consequences
    .map((c) => ({
      ...c,
      intensity: Math.max(0, c.intensity * (1 - c.decayRate)),
    }))
    .filter((c) => c.intensity > 0.1); // Remove negligible consequences

  // Decay faction beliefs: reduce weight by decay rate
  const factionList: Faction[] = ["historian", "scholar", "witness", "scribe", "diplomat", "rebel", "merchant"];
  const decayedBeliefs: Record<Faction, readonly FactionBelief[]> = Object.fromEntries(
    factionList.map((f) => [f, decayFactionBeliefs(currentWorldState.factionBeliefs[f] || [])])
  ) as Record<Faction, readonly FactionBelief[]>;

  // Decay world variables toward default at 20% per run
  const decayRate = 0.2;
  const decayedVariables: WorldVariables = {
    morale: decayToward(currentWorldState.worldVariables.morale, DEFAULT_VARIABLE_VALUE, decayRate),
    infrastructure: decayToward(currentWorldState.worldVariables.infrastructure, DEFAULT_VARIABLE_VALUE, decayRate),
    economy: decayToward(currentWorldState.worldVariables.economy, DEFAULT_VARIABLE_VALUE, decayRate),
  };

  return {
    initialSeed: currentWorldState.initialSeed, // Preserve seed across runs for deterministic resumption (FR46-FR47)
    runNumber: nextRun,
    factionBeliefs: decayedBeliefs,
    consequences: decayedConsequences,
    lastUpdateTurn: lastTurnNumber,
    history: currentWorldState.history,
    worldVariables: decayedVariables,
  };
}

/**
 * Update world state after a run ends: add new consequences and update beliefs.
 */
export function updateWorldStateAfterRun(
  worldState: WorldState,
  claims: readonly Claim[],
  credibilityResults: readonly CredibilityResult[],
  events: readonly Event[],
  currentFaction: Faction
): WorldState {
  // Track which claims triggered events (for consequences)
  const newConsequences = recordConsequences(
    claims,
    credibilityResults,
    events,
    worldState
  );

  // Update faction beliefs based on claims
  const updatedBeliefs = updateFactionBeliefs(
    worldState.factionBeliefs,
    claims,
    credibilityResults,
    currentFaction
  );

  // Apply event effects to world variables
  const updatedVariables = applyEventVariableEffects(worldState.worldVariables, events);

  return {
    ...worldState,
    factionBeliefs: updatedBeliefs,
    consequences: [...worldState.consequences, ...newConsequences],
    lastUpdateTurn: events[events.length - 1]?.turnNumber || 1,
    history: worldState.history,
    worldVariables: updatedVariables,
  };
}

/**
 * Get faction beliefs that should influence event generation.
 * Returns weighted event types that are more likely to appear.
 */
export function getFactionBeliefInfluence(
  worldState: WorldState,
  faction: Faction,
  currentTurn: TurnNumber
): Readonly<Record<string, number>> {
  const beliefs = worldState.factionBeliefs[faction] || [];
  const influence: Record<string, number> = {};

  // Build base weights (all event types at 1.0)
  for (const eventType of Object.keys(EVENT_TYPE_KEYWORDS)) {
    influence[eventType] = 1.0;
  }

  // Apply belief weights, applying decay based on age
  for (const belief of beliefs) {
    const ageInTurns = currentTurn - belief.turnIntroduced;
    const decayFactor = Math.pow(1 - belief.decayRate, ageInTurns);
    const currentWeight = belief.weight * decayFactor;

    if (currentWeight > 0.1) {
      influence[belief.eventType] = Math.max(
        influence[belief.eventType],
        1.0 + currentWeight / 100
      );
    }
  }

  return influence;
}

/**
 * Get consequence-related event descriptions to incorporate into new events.
 */
export function getConsequenceTexts(
  worldState: WorldState,
  currentTurn: TurnNumber
): string[] {
  const texts: string[] = [];

  for (const consequence of worldState.consequences) {
    const ageInTurns = currentTurn - consequence.turnIntroduced;
    const intensity = consequence.intensity * Math.pow(1 - consequence.decayRate, ageInTurns);

    if (intensity > 0.2) {
      // Reference the original claim in a subtle way
      texts.push(`echoed from "${consequence.claimText}"`);
    }
  }

  return texts;
}

// ============= Helper Functions =============

function decayFactionBeliefs(beliefs: readonly FactionBelief[]): readonly FactionBelief[] {
  return beliefs
    .map((b) => ({
      ...b,
      weight: Math.max(0, b.weight * (1 - b.decayRate)),
    }))
    .filter((b) => b.weight > 0.1);
}

function recordConsequences(
  claims: readonly Claim[],
  credibilityResults: readonly CredibilityResult[],
  events: readonly Event[],
  worldState: WorldState
): CascadingConsequence[] {
  const consequences: CascadingConsequence[] = [];

  // For each accurate, high-credibility claim, record it as a potential consequence trigger
  for (const result of credibilityResults) {
    if (
      result.accuracy > 50 &&
      result.finalCredibility > 60 &&
      !result.hasInsult
    ) {
      const triggerChance = result.finalCredibility / 100;
      const triggerHash = hashClaim(result.claim) % 100;

      if (triggerHash < triggerChance * 100) {
        // Find the matching event to get its type
        const matchedEvent = events.find((e) => e.eventId === result.claim.eventId);
        const triggeredEventType = matchedEvent?.eventType ?? "discovery";

        // Determine which world variable this event type most affects
        const affectedVariable = getAffectedVariable(triggeredEventType);
        const variableDelta = getVariableDelta(triggeredEventType, affectedVariable, result.finalCredibility);

        consequences.push({
          claimText: result.claim.claimText,
          triggerEventId: result.claim.eventId,
          turnIntroduced: result.claim.turnNumber,
          intensity: result.finalCredibility,
          decayRate: 0.15,
          depth: 0,
          triggeredEventType,
          affectedVariable,
          variableDelta,
        });
      }
    }
  }

  return consequences;
}

/**
 * Determine which WorldVariables key is most affected by an event type.
 * Returns null if the event type has no significant variable effect.
 */
function getAffectedVariable(eventType: string): keyof WorldVariables | null {
  const effects = EVENT_VARIABLE_EFFECTS[eventType];
  if (!effects) return null;
  const [moraleEffect, infraEffect, econEffect] = effects;
  const maxAbsolute = Math.max(Math.abs(moraleEffect), Math.abs(infraEffect), Math.abs(econEffect));
  if (maxAbsolute === 0) return null;
  if (Math.abs(moraleEffect) === maxAbsolute) return "morale";
  if (Math.abs(infraEffect) === maxAbsolute) return "infrastructure";
  return "economy";
}

/**
 * Compute how much the affected variable changes when this consequence cascades.
 * Scaled by credibility; clamped to [-50, +50].
 */
function getVariableDelta(
  eventType: string,
  affectedVariable: keyof WorldVariables | null,
  credibility: number
): number {
  if (!affectedVariable) return 0;
  const effects = EVENT_VARIABLE_EFFECTS[eventType];
  if (!effects) return 0;
  const rawEffect =
    affectedVariable === "morale" ? effects[0]
    : affectedVariable === "infrastructure" ? effects[1]
    : effects[2];
  // Scale by credibility (0-100) → smaller delta for low-credibility claims
  const scaled = rawEffect * (credibility / 100);
  return Math.max(-50, Math.min(50, Math.round(scaled)));
}

/**
 * Generate cascading child consequences from existing ones.
 * Each consequence can spawn cascades up to MAX_CASCADE_DEPTH.
 * Cascade probability = intensity/100 * depthFactor (halved each level).
 * Returns new child consequences only (not parents).
 */
export function cascadeConsequences(
  currentConsequences: readonly CascadingConsequence[],
  currentTurn: TurnNumber
): CascadingConsequence[] {
  const MAX_CASCADE_DEPTH = 3;
  const children: CascadingConsequence[] = [];

  for (const parent of currentConsequences) {
    const depth = parent.depth ?? 0;
    if (depth >= MAX_CASCADE_DEPTH) continue;

    const depthFactor = Math.pow(0.5, depth);
    const cascadeChance = (parent.intensity / 100) * depthFactor;

    // Deterministic cascade trigger using hash of parent claim + depth
    const triggerHash = (hashString(parent.claimText + depth) % 100) / 100;
    if (triggerHash >= cascadeChance) continue;

    // Cascade intensity is halved from parent
    const childIntensity = Math.max(0, parent.intensity * 0.5);
    if (childIntensity < 5) continue; // Don't generate negligible cascades

    // The child event type is related to the parent (same or adjacent)
    const childEventType = parent.triggeredEventType ?? "discovery";
    const childAffectedVariable = getAffectedVariable(childEventType);
    const childDelta = getVariableDelta(childEventType, childAffectedVariable, childIntensity);

    children.push({
      claimText: `cascade of "${parent.claimText}"`,
      triggerEventId: parent.triggerEventId,
      turnIntroduced: currentTurn,
      intensity: childIntensity,
      decayRate: parent.decayRate * 1.2, // Cascades decay faster
      depth: depth + 1,
      triggeredEventType: childEventType,
      affectedVariable: childAffectedVariable,
      variableDelta: childDelta,
    });
  }

  return children;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function updateFactionBeliefs(
  currentBeliefs: Readonly<Record<Faction, readonly FactionBelief[]>>,
  claims: readonly Claim[],
  credibilityResults: readonly CredibilityResult[],
  playerFaction: Faction
): Readonly<Record<Faction, readonly FactionBelief[]>> {
  const updated = { ...currentBeliefs };

  // Update beliefs for each faction based on claims
  for (const result of credibilityResults) {
    if (result.accuracy > 50 && result.finalCredibility > 50) {
      const eventType = getEventTypeFromId(result.event.eventId);

      for (const faction of ["historian", "scholar", "witness", "scribe", "diplomat", "rebel", "merchant"] as const) {
        const beliefs = [...(updated[faction] || [])];

        // Find or create belief for this event type
        const existingBelief = beliefs.find((b) => b.eventType === eventType);

        if (existingBelief) {
          // Strengthen existing belief
          const strengthened = {
            ...existingBelief,
            weight: Math.min(100, existingBelief.weight + 10),
          };
          updated[faction] = beliefs.map((b) =>
            b.eventType === eventType ? strengthened : b
          );
        } else {
          // Create new belief
          beliefs.push({
            eventType,
            weight: 40, // Start at moderate weight
            decayRate: 0.15,
            turnIntroduced: result.claim.turnNumber,
          });
          updated[faction] = beliefs;
        }
      }
    }
  }

  return updated;
}

function getEventTypeFromId(eventId: EventId): string {
  // Extract event type from event ID (heuristic based on event generation pattern)
  const typeHint = eventId.split("-")[1] || "weather";
  return (
    Object.keys(EVENT_TYPE_KEYWORDS).find((t) =>
      typeHint.toLowerCase().includes(t.charAt(0))
    ) || "weather"
  );
}

/**
 * Apply event variable effects based on the events that occurred in a run.
 * Each event type's effect is applied once per event occurrence.
 * Variables are clamped to [0, 100].
 */
export function applyEventVariableEffects(
  current: WorldVariables,
  events: readonly Event[]
): WorldVariables {
  let morale = current.morale;
  let infrastructure = current.infrastructure;
  let economy = current.economy;

  for (const event of events) {
    const effect = EVENT_VARIABLE_EFFECTS[event.eventType];
    if (effect) {
      morale += effect[0];
      infrastructure += effect[1];
      economy += effect[2];
    }
  }

  return {
    morale: clamp(morale, 0, 100),
    infrastructure: clamp(infrastructure, 0, 100),
    economy: clamp(economy, 0, 100),
  };
}

/**
 * Get event type weight multipliers based on current world variables.
 * Low variables boost certain event types (e.g., low morale → rebellion).
 * High variables boost other event types (e.g., high morale → culture).
 * Returns a map of eventType → weight multiplier (default 1.0).
 */
export function getWorldVariableEventWeights(
  worldVariables: WorldVariables
): Readonly<Record<string, number>> {
  const weights: Record<string, number> = {};

  // Initialize all event types at 1.0
  for (const eventType of Object.keys(EVENT_TYPE_KEYWORDS)) {
    weights[eventType] = 1.0;
  }

  // Apply boosts based on each variable's state
  for (const varName of ["morale", "infrastructure", "economy"] as const) {
    const value = worldVariables[varName];
    const boosts = VARIABLE_EVENT_BOOSTS[varName];
    if (!boosts) continue;

    if (value < LOW_VARIABLE_THRESHOLD) {
      // Boost low-variable event types
      const multiplier = 1.0 + (LOW_VARIABLE_THRESHOLD - value) / LOW_VARIABLE_THRESHOLD;
      for (const eventType of boosts.low) {
        weights[eventType] = Math.max(weights[eventType], multiplier);
      }
    } else if (value > HIGH_VARIABLE_THRESHOLD) {
      // Boost high-variable event types
      const multiplier = 1.0 + (value - HIGH_VARIABLE_THRESHOLD) / (100 - HIGH_VARIABLE_THRESHOLD);
      for (const eventType of boosts.high) {
        weights[eventType] = Math.max(weights[eventType], multiplier);
      }
    }
  }

  return weights;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function decayToward(current: number, target: number, rate: number): number {
  return current + (target - current) * rate;
}

function hashClaim(claim: Claim): number {
  // Simple hash of claim text for deterministic trigger decisions
  let hash = 0;
  for (let i = 0; i < claim.claimText.length; i++) {
    const char = claim.claimText.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
