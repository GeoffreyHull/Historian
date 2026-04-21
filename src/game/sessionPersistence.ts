/**
 * SessionPersistence: Save and load game state to/from localStorage.
 * Constraint 5: All data is JSON-serializable.
 * FR32, FR33, FR46, FR47: Save/resume with deterministic restoration.
 * NFR4: Atomic save operations.
 * NFR5: Deterministic resumption (same seed = same events).
 */

import { GameState, EventId } from "./types";

const STORAGE_KEY = "historian_game_state";
const BACKUP_KEY = "historian_game_state_backup";

/**
 * ValidateGameState: Runtime validation of GameState after JSON deserialization.
 * Constraint 5 requires: GameState is 100% JSON-serializable AND must round-trip without data loss.
 * This function detects corrupted saves that pass JSON.parse but have missing/malformed fields.
 */
export function validateGameState(obj: unknown): GameState | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  const state = obj as any;

  // Validate required fields
  if (typeof state.turnNumber !== 'number' || state.turnNumber < 1) {
    console.error('Invalid turnNumber in saved game:', state.turnNumber);
    return null;
  }

  if (typeof state.currentFaction !== 'string') {
    console.error('Invalid currentFaction in saved game:', state.currentFaction);
    return null;
  }

  if (!Array.isArray(state.events)) {
    console.error('Invalid events array in saved game');
    return null;
  }

  if (!Array.isArray(state.claims)) {
    console.error('Invalid claims array in saved game');
    return null;
  }

  if (!state.worldState || typeof state.worldState !== 'object') {
    console.error('Invalid or missing worldState in saved game');
    return null;
  }

  if (typeof state.worldState.runNumber !== 'number') {
    console.error('Invalid worldState.runNumber:', state.worldState.runNumber);
    return null;
  }

  if (typeof state.worldState.initialSeed !== 'number') {
    console.error('Invalid worldState.initialSeed:', state.worldState.initialSeed);
    return null;
  }

  if (!Array.isArray(state.worldState.history)) {
    console.error('Invalid worldState.history array');
    return null;
  }

  // Passed all checks; return as validated GameState
  return obj as GameState;
}

/**
 * SaveGameState: Save game state to localStorage with backup fallback.
 * NFR4 (Atomic save operations): Writes primary first, then backup.
 * If primary write fails, no backup is created (user knows save failed).
 * If primary succeeds but backup fails, primary remains safe.
 * Validates state before committing (Constraint 5: JSON serialization safety).
 * Returns true if save succeeded, false otherwise.
 */
export function saveGameState(state: GameState): boolean {
  try {
    // Validate state is serializable and complete
    const serialized = JSON.stringify(state);
    const validated = validateGameState(JSON.parse(serialized));
    if (!validated) {
      console.error("Game state validation failed; save aborted");
      return false;
    }

    // NFR4: Write primary first (safer than backup-first pattern)
    // If primary fails, no backup is created; user sees save failed
    // If primary succeeds but backup fails, primary is safe (recoverable on next load)
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (primaryError) {
      if (primaryError instanceof Error && primaryError.name === 'QuotaExceededError') {
        console.error("Storage quota exceeded; save failed");
      } else {
        console.error("Failed to write primary save:", primaryError);
      }
      return false;
    }

    // Write backup after primary succeeds
    try {
      localStorage.setItem(BACKUP_KEY, serialized);
    } catch (backupError) {
      // Backup failure is non-fatal; primary is safe
      console.warn("Backup write failed (primary save safe):", backupError);
    }

    return true;
  } catch (error) {
    console.error("Failed to save game state:", error);
    return false;
  }
}

/**
 * LoadGameState: Restore game state from localStorage with validation.
 * Tries primary storage first, falls back to backup on corruption.
 * Constraint 5: Validates GameState fields after JSON.parse (prevents silent data loss).
 * Returns state if found and valid, null if not available or corrupted.
 */
export function loadGameState(): GameState | null {
  try {
    // Try primary storage first
    const primary = localStorage.getItem(STORAGE_KEY);
    if (primary) {
      const parsed = JSON.parse(primary);
      const validated = validateGameState(parsed);
      if (validated) {
        return validated;
      }
      console.warn("Primary save corrupted; attempting backup recovery");
    }

    // Fall back to backup if primary is missing or corrupted
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      const validated = validateGameState(parsed);
      if (validated) {
        console.warn("Loaded from backup due to primary corruption");
        return validated;
      }
      console.error("Both primary and backup saves are corrupted; cannot recover");
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
