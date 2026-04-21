---
story: "S2: Event Generation & Observation"
story_key: "2-0-event-generation"
epic: "Epic 3: Author History Through Claims"
status: "in-progress"
created: "2026-04-20"
---

# Story S2: Event Generation & Observation

## Story

As a game engine, I need to generate deterministic events each turn and mark which events the player observes, so that S3 (UI) can display observation indicators and S4 (credibility system) can evaluate claims against known events.

**Investment:** 6 hours (estimated)  
**Unblocks:** S3 (claims UI), S4 (credibility system)

---

## Acceptance Criteria

- **AC1:** EventGenerator generates 3–5 events per turn with random type and description
- **AC2:** All events are marked with observedByPlayer flag (seeded 60–80% observation rate)
- **AC3:** Event generation is deterministic: same seed → identical events (Constraint 3, 9)
- **AC4:** Events are added to GameState via 'updateEvents' action
- **AC5:** Event generation compiles and integrates with GameManager (S1)

---

## Tasks/Subtasks

- [x] **T2.1:** Create `/src/game/eventGenerator.ts` with deterministic event generation
  - [x] Constructor accepting SeededRNG
  - [x] generateEvents(count, turn) method
  - [x] Random event type selection from EVENT_TYPES
  - [x] Random description generation from templates
  - [x] Deterministic observation flag (seed-based probability)
- [x] **T2.2:** Create SeededRNG utility if not already in S0
- [x] **T2.3:** Add 'updateEvents' action handler to GameManager
- [x] **T2.4:** Create event generation tests validating determinism (Constraint 9)

---

## Dev Notes

S2 is minimal event generation with seeded randomness (Constraint 3). No complex game logic, just data generation and observation flagging.

Event observation rate: 60-80% seeded (deterministic).

---

## Dev Agent Record

### Implementation Plan

1. Create SeededRNG utility for deterministic randomness
2. Create EventGenerator class with seeded RNG
3. Generate 3-5 events per turn with random types/descriptions
4. Determine observation flags with seeded probability
5. Add updateEvents action to GameManager
6. Verify determinism (Constraint 9)

### Completion Notes

✅ Event generation complete: SeededRNG utility, EventGenerator class, determinism verified, integration with GameManager.

---

## File List

- `/src/game/rng.ts` (NEW) - SeededRNG utility for deterministic randomness
- `/src/game/eventGenerator.ts` (NEW) - EventGenerator class
- `/src/game/gameManager.ts` (MODIFIED) - Added updateEvents action handler
- `/src/game/__tests__/eventGenerator.test.ts` (NEW) - Determinism validation tests

---

## Change Log

- **2026-04-20 16:00 UTC:** Story S2 implemented; event generation with seeded observation ready for S3

---

## Status

**Current:** review  
**Ready for:** S3 (claims UI)
