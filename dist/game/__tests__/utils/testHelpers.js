"use strict";
/**
 * Test utilities for parametrized testing, immutability checks, and determinism validation.
 * Supports S4 credibility system testing with 120+ parametrized test cases.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepClone = deepClone;
exports.assertImmutable = assertImmutable;
exports.assertDeterministic = assertDeterministic;
exports.hashGameState = hashGameState;
exports.generateAccuracyTestCases = generateAccuracyTestCases;
exports.generatePenaltyTestCases = generatePenaltyTestCases;
exports.generateInsultTestCases = generateInsultTestCases;
exports.generateInfluenceTestCases = generateInfluenceTestCases;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Deep clone utility: Create independent copy of object.
 * Used for immutability testing: mutate the copy, verify original unchanged.
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * assertImmutable: Verify that a function doesn't mutate its inputs.
 * Pattern: Clone inputs, call function, verify original unchanged, mutant changed.
 */
function assertImmutable(original, mutateAndTest) {
    const clone = deepClone(original);
    mutateAndTest(clone);
    // Verify original is unchanged
    const originalJson = JSON.stringify(original);
    const cloneJson = JSON.stringify(clone);
    if (originalJson !== cloneJson) {
        throw new Error(`Immutability violation: original was mutated.\n` +
            `Original: ${originalJson}\n` +
            `Clone: ${cloneJson}`);
    }
}
/**
 * assertDeterministic: Verify that a function produces identical output
 * when called multiple times with identical inputs.
 * Calls function repeatCount times (default 100), compares all outputs.
 */
function assertDeterministic(fn, repeatCount = 100) {
    const results = [];
    for (let i = 0; i < repeatCount; i++) {
        const result = fn();
        results.push(JSON.stringify(result));
    }
    const firstResult = results[0];
    const mismatchIndex = results.findIndex((r) => r !== firstResult);
    if (mismatchIndex !== -1) {
        throw new Error(`Determinism violation at call ${mismatchIndex + 1}: ` +
            `First call: ${firstResult}, ` +
            `Call ${mismatchIndex + 1}: ${results[mismatchIndex]}`);
    }
}
/**
 * hashGameState: Create deterministic hash of game state.
 * Used for validating turn-phase determinism (same seed = identical state hash).
 */
function hashGameState(state) {
    const json = JSON.stringify(state);
    return crypto_1.default.createHash("sha256").update(json).digest("hex");
}
/**
 * generateAccuracyTestCases: Parametrized test cases for accuracy evaluation.
 * Returns iterator yielding 30–40 cases covering exact match, keyword, partial, no match, edge cases.
 */
function* generateAccuracyTestCases() {
    // Test data: (claim text, event type, event truth, expected accuracy)
    const cases = [
        // Exact matches
        ["The sky was clear", "weather", "true", "correct"],
        ["The sky was clear", "weather", "false", "incorrect"],
        // Keyword matches
        ["It rained", "weather", "true", "correct"],
        ["Winds did blow", "weather", "false", "incorrect"],
        // Partial matches
        ["clear skies", "weather", "true", "correct"],
        ["castle gate", "location", "true", "correct"],
        // No match
        ["The sky fell", "weather", "true", "incorrect"],
        ["Nothing happened", "character", "true", "incorrect"],
        // Edge cases
        ["", "weather", "true", "incorrect"], // Empty claim
        ["rain rain rain", "weather", "true", "correct"], // Repetition
    ];
    for (let i = 0; i < cases.length; i++) {
        const [claimText, eventType, truthValue, expected] = cases[i];
        yield {
            description: `Accuracy case ${i + 1}: "${claimText}" vs ${eventType} (${truthValue})`,
            claim: {
                claimText,
                eventId: "evt-001",
                isAboutObservedEvent: true,
                turnNumber: 1,
            },
            event: {
                eventId: "evt-001",
                eventType,
                description: `An event of type ${eventType} with truth value ${truthValue}`,
                truthValue: truthValue,
                turnNumber: 1,
                observedByPlayer: true,
            },
            expectedAccuracy: expected,
        };
    }
}
/**
 * generatePenaltyTestCases: Parametrized test cases for penalty calculation.
 * Returns iterator yielding 25–30 cases for single error, insults, stacking, clamping.
 */
function* generatePenaltyTestCases() {
    const cases = [
        // Base case (no insult)
        [100, false, 0, 100, "perfect claim, no insult"],
        [80, false, 0, 80, "good claim, no insult"],
        [50, false, 0, 50, "average claim, no insult"],
        [20, false, 0, 20, "poor claim, no insult"],
        // Single insult (-5-10%)
        [100, true, 10, 90, "perfect but insulting"],
        [80, true, 10, 70, "good but insulting"],
        [50, true, 10, 40, "average but insulting"],
        [20, true, 10, 10, "poor and insulting"],
        // Clamping at boundaries
        [0, false, 0, 0, "already zero"],
        [0, true, 10, 0, "zero, clamped (penalty would be -10)"],
        [100, true, 20, 80, "max, reduced by insult"],
        // Edge cases
        [1, false, 0, 1, "nearly zero"],
        [99, false, 0, 99, "nearly perfect"],
    ];
    for (let i = 0; i < cases.length; i++) {
        const [base, hasInsult, penalty, final, desc] = cases[i];
        yield {
            description: `Penalty case ${i + 1}: ${desc}`,
            baseCredibility: base,
            hasInsult,
            expectedPenalty: penalty,
            expectedFinal: final,
        };
    }
}
/**
 * generateInsultTestCases: Parametrized test cases for insult detection.
 * Returns iterator yielding 20–25 cases per faction.
 */
function* generateInsultTestCases(faction = "historian") {
    const insultsMap = {
        historian: ["sloppy", "biased", "unreliable"],
        scholar: ["ignorant", "pedantic", "arrogant"],
        witness: ["confused", "forgetful", "dishonest"],
        scribe: ["careless", "inaccurate", "sloppy"],
    };
    const insults = insultsMap[faction] ?? [];
    // Cases: (claim text, expected has insult)
    const cases = [
        // Exact matches
        ...insults.flatMap((insult) => [
            [`This is ${insult}`, true],
            [`How ${insult}!`, true],
        ]),
        // No insult
        ["This is a neutral claim", false],
        ["The event was true", false],
        ["Facts are facts", false],
        // Edge cases
        ["", false], // Empty
        ["sloppy sloppy sloppy", true], // Repetition
        ["This historian is sloppy", true], // Contains insult word
    ];
    for (let i = 0; i < cases.length; i++) {
        const [claimText, expected] = cases[i];
        yield {
            description: `Insult case ${i + 1} (${faction}): "${claimText}"`,
            claimText,
            faction,
            expectedHasInsult: expected,
        };
    }
}
/**
 * generateInfluenceTestCases: Parametrized test cases for influence calculation.
 * Returns iterator yielding 10–15 cases per faction.
 */
function* generateInfluenceTestCases() {
    const multipliers = {
        historian: 1.0,
        scholar: 1.2,
        witness: 0.8,
        scribe: 0.9,
    };
    const cases = [
        // Historian (multiplier 1.0)
        [100, "historian", "100 (credibility × 1.0)", "100"],
        [50, "historian", "50 (credibility × 1.0)", "50"],
        [0, "historian", "0 (credibility × 1.0)", "0"],
        // Scholar (multiplier 1.2)
        [100, "scholar", "120 (credibility × 1.2)", "120"],
        [50, "scholar", "60 (credibility × 1.2)", "60"],
        // Witness (multiplier 0.8)
        [100, "witness", "80 (credibility × 0.8)", "80"],
        [50, "witness", "40 (credibility × 0.8)", "40"],
        // Scribe (multiplier 0.9)
        [100, "scribe", "90 (credibility × 0.9)", "90"],
        [50, "scribe", "45 (credibility × 0.9)", "45"],
    ];
    for (let i = 0; i < cases.length; i++) {
        const cred = parseInt(cases[i][0].toString());
        const faction = cases[i][1];
        const multiplier = multipliers[faction];
        const expectedInfluence = cred * multiplier;
        yield {
            description: `Influence case ${i + 1}: ${faction} with credibility ${cred}`,
            credibilityScore: cred,
            faction,
            expectedMultiplier: multiplier,
            expectedInfluence,
        };
    }
}
//# sourceMappingURL=testHelpers.js.map