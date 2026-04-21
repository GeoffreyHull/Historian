/**
 * WorldStateManager: Manages persistent game state across runs.
 * Tracks faction beliefs shaped by player claims and consequences.
 * Implements state recovery over time (consequences fade).
 */

import {
  WorldState,
  FactionBelief,
  ConsequenceRecord,
  Claim,
  Event,
  EventId,
  Faction,
  TurnNumber,
  CredibilityResult,
} from "./types";
import { EVENT_TYPE_KEYWORDS } from "./constants";

/**
 * Create initial world state for run 1.
 * initialSeed: Deterministic seed for event generation across all runs.
 * FR46-FR47: Same seed ensures identical event sequences on resumption.
 */
export function createInitialWorldState(initialSeed: number = Math.floor(Math.random() * 1000000)): WorldState {
  return {
    initialSeed,
    runNumber: 1,
    factionBeliefs: {
      historian: [],
      scholar: [],
      witness: [],
      scribe: [],
    },
    consequences: [],
    lastUpdateTurn: 0,
    history: [],
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
  const decayedBeliefs: Record<Faction, readonly FactionBelief[]> = {
    historian: decayFactionBeliefs(currentWorldState.factionBeliefs.historian),
    scholar: decayFactionBeliefs(currentWorldState.factionBeliefs.scholar),
    witness: decayFactionBeliefs(currentWorldState.factionBeliefs.witness),
    scribe: decayFactionBeliefs(currentWorldState.factionBeliefs.scribe),
  };

  return {
    initialSeed: currentWorldState.initialSeed, // Preserve seed across runs for deterministic resumption (FR46-FR47)
    runNumber: nextRun,
    factionBeliefs: decayedBeliefs,
    consequences: decayedConsequences,
    lastUpdateTurn: lastTurnNumber,
    history: currentWorldState.history,
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

  return {
    ...worldState,
    factionBeliefs: updatedBeliefs,
    consequences: [...worldState.consequences, ...newConsequences],
    lastUpdateTurn: events[events.length - 1]?.turnNumber || 1,
    history: worldState.history,
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
): ConsequenceRecord[] {
  const consequences: ConsequenceRecord[] = [];

  // For each accurate, high-credibility claim, record it as a potential consequence trigger
  for (const result of credibilityResults) {
    if (
      result.accuracy === "correct" &&
      result.finalCredibility > 60 &&
      !result.hasInsult
    ) {
      // Probabilistically trigger a consequence based on credibility
      const triggerChance = result.finalCredibility / 100;

      // Use a deterministic but claim-based trigger (for reproducibility)
      const triggerHash = hashClaim(result.claim) % 100;

      if (triggerHash < triggerChance * 100) {
        consequences.push({
          claimText: result.claim.claimText,
          triggerEventId: result.claim.eventId,
          turnIntroduced: result.claim.turnNumber,
          intensity: result.finalCredibility,
          decayRate: 0.15, // Consequences fade at 15% per run
        });
      }
    }
  }

  return consequences;
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
    if (result.accuracy === "correct" && result.finalCredibility > 50) {
      const eventType = getEventTypeFromId(result.event.eventId);

      for (const faction of ["historian", "scholar", "witness", "scribe"] as const) {
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
