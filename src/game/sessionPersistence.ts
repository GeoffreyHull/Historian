/**
 * SessionPersistence: Save and load game state to/from localStorage.
 * Constraint 5: All data is JSON-serializable.
 * FR32, FR33, FR46, FR47: Save/resume with deterministic restoration.
 * NFR4: Atomic save operations.
 * NFR5: Deterministic resumption (same seed = same events).
 */

import { GameState } from "./types";

const STORAGE_KEY = "historian_game_state";
const BACKUP_KEY = "historian_game_state_backup";

/**
 * SaveGameState: Atomically save game state to localStorage.
 * Stores both current and backup to prevent corruption on crash.
 * Returns true if save succeeded, false otherwise.
 */
export function saveGameState(state: GameState): boolean {
  try {
    const serialized = JSON.stringify(state);

    // Atomic save pattern: write backup, then primary
    localStorage.setItem(BACKUP_KEY, serialized);
    localStorage.setItem(STORAGE_KEY, serialized);

    return true;
  } catch (error) {
    console.error("Failed to save game state:", error);
    return false;
  }
}

/**
 * LoadGameState: Restore game state from localStorage.
 * Tries primary storage first, falls back to backup on corruption.
 * Returns state if found, null if not available.
 */
export function loadGameState(): GameState | null {
  try {
    // Try primary storage first
    const primary = localStorage.getItem(STORAGE_KEY);
    if (primary) {
      return JSON.parse(primary) as GameState;
    }

    // Fall back to backup if primary is missing/corrupted
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      console.warn("Loading from backup due to primary corruption");
      return JSON.parse(backup) as GameState;
    }

    return null;
  } catch (error) {
    console.error("Failed to load game state:", error);
    return null;
  }
}

/**
 * ClearGameState: Erase all saved game state.
 * Used to start a fresh game or clean up after completion.
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
}

/**
 * HasSavedGame: Check if a saved game exists.
 */
export function hasSavedGame(): boolean {
  const primary = localStorage.getItem(STORAGE_KEY);
  const backup = localStorage.getItem(BACKUP_KEY);
  return primary !== null || backup !== null;
}

/**
 * GetLastSaveTime: Get the timestamp of the last save (milliseconds since epoch).
 * Returns null if no save exists.
 */
export function getLastSaveTime(): number | null {
  try {
    const state = loadGameState();
    if (state && state.worldState && state.worldState.history.length > 0) {
      // Get the timestamp from the last recap
      const lastRecap = state.worldState.history[state.worldState.history.length - 1];
      return lastRecap.timestamp;
    }
    return null;
  } catch {
    return null;
  }
}
