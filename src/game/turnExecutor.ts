/**
 * TurnExecutor: Executes a single turn through all phases (FR31).
 * Constraint 1: Pure functions, no mutations.
 * Constraint 9: Explicit ordering: events → observation → claims → credibility → influence → world state update.
 */

import {
  Event,
  Claim,
  CredibilityResult,
  GameState,
  TurnNumber,
  createTurn,
  WorldState,
  RunRecap,
} from "./types";
import { EventGenerator } from "./eventGenerator";
import { evaluateClaimsBatch } from "./credibilitySystem";
import { calculateInfluence } from "./influenceCalculator";
import { updateWorldStateAfterRun, evolveToNextRun } from "./worldStateManager";
import { generateRunRecap, formatHistoryBook } from "./recapGenerator";
import { GameManager } from "./gameManager";

/**
 * TurnPhaseResult: Result of executing a single turn phase.
 */
export interface TurnPhaseResult {
  readonly updatedState: GameState;
  readonly events: Event[];
  readonly credibilityResults: CredibilityResult[];
  readonly runEnded: boolean;
  readonly recap?: RunRecap;
}

/**
 * ExecuteTurn: Process a complete turn for the given state.
 * Phases:
 * 1. Generate events for this turn
 * 2. Determine observation
 * 3. Evaluate player claims
 * 4. Calculate influence
 * 5. Update world state with consequences
 * 6. Check if run (10 turns) is complete
 * 7. If complete, generate recap and prepare next run
 */
export function executeTurn(
  gameState: GameState,
  playerClaims: Claim[]
): TurnPhaseResult {
  const currentTurn = gameState.turnNumber;

  // FR46-FR47: Use world's initial seed for deterministic event generation across run resumptions
  // Constraint 9: Turn-phase determinism requires seed stability, not turn-based variation
  const deterministicSeed = gameState.worldState.initialSeed + currentTurn;
  const eventGenerator = new EventGenerator(deterministicSeed);

  // Phase 1: Generate events for this turn
  eventGenerator.setWorldState(gameState.worldState, gameState.currentFaction);
  const events = eventGenerator.generateEvents(currentTurn, 3);

  // Phase 2: Observation is already determined (set in events)
  // No changes needed; EventGenerator sets observedByPlayer

  // Create a manager to handle state updates
  const manager = new GameManager(gameState);

  // Phase 3: Evaluate player claims (FR8: limit to 1-3 claims per turn)
  let credibilityResults: CredibilityResult[] = [];
  const validatedClaims = playerClaims.slice(0, 3); // Enforce 1-3 claim limit (FR8)
  if (playerClaims.length > 3) {
    console.warn(`Truncated ${playerClaims.length} claims to 3-claim limit (FR8)`);
  }
  if (validatedClaims.length > 0) {
    credibilityResults = evaluateClaimsBatch(validatedClaims, events, gameState.currentFaction);
    manager.dispatch({ type: "evaluateClaims", results: credibilityResults });
  }

  // Phase 4: Calculate influence (for future use; not strictly required in this phase)
  // const influences = credibilityResults.map(result => calculateInfluence(result, gameState.currentFaction));

  // Get state after claim evaluation
  let state = manager.getState();

  // Phase 5: Check if run is complete (10 turns)
  const isRunComplete = currentTurn >= 10;

  if (isRunComplete) {
    // Phase 6: Generate recap
    const recap = generateRunRecap(
      state.claims,
      credibilityResults,
      events,
      state.worldState,
      state.worldState.runNumber
    );

    // Phase 7: Update world state with consequences and evolve for next run
    const updatedWorldState = updateWorldStateAfterRun(
      state.worldState,
      state.claims,
      credibilityResults,
      events,
      state.currentFaction
    );

    // Phase 8: Evolve world state to next run
    const nextRunWorldState = evolveToNextRun(updatedWorldState, currentTurn);

    // Phase 9: Add recap to history and update world state
    const worldStateWithRecap = {
      ...nextRunWorldState,
      history: [...nextRunWorldState.history, recap],
    };

    // Reset game state for next run
    state = {
      ...state,
      turnNumber: createTurn(1),
      events: [],
      claims: [],
      credibilityMap: {},
      worldState: worldStateWithRecap,
      isGameOver: false,
    };

    return {
      updatedState: state,
      events,
      credibilityResults,
      runEnded: true,
      recap,
    };
  } else {
    // Phase 8: Advance turn for next turn
    manager.dispatch({ type: "nextTurn" });
    state = manager.getState();

    return {
      updatedState: state,
      events,
      credibilityResults,
      runEnded: false,
    };
  }
}

/**
 * GetRunSummary: Get a summary of the current run (turn and major stats).
 */
export interface RunSummary {
  readonly currentTurn: TurnNumber;
  readonly turnsRemaining: number;
  readonly claimsCount: number;
  readonly totalInfluence: number;
  readonly isRunComplete: boolean;
}

export function getRunSummary(gameState: GameState): RunSummary {
  const turnsRemaining = Math.max(0, 10 - gameState.turnNumber);
  return {
    currentTurn: gameState.turnNumber,
    turnsRemaining,
    claimsCount: gameState.claims.length,
    totalInfluence: gameState.influence,
    isRunComplete: turnsRemaining === 0,
  };
}
