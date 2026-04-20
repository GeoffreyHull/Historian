/**
 * Game constants: Event keywords, insult phrases, and faction multipliers.
 * These are design decisions locked in and used throughout the game logic.
 */
/**
 * EVENT_TYPE_KEYWORDS: Maps each event type to keywords that can appear in claim text.
 * Used by accuracy evaluation: if claim text contains event keywords, it may be accurate.
 */
export declare const EVENT_TYPE_KEYWORDS: Record<string, string[]>;
/**
 * INSULTING_PHRASES: Maps each faction to hardcoded insult phrases.
 * Used by insult detection: if claim contains faction insult, it incurs penalty.
 */
export declare const INSULTING_PHRASES: Record<string, string[]>;
/**
 * FACTION_MULTIPLIERS: Per-faction credibility multiplier.
 * Used by influence calculation: influence = credibility × faction.multiplier
 */
export declare const FACTION_MULTIPLIERS: Record<string, number>;
//# sourceMappingURL=constants.d.ts.map