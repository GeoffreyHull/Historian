/**
 * History book data transformation utilities.
 * Converts RunRecap[] (game domain) into HistoryBook UI component props.
 * Constraint 1: Pure functions, no mutations.
 * FR38-FR40: History book access, accumulation, read-only.
 */

import type { RunRecap } from "./types";

export interface PastRunSummary {
  readonly runId: string;
  readonly title: string;
  readonly completedDate: string;
  readonly turnsCompleted: number;
  readonly finalCredibility: number;
}

export interface BeliefTrend {
  readonly runNumber: number;
  readonly historian: number;
  readonly scholar: number;
  readonly witness: number;
  readonly scribe: number;
}

export interface ClaimFrequency {
  readonly word: string;
  readonly count: number;
  readonly percentage: number;
}

export interface HistoryBookData {
  readonly pastRuns: PastRunSummary[];
  readonly beliefTrends: BeliefTrend[];
  readonly claimFrequencies: ClaimFrequency[];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "was", "is", "were", "had", "and", "of", "in", "on",
  "at", "to", "for", "with", "by", "from", "as", "it", "be", "this",
  "that", "or", "but", "not", "its", "their", "they", "them", "has",
]);

/**
 * Build HistoryBook component data from accumulated run recaps.
 * Derives presentation data from RunRecap[]; no mutations.
 */
export function buildHistoryBookData(history: readonly RunRecap[]): HistoryBookData {
  const pastRuns: PastRunSummary[] = history.map((recap) => ({
    runId: `run-${recap.runNumber}`,
    title: `Run ${recap.runNumber} Chronicles`,
    completedDate: new Date(recap.timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    turnsCompleted: 10,
    // Estimate credibility from major claim count: more high-credibility claims = higher overall credibility
    finalCredibility: Math.min(95, 50 + recap.majorClaims.length * 10),
  }));

  const beliefTrends: BeliefTrend[] = history.map((recap) => {
    const base = recap.majorClaims.length;
    return {
      runNumber: recap.runNumber,
      historian: Math.min(100, 50 + base * 8),
      scholar: Math.min(100, 48 + base * 7),
      witness: Math.min(100, 52 + base * 9),
      scribe: Math.min(100, 46 + base * 6),
    };
  });

  const claimFrequencies = computeClaimFrequencies(history);

  return { pastRuns, beliefTrends, claimFrequencies };
}

function computeClaimFrequencies(history: readonly RunRecap[]): ClaimFrequency[] {
  const wordCounts: Record<string, number> = {};

  for (const recap of history) {
    for (const claim of recap.majorClaims) {
      const words = claim
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
      for (const word of words) {
        wordCounts[word] = (wordCounts[word] ?? 0) + 1;
      }
    }
  }

  const totalWords = Object.values(wordCounts).reduce((sum, c) => sum + c, 0);
  if (totalWords === 0) return [];

  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / totalWords) * 100),
    }));
}
