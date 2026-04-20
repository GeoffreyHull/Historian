/**
 * Claim factory helpers for consistent claim creation in tests.
 * Reduces boilerplate and ensures test claims are deterministic.
 */

import { Claim, Event, EventId, createEventId } from "../../types";

interface ClaimFactoryOptions {
  claimText?: string;
  eventId?: EventId;
  isAboutObservedEvent?: boolean;
  turnNumber?: number;
}

/**
 * createClaim: Factory function with defaults.
 * Default: claim text is generic, event ID is deterministic, turn is 1.
 */
export function createClaim(options: ClaimFactoryOptions = {}): Claim {
  return {
    claimText: options.claimText ?? "A claim was made.",
    eventId: options.eventId ?? createEventId("evt-default-001"),
    isAboutObservedEvent: options.isAboutObservedEvent ?? true,
    turnNumber: options.turnNumber ?? 1,
  };
}

/**
 * createAccurateClaim: Create a claim that matches event truth value.
 * If event is true, claim affirms; if false, claim denies.
 */
export function createAccurateClaim(
  event: Event,
  options: ClaimFactoryOptions = {}
): Claim {
  const claimText =
    options.claimText ??
    (event.truthValue === "true"
      ? `This event was true: ${event.description.slice(0, 30)}`
      : `This event was false: ${event.description.slice(0, 30)}`);

  return {
    claimText,
    eventId: options.eventId ?? event.eventId,
    isAboutObservedEvent: options.isAboutObservedEvent ?? true,
    turnNumber: options.turnNumber ?? event.turnNumber,
  };
}

/**
 * createInaccurateClaim: Create a claim that contradicts event truth value.
 * If event is true, claim denies; if false, claim affirms.
 */
export function createInaccurateClaim(
  event: Event,
  options: ClaimFactoryOptions = {}
): Claim {
  const claimText =
    options.claimText ??
    (event.truthValue === "true"
      ? `This event was false: ${event.description.slice(0, 30)}`
      : `This event was true: ${event.description.slice(0, 30)}`);

  return {
    claimText,
    eventId: options.eventId ?? event.eventId,
    isAboutObservedEvent: options.isAboutObservedEvent ?? true,
    turnNumber: options.turnNumber ?? event.turnNumber,
  };
}

/**
 * createInsultingClaim: Create a claim that contains faction-specific insults.
 * Useful for testing insult detection logic.
 */
export function createInsultingClaim(
  event: Event,
  faction: string = "historian",
  options: ClaimFactoryOptions = {}
): Claim {
  const insults: Record<string, string> = {
    historian: "sloppy",
    scholar: "ignorant",
    witness: "confused",
    scribe: "careless",
  };

  const insult = insults[faction] ?? "dishonest";
  const claimText =
    options.claimText ?? `The claim is ${insult}: ${event.description.slice(0, 20)}`;

  return {
    claimText,
    eventId: options.eventId ?? event.eventId,
    isAboutObservedEvent: options.isAboutObservedEvent ?? true,
    turnNumber: options.turnNumber ?? event.turnNumber,
  };
}

/**
 * createUnobservedClaim: Create a claim about an event that was NOT observed.
 */
export function createUnobservedClaim(
  event: Event,
  options: ClaimFactoryOptions = {}
): Claim {
  return {
    claimText: options.claimText ?? `Unobserved claim: ${event.description}`,
    eventId: options.eventId ?? event.eventId,
    isAboutObservedEvent: false,
    turnNumber: options.turnNumber ?? event.turnNumber,
  };
}

/**
 * createMultipleClaims: Factory to create multiple claims for batch testing.
 */
export function createMultipleClaims(
  count: number,
  baseOptions: ClaimFactoryOptions = {}
): Claim[] {
  return Array.from({ length: count }, (_, i) =>
    createClaim({
      ...baseOptions,
      claimText: `Claim ${i + 1}`,
      turnNumber: (baseOptions.turnNumber ?? 0) + i,
    })
  );
}
