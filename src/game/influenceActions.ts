/**
 * InfluenceActions: Pure functions for spending influence during play.
 * Constraint 1: Pure functions, no mutations.
 * Constraint 2: Immutable state updates.
 * FR19: Influence is the currency earned from credibility; spent here on strategic actions.
 */

import { GameState, EventId } from "./types";

/** Cost in influence units to purchase intel on a hidden event. */
export const BUY_INTEL_COST = 2;

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
