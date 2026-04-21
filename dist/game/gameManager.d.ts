/**
 * GameManager: Centralized game state management.
 * Pure state updates, immutable, JSON-serializable.
 * Constraint 2 (immutability) + Constraint 5 (JSON serializable) + Constraint 6 (action dispatch).
 */
import { GameState, Action, Faction, TurnNumber } from "./types";
/**
 * Create initial game state.
 */
export declare function createInitialGameState(faction?: Faction, turnNumber?: TurnNumber): GameState;
/**
 * GameManager: Immutable state container and dispatcher.
 */
export declare class GameManager {
    private state;
    constructor(initialState?: GameState);
    /**
     * Get current state (read-only reference).
     */
    getState(): GameState;
    /**
     * Dispatch action and update state immutably.
     */
    dispatch(action: Action): void;
    /**
     * Pure reducer: state + action -> new state.
     */
    private reduce;
    /**
     * Verify state is JSON-serializable (Constraint 5).
     */
    toJSON(): GameState;
}
//# sourceMappingURL=gameManager.d.ts.map