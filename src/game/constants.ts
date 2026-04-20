/**
 * Game constants: Event keywords, insult phrases, and faction multipliers.
 * These are design decisions locked in and used throughout the game logic.
 */

/**
 * EVENT_TYPE_KEYWORDS: Maps each event type to keywords that can appear in claim text.
 * Used by accuracy evaluation: if claim text contains event keywords, it may be accurate.
 */
export const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
  weather: ["rain", "wind", "clear", "storm", "sunny", "cloudy", "fog"],
  location: ["castle", "forest", "village", "river", "mountain", "tower"],
  character: ["appeared", "spoke", "acted", "encountered", "met"],
  conversation: ["said", "told", "asked", "replied", "discussed"],
  action: ["attacked", "defended", "fled", "rested", "traveled"],
  discovery: ["found", "discovered", "revealed", "uncovered", "witnessed"],
};

/**
 * INSULTING_PHRASES: Maps each faction to hardcoded insult phrases.
 * Used by insult detection: if claim contains faction insult, it incurs penalty.
 */
export const INSULTING_PHRASES: Record<string, string[]> = {
  historian: ["sloppy", "biased", "unreliable", "fabricated"],
  scholar: ["ignorant", "pedantic", "arrogant", "closed-minded"],
  witness: ["confused", "forgetful", "delusional", "dishonest"],
  scribe: ["careless", "inaccurate", "sloppy", "untrustworthy"],
};

/**
 * FACTION_MULTIPLIERS: Per-faction credibility multiplier.
 * Used by influence calculation: influence = credibility × faction.multiplier
 */
export const FACTION_MULTIPLIERS: Record<string, number> = {
  historian: 1.0,
  scholar: 1.2,
  witness: 0.8,
  scribe: 0.9,
};
