/**
 * InfluenceActions: Pure functions for spending influence during play.
 * Constraint 1: Pure functions, no mutations.
 * Constraint 2: Immutable state updates.
 * FR19: Influence is the currency earned from credibility; spent here on strategic actions.
 */

import { GameState, EventId } from "./types";
import { EVENT_TYPE_KEYWORDS } from "./constants";

/** Cost in influence units to purchase intel on a hidden event. */
export const BUY_INTEL_COST = 2;

/** Cost in influence units to force a specific event type next turn (FR20). */
export const FORCE_EVENT_COST = 3;

/**
 * CanBuyIntel: Returns true if the player can spend influence to reveal the given event.
 * Conditions: event exists, is not already observed, and player has enough influence.
 */
export function canBuyIntel(gameState: GameState, eventId: EventId): boolean {
  const event = gameState.events.find((e) => e.eventId === eventId);
  if (!event) return false;
  if (event.observedByPlayer) return false;
  return gameState.influence >= BUY_INTEL_COST;
}

/**
 * BuyIntel: Spend influence to reveal a hidden event. Returns updated GameState.
 * If the action is invalid (insufficient influence, event already observed), returns
 * the original state unchanged.
 */
export function buyIntel(gameState: GameState, eventId: EventId): GameState {
  if (!canBuyIntel(gameState, eventId)) return gameState;

  const updatedEvents = gameState.events.map((e) =>
    e.eventId === eventId ? { ...e, observedByPlayer: true } : e
  );

  return {
    ...gameState,
    influence: gameState.influence - BUY_INTEL_COST,
    events: updatedEvents,
  };
}

/**
 * CanForceEvent: Returns true if the player can spend influence to force an event type next turn.
 * Conditions: eventType must be valid, no force already pending, enough influence.
 * FR20: Player claims influence which events appear in future turns.
 */
export function canForceEvent(gameState: GameState, eventType: string): boolean {
  const validTypes = Object.keys(EVENT_TYPE_KEYWORDS);
  if (!validTypes.includes(eventType)) return false;
  if (gameState.pendingForcedEventType !== null) return false;
  return gameState.influence >= FORCE_EVENT_COST;
}

/**
 * ForceEvent: Spend influence to guarantee a specific event type appears next turn.
 * Returns updated GameState with pendingForcedEventType set.
 * If the action is invalid, returns the original state unchanged.
 * FR20: Player claims influence which events appear in future turns.
 */
export function forceEvent(gameState: GameState, eventType: string): GameState {
  if (!canForceEvent(gameState, eventType)) return gameState;

  return {
    ...gameState,
    influence: gameState.influence - FORCE_EVENT_COST,
    pendingForcedEventType: eventType,
  };
}
