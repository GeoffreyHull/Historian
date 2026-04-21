/**
 * FactionTrust: Display faction trust levels in a 2x2 grid.
 * UX Spec: FactionTrust Component
 *
 * AC1: Show 4 factions (Historian, Scholar, Witness, Scribe) in 2x2 grid
 * AC2: Display emoji + name + trust percentage
 * AC3: Color-coded borders: green (80%+), yellow (50-80%), red (<50%)
 * AC4: Responsive grid (2 columns, stacks on mobile post-MVP)
 * AC5: Accessibility: ARIA labels for each faction cell
 */

import React from "react";
import styles from "./FactionTrust.module.css";

interface FactionTrustLevel {
  name: "historian" | "scholar" | "witness" | "scribe";
  emoji: string;
  trust: number;
}

interface FactionTrustProps {
  factions: FactionTrustLevel[];
}

const getTrustColor = (trust: number): "high" | "medium" | "low" => {
  if (trust >= 80) return "high";
  if (trust >= 50) return "medium";
  return "low";
};

export const FactionTrust: React.FC<FactionTrustProps> = ({ factions }) => {
  const factionMap = new Map(factions.map((f) => [f.name, f]));
  const displayOrder: Array<"historian" | "scholar" | "witness" | "scribe"> =
    ["historian", "scholar", "witness", "scribe"];

  return (
    <div className={styles.factionTrust} role="region" aria-label="Faction trust levels">
      <h4 className={styles.header}>FACTION TRUST</h4>

      <div className={styles.grid}>
        {displayOrder.map((factionName) => {
          const faction = factionMap.get(factionName);
          if (!faction) return null;

          const trustLevel = getTrustColor(faction.trust);

          return (
            <div
              key={factionName}
              className={`${styles.cell} ${styles[`trust-${trustLevel}`]}`}
              aria-label={`${faction.name.charAt(0).toUpperCase() + faction.name.slice(1)} faction trust: ${faction.trust}%`}
            >
              <div className={styles.emoji}>{faction.emoji}</div>
              <div className={styles.name}>
                {faction.name.charAt(0).toUpperCase() + faction.name.slice(1)}
              </div>
              <div className={styles.trust}>{faction.trust}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FactionTrust;
