/**
 * SeededRNG: Deterministic pseudo-random number generator.
 * Constraint 3: All randomness through SeededRNG, never Math.random().
 * Constraint 9: Same seed → identical sequence.
 */
/**
 * Simple linear congruential generator for deterministic randomness.
 * Based on MINSTD (Park and Miller).
 * Good enough for game logic; not cryptographically secure.
 */
export declare class SeededRNG {
    private seed;
    constructor(seed: number);
    /**
     * Return next random number in [0, 1).
     */
    next(): number;
    /**
     * Return random integer in [min, max).
     */
    nextInt(min: number, max: number): number;
    /**
     * Return random boolean with given probability (0 to 1).
     */
    nextBool(probability?: number): boolean;
    /**
     * Pick random element from array.
     */
    pick<T>(array: readonly T[]): T;
}
//# sourceMappingURL=rng.d.ts.map