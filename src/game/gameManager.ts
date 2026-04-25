/**
 * GameManager: Centralized game state management.
 * Pure state updates, immutable, JSON-serializable.
 * Constraint 2 (immutability) + Constraint 5 (JSON serializable) + Constraint 6 (action dispatch).
 */

import { GameState, Action, Faction, TurnNumber, createTurn, WorldState } from "./types";
import { createInitialWorldState } from "./worldStateManager";
import { createInitialTrustMap, applyTrustDeltas } from "./factionTrustSystem";

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
    influence: 50, // Start at neutral influence
    factionTrust: createInitialTrustMap(), // All factions start at 0 trust (FR15)
    isGameOver: false,
    worldState: worldState ?? createInitialWorldState(),
    pendingForcedEventType: null, // FR20: no forced event pending at start
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
      case "writeClaim":
        // S3 writes claims; store them in state
        return {
          ...state,
          claims: [...state.claims, ...action.claims],
        };

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

      case "nextTurn":
        // Advance turn and reset claims
        return {
          ...state,
          turnNumber: (state.turnNumber + 1) as TurnNumber,
          claims: [], // Clear claims for next turn
        };

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
