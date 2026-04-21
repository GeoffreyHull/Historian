/**
 * CredibilityResult: Display faction reactions and final credibility score.
 * UX Spec: CredibilityResult Component
 *
 * AC1: Show 4 faction scores (Historian, Scholar, Witness, Scribe)
 * AC2: Display final credibility percentage + word (Strong/Moderate/Weak)
 * AC3: Color accent (green for success, orange for moderate, red for weak)
 * AC4: Symbol + text encoding (never color-only)
 * AC5: Accessibility: aria-live region for screen readers
 */

import React from "react";
import styles from "./CredibilityResult.module.css";

interface FactionScore {
  name: "historian" | "scholar" | "witness" | "scribe";
  emoji: string;
  score: number;
}

interface CredibilityResultProps {
  factionScores: FactionScore[];
  finalCredibility: number;
}

const getCredibilityLabel = (
  score: number
): { label: string; level: "strong" | "moderate" | "weak" } => {
  if (score >= 64) return { label: "Strong", level: "strong" };
  if (score >= 40) return { label: "Moderate", level: "moderate" };
  return { label: "Weak", level: "weak" };
};

const getStatusIcon = (level: "strong" | "moderate" | "weak"): string => {
  switch (level) {
    case "strong":
      return "✓";
    case "moderate":
      return "◐";
    case "weak":
      return "✗";
  }
};

export const CredibilityResult: React.FC<CredibilityResultProps> = ({
  factionScores,
  finalCredibility,
}) => {
  const { label, level } = getCredibilityLabel(finalCredibility);
  const statusIcon = getStatusIcon(level);

  return (
    <div
      className={`${styles.credibilityResult} ${styles[`level-${level}`]}`}
      role="status"
      aria-live="assertive"
      aria-label={`Credibility result: ${finalCredibility}% ${label}`}
    >
      <div className={styles.header}>
        <h4 className={styles.title}>
          {statusIcon} Claim Received ({finalCredibility}% {label})
        </h4>
      </div>

      <div className={styles.factionScores}>
        {factionScores.map((faction) => (
          <div key={faction.name} className={styles.row}>
            <span className={styles.factionName}>
              {faction.emoji} {faction.name.charAt(0).toUpperCase() +
                faction.name.slice(1)}
            </span>
            <span className={styles.score}>{faction.score}%</span>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.finalRow}>
          <span className={styles.finalLabel}>FINAL CREDIBILITY:</span>
          <span className={styles.finalScore}>
            {finalCredibility}% [{label}]
          </span>
        </div>
      </div>
    </div>
  );
};

export default CredibilityResult;
