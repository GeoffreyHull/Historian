---
epic: "Epic 3: Author History Through Claims"
estimatedHours: 28
revised: "2026-04-19"
phase: "MVP Core – Solutions Roundtable"
---

# Epic 3: Solutions Summary

**From:** BMAD Roundtable Problems & Solutions Synthesis  
**Status:** Revised estimates locked; decision gates identified; test strategy documented

---

## Executive Summary

### Original vs. Revised Estimate

| Metric | Original | Revised | Delta | Reason |
|--------|----------|---------|-------|--------|
| **S3 Hours** | 6h | 6h | 0h | Straightforward UI, no surprises |
| **S4 Hours** | 10h | 22h | +12h | 16h test friction (accuracy, penalties, insults, immutability, determinism) |
| **Epic 3 Total** | 16h | 28h | **+12h (+75%)** | Realistic test cost; 18h estimate was undersized |

### Why Test Friction Is Real

1. **Accuracy Detection Tests (4h):** 30–40 parametrized cases (exact match, keyword match, partial, no match, determinism)
2. **Penalty Calculation Tests (3h):** 25–30 scenarios (single error, multiple, insult stacking, clamping, averages)
3. **Insult Detection Tests (3h):** 20–25 cases per faction (contains, no insult, false positive checking)
4. **Influence Calculation Tests (2h):** 10–15 scenarios (credibility × multiplier per faction)
5. **Immutability & Purity Tests (2h):** Deep copy + 100× determinism validation (Constraint 1–2, often forgotten)
6. **Integration Tests (2h):** End-to-end Claim → Credibility → Influence, seeded RNG replay, state hash (Constraint 9)

**Total: 16 hours of pure testing** (not including 6h of core logic)

---

## Story Breakdown

### Story S3: Claims & Observation UI (6 hours)

**Deliverables:**
```
/src/components/BookWriter.tsx
/src/components/BookWriter.module.css
```

**Hour Allocation:**
- Component skeleton + form state: 1h
- Event display + observation indicators (eye vs ?): 1.5h
- Submit handler + validation: 1h
- CSS modules + layout: 1h
- Manual testing + edge cases: 1.5h

**Assumptions Locked:**
- Event type shape (Event, EventId, truthValue)
- Claim type shape (claimText, eventId, isAboutObservedEvent, turnNumber)
- Events available as props from GameManager
- Observation mask from S2 (deterministic seeded)
- No Date objects in Event or Claim types

**Key ACs:**
- [ ] Component renders event list with eye (observed) vs ? (unobserved) indicators
- [ ] Form validates: 1–3 claims, ≤500 chars, no empty claims
- [ ] Form automatically captures `isAboutObservedEvent` from event state (not manual toggle)
- [ ] Submit dispatches action: `{ type: 'writeClaim', claims: Claim[] }`
- [ ] No hard-coded sample data; graceful fallback if no events

**Dependencies:** S0 (types), S1 (GameManager), S2 (events + observation mask)

**Test Strategy:** Manual only (presentational component per architecture.md); integration test via S4

---

### Story S4: Credibility System (22 hours)

**Deliverables:**
```
/src/game/credibilitySystem.ts
/src/game/__tests__/credibilitySystem.test.ts       (8–10h of test code)
/src/game/__tests__/fixtures/events.ts              (from S0)
/src/game/__tests__/fixtures/claims.ts              (from S0)
/src/game/__tests__/utils/testHelpers.ts            (from S0)
```

**Hour Allocation:**

**Core Logic (6h):**
- Accuracy Evaluation: 2h (compare claim keyword to event truthValue; hardcoded, no fuzzy)
- Insult Detection: 2h (per-faction hardcoded keyword lists; hardcoded regex, not NLP)
- Penalty Calculation: 1h (−20% major error, −5–10% insult per faction, clamp [0, 100])
- Influence Calculation: 1h (influence = credibility × faction.multiplier)

**Tests (16h):**
- Accuracy Detection (4h): 30–40 parametrized cases
- Penalty Calculation (3h): 25–30 parametrized scenarios
- Insult Detection (3h): 20–25 cases per faction
- Influence Calculation (2h): 10–15 parametrized scenarios
- Immutability & Purity (2h): Deep copy + 100× repeat tests (Constraint 1–2)
- Integration: Claim → Credibility → Influence (2h): End-to-end flow + determinism replay

**Assumptions Locked (CRITICAL):**
- [ ] **Insult Detection:** Hardcoded per-faction keyword lists (not fuzzy, not NLP)
  - Cost if deferred: +3–4h
- [ ] **Error Taxonomy:** Binary (accurate OR inaccurate; no partial credit MVP1)
  - Cost if deferred: +4–5h
- [ ] **Faction Multiplier:** Fixed per faction (e.g., militarists 1.2, scholars 1.0, merchants 0.8)
  - Cost if deferred: +2–3h
- [ ] **Claims Aggregation:** Average credibility across 1–3 claims per turn
  - Cost if deferred: +1h
- [ ] **Unobserved Event Evaluation:** Same formula as observed (UI surfaces risk)
  - Cost if deferred: +0h (assumption only, no logic impact)
- [ ] **Event Fixtures:** 15 seeded templates pre-built in S0/S1
  - Cost if deferred: +8–10h (S4 would build fixtures on-the-fly during test setup)

**Key ACs:**
- [ ] AC1: Accuracy Evaluation – 30–40 parametrized test cases (exact match, keyword match, partial, no match, determinism)
- [ ] AC2: Insult Detection – 20–25 cases per faction (contains insult, no insult, false positives)
- [ ] AC3: Penalty Calculation – 25–30 scenarios (single error → −20%, double → −40%, insult stacking, clamping [0, 100], averaging)
- [ ] AC4: Influence Calculation – 10–15 scenarios (credibility × multiplier per faction)
- [ ] AC5: Purity & Immutability – Deep copy inputs, call function, verify no mutations; 100× call determinism
- [ ] AC6: Integration – Claim → Credibility → Influence → GameState; same seed + same claims = identical state hash (Constraint 9)

**Dependencies:** S0 (types, event fixtures), S1 (GameManager), S2 (seeded RNG), S3 (claims actions)

**Test Strategy:** 
- Parametrized tests for accuracy, penalties, insults, influence
- Immutability tests FIRST (before core logic)
- Integration test for determinism validation (Constraint 9)
- Use pre-built event fixtures from S0 (3–4h investment saves 8–10h here)

---

## Decision Gates (Must Be Locked NOW)

### Before S3–S4 Code Starts (After S0 Done)

| Decision | Option A | Option B | Impact | Decision? |
|----------|----------|----------|--------|-----------|
| **Insult Detection** | Hardcoded keyword lists | Fuzzy / NLP | +0h vs +3–4h | **Hardcoded (Lock NOW)** |
| **Error Taxonomy** | Binary (yes/no) | Partial credit (0–100%) | +0h vs +4–5h | **Binary (Lock NOW)** |
| **Faction Multiplier** | Fixed per faction | Dynamic / config file | +0h vs +2–3h | **Fixed hardcoded (Lock NOW)** |
| **Claims Aggregation** | Average credibility | Per-claim display | +0h vs +1h | **Average (Lock NOW)** |
| **Unobserved Evaluation** | Same formula | Different bonus | +0h vs +0h | **Same formula (Lock NOW)** |
| **Event Fixtures** | Pre-built in S0 (15 templates) | Mocked on-the-fly | +0h vs +8–10h | **Pre-built (CRITICAL)** |

**Total Cost of Deferring All Decisions:** +10–14 hours (35–36h total for S3–S4)

---

## Pre-Build Checklist (S0/S1 Must Complete)

These are BLOCKING REQUIREMENTS for S4 to stay on 22h:

- [ ] **Event Fixtures (15 seeded templates)** in `/src/game/__tests__/fixtures/events.ts`
  - rebellion, plague, trade_disruption, harvest_failure, royal_decree, succession_crisis, ... (15 total)
  - Each with deterministic seeded EventId, type, description, observedByPlayer, truthValue
  - Cost: 3–4h in S0; saves 8–10h in S4

- [ ] **Claim Test Helpers** in `/src/game/__tests__/fixtures/claims.ts`
  - `createClaim(eventId, claimText, isAboutObservedEvent, turnNumber): Claim`
  - Cost: 30 min in S0

- [ ] **Parametrized Test Utilities** in `/src/game/__tests__/utils/testHelpers.ts`
  - `accuracyTestCases`, `penaltyTestCases`, `insultTestCases`, `influenceTestCases`
  - Cost: 30 min in S0

- [ ] **Event Type Keywords** constant in `credibilitySystem.ts` (from domain analysis)
  - `EVENT_TYPE_KEYWORDS: { rebellion: [...], plague: [...], ... }`
  - Cost: 1h in S0

- [ ] **Insult Phrase Map** constant in `credibilitySystem.ts`
  - `INSULTING_PHRASES: { militarists: [...], merchants: [...], ... }`
  - Cost: 1h in S0

- [ ] **Faction Multiplier Map** constant in `credibilitySystem.ts`
  - `FACTION_MULTIPLIERS: { militarists: 1.2, scholars: 1.0, merchants: 0.8, ... }`
  - Cost: 30 min in S0

**Total S0 Investment (Unblock S4):** 6–7 hours (already in S0 estimate, but flagged here as critical dependency)

---

## Test Infrastructure Strategy (S4 Focus)

### Parametrized Testing Approach

Instead of writing 120+ individual tests, use parametrized patterns:

```typescript
// Accuracy tests (30–40 cases in 1 test)
test.each(accuracyTestCases)(
  'should evaluate $claimType vs $truthType accuracy correctly',
  ({ claimText, eventType, expected }) => {
    const event = eventFixtures[eventType];
    const result = evaluateClaimAccuracy({ claimText, ...claim }, event);
    expect(result.correct).toBe(expected);
  }
);

// Penalty tests (25–30 scenarios in 1 test)
test.each(penaltyTestCases)(
  'should calculate credibility with $scenario',
  ({ claims, expected }) => {
    const result = calculateCredibility(claims, events, state);
    expect(result.credibility).toBe(expected);
  }
);

// Insult tests (20–25 per faction in 1 test per faction)
Object.entries(INSULTING_PHRASES).forEach(([faction, insults]) => {
  test.each(insultTestCases[faction])(
    `${faction}: should detect insult correctly`,
    ({ claimText, expected }) => {
      const result = detectInsult(claimText, faction);
      expect(result).toBe(expected);
    }
  );
});
```

**Benefit:** Compress 120+ test cases into ~10 test functions; easier to maintain, still full coverage.

---

## Friction Points & Mitigations

| Friction | Cost | Mitigation |
|----------|------|-----------|
| **Accuracy test edge cases** | 1–2h debugging | Pre-built event fixtures with edge cases (S0) |
| **Penalty stacking logic** | 1h debugging | Write penalty calculation LAST (after accuracy tests); clarify aggregation rule |
| **Insult false positives** | 1h debugging | Test neutral claims too (e.g., "foolishly brave" returns true; expected behavior) |
| **Immutability bugs** | 1–2h debugging | Write immutability tests FIRST; catch mutations early |
| **Determinism failures** | 1–3h debugging | Validate seeded RNG in S0–S2; use same seed for all S4 tests |
| **JSON serialization issues** | 1–2h debugging | Test JSON round-trip in S0; verify no Date objects in types |

---

## Realistic Timeline (Solo Dev)

### Optimistic Path (No Deferred Decisions)

| Phase | Hours | Blocker? |
|-------|-------|----------|
| S0: Type design + fixtures + constants | 8h | None; pre-req |
| S1: GameManager + game initialization | 4h | None; pre-req |
| S2: Event generation + observation mask | 6h | None; pre-req |
| **S3: Claims UI** | **6h** | Unblock S4 |
| **S4: Credibility System** | **22h** | Depends on S3 + S0 fixtures |
| **Epic 3 Total** | **28h** | Core mechanics locked |

### Deferred Decision Path

If insult fuzzy matching, partial credit, and dynamic multipliers ALL deferred:

| Phase | Hours | Notes |
|-------|-------|-------|
| S3: Claims UI | 6h | Unchanged |
| S4: Credibility System | 32–36h | +10–14h from design rework |
| **Epic 3 Total** | **38–42h** | Not on track; pivot needed |

---

## Constraints Validated

| Constraint | S3 Impact | S4 Impact | Validation |
|-----------|-----------|-----------|-----------|
| **Constraint 1: Purity** | None (UI component) | 2h immutability tests | All game functions pure; no mutations of inputs |
| **Constraint 2: Immutability** | None (UI component) | 2h purity tests | All state updates return new objects |
| **Constraint 5: JSON Serializable** | None (UI component) | AC5 test | CredibilityResult + InfluenceState round-trip through JSON |
| **Constraint 9: Turn-Phase Determinism** | None (UI component) | AC6 integration test | Same seed + same claims = identical state hash |

---

## Sign-Off Checklist (Before S3 Code Starts)

- [ ] All design decisions locked (insult, error, multiplier, aggregation)
- [ ] Event fixtures (15 templates) defined in S0
- [ ] Event type keywords (accuracySystem map) defined in S0
- [ ] Insult phrase map (per faction) defined in S0
- [ ] Faction multiplier map (per faction) defined in S0
- [ ] Parametrized test utilities written in S0
- [ ] All S0–S2 types finalized (no Date objects, fully JSON serializable)
- [ ] S2 output (events + observedByPlayer flags) tested deterministic
- [ ] PR review scheduled before S3 code
- [ ] Team alignment on 28h estimate (vs. original 18h)

---

## Post-MVP Enhancements (Deferred)

- [ ] Fuzzy insult matching (NLP-based)
- [ ] Partial credit accuracy (graduated credibility)
- [ ] Dynamic faction multipliers (config-driven)
- [ ] Per-claim credibility display (breakdown by claim)
- [ ] Claim templates (suggested accurate claims)
- [ ] Reputation recovery (credibility reset after accuracy streak)
- [ ] Faction-specific accuracy weights (merchants care more about trade)

---

## Bottom Line

**Epic 3 is realistic at 28 hours solo dev with honest testing.**

- **S3:** 6h UI (no surprises)
- **S4:** 22h logic + 16h testing (test friction is real)

**To stay on track:**
1. Lock design decisions NOW (insult, error, multiplier, aggregation)
2. Pre-build event fixtures in S0 (3–4h, saves 8–10h in S4)
3. Use parametrized tests (compress 120+ cases into ~10 test functions)
4. Immutability tests FIRST (catch mutations early)
5. Determinism validation via S0–S2 seeded RNG

**If any decision deferred:** +10–14 hours (35–42h total, off track)

**Recommendation:** Proceed with S3–S4 implementation using 22h estimate for S4. Schedule decision gate review after S0 complete to lock assumptions.

