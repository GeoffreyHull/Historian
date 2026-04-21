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
export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Return next random number in [0, 1).
   */
  next(): number {
    // MINSTD: x = (a * x) mod m
    const a = 16807;
    const m = 2147483647; // 2^31 - 1
    const q = Math.floor(m / a); // 127773
    const r = m % a; // 2836

    const hi = Math.floor(this.seed / q);
    const lo = this.seed % q;

    this.seed = a * lo - r * hi;
    if (this.seed <= 0) {
      this.seed += m;
    }

    return (this.seed % m) / m;
  }

  /**
   * Return random integer in [min, max).
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Return random boolean with given probability (0 to 1).
   */
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Pick random element from array.
   */
  pick<T>(array: readonly T[]): T {
    const index = this.nextInt(0, array.length);
    return array[index];
  }
}
