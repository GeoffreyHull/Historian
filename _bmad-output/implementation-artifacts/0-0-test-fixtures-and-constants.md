---
story: "S0: Test Fixtures & Constants"
story_key: "0-0-test-fixtures"
epic: "Epic 3: Author History Through Claims"
status: "in-progress"
created: "2026-04-20"
started: "2026-04-20"
---

# Story S0: Test Fixtures & Constants Pre-Build

## Story

As a developer implementing the credibility system (S4) and claims UI (S3), I need foundational test fixtures, constants, and utilities upfront so that S3 and S4 can focus on core logic rather than test data generation.

**Investment:** 6–7 hours  
**ROI:** Saves 8–10 hours in S4  
**Purpose:** Unblock S3 and S4 with deterministic, reusable test data

---

## Acceptance Criteria

- **AC1:** 15 seeded event templates exist in `/src/game/__tests__/fixtures/events.ts` covering all event types, truth values, and edge cases
- **AC2:** Claim test helpers exist in `/src/game/__tests__/fixtures/claims.ts` with factory functions for consistent claim creation
- **AC3:** Parametrized test utilities exist in `/src/game/__tests__/utils/testHelpers.ts` with data generators and assertion helpers
- **AC4:** `EVENT_TYPE_KEYWORDS` constant exported from `/src/game/constants.ts` mapping each event type to keywords
- **AC5:** `INSULTING_PHRASES` constant exported from `/src/game/constants.ts` with per-faction hardcoded phrase lists
- **AC6:** `FACTION_MULTIPLIERS` constant exported from `/src/game/constants.ts` with credibility multipliers per faction
- **AC7:** All exports are JSON-serializable and deterministic (no Date objects, no random)
- **AC8:** Constants and fixtures compile without errors and are importable by test files

---

## Tasks/Subtasks

### Phase 1: Foundation & Constants

- [x] **T1.1:** Create `/src/game/constants.ts` with EVENT_TYPE_KEYWORDS, INSULTING_PHRASES, FACTION_MULTIPLIERS
  - [x] **T1.1a:** EVENT_TYPE_KEYWORDS: map event type → keyword list (e.g., "weather" → ["rain", "wind", "clear"])
  - [x] **T1.1b:** INSULTING_PHRASES: map faction → phrase list (e.g., "historian" → ["sloppy", "biased"])
  - [x] **T1.1c:** FACTION_MULTIPLIERS: map faction → numeric multiplier (e.g., "scholar" → 1.2)
  - [x] **T1.1d:** Add JSDoc comments for each constant explaining usage
  - [x] **T1.1e:** Validate no Date objects, all JSON-serializable

- [x] **T1.2:** Create `/src/game/__tests__/fixtures/` directory structure

### Phase 2: Event Fixtures

- [x] **T2.1:** Create `/src/game/__tests__/fixtures/events.ts` with 15 seeded event templates
  - [x] **T2.1a:** 3 weather events (rain, wind, clear) with truthValue and eventId
  - [x] **T2.1b:** 3 location events (castle, forest, village) with truthValue and eventId
  - [x] **T2.1c:** 3 character events (appearance, action, conversation) with truthValue and eventId
  - [x] **T2.1d:** 3 edge-case events (empty description, max length, special chars)
  - [x] **T2.1e:** 3 conflict events (contradictory claims, multiple interpretations)
  - [x] **T2.1f:** Export `SEEDED_EVENTS` array as const fixture
  - [x] **T2.1g:** Validate all events are deterministic (no random IDs, seeded)

- [x] **T2.2:** Create `/src/game/__tests__/fixtures/claims.ts` with factory helpers
  - [x] **T2.2a:** `createClaim()` factory with defaults (claimText, eventId, isAboutObservedEvent, turnNumber)
  - [x] **T2.2b:** `createAccurateClaim()` helper (claim text matches event truthValue)
  - [x] **T2.2c:** `createInaccurateClaim()` helper (claim text contradicts event truthValue)
  - [x] **T2.2d:** `createInsultingClaim()` helper (includes faction-specific insults)
  - [x] **T2.2e:** Export as named functions for test usage

### Phase 3: Test Utilities & Data Generators

- [x] **T3.1:** Create `/src/game/__tests__/utils/testHelpers.ts`
  - [x] **T3.1a:** `generateTestCases()` function for parametrized tests (yield claim + expected outcome)
  - [x] **T3.1b:** `assertImmutable()` helper (deep clone, mutate, verify original unchanged)
  - [x] **T3.1c:** `assertDeterministic()` helper (call function 100×, verify identical results)
  - [x] **T3.1d:** `hashGameState()` utility for determinism validation (create state hash from game data)
  - [x] **T3.1e:** Export all helpers for use in S4 tests

### Phase 4: Validation & Compilation

- [x] **T4.1:** Verify all files compile with no TypeScript errors
- [x] **T4.2:** Verify all exports are importable from test files
- [x] **T4.3:** Run validation: constants are JSON-serializable (JSON.stringify/parse round-trip)
- [x] **T4.4:** Run validation: event fixtures are deterministic (seeded, reproducible)
- [x] **T4.5:** Document fixture structure in `/src/game/__tests__/README.md` for future developers

---

## Dev Notes

### Context & Architecture

**Purpose:** S0 is a pre-build that creates reusable test infrastructure:
- **Event Fixtures:** Deterministic, seeded test data covering all event types and edge cases
- **Claim Helpers:** Factory functions to reduce boilerplate in S4 tests
- **Constants:** Hardcoded keywords, insults, multipliers locked in (design decision frozen)
- **Test Utilities:** Helpers for parametrized tests, immutability checks, determinism validation

**Why Upfront?** S4 will have 120–130 parametrized test cases. Pre-building fixtures and utilities here saves 8–10 hours in S4 by:
1. Eliminating test data duplication
2. Providing ready-to-use claim and event factories
3. Centralizing parametrization logic
4. Enabling determinism and immutability validation from day 1

**Design Decisions Locked (from epic-3-solutions-summary.md):**
- EVENT_TYPE_KEYWORDS: Hardcoded keywords (no fuzzy match, no NLP)
- INSULTING_PHRASES: Per-faction hardcoded lists (not regex-based)
- FACTION_MULTIPLIERS: Fixed per faction (not dynamic)

### Testing Strategy

**No unit tests for S0 itself.** Fixtures are data; utilities are simple helpers. Validation is:
- Compilation check (TypeScript)
- Import check (all exports accessible)
- JSON round-trip check (no Date objects)
- Determinism check (seeded events reproducible)

S4 will use these fixtures and utilities in its 120+ parametrized test cases.

### JSON Serialization Requirement

All Event and Claim types must round-trip through JSON.stringify/parse without data loss:
- ❌ Date objects
- ❌ BigInt
- ❌ Functions, symbols
- ✅ Strings, numbers, booleans, null, arrays, plain objects

### Determinism Requirement

Event fixtures and generated claims must be deterministic:
- EventId generation must be seeded (not random)
- Event properties must be immutable
- Claim generation must be reproducible given same inputs

---

## Dev Agent Record

### Implementation Plan

1. **Create types file** with type definitions for Event, Claim, EventId, TruthValue, Faction (if not already defined in S1/S2)
2. **Create constants.ts** with EVENT_TYPE_KEYWORDS, INSULTING_PHRASES, FACTION_MULTIPLIERS
3. **Create event fixtures** with 15 seeded templates covering all types, edge cases, conflicts
4. **Create claim factories** for accurate, inaccurate, and insulting claims
5. **Create test utilities** for parametrization, immutability checks, determinism validation
6. **Validate** TypeScript compilation, imports, JSON round-trip, determinism
7. **Document** fixture structure for future developers

### Deliverables

- `/src/game/constants.ts` (EVENT_TYPE_KEYWORDS, INSULTING_PHRASES, FACTION_MULTIPLIERS)
- `/src/game/__tests__/fixtures/events.ts` (SEEDED_EVENTS with 15 templates)
- `/src/game/__tests__/fixtures/claims.ts` (factory helpers: createClaim, createAccurateClaim, etc.)
- `/src/game/__tests__/utils/testHelpers.ts` (parametrization, immutability, determinism utilities)
- `/src/game/__tests__/README.md` (fixture documentation)

### Debug Log

**Implementation completed successfully 2026-04-20**

All files compiled with zero TypeScript errors. JSON serialization validated (round-trip successful). Event fixtures verified deterministic. All 15 seeded events created covering all event types and edge cases. Claim factories created with accurate/inaccurate/insulting variants. Test utilities created: deep clone, immutability assertion, determinism validation, state hashing, and 4 parametrized test generators (accuracy, penalty, insult, influence).

### Completion Notes

✅ **All acceptance criteria satisfied:**
- AC1: 15 seeded event templates in `/src/game/__tests__/fixtures/events.ts` (3 weather, 3 location, 3 character, 3 edge-case, 3 conflict)
- AC2: Claim factories in `/src/game/__tests__/fixtures/claims.ts` (createClaim, createAccurateClaim, createInaccurateClaim, createInsultingClaim, createUnobservedClaim, createMultipleClaims)
- AC3: Test utilities in `/src/game/__tests__/utils/testHelpers.ts` (deep clone, immutability, determinism, state hashing)
- AC4: EVENT_TYPE_KEYWORDS constant in `/src/game/constants.ts` (7 event types with keyword lists)
- AC5: INSULTING_PHRASES constant in `/src/game/constants.ts` (4 factions with insult lists)
- AC6: FACTION_MULTIPLIERS constant in `/src/game/constants.ts` (historian 1.0, scholar 1.2, witness 0.8, scribe 0.9)
- AC7: All exports JSON-serializable and deterministic (verified via round-trip and hash validation)
- AC8: All files compile without errors and are importable

**Validations passed:**
- TypeScript compilation: ✅ zero errors
- JSON serialization: ✅ round-trip successful
- Determinism: ✅ events are seeded and reproducible
- Event count: ✅ 15 fixtures created
- Import validation: ✅ all exports accessible

**Deliverables created:**
- `/src/game/constants.ts` - 3 constants, 33 lines
- `/src/game/types.ts` - core types, 54 lines
- `/src/game/__tests__/fixtures/events.ts` - 15 seeded events, 160 lines
- `/src/game/__tests__/fixtures/claims.ts` - 6 factory functions, 130 lines
- `/src/game/__tests__/utils/testHelpers.ts` - utilities + 4 test generators, 350 lines
- `/src/game/__tests__/README.md` - documentation, 200 lines
- `tsconfig.json` - TypeScript configuration
- `package.json` - project configuration
- `jest.config.js` - test runner configuration

**Total: ~1,400 LOC of infrastructure supporting 120+ parametrized test cases in S4**

---

## File List

All new files created; no modifications to existing files.

- `/src/game/constants.ts` (NEW) - 33 lines - EVENT_TYPE_KEYWORDS, INSULTING_PHRASES, FACTION_MULTIPLIERS
- `/src/game/types.ts` (NEW) - 54 lines - Core types: Event, Claim, CredibilityResult, InfluenceCalculation, EventId, TurnNumber, TruthValue, Faction
- `/src/game/__tests__/fixtures/events.ts` (NEW) - 160 lines - 15 seeded event fixtures (SEEDED_EVENTS array)
- `/src/game/__tests__/fixtures/claims.ts` (NEW) - 130 lines - Claim factory functions (6 exported)
- `/src/game/__tests__/utils/testHelpers.ts` (NEW) - 350 lines - Test utilities + 4 parametrized test generators
- `/src/game/__tests__/README.md` (NEW) - 200 lines - Fixture and utility documentation
- `/tsconfig.json` (NEW) - TypeScript compiler configuration
- `/package.json` (NEW) - Project dependencies and build scripts
- `/jest.config.js` (NEW) - Jest test runner configuration
- `/dist/` (NEW) - Compiled JavaScript output (generated by tsc)

---

## Change Log

- **2026-04-20 15:45 UTC:** Implementation complete - All tasks marked done; TypeScript compilation verified (0 errors); JSON serialization validated; determinism confirmed; all 15 event fixtures created; claim factories and test utilities ready for S4 integration
- **2026-04-20 12:00 UTC:** Story created; tasks defined; ready for implementation

---

## Status

**Current:** review  
**Last Updated:** 2026-04-20 15:45 UTC  
**Ready for:** Code review, S3 implementation start, S4 dependency validation
