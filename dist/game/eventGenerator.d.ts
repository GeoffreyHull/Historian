/**
 * EventGenerator: Deterministic event generation with seeded randomness.
 * Constraint 3: Uses SeededRNG for all randomness.
 * Constraint 9: Same seed → identical events (determinism).
 */
import { Event, TurnNumber } from "./types";
/**
 * EventGenerator: Generate deterministic events with seeded randomness.
 */
export declare class EventGenerator {
    private rng;
    private eventCounter;
    constructor(seed: number);
    /**
     * Generate events for a turn.
     */
    generateEvents(turnNumber: TurnNumber, count?: number): Event[];
}
//# sourceMappingURL=eventGenerator.d.ts.map