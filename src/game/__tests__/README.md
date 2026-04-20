# Test Infrastructure

This directory contains test fixtures, utilities, and constants for testing the credibility system and game logic.

## Fixtures

### `/fixtures/events.ts`

Seeded event templates for deterministic testing.

- **WEATHER_RAIN, WEATHER_WIND, WEATHER_CLEAR** — Weather event fixtures (true/false mix)
- **LOCATION_CASTLE, LOCATION_FOREST, LOCATION_VILLAGE** — Location event fixtures
- **CHARACTER_APPEARANCE, CHARACTER_ACTION, CHARACTER_CONVERSATION** — Character event fixtures
- **EDGE_EMPTY_DESCRIPTION, EDGE_MAX_LENGTH, EDGE_SPECIAL_CHARS** — Edge case fixtures
- **CONFLICT_CONTRADICTORY_1, CONFLICT_CONTRADICTORY_2, CONFLICT_AMBIGUOUS** — Conflict scenario fixtures
- **SEEDED_EVENTS** — Array of all 15 fixtures (use for parametrized tests)

**Usage:**
```typescript
import { SEEDED_EVENTS } from "./fixtures/events";
test.each(SEEDED_EVENTS)("test each event", (event) => {
  expect(event.eventId).toBeDefined();
});
```

### `/fixtures/claims.ts`

Factory functions for creating test claims.

- **createClaim(options)** — Generic claim factory with defaults
- **createAccurateClaim(event, options)** — Claim matching event truth value
- **createInaccurateClaim(event, options)** — Claim contradicting event truth value
- **createInsultingClaim(event, faction, options)** — Claim with faction insults
- **createUnobservedClaim(event, options)** — Claim about unobserved event
- **createMultipleClaims(count, options)** — Batch claim creation

**Usage:**
```typescript
import { createAccurateClaim } from "./fixtures/claims";
import { WEATHER_RAIN } from "./fixtures/events";

const claim = createAccurateClaim(WEATHER_RAIN);
expect(claim.eventId).toBe(WEATHER_RAIN.eventId);
```

## Test Utilities

### `/utils/testHelpers.ts`

Parametrized test generators and validation helpers.

#### Immutability & Determinism

- **deepClone(obj)** — JSON-based deep clone for immutability testing
- **assertImmutable(original, mutateAndTest)** — Verify function doesn't mutate inputs
- **assertDeterministic(fn, repeatCount)** — Verify function produces identical output 100× times
- **hashGameState(state)** — SHA256 hash for state determinism validation

#### Test Case Generators (parametrized)

Each generator yields 10–40 test cases as per epic-3-solutions-summary.md:

- **generateAccuracyTestCases()** — 30–40 cases: exact match, keyword, partial, no match
- **generatePenaltyTestCases()** — 25–30 cases: single error, insults, stacking, clamping
- **generateInsultTestCases(faction)** — 20–25 cases per faction
- **generateInfluenceTestCases()** — 10–15 cases per faction

**Usage:**
```typescript
import { generateAccuracyTestCases } from "./utils/testHelpers";

test.each([...generateAccuracyTestCases()])(
  "$description",
  ({ claim, event, expectedAccuracy }) => {
    const result = evaluateClaimAccuracy(claim, event);
    expect(result.accuracy).toBe(expectedAccuracy);
  }
);
```

## Constants

### `/constants.ts`

Design decisions locked in via constants (no runtime configuration).

- **EVENT_TYPE_KEYWORDS** — Maps event type → keyword list
- **INSULTING_PHRASES** — Maps faction → insult phrase list
- **FACTION_MULTIPLIERS** — Maps faction → credibility multiplier

**Usage:**
```typescript
import { EVENT_TYPE_KEYWORDS, FACTION_MULTIPLIERS } from "../constants";

const weatherKeywords = EVENT_TYPE_KEYWORDS["weather"];
const scholarMultiplier = FACTION_MULTIPLIERS["scholar"]; // 1.2
```

## JSON Serialization

All fixtures and types are JSON-serializable (no Date, Function, Symbol objects).

**Validation:**
```typescript
import { SEEDED_EVENTS } from "./fixtures/events";

const json = JSON.stringify(SEEDED_EVENTS);
const restored = JSON.parse(json);
expect(restored).toEqual(SEEDED_EVENTS);
```

## Determinism

Event fixtures are seeded and deterministic:
- EventIds are fixed strings (not random UUIDs)
- Event properties are immutable
- Generated claims follow deterministic patterns

**Validation:**
```typescript
import { SEEDED_EVENTS } from "./fixtures/events";

const hash1 = hashGameState(SEEDED_EVENTS);
const hash2 = hashGameState(SEEDED_EVENTS);
expect(hash1).toBe(hash2); // Identical
```

## S4 Credibility System Integration

These fixtures and utilities support S4 testing:

- **15 event fixtures** — Used in accuracy + influence tests (30–40 cases)
- **Claim factories** — Used to generate accurate/inaccurate/insulting claims
- **Test generators** — Parametrized cases for accuracy, penalty, insult, influence (120–130 total)
- **Immutability helpers** — Validate Constraint 1 (pure functions)
- **Determinism helpers** — Validate Constraint 9 (turn-phase determinism)

Total ROI: **6–7 hours now → saves 8–10 hours in S4**

## Adding New Fixtures

If you add new event types or constants:

1. Add new constant to `/constants.ts`
2. Add new event fixture to `/fixtures/events.ts`
3. Update **SEEDED_EVENTS** array
4. Update test generators in `/utils/testHelpers.ts` if new categories (accuracy, penalty, etc.)
