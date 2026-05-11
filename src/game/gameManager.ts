/**
 * GameManager: Centralized game state management.
 * Pure state updates, immutable, JSON-serializable.
 * Constraint 2 (immutability) + Constraint 5 (JSON serializable) + Constraint 6 (action dispatch).
 */

import { GameState, Action, Faction, TurnNumber, createTurn, WorldState, PendingClaim } from "./types";
import { createInitialWorldState } from "./worldStateManager";
import { createInitialTrustMap, applyTrustDeltas } from "./factionTrustSystem";
import { CLAIM_REVEAL_DELAY } from "./constants";

/**
 * Create initial game state.
 */
export function createInitialGameState(
  faction: Faction = "historian",
  turnNumber: TurnNumber = createTurn(1),
  worldState?: WorldState
): GameState {
  return {
    turnNumber,
    currentFaction: faction,
    events: [],
    claims: [],
    credibilityMap: {},
    influence: 50,
    factionTrust: createInitialTrustMap(),
    isGameOver: false,
    worldState: worldState ?? createInitialWorldState(),
    pendingForcedEventType: null,
    turnSnapshots: [],
    pendingClaims: [],
  };
}

/**
 * GameManager: Immutable state container and dispatcher.
 */
export class GameManager {
  private state: GameState;

  constructor(initialState?: GameState) {
    this.state = initialState ?? createInitialGameState();
  }

  /**
   * Get current state (read-only reference).
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Dispatch action and update state immutably.
   */
  dispatch(action: Action): void {
    this.state = this.reduce(this.state, action);
  }

  /**
   * Pure reducer: state + action -> new state.
   */
  private reduce(state: GameState, action: Action): GameState {
    switch (action.type) {
      case "writeClaim": {
        // Store claims and create pending records for retroactive revelation
        const newPending: PendingClaim[] = action.claims.map((claim) => ({
          claim,
          evidenceFragments:
            state.events.find((e) => e.eventId === claim.eventId)?.evidenceFragments ?? [],
          revealTurn: (state.turnNumber + CLAIM_REVEAL_DELAY) as TurnNumber,
        }));
        return {
          ...state,
          claims: [...state.claims, ...action.claims],
          pendingClaims: [...state.pendingClaims, ...newPending],
        };
      }

      case "evaluateClaims":
        // S4 evaluates claims and updates credibility map
        const newCredibilityMap = { ...state.credibilityMap };
        for (const result of action.results) {
          newCredibilityMap[result.event.eventId] = result.finalCredibility;
        }
        return {
          ...state,
          credibilityMap: newCredibilityMap,
        };

      case "nextTurn": {
        // Advance turn, reset current claims.
        // Pending claims are resolved asynchronously by the resolver service
        // (see turnExecutor.ts), which dispatches evaluateClaims when due.
        const nextTurn = (state.turnNumber + 1) as TurnNumber;
        return {
          ...state,
          turnNumber: nextTurn,
          claims: [],
        };
      }

      case "updateEvents":
        // S2: Add events to state
        return {
          ...state,
          events: [...state.events, ...action.events],
        };

      case "updateWorldState":
        // Epic 4: Update persistent world state
        return {
          ...state,
          worldState: action.worldState,
        };

      case "endRun":
        // Epic 4: End of run - update world state and mark game over
        return {
          ...state,
          isGameOver: true,
          worldState: action.newWorldState,
        };

      case "updateFactionTrust":
        // FR15-FR18: Apply trust deltas immutably
        return {
          ...state,
          factionTrust: applyTrustDeltas(state.factionTrust, action.deltas),
        };

      default:
        return state;
    }
  }

  /**
   * Verify state is JSON-serializable (Constraint 5).
   */
  toJSON(): GameState {
    return this.state;
  }
}
