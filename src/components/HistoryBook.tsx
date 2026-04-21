/**
 * HistoryBook: Display all past runs with belief evolution and claim frequency.
 * UX Spec: HistoryBook Component
 *
 * AC1: Show list of all completed runs with titles and dates
 * AC2: Display belief evolution chart (4 factions, trend across runs)
 * AC3: Show claim frequency analysis (most common claim words)
 * AC4: Clickable run entries to view RunRecap modal (post-MVP)
 * AC5: Accessibility: semantic list, ARIA labels, table structure for charts
 */

import React from "react";
import styles from "./HistoryBook.module.css";

interface PastRunSummary {
  runId: string;
  title: string;
  completedDate: string;
  turnsCompleted: number;
  finalCredibility: number;
}

interface BeliefTrend {
  runNumber: number;
  historian: number;
  scholar: number;
  witness: number;
  scribe: number;
}

interface ClaimFrequency {
  word: string;
  count: number;
  percentage: number;
}

interface HistoryBookProps {
  pastRuns: PastRunSummary[];
  beliefTrends: BeliefTrend[];
  claimFrequencies: ClaimFrequency[];
  onRunClick?: (runId: string) => void;
}

export const HistoryBook: React.FC<HistoryBookProps> = ({
  pastRuns,
  beliefTrends,
  claimFrequencies,
  onRunClick,
}) => {
  return (
    <article className={styles.historyBook} role="article" aria-label="History book">
      <h1 className={styles.title}>The Historical Record</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Past Runs</h2>
        <div className={styles.runsList} role="list">
          {pastRuns.length === 0 ? (
            <p className={styles.empty}>No completed runs yet. Begin your first run!</p>
          ) : (
            pastRuns.map((run) => (
              <div
                key={run.runId}
                className={styles.runItem}
                role="listitem"
                onClick={() => onRunClick?.(run.runId)}
                tabIndex={onRunClick ? 0 : -1}
                onKeyDown={(e) => {
                  if (onRunClick && (e.key === "Enter" || e.key === " ")) {
                    onRunClick(run.runId);
                  }
                }}
              >
                <div className={styles.runHeader}>
                  <h3 className={styles.runTitle}>{run.title}</h3>
                  <span className={styles.runDate}>{run.completedDate}</span>
                </div>
                <div className={styles.runStats}>
                  <span>
                    <span className={styles.label}>Turns:</span>{" "}
                    <span className={styles.value}>{run.turnsCompleted}/10</span>
                  </span>
                  <span>
                    <span className={styles.label}>Final Credibility:</span>{" "}
                    <span className={styles.value}>{run.finalCredibility}%</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {beliefTrends.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Belief Evolution</h2>
          <div className={styles.chart} aria-label="Faction belief trends across runs">
            <table className={styles.trendTable}>
              <thead>
                <tr>
                  <th className={styles.th}>Run</th>
                  <th className={styles.th}>📖 Historian</th>
                  <th className={styles.th}>🔬 Scholar</th>
                  <th className={styles.th}>👁️ Witness</th>
                  <th className={styles.th}>✍️ Scribe</th>
                </tr>
              </thead>
              <tbody>
                {beliefTrends.map((trend) => (
                  <tr key={trend.runNumber} className={styles.trendRow}>
                    <td className={styles.td}>Run {trend.runNumber}</td>
                    <td className={styles.td}>{trend.historian}%</td>
                    <td className={styles.td}>{trend.scholar}%</td>
                    <td className={styles.td}>{trend.witness}%</td>
                    <td className={styles.td}>{trend.scribe}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {claimFrequencies.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Common Claims</h2>
          <div className={styles.frequencyList}>
            {claimFrequencies.slice(0, 10).map((freq, index) => (
              <div key={freq.word} className={styles.frequencyItem}>
                <span className={styles.rank}>#{index + 1}</span>
                <span className={styles.word}>{freq.word}</span>
                <span className={styles.count}>
                  {freq.count} mention{freq.count !== 1 ? "s" : ""} ({freq.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

export default HistoryBook;
