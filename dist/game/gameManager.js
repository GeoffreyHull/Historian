"use strict";
/**
 * GameManager: Centralized game state management.
 * Pure state updates, immutable, JSON-serializable.
 * Constraint 2 (immutability) + Constraint 5 (JSON serializable) + Constraint 6 (action dispatch).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
exports.createInitialGameState = createInitialGameState;
const types_1 = require("./types");
/**
 * Create initial game state.
 */
function createInitialGameState(faction = "historian", turnNumber = (0, types_1.createTurn)(1)) {
    return {
        turnNumber,
        currentFaction: faction,
        events: [],
        claims: [],
        credibilityMap: {},
        influence: 50, // Start at neutral influence
        isGameOver: false,
    };
}
/**
 * GameManager: Immutable state container and dispatcher.
 */
class GameManager {
    constructor(initialState) {
        this.state = initialState ?? createInitialGameState();
    }
    /**
     * Get current state (read-only reference).
     */
    getState() {
        return this.state;
    }
    /**
     * Dispatch action and update state immutably.
     */
    dispatch(action) {
        this.state = this.reduce(this.state, action);
    }
    /**
     * Pure reducer: state + action -> new state.
     */
    reduce(state, action) {
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
                    turnNumber: (state.turnNumber + 1),
                    claims: [], // Clear claims for next turn
                };
            case "updateEvents":
                // S2: Add events to state
                return {
                    ...state,
                    events: [...state.events, ...action.events],
                };
            default:
                return state;
        }
    }
    /**
     * Verify state is JSON-serializable (Constraint 5).
     */
    toJSON() {
        return this.state;
    }
}
exports.GameManager = GameManager;
//# sourceMappingURL=gameManager.js.map