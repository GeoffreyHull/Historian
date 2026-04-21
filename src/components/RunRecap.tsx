/**
 * RunRecap: Display narrative summary of a completed run with claim anchors.
 * UX Spec: RunRecap Component
 *
 * AC1: Show run title (e.g., "The Schism at Whitewood")
 * AC2: Display ~500 word lore-style narrative recap
 * AC3: Embedded claim anchors showing player influence (e.g., "Your claim about the curse")
 * AC4: Final statistics: turns completed, claims made, faction outcomes
 * AC5: Accessibility: semantic HTML, ARIA labels for statistics
 */

import React from "react";
import styles from "./RunRecap.module.css";

interface ClaimAnchor {
  claimId: string;
  claimText: string;
  turnNumber: number;
}

interface RunRecapProps {
  runTitle: string;
  narrative: string;
  claimAnchors: ClaimAnchor[];
  turnsCompleted: number;
  totalClaimsMade: number;
  finalFactionOutcomes: {
    historian: number;
    scholar: number;
    witness: number;
    scribe: number;
  };
}

export const RunRecap: React.FC<RunRecapProps> = ({
  runTitle,
  narrative,
  claimAnchors,
  turnsCompleted,
  totalClaimsMade,
  finalFactionOutcomes,
}) => {
  const anchorMap = new Map(claimAnchors.map((a) => [a.claimId, a]));

  return (
    <article className={styles.runRecap}>
      <div className={styles.titleSection}>
        <h2 className={styles.title}>{runTitle}</h2>
        <p className={styles.subtitle}>
          A narrative shaped by your testimony across {turnsCompleted} turns
        </p>
      </div>

      <div className={styles.narrativeSection}>
        <p className={styles.narrative}>{narrative}</p>

        {claimAnchors.length > 0 && (
          <aside className={styles.anchorsSection} aria-label="Your claims in this recap">
            <h3 className={styles.anchorsTitle}>Your Testament</h3>
            <ul className={styles.anchorsList}>
              {claimAnchors.map((anchor) => (
                <li key={anchor.claimId} className={styles.anchorItem}>
                  <span className={styles.anchorId}>{anchor.claimId}</span>
                  <span className={styles.anchorText}>
                    Turn {anchor.turnNumber}: "{anchor.claimText}"
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <footer className={styles.statistics}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Turns Completed:</span>
          <span className={styles.statValue}>{turnsCompleted}/10</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Claims Made:</span>
          <span className={styles.statValue}>{totalClaimsMade}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Faction Final Trust:</span>
          <span className={styles.factionOutcomes}>
            📖 {finalFactionOutcomes.historian}% · 🔬 {finalFactionOutcomes.scholar}% ·
            👁️ {finalFactionOutcomes.witness}% · ✍️ {finalFactionOutcomes.scribe}%
          </span>
        </div>
      </footer>
    </article>
  );
};

export default RunRecap;
