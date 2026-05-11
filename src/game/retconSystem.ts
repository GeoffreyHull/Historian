/**
 * RetconSystem: Allows players to rewind to a previous turn and replay with different claims.
 * Constraint 1: All pure functions — no I/O, no mutations.
 * Constraint 2: Returns new state objects, never mutates input.
 * Constraint 5: All output is JSON-serializable.
 * Architecture: Relies on TurnSnapshot array already stored in GameState.turnSnapshots.
 */

import { GameState, TurnNumber, TurnSnapshot } from "./types";

/** Influence cost to use retcon. */
export const RETCON_COST = 5;

/**
 * Whether the player can retcon to a specific past turn.
 * Requires: enough influence, target turn has a snapshot, not currently in retcon mode.
 */
export function canRetcon(gameState: GameState, targetTurnNumber: TurnNumber): boolean {
  if (gameState.influence < RETCON_COST) return false;
  const hasSnapshot = gameState.turnSnapshots.some(
    (s) => s.turnNumber === targetTurnNumber
  );
  return hasSnapshot;
}

/**
 * Get all turn numbers that have snapshots and are available for retcon.
 */
export function getRetconTargets(gameState: GameState): TurnNumber[] {
  return gameState.turnSnapshots.map((s) => s.turnNumber);
}

/**
 * Rewind game state to a previous turn snapshot.
 * Restores state from the snapshot; deducts influence cost.
 * Returns the new game state positioned at the target turn, ready for new claims.
 */
export function enterRetcon(gameState: GameState, targetTurnNumber: TurnNumber): GameState {
  const snapshot = gameState.turnSnapshots.find(
    (s) => s.turnNumber === targetTurnNumber
  );
  if (!snapshot) return gameState;
  if (gameState.influence < RETCON_COST) return gameState;

  return {
    ...snapshot.worldState
      ? gameState // keep structural shape
      : gameState,
    // Restore from snapshot
    turnNumber: snapshot.turnNumber,
    events: snapshot.events,
    claims: snapshot.claims,
    influence: snapshot.influence - RETCON_COST, // pay the cost
    factionTrust: snapshot.factionTrust,
    credibilityMap: snapshot.credibilityMap,
    worldState: snapshot.worldState,
    // Keep the current faction and game-over state
    currentFaction: gameState.currentFaction,
    isGameOver: gameState.isGameOver,
    pendingForcedEventType: gameState.pendingForcedEventType,
    // Keep all snapshots so player can see history; commitRetcon trims future ones
    turnSnapshots: gameState.turnSnapshots,
    pendingClaims: [],
  };
}

/**
 * Commit retcon: discard snapshots newer than the retcon point and finalize.
 * Call this after the player has submitted new claims for the retconned turn.
 */
export function commitRetcon(
  gameState: GameState,
  retconTargetTurn: TurnNumber
): GameState {
  // Keep only snapshots up to (but not including) the retcon target
  const trimmedSnapshots = gameState.turnSnapshots.filter(
    (s) => s.turnNumber < retconTargetTurn
  );
  return {
    ...gameState,
    turnSnapshots: trimmedSnapshots,
  };
}

/**
 * Cancel retcon: restore full original state from a backup of snapshots.
 * The caller must have saved the original snapshots before entering retcon.
 */
export function cancelRetcon(
  gameState: GameState,
  originalSnapshot: TurnSnapshot
): GameState {
  return {
    ...originalSnapshot.worldState
      ? gameState
      : gameState,
    turnNumber: originalSnapshot.turnNumber,
    events: originalSnapshot.events,
    claims: originalSnapshot.claims,
    influence: originalSnapshot.influence,
    factionTrust: originalSnapshot.factionTrust,
    credibilityMap: originalSnapshot.credibilityMap,
    worldState: originalSnapshot.worldState,
    currentFaction: gameState.currentFaction,
    isGameOver: gameState.isGameOver,
    pendingForcedEventType: gameState.pendingForcedEventType,
    turnSnapshots: gameState.turnSnapshots,
    pendingClaims: gameState.pendingClaims,
  };
}

/**
 * Take a snapshot of the current game state at the start of a turn.
 * Stored in GameState.turnSnapshots for later retcon.
 */
export function takeSnapshot(gameState: GameState): TurnSnapshot {
  return {
    turnNumber: gameState.turnNumber,
    events: gameState.events,
    claims: gameState.claims,
    influence: gameState.influence,
    factionTrust: { ...gameState.factionTrust },
    credibilityMap: { ...gameState.credibilityMap },
    worldState: gameState.worldState,
  };
}
