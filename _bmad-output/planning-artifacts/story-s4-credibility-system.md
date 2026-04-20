---
storyId: S4
title: "Credibility System"
epic: "Epic 3: Author History Through Claims"
estimatedHours: 22
phase: "MVP Core – Test-Heavy"
depends: ["S0", "S1", "S2", "S3"]
priority: "P0 – Core Game Mechanic"
testFriction: 16h
---

# Story S4: Credibility System

## Overview

The credibility system evaluates whether player claims match actual event truth, applies penalties for inaccuracy and insults, and calculates influence earned per faction. **This is the core mechanic that proves narrative claims matter.**

**User Value:** "My claims are judged fairly, and factions respond based on how truthful I am."

**Critical:** This story is **16 hours of testing** (parametrized accuracy tests, penalty scenarios, insult detection, immutability validation, determinism replay). The 18-hour estimate from Epic Planning was understated; 22 hours is realistic solo dev.

---

## Deliverables

```
/src/game/credibilitySystem.ts                    – Core functions
/src/game/__tests__/credibilitySystem.test.ts     – Parametrized test suite (8–10h of code)
/src/game/__tests__/fixtures/events.ts            – Event test templates (from S0)
/src/game/__tests__/fixtures/claims.ts            – Claim test helpers (from S0)
/src/game/__tests__/utils/testHelpers.ts          – Parametrized test utilities (from S0)
```

---

## Hour Breakdown

### A. Core Logic: 6 Hours

| Component | Hours | Notes |
|-----------|-------|-------|
| Accuracy Evaluation | 2h | Compare claim keyword to event truthValue; hardcoded match, no fuzzy |
| Insult Detection | 2h | Per-faction keyword lists; hardcoded regex, not NLP |
| Penalty Calculation | 1h | −20% major error, −5–10% insult per faction, clamp [0, 100] |
| Influence Calculation | 1h | `influence = credibility × faction.multiplier` per faction record |
| **Subtotal** | **6h** | Straightforward logic, no async/I/O |

### B. Tests: 16 Hours (THE HEAVY LIFT)

| Test Layer | Hours | Test Cases | Coverage Goal |
|-----------|-------|-----------|---------------|
| **Accuracy Detection** | 4h | 30–40 parametrized cases | Exact match ✓, keyword ✓, partial ✓, no match ✓, determinism ✓ |
| **Penalty Calculation** | 3h | 25–30 parametrized cases | Single error → −20 ✓, double error → −40 ✓, clamping [0, 100] ✓, insult stacking ✓ |
| **Insult Detection** | 3h | 20–25 cases per faction | Contains insult ✓, no insult ✓, multiple insults ✓, false positive ✗ |
| **Influence Calculation** | 2h | 10–15 parametrized cases | Credibility × multiplier per faction ✓ |
| **Immutability & Purity** | 2h | Deep copy + 100× repeat tests | Inputs unchanged ✓, output deterministic ✓ (Constraint 1–2) |
| **Integration: Claim → Credibility → Influence** | 2h | End-to-end flow | State hash determinism (Constraint 9) ✓ |
| **Subtotal** | **16h** | **120–130 test cases** | **99%+ code coverage** |

**Total: 6 + 16 = 22 hours**

---

## Assumed Locked (Critical Design Decisions)

**These must be decided NOW or story will balloon by 6–10 hours.**

| Decision | Assumption | Cost if Deferred |
|----------|-----------|------------------|
| **Insult Detection Approach** | Hardcoded per-faction keyword lists (e.g., `/(coward\|weak\|foolish)/i` for militarists) | +3–4h if fuzzy matching / NLP required |
| **Error Taxonomy** | Binary: event match = accurate OR inaccurate (no partial credit MVP1) | +4–5h if graduated partial credit (e.g., 50% for partial keyword match) |
| **Faction Multiplier Values** | Fixed per faction (e.g., militarists 1.2, scholars 1.0, merchants 0.8) hardcoded constant | +2–3h if dynamic / configurable |
| **Claims Aggregation** | Average credibility across 1–3 claims per turn | +1h if per-claim display / weighted aggregation |
| **Unobserved Event Evaluation** | Same formula as observed (but UI surfaces risk) | +0h (assumption only affects logic clarity) |
| **Event Fixtures Pre-Built** | 15 seeded event templates built in S0/S1 (not mocked on-the-fly) | +8–10h if S4 builds fixtures during test setup |

**Decision Gate Before S4 Code Starts:**
- [ ] Insult detection: hardcoded keyword lists finalized
- [ ] Error taxonomy: binary yes/no (no partial credit)
- [ ] Faction multipliers: hardcoded per faction (no config file)
- [ ] Claims aggregation: average credibility across 1–3 claims
- [ ] Unobserved evaluation: same formula as observed
- [ ] Event fixtures: 15 templates pre-built in S0/S1 (required to unblock S4 testing)

---

## Dependencies

| Story | Contribution | Critical For |
|-------|--------------|--------------|
| **S0** | Event, Claim, CredibilityResult, InfluenceState types (no Date objects) | Type safety, JSON serialization (Constraint 5) |
| **S1** | GameManager initialized, event fixtures (15 seeded templates) | Parametrized test fixtures |
| **S2** | Events generated with deterministic seeded RNG, observedByPlayer flag set | Accuracy evaluation test cases |
| **S3** | Claims submitted as action: `dispatch({ type: 'writeClaim', claims: Claim[] })` | Integration test (Claim → Credibility → Influence) |

---

## Acceptance Criteria

### AC1: Accuracy Evaluation Function

**Function Signature:**
```typescript
function evaluateClaimAccuracy(claim: Claim, event: Event): { correct: boolean }
```

**Behavior:**
- [ ] Return `{ correct: true }` if claim text **exactly matches** event description OR **contains event type keyword**
- [ ] Example: Event type `rebellion` + claim "A militia declares independence" → `correct: true` (keyword match)
- [ ] Example: Event type `plague` + claim "The capital is flooded" → `correct: false` (no match)
- [ ] **Assumption:** No fuzzy matching, no NLP (saves 3–4h vs. post-MVP)
- [ ] Function is pure: no mutations, deterministic output given same inputs

**Hardcoded Keyword Map (from S0):**
```typescript
const EVENT_TYPE_KEYWORDS = {
  rebellion: ['revolt', 'independence', 'militia', 'uprising'],
  plague: ['illness', 'spreading', 'disease', 'outbreak'],
  trade_disruption: ['disruption', 'supply', 'commerce', 'halt'],
  // ... more per event type
};
```

**Test Coverage (AC1):**
- [ ] **Exact match:** Claim text = event description → `correct: true`
- [ ] **Keyword match:** Claim contains event type keyword → `correct: true`
- [ ] **Partial keyword:** Claim contains substring of keyword → `correct: false`
- [ ] **No match:** Claim doesn't match event → `correct: false`
- [ ] **Case insensitive:** "REBELLION" in claim → recognized as keyword match
- [ ] **Determinism:** Call 100× with same inputs → identical output
- [ ] **Parametrized test:** 30–40 cases covering all above

**Acceptance:** All 30–40 test cases pass; zero false positives on random claims

---

### AC2: Insult Detection Function

**Function Signature:**
```typescript
function detectInsult(claimText: string, factionName: string): boolean
```

**Behavior:**
- [ ] Return `true` if claim contains faction-specific insulting phrase (case-insensitive regex)
- [ ] Each faction has hardcoded keyword list (e.g., militarists: "coward", "weak", "foolish")
- [ ] Example: Faction = militarists, claim = "You cowards refused to act" → `true`
- [ ] Example: Faction = merchants, claim = "Those greedy traders" → `true`
- [ ] Example: Faction = scholars, claim = "The wise council" → `false`
- [ ] Function is pure and deterministic

**Hardcoded Insult Map (from S0):**
```typescript
const INSULTING_PHRASES: Record<string, string[]> = {
  militarists: ['coward', 'weak', 'foolish', 'cowardly'],
  merchants: ['greedy', 'dishonest', 'lazy', 'mercenary'],
  scholars: ['ignorant', 'blind', 'foolish', 'incompetent'],
  // ... more per faction
};
```

**Test Coverage (AC2):**
- [ ] **Contains insult:** Faction insult phrase in claim → `true`
- [ ] **No insult:** Claim doesn't contain phrase → `false`
- [ ] **Multiple insults:** Claim contains 2+ insult phrases → `true` (still one penalty application, not stacked per phrase)
- [ ] **Similar word, not insult:** Claim "foolishly brave" → `true` (keyword present, even if meaning differs)
- [ ] **Case insensitive:** "COWARD" in claim → detected
- [ ] **Per-faction:** Same phrase insulting to one faction, not another
- [ ] **Parametrized test:** 20–25 cases per faction (3–4 factions = 60–100 total)

**Acceptance:** All 20–25 cases per faction pass; zero false positives on neutral claims

---

### AC3: Penalty Calculation Function

**Function Signature:**
```typescript
function calculateCredibility(
  claims: Claim[],
  events: Event[],
  state: GameState
): CredibilityResult {
  return {
    credibility: number,        // [0, 100]
    penalties: PenaltyDetail[], // list of applied penalties
    perFaction: Record<string, number> // influence per faction
  };
}
```

**Behavior:**
- [ ] For each claim, evaluate accuracy (AC1) and detect insults (AC2)
- [ ] Apply penalties:
  - [ ] **Major Error (inaccuracy):** −20% per incorrect claim
  - [ ] **Insult (per faction):** −5% to −10% per faction insulted (hardcoded per faction)
  - [ ] **Aggregate:** Sum penalties, clamp final credibility to [0, 100]
- [ ] Example: 1 accurate claim (0%), 1 inaccurate claim (−20%), 1 insult to militarists (−5%) = `100 − 20 − 5 = 75%`
- [ ] Example: 3 inaccurate claims (−60%) = clamp to 0% (not negative)
- [ ] **Unobserved Claims:** Apply same formula (but UI surfaces risk; no special bonus/penalty)
- [ ] Aggregate credibility is **average** of all claims' credibility scores (if >1 claim)
  - [ ] e.g., 2 claims: one 100%, one 80% → `(100 + 80) / 2 = 90%`
- [ ] Return `penalties` list with details (which claim, what error, −X%)
- [ ] Populate `perFaction` record with `credibility × faction.multiplier`

**Penalty Example Table:**

| Claims | Accuracy | Insult | Calculation | Final Credibility |
|--------|----------|--------|-------------|-------------------|
| 1 accurate | ✓ | None | 100 − 0 − 0 | **100%** |
| 1 inaccurate | ✗ | None | 100 − 20 − 0 | **80%** |
| 1 accurate + 1 insult (militarists) | ✓ | Yes | (100 − 0) + (100 − 5) / 2 = 97.5 | **97.5%** |
| 1 inaccurate + 1 inaccurate | ✗✗ | None | (100 − 20) + (100 − 20) / 2 = 80 | **80%** |
| 2 inaccurate + 1 insult | ✗✗ | Yes | (100 − 20 − 5) + (100 − 20) / 2 = 77.5 | **77.5%** |
| 3 inaccurate | ✗✗✗ | None | (80 + 80 + 80) / 3 = 80 | **80%** |

**Test Coverage (AC3):**
- [ ] **Single error:** 1 inaccurate claim → −20% penalty applied
- [ ] **Multiple errors:** 2 inaccurate → −40% total (two −20% penalties averaged)
- [ ] **Insult stacking:** 1 inaccurate + 1 insult → −20% − 5% = −25% (not compounded)
- [ ] **Clamping:** 3 inaccurate claims would be −60%, clamp to [0, 100]
- [ ] **Average aggregation:** 2 claims (100% + 80%) → 90% average
- [ ] **Unobserved claims:** Same formula applied (no special case)
- [ ] **Empty claims list:** Return { credibility: 100, penalties: [], perFaction: {...} }
- [ ] **Parametrized test:** 25–30 scenarios covering all above

**Acceptance:** All 25–30 test cases pass; penalties calculated correctly; clamping enforced; averages match expected

---

### AC4: Influence Calculation Function

**Function Signature:**
```typescript
function calculateInfluence(
  credibility: number,
  factions: Faction[]
): InfluenceState {
  return {
    perFaction: Record<string, number>,  // credibility × multiplier per faction
    lastCalculatedTurn: number
  };
}
```

**Behavior:**
- [ ] For each faction, calculate `influence = credibility × faction.multiplier`
- [ ] Multipliers are hardcoded per faction (e.g., militarists: 1.2, scholars: 1.0, merchants: 0.8)
- [ ] Store result in `perFaction[factionId]`
- [ ] Set `lastCalculatedTurn` to current turn
- [ ] Function is pure and deterministic

**Hardcoded Multipliers (from S0):**
```typescript
const FACTION_MULTIPLIERS: Record<string, number> = {
  militarists: 1.2,
  scholars: 1.0,
  merchants: 0.8,
  // ... more factions
};
```

**Example:**
- Credibility: 75%
- Militarists (×1.2): 75 × 1.2 = 90
- Scholars (×1.0): 75 × 1.0 = 75
- Merchants (×0.8): 75 × 0.8 = 60

**Test Coverage (AC4):**
- [ ] **Per-faction calculation:** Each faction receives `credibility × multiplier`
- [ ] **High credibility:** 100% × 1.2 = 120
- [ ] **Low credibility:** 0% × 0.8 = 0
- [ ] **Average credibility:** 50% × 1.0 = 50
- [ ] **Parametrized test:** 10–15 scenarios (credibility [0, 25, 50, 75, 100] × 3 factions)

**Acceptance:** All 10–15 test cases pass; influence values match expected

---

### AC5: Purity & Immutability Validation (Constraint 1–2)

**Function Signature (all exported functions must satisfy this):**
```typescript
// Before
const claimsBefore = JSON.stringify(claims);
const eventsBefore = JSON.stringify(events);

// Call
const result = calculateCredibility(claims, events, state);

// After
const claimsAfter = JSON.stringify(claims);
const eventsAfter = JSON.stringify(events);

expect(claimsBefore).toBe(claimsAfter);
expect(eventsBefore).toBe(eventsAfter);
```

**Behavior:**
- [ ] All exported functions are pure: no mutations of input parameters
- [ ] All state updates return new objects (no `Object.assign`, no spread operator mutations)
- [ ] Test: Deep copy inputs, call function, verify originals unchanged
- [ ] Test: Call function 100 times with identical inputs, verify identical outputs (no internal state drift)
- [ ] Test: Serialize inputs/outputs to JSON, verify no Date objects or undefined values

**Test Coverage (AC5):**
- [ ] **Input mutation check:** Clone inputs, call function, deep-equal comparison
- [ ] **Determinism check:** Call 100× with same inputs, hash outputs, all identical
- [ ] **JSON serialization:** `JSON.stringify(result)` succeeds without custom serializer
- [ ] **No Date objects:** All temporal data as numbers (timestamps, turn indices)
- [ ] **No undefined values:** All object fields are defined or explicitly null
- [ ] **Test suite:** 2h dedicated to immutability validation (often forgotten, caught late in integration)

**Acceptance:** All purity tests pass; 100% determinism confirmed; JSON round-trip succeeds

---

### AC6: Integration Test – Claim → Credibility → Influence → GameState

**End-to-End Flow:**
```
1. Dispatch writeClaim action: { type: 'writeClaim', claims: Claim[] }
2. Reducer calls calculateCredibility(claims, events, state)
3. Reducer updates GameState.influence with result
4. GameState persists correctly via JSON serialization
5. Replay with same seed + same claims → identical state hash (Constraint 9)
```

**Test Coverage (AC6):**
- [ ] **Claim submission:** Dispatch action with 2–3 claims
- [ ] **Credibility calculation:** Verify reducer calls calculateCredibility with correct params
- [ ] **Influence update:** Verify GameState.influence updated with result
- [ ] **State serialization:** `JSON.stringify(state)` succeeds
- [ ] **Determinism replay:** Generate identical game state with same seed + same action sequence
- [ ] **State hash:** Compute state hash before/after, verify determinism (Constraint 9)
- [ ] **Test case:** 2h setup + integration test

**Acceptance:** End-to-end flow works; state hashes match; determinism verified

---

## Design Decisions (Assumed Locked Now)

| Decision | Assumption | Impact |
|----------|-----------|--------|
| **Insult keywords** | Hardcoded per faction (INSULTING_PHRASES constant) | Clean, testable; no config overhead |
| **Error binary** | Accurate OR inaccurate; no partial credit | Simpler logic; 40% easier tests |
| **Multipliers fixed** | Hardcoded per faction (FACTION_MULTIPLIERS constant) | Testable; post-MVP config deferred |
| **Aggregation** | Average credibility across claims | Fair (no single claim dominates); matches narrative intent |
| **Event fixtures** | 15 seeded templates in S0/S1 (pre-built) | Saves 8–10h in S4 (no on-the-fly mocking) |

---

## Test Infrastructure (Pre-Build in S0/S1)

These fixtures MUST be in place before S4 code starts, or testing will be blocked.

### `/src/game/__tests__/fixtures/events.ts` (Pre-Built in S0)

```typescript
export const eventFixtures = {
  rebellion: {
    id: createEventId(1, 'rebellion_hash') as EventId,
    type: 'rebellion',
    description: 'A militia leader declares independence in the North',
    observedByPlayer: true,
    truthValue: { actualOutcome: 'rebellion_declared', severity: 'high' },
  },
  plague: {
    id: createEventId(1, 'plague_hash') as EventId,
    type: 'plague',
    description: 'A mysterious illness spreads through the capital',
    observedByPlayer: false,
    truthValue: { actualOutcome: 'plague_spreading', severity: 'severe' },
  },
  trade_disruption: { /* ... */ },
  // ... 12+ more templates (15 total)
};
```

### `/src/game/__tests__/fixtures/claims.ts` (Helper in S0)

```typescript
export function createClaim(
  eventId: EventId,
  claimText: string,
  isAboutObservedEvent: boolean,
  turnNumber: number
): Claim {
  return { claimText, eventId, isAboutObservedEvent, turnNumber };
}
```

### `/src/game/__tests__/utils/testHelpers.ts` (Parametrized utilities in S0)

```typescript
export const accuracyTestCases = [
  { claimText: 'A militia declares independence', eventType: 'rebellion', expected: true },
  { claimText: 'The capital faces a plague', eventType: 'plague', expected: true },
  // ... 30–40 cases
];

export const penaltyTestCases = [
  { claims: [accurate], expected: 100 },
  { claims: [inaccurate], expected: 80 },
  // ... 25–30 cases
];
```

**Cost:** 3–4h in S0 to build fixtures. Saves 8–10h in S4 (no on-the-fly mocking).

---

## Known Risks

| Risk | Mitigation | Fallback |
|------|-----------|----------|
| **Event fixtures mocked on-the-fly** | Pre-build in S0 (3–4h investment) | If not done, S4 adds 8–10h (fixture setup during test) |
| **Fuzzy insult detection temptation** | Lock hardcoded decision NOW | If fuzzy attempted, adds 3–4h + false positive hunting |
| **Partial credit taxonomy** | Lock binary decision NOW | If attempted, adds 4–5h rework + test regeneration |
| **Immutability bugs late** | Write immutability tests FIRST (before core logic) | Debug mutations after integration (1–2h lost) |
| **Determinism failures >5%** | Validate seeded RNG in S0–S2 | Rework RNG to deterministic tables (2 weeks) |
| **JSON serialization failures** | Test JSON round-trip in S0 types | Refactor all types post-MVP (not on track) |

---

## Definition of Done

- [ ] All functions compile (TypeScript strict mode)
- [ ] All 6 ACs pass (accuracy, insults, penalties, influence, purity, integration)
- [ ] 120–130 parametrized test cases written and passing
- [ ] 99%+ code coverage (game logic only, not UI)
- [ ] No console errors or warnings (ESLint clean)
- [ ] Immutability tests confirm no input mutations
- [ ] Determinism tests confirm 100× identical outputs
- [ ] Event fixtures (15 templates) from S0 used in tests
- [ ] Integration test: S3 claims → S4 credibility → GameState.influence
- [ ] Constraint 1 (purity): All functions pure, no I/O, no async
- [ ] Constraint 2 (immutability): No input mutations, all outputs new objects
- [ ] Constraint 5 (JSON serializable): CredibilityResult + InfluenceState round-trip through JSON
- [ ] Constraint 9 (determinism): Same seed + same claims = identical state hash

---

## Post-MVP Enhancements

- [ ] Fuzzy insult matching (NLP-based, deferred to post-MVP)
- [ ] Partial credit accuracy (graduated credibility based on partial keyword match)
- [ ] Dynamic faction multipliers (config file, not hardcoded)
- [ ] Per-claim credibility display (show breakdown of which claims hurt/helped)
- [ ] Claim templates (suggestions for accurate/high-influence claims)
- [ ] Reputation recovery over time (credibility resets after N turns of accurate claims)
- [ ] Faction-specific accuracy weights (merchants care more about trade claims, etc.)

---

## Summary: Why 22 Hours, Not 10?

| Source | Hours | Reason |
|--------|-------|--------|
| Core logic (accuracy, penalties, influence) | 6h | Straightforward; no async/I/O |
| Parametrized accuracy tests (30–40 cases) | 4h | Setup fixtures, write assertions, debug edge cases |
| Parametrized penalty tests (25–30 cases) | 3h | Discover edge cases (stacking, clamping, averages), debug |
| Parametrized insult tests (20–25 per faction) | 3h | Per-faction logic, false positive hunting |
| Parametrized influence tests (10–15 cases) | 2h | Multiplier validation per faction |
| **Immutability + purity tests** | **2h** | Often forgotten, caught late; deep copy checks + 100× determinism |
| **Integration test (S3 → S4 → GameState)** | **2h** | End-to-end, seeded RNG replay, state hash validation |
| **TOTAL** | **22h** | **No corners cut; test friction is real** |

**If Design Decisions Deferred:**
- Insult fuzzy matching: +3–4h
- Partial credit error taxonomy: +4–5h
- Dynamic faction multipliers: +2–3h
- Per-claim credibility display: +1–2h
- **Total rework if all deferred: +10–14h** (35–36h total)

**Recommendation:** Lock all design decisions NOW before S4 code starts. Invest 3–4h in S0 to pre-build event fixtures. Use parametrized tests to compress 120+ test cases efficiently.

