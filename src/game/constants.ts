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
  embargo: ["blockade", "sanctions", "tariff", "embargo", "boycott"],
  rebellion: ["uprising", "revolt", "insurrection", "mutiny", "coup"],
  plague: ["disease", "sickness", "pestilence", "outbreak", "epidemic"],
  trade: ["merchant", "commerce", "barter", "market", "exchange"],
  diplomacy: ["treaty", "alliance", "pact", "negotiation", "envoy"],
  military: ["army", "siege", "battle", "campaign", "garrison"],
  religion: ["temple", "ritual", "heresy", "schism", "pilgrimage"],
  culture: ["festival", "tradition", "art", "music", "theatre"],
  economy: ["coin", "tax", "treasury", "debt", "inflation"],
  infrastructure: ["road", "bridge", "harbor", "wall", "aqueduct"],
  intrigue: ["conspiracy", "betrayal", "espionage", "assassination", "blackmail"],
  migration: ["exodus", "refugee", "settlement", "nomad", "resettlement"],
  magic: ["omen", "curse", "prophecy", "enchantment", "ritual"],
  disaster: ["earthquake", "famine", "flood", "wildfire", "drought"],
  innovation: ["invention", "discovery", "breakthrough", "craft", "engineering"],
  exploration: ["expedition", "voyage", "frontier", "cartography", "survey"],
  justice: ["trial", "verdict", "decree", "law", "sentence"],
  education: ["academy", "manuscript", "library", "scholar", "curriculum"],
  romance: ["courtship", "marriage", "scandal", "alliance", "affair"],
  succession: ["heir", "throne", "dynasty", "coronation", "regent"],
  naval: ["fleet", "ship", "piracy", "navy", "coast"],
  agriculture: ["harvest", "famine", "crop", "livestock", "irrigation"],
  mining: ["mine", "quarry", "ore", "smelter", "excavation"],
  hunting: ["game", "poach", "wilds", "tracking", "expedition"],
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
  diplomat: ["deceitful", "cowardly", "spineless", "treacherous"],
  rebel: ["oppressive", "tyrannical", "authoritarian", "complacent"],
  merchant: ["greedy", "exploitative", "corrupt", "unscrupulous"],
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
  diplomat: 1.1,
  rebel: 0.7,
  merchant: 1.3,
};

/**
 * CLAIM_REVEAL_DELAY: Turns between claim submission and score revelation.
 */
export const CLAIM_REVEAL_DELAY = 2;

/**
 * WITNESS_NAMES / WITNESS_ROLES: Pool for seeded fragment generation.
 */
export const WITNESS_NAMES: readonly string[] = [
  "Brother Aldric", "Sister Elena", "Merchant Yusuf", "Guard Petra",
  "Scholar Imre", "Farmer Oswin", "Scribe Catalina", "Innkeeper Rhys",
  "Elder Maren", "Soldier Dax",
];

export const WITNESS_ROLES: readonly string[] = [
  "a market herbalist", "a garrison guard", "a traveling merchant",
  "a monastery scribe", "a court attendant", "a harbor watchman",
  "a local farmer", "a temple priest", "a guild apprentice", "an innkeeper",
];

/**
 * STOP_WORDS: Common words excluded from semantic similarity tokenization.
 */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  "a", "an", "the", "is", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "to", "of", "in", "on", "at",
  "by", "for", "with", "about", "as", "and", "or", "but", "not",
  "it", "this", "that", "they", "them", "their", "from", "into",
]);

/**
 * World variable names for tracking aggregate world state.
 */
export const WORLD_VARIABLE_NAMES = ["morale", "infrastructure", "economy"] as const;

export type WorldVariableName = typeof WORLD_VARIABLE_NAMES[number];

/**
 * EVENT_VARIABLE_EFFECTS: Each event type's effect on world variables [morale, infrastructure, economy].
 * Positive values improve the variable; negative values degrade it.
 * Applied each time an event of that type occurs.
 */
export const EVENT_VARIABLE_EFFECTS: Record<string, readonly [number, number, number]> = {
  weather:       [0,  0,  0],
  location:      [0,  0,  0],
  character:     [0,  0,  0],
  conversation:  [0,  0,  0],
  action:        [0,  0,  0],
  discovery:     [2,  0,  0],
  embargo:       [-3, 0, -5],
  rebellion:     [-5, -3, -3],
  plague:        [-8, 0, -4],
  trade:         [2,  0,  5],
  diplomacy:     [3,  0,  2],
  military:      [-2, -5, -2],
  religion:      [3,  0,  0],
  culture:       [5,  0,  1],
  economy:       [1,  0,  3],
  infrastructure:[0,  5,  2],
  intrigue:      [-2, 0,  0],
  migration:     [-1, -2, 2],
  magic:         [3,  0,  0],
  disaster:      [-8, -8, -5],
  innovation:    [3,  3,  3],
  exploration:   [2,  0,  1],
  justice:       [2,  0,  0],
  education:     [3,  0,  1],
  romance:       [4,  0,  0],
  succession:    [-1, 0,  0],
  naval:         [1,  3,  3],
  agriculture:   [2,  1,  4],
  mining:        [0,  2,  4],
  hunting:       [1,  0,  2],
};

/**
 * LOW_VARIABLE_EVENT_BOOSTS: Event types that become MORE likely when a variable is LOW (below threshold).
 * HIGH_VARIABLE_EVENT_BOOSTS: Event types that become MORE likely when a variable is HIGH (above threshold).
 * These create cascading consequences: low morale breeds rebellion, etc.
 */
export const VARIABLE_EVENT_BOOSTS: Record<string, { readonly low: readonly string[]; readonly high: readonly string[] }> = {
  morale: {
    low: ["rebellion", "intrigue", "migration", "disaster", "plague"],
    high: ["culture", "religion", "romance", "innovation", "education"],
  },
  infrastructure: {
    low: ["disaster", "plague", "military", "migration"],
    high: ["infrastructure", "trade", "naval", "innovation", "agriculture"],
  },
  economy: {
    low: ["embargo", "rebellion", "migration", "disaster"],
    high: ["trade", "mining", "agriculture", "economy", "innovation"],
  },
};

/** Threshold below which low-variable boosts apply (variable value in 0-100). */
export const LOW_VARIABLE_THRESHOLD = 35;

/** Threshold above which high-variable boosts apply. */
export const HIGH_VARIABLE_THRESHOLD = 65;

/** The default mid-point for world variables. */
export const DEFAULT_VARIABLE_VALUE = 50;
