/**
 * RetconPanel: UI for the retcon (rewind-history) mechanic.
 * Shows available turns to rewind to, commit/cancel controls.
 * Phase 4: Retcon system for replaying turns with different claims.
 */

import React from "react";
import styles from "./RetconPanel.module.css";
import type { TurnNumber } from "../game/types";

interface RetconPanelProps {
  currentInfluence: number;
  retconCost: number;
  availableTurns: TurnNumber[];
  isInRetcon: boolean;
  retconTargetTurn: TurnNumber | null;
  onEnterRetcon: (turn: TurnNumber) => void;
  onCommitRetcon: () => void;
  onCancelRetcon: () => void;
}

export const RetconPanel: React.FC<RetconPanelProps> = ({
  currentInfluence,
  retconCost,
  availableTurns,
  isInRetcon,
  retconTargetTurn,
  onEnterRetcon,
  onCommitRetcon,
  onCancelRetcon,
}) => {
  const canAfford = currentInfluence >= retconCost;

  if (availableTurns.length === 0 && !isInRetcon) return null;

  return (
    <div
      className={`${styles.container} ${isInRetcon ? styles.activeMode : ""}`}
      role="region"
      aria-label="Retcon: rewrite history"
    >
      <h4 className={styles.header}>
        {isInRetcon ? "⏪ REWRITING HISTORY" : "REWRITE HISTORY"}
      </h4>

      {isInRetcon ? (
        <div className={styles.activeRetcon}>
          <p className={styles.activeLabel} role="status" aria-live="polite">
            Replaying from Turn {retconTargetTurn}. Submit new claims, then commit.
          </p>
          <div className={styles.actionButtons}>
            <button
              className={styles.commitButton}
              onClick={onCommitRetcon}
              aria-label="Commit retcon changes"
            >
              ✅ Commit Changes
            </button>
            <button
              className={styles.cancelButton}
              onClick={onCancelRetcon}
              aria-label="Cancel retcon and restore original state"
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.turnList}>
          {!canAfford && (
            <p className={styles.affordHint} role="note">
              Need {retconCost} influence (have {currentInfluence.toFixed(1)})
            </p>
          )}
          {availableTurns.map((turn) => (
            <button
              key={turn}
              className={styles.turnButton}
              onClick={() => onEnterRetcon(turn)}
              disabled={!canAfford}
              aria-label={`Rewind to Turn ${turn} (costs ${retconCost} influence)`}
              title={
                canAfford
                  ? `Rewind to Turn ${turn} and replay with different claims`
                  : `Need ${retconCost} influence to rewind (have ${currentInfluence.toFixed(1)})`
              }
            >
              <span className={styles.turnLabel}>Turn {turn}</span>
              <span className={styles.turnCost}>−{retconCost} ✨</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RetconPanel;
