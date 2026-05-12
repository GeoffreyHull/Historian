import { Event, WorldState, CascadingConsequence, RunRecap } from './types';

/**
 * Converts recent events into a prose narrative for LLM context.
 * Looks back up to `depth` turns (including current turn) and summarizes events as a story.
 */
export function getRecentEventsSummary(
  events: readonly Event[],
  currentTurnNumber: number,
  depth: number = 3
): string {
  const recentEvents: Event[] = [];
  for (let turn = Math.max(1, currentTurnNumber - depth + 1); turn <= currentTurnNumber; turn++) {
    const turnEvents = events.filter((e) => e.turnNumber === turn);
    recentEvents.push(...turnEvents);
  }

  if (recentEvents.length === 0) {
    return 'No recent history.';
  }

  const turnGroups = new Map<number, string[]>();
  for (const event of recentEvents) {
    if (!turnGroups.has(event.turnNumber)) {
      turnGroups.set(event.turnNumber, []);
    }
    const description = event.description || `A ${event.eventType} event`;
    turnGroups.get(event.turnNumber)!.push(description);
  }

  const summaryLines: string[] = [];
  for (const turn of Array.from(turnGroups.keys()).sort((a, b) => a - b)) {
    const descriptions = turnGroups.get(turn) || [];
    const summary = descriptions.join(' ');
    summaryLines.push(`Turn ${turn}: ${summary}`);
  }

  return summaryLines.join(' ');
}

/**
 * Converts cascading consequences into prose for LLM context.
 */
export function getConsequencesSummary(consequences: readonly CascadingConsequence[]): string {
  if (consequences.length === 0) {
    return 'No active consequences.';
  }

  const descriptions = consequences
    .filter((c) => c.intensity > 0)
    .slice(0, 3)
    .map((c) => {
      const intensity = c.intensity > 0.7 ? 'significant' : c.intensity > 0.3 ? 'notable' : 'lingering';
      return `${intensity} consequence from: "${c.claimText}"`;
    });

  return descriptions.join(' ');
}

/**
 * Converts prior run recaps into prose lore for LLM context.
 */
export function getRunHistorySummary(recaps: readonly RunRecap[], maxRuns: number = 2): string {
  if (recaps.length === 0) {
    return 'This is the first era of history.';
  }

  const recent = recaps.slice(-maxRuns).reverse();
  const summaryLines: string[] = [];
  for (const recap of recent) {
    summaryLines.push(`Run ${recap.runNumber}: ${recap.narrative}`);
  }

  return summaryLines.join(' ');
}

/**
 * Formats world state into human-readable prose for LLM context.
 */
export function formatWorldStateForPrompt(worldState: WorldState): string {
  const vars = worldState.worldVariables;
  const moraleTone =
    vars.morale > 75
      ? 'very high'
      : vars.morale > 60
        ? 'high'
        : vars.morale > 40
          ? 'moderate'
          : vars.morale > 25
            ? 'low'
            : 'very low';

  const infrastructureTone =
    vars.infrastructure > 75
      ? 'well-maintained'
      : vars.infrastructure > 50
        ? 'adequate'
        : 'deteriorating';

  const economyTone =
    vars.economy > 75
      ? 'flourishing'
      : vars.economy > 50
        ? 'stable'
        : 'struggling';

  return `Morale is ${moraleTone} (${vars.morale}/100). Infrastructure is ${infrastructureTone} (${vars.infrastructure}/100). Economy is ${economyTone} (${vars.economy}/100).`;
}

/**
 * Builds full context string for event type suggestion.
 */
export function buildEventTypeSuggestionContext(
  worldState: WorldState,
  recentEvents: readonly Event[],
  currentTurnNumber: number,
  consequences: readonly CascadingConsequence[],
  runHistory: readonly RunRecap[]
): string {
  const worldStateStr = formatWorldStateForPrompt(worldState);
  const recentEventsStr = getRecentEventsSummary(recentEvents, currentTurnNumber, 3);
  const consequencesStr = getConsequencesSummary(consequences);
  const historyStr = getRunHistorySummary(runHistory, 1);

  return `Current world state: ${worldStateStr}\n\nRecent history (last 3 turns): ${recentEventsStr}\n\nActive consequences: ${consequencesStr}\n\nPrevious eras: ${historyStr}`;
}

/**
 * Truncates a context string to a maximum character count,
 * cutting at the last complete word within the limit.
 */
export function truncateContext(context: string, maxChars: number = 400): string {
  if (context.length <= maxChars) return context;
  const truncated = context.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/**
 * Builds full context string for event description generation.
 */
export function buildEventDescriptionContext(
  worldState: WorldState,
  recentEvents: readonly Event[],
  currentTurnNumber: number,
  consequences: readonly CascadingConsequence[]
): string {
  const worldStateStr = formatWorldStateForPrompt(worldState);
  const recentEventsStr = getRecentEventsSummary(recentEvents, currentTurnNumber, 3);
  const consequencesStr = getConsequencesSummary(consequences);

  return truncateContext(`World state: ${worldStateStr}\n\nRecent history: ${recentEventsStr}\n\nContext: ${consequencesStr}`);
}

/**
 * Builds full context string for witness account generation.
 */
export function buildWitnessContext(
  worldState: WorldState,
  recentEvents: readonly Event[],
  currentTurnNumber: number,
  consequences: readonly CascadingConsequence[]
): string {
  return buildEventDescriptionContext(worldState, recentEvents, currentTurnNumber, consequences);
}
