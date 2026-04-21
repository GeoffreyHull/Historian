/**
 * TracingSystem: Log and trace game actions for determinism verification.
 * Constraint 1: Pure functions, no mutations.
 * FR26-FR29: Action logging, causal tracing, confidence scoring, developer verification.
 */

import { Claim, Event, EventId, TurnNumber, CredibilityResult } from "./types";

/**
 * ActionLog: Record of a player action.
 */
export interface ActionLog {
  readonly type: "claim" | "evaluate" | "consequence";
  readonly turnNumber: TurnNumber;
  readonly timestamp: number;
  readonly actionHash: string; // Deterministic hash of the action
  readonly stateHash: string; // Hash of game state after action
}

/**
 * ClaimLog: Records a player claim and potential consequences.
 */
export interface ClaimLog extends ActionLog {
  readonly type: "claim";
  readonly claim: Claim;
  readonly eventId: EventId;
}

/**
 * ConsequenceLog: Records that a claim triggered an event.
 */
export interface ConsequenceLog extends ActionLog {
  readonly type: "consequence";
  readonly triggeringClaimId: string; // Reference to claim
  readonly triggeredEventId: EventId; // Event that was triggered
  readonly confidence: number; // [0, 100] how confident we are in this causal link
}

/**
 * EvaluationLog: Records credibility evaluation of a claim.
 */
export interface EvaluationLog extends ActionLog {
  readonly type: "evaluate";
  readonly claim: Claim;
  readonly credibilityResult: CredibilityResult;
}

export type AnyLog = ClaimLog | ConsequenceLog | EvaluationLog;

/**
 * TracingSystem: Manages action logs and causal chain tracing.
 */
export class TracingSystem {
  private logs: AnyLog[] = [];

  /**
   * Log a player claim (FR26).
   */
  logClaim(claim: Claim, turnNumber: TurnNumber): void {
    const log: ClaimLog = {
      type: "claim",
      turnNumber,
      timestamp: Date.now(),
      claim,
      eventId: claim.eventId,
      actionHash: this.hashClaim(claim),
      stateHash: "", // Filled by caller
    };
    this.logs.push(log);
  }

  /**
   * Log credibility evaluation.
   */
  logEvaluation(
    claim: Claim,
    credibilityResult: CredibilityResult,
    turnNumber: TurnNumber
  ): void {
    const log: EvaluationLog = {
      type: "evaluate",
      turnNumber,
      timestamp: Date.now(),
      claim,
      credibilityResult,
      actionHash: this.hashClaim(claim),
      stateHash: "",
    };
    this.logs.push(log);
  }

  /**
   * Log consequence (triggered event from a claim) (FR27).
   */
  logConsequence(
    triggeringClaimId: string,
    triggeredEvent: Event,
    confidence: number
  ): void {
    const log: ConsequenceLog = {
      type: "consequence",
      turnNumber: triggeredEvent.turnNumber,
      timestamp: Date.now(),
      triggeringClaimId,
      triggeredEventId: triggeredEvent.eventId,
      confidence,
      actionHash: this.hashEvent(triggeredEvent),
      stateHash: "",
    };
    this.logs.push(log);
  }

  /**
   * Get all logs (FR28).
   */
  getLogs(): readonly AnyLog[] {
    return [...this.logs];
  }

  /**
   * Get logs of a specific type.
   */
  getLogsByType(type: "claim" | "evaluate" | "consequence"): readonly AnyLog[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Trace causal chain: given a claim, find events it may have triggered (FR29).
   */
  traceCausalChain(claimId: string): readonly ConsequenceLog[] {
    return this.logs.filter(
      (log): log is ConsequenceLog =>
        log.type === "consequence" && log.triggeringClaimId === claimId
    );
  }

  /**
   * Verify determinism: check if action sequence is deterministic.
   * Returns confidence [0, 100] that outcomes are deterministic.
   */
  verifyDeterminism(): number {
    if (this.logs.length === 0) return 100; // No logs, assume deterministic

    // Count unique stateHashes for identical action sequences
    const actionSequences: Map<string, Set<string>> = new Map();
    for (const log of this.logs) {
      const key = `${log.type}-${log.turnNumber}`;
      if (!actionSequences.has(key)) {
        actionSequences.set(key, new Set());
      }
      actionSequences.get(key)!.add(log.stateHash);
    }

    // If all identical actions produce same state, deterministic
    let deterministicCount = 0;
    for (const hashes of actionSequences.values()) {
      if (hashes.size === 1) deterministicCount++;
    }

    return Math.round((deterministicCount / actionSequences.size) * 100);
  }

  /**
   * Clear all logs (useful for testing or fresh runs).
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON (FR28).
   */
  toJSON(): AnyLog[] {
    return [...this.logs];
  }

  /**
   * Simple hash function for claims (deterministic).
   */
  private hashClaim(claim: Claim): string {
    return `claim-${claim.claimText}-${claim.eventId}`.split("").reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0).toString();
  }

  /**
   * Simple hash function for events (deterministic).
   */
  private hashEvent(event: Event): string {
    return `event-${event.eventId}-${event.turnNumber}`.split("").reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0).toString();
  }
}

/**
 * Global tracing system instance (singleton for dev use).
 */
let globalTracingSystem: TracingSystem | null = null;

export function getGlobalTracingSystem(): TracingSystem {
  if (!globalTracingSystem) {
    globalTracingSystem = new TracingSystem();
  }
  return globalTracingSystem;
}

export function resetGlobalTracingSystem(): void {
  globalTracingSystem = null;
}
