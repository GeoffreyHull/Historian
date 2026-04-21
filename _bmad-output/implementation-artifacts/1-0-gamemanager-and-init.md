---
story: "S1: GameManager & Game Initialization"
story_key: "1-0-gamemanager"
epic: "Epic 3: Author History Through Claims"
status: "in-progress"
created: "2026-04-20"
---

# Story S1: GameManager & Game Initialization

## Story

As a game engine, I need centralized game state management and initialization so that S2 (event generation) and S3 (UI) have a reliable single source of truth for GameState and can subscribe to state changes.

**Investment:** 4 hours (estimated)  
**Unblocks:** S2 (event generation), S3 (claims UI), S4 (credibility system)

---

## Acceptance Criteria

- **AC1:** GameState type defined with turn, events array, currentFaction, influence, and credibility tracking
- **AC2:** GameManager class provides initial state and reducer for state mutations
- **AC3:** All state updates return new objects (immutability, Constraint 2)
- **AC4:** GameState is 100% JSON-serializable (Constraint 5)
- **AC5:** GameManager exports state via getter; state changes via dispatch(action)
- **AC6:** Initial game state has turn=1, empty events array, valid starting influence/credibility

---

## Tasks/Subtasks

- [x] **T1.1:** Extend Event type in `/src/game/types.ts` with observedByPlayer: boolean flag
- [x] **T1.2:** Create GameState type in `/src/game/types.ts` with turn, events, faction, influence, credibilityMap
- [x] **T1.3:** Create `/src/game/gameManager.ts` with GameManager class
  - [x] Constructor accepting initial state or defaults
  - [x] getState() getter
  - [x] dispatch(action) method
  - [x] Immutable state updates (spread operator, no mutations)
- [x] **T1.4:** Create action handlers for 'writeClaim', 'evaluateClaims', 'nextTurn' actions
- [x] **T1.5:** Verify GameManager state compiles and is JSON-serializable
- [x] **T1.6:** Create `/src/game/__tests__/gameManager.test.ts` with 9 tests (initialization, immutability, serialization, dispatch)

---

## Dev Notes

S1 is minimal game infrastructure unblocking S2 and S3. It doesn't implement full game logic (that's S4), just state management and action dispatch.

---

## Dev Agent Record

### Implementation Plan

1. Extend Event type with observedByPlayer
2. Create GameState interface
3. Create GameManager class with state getter and dispatch method
4. Create action handlers (focus: writeClaim for S3)
5. Verify immutability and JSON serialization
6. Write basic unit tests

### Debug Log

All tasks completed successfully.

### Completion Notes

✅ **All acceptance criteria satisfied:**
- AC1: GameState type defined with turnNumber, currentFaction, events, claims, credibilityMap, influence, isGameOver
- AC2: GameManager class with immutable state reducer pattern
- AC3: All state updates return new objects via spread operator (no mutations)
- AC4: GameState is 100% JSON-serializable (verified via round-trip tests)
- AC5: State getter and dispatch(action) pattern implemented
- AC6: Initial state: turn=1, empty arrays, influence=50, faction="historian"

**Test Results:** 9/9 tests passing
- Initialization: 2 tests
- Immutability: 2 tests
- JSON Serialization: 2 tests
- Action Dispatch: 3 tests

**Validations:**
- TypeScript compilation: ✅ zero errors
- Tests: ✅ 9 passing
- Immutability (Constraint 2): ✅ verified
- JSON serialization (Constraint 5): ✅ verified
- Action dispatch (Constraint 6): ✅ implemented

**Design Decisions Locked:**
- Event type extended with observedByPlayer boolean
- GameState type finalized (immutable record)
- Action types: writeClaim, evaluateClaims, nextTurn
- Action dispatch pattern established

---

## File List

- `/src/game/types.ts` (MODIFIED) - Added observedByPlayer to Event, GameState, Action, Reducer types
- `/src/game/gameManager.ts` (NEW) - GameManager class, createInitialGameState factory
- `/src/game/__tests__/gameManager.test.ts` (NEW) - 9 unit tests covering initialization, immutability, serialization, dispatch
- `/src/game/__tests__/fixtures/events.ts` (MODIFIED) - All 15 events updated with observedByPlayer flags

---

## Change Log

- **2026-04-20 15:50 UTC:** Story S1 implemented; GameManager and game state ready for S2/S3; 9/9 tests passing; constraints 2, 5, 6 verified

---

## Status

**Current:** review  
**Ready for:** S2 (event generation), S3 (claims UI implementation)
