/**
 * CascadeView: Shows active cascading consequences in the sidebar.
 * Each entry shows depth, event type, and intensity bar.
 * Phase 3: Multi-level cascading consequence chains.
 */

import React, { useState } from "react";
import styles from "./CascadeView.module.css";
import type { CascadingConsequence } from "../game/types";

interface CascadeViewProps {
  consequences: readonly CascadingConsequence[];
}

const DEPTH_LABELS = ["Root", "1st Wave", "2nd Wave", "3rd Wave"];

export const CascadeView: React.FC<CascadeViewProps> = ({ consequences }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const cascadingOnly = consequences.filter(
    (c) => c.depth !== undefined && c.depth !== null && c.intensity >= 5
  );

  if (cascadingOnly.length === 0) return null;

  return (
    <div className={styles.container} role="region" aria-label="Cascading consequences">
      <h4 className={styles.header}>CASCADE CHAINS</h4>
      <div className={styles.list}>
        {cascadingOnly.slice(0, 8).map((c, i) => {
          const depth = c.depth ?? 0;
          const isExpanded = expandedIndex === i;
          const intensityPct = Math.round(c.intensity);
          const intensityLevel =
            intensityPct >= 65 ? "high" : intensityPct >= 35 ? "medium" : "low";

          return (
            <div key={i} className={styles.entry}>
              <button
                className={styles.entryHeader}
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                aria-expanded={isExpanded}
                aria-label={`${DEPTH_LABELS[depth] ?? `Level ${depth}`} cascade: ${c.triggeredEventType ?? "unknown"}, intensity ${intensityPct}`}
              >
                <span className={styles.depthBadge} data-depth={Math.min(depth, 3)}>
                  {DEPTH_LABELS[depth] ?? `L${depth}`}
                </span>
                <span className={styles.eventType}>{c.triggeredEventType ?? "consequence"}</span>
                <div className={styles.barOuter}>
                  <div
                    className={`${styles.barInner} ${styles[`bar-${intensityLevel}`]}`}
                    style={{ width: `${intensityPct}%` }}
                  />
                </div>
                <span className={styles.intensity}>{intensityPct}</span>
              </button>

              {isExpanded && (
                <div className={styles.detail} role="tooltip">
                  <p className={styles.claimText}>
                    <strong>Origin:</strong> {c.claimText}
                  </p>
                  {c.affectedVariable && (
                    <p className={styles.variable}>
                      <strong>Affects:</strong> {c.affectedVariable}
                      {c.variableDelta !== undefined && c.variableDelta !== 0 && (
                        <span className={c.variableDelta > 0 ? styles.positive : styles.negative}>
                          {" "}{c.variableDelta > 0 ? "+" : ""}{c.variableDelta}
                        </span>
                      )}
                    </p>
                  )}
                  <p className={styles.decay}>
                    Fades at {Math.round(c.decayRate * 100)}% / run
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CascadeView;
