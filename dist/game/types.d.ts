/**
 * Core type definitions for the game.
 * All types are JSON-serializable (no Date, Function, Symbol).
 * All types are immutable (use readonly for objects and arrays).
 */
export type EventId = string & {
    readonly __brand: "EventId";
};
export type TurnNumber = number;
export type TruthValue = "true" | "false";
export type Faction = "historian" | "scholar" | "witness" | "scribe";
export declare const createEventId: (id: string) => EventId;
export declare const createTurn: (turn: number) => TurnNumber;
/**
 * Event: Represents a historical event that occurred in the world.
 */
export interface Event {
    readonly eventId: EventId;
    readonly eventType: string;
    readonly description: string;
    readonly truthValue: TruthValue;
    readonly turnNumber: TurnNumber;
}
/**
 * Claim: A narrative claim about an event.
 */
export interface Claim {
    readonly claimText: string;
    readonly eventId: EventId;
    readonly isAboutObservedEvent: boolean;
    readonly turnNumber: TurnNumber;
}
/**
 * CredibilityResult: Output of credibility evaluation.
 */
export interface CredibilityResult {
    readonly claim: Claim;
    readonly event: Event;
    readonly accuracy: "correct" | "incorrect";
    readonly hasInsult: boolean;
    readonly baseCredibility: number;
    readonly penalty: number;
    readonly finalCredibility: number;
}
/**
 * InfluenceCalculation: Result of influence calculation.
 */
export interface InfluenceCalculation {
    readonly claim: Claim;
    readonly credibilityResult: CredibilityResult;
    readonly faction: Faction;
    readonly credibilityScore: number;
    readonly multiplier: number;
    readonly influence: number;
}
//# sourceMappingURL=types.d.ts.map