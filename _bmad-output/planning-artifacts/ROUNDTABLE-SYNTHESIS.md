# BMAD Roundtable Synthesis – Epic 3 Solutions

**Status:** Solutions Proposal Locked & Documented  
**Date:** 2026-04-19 (Amelia Agent Summary)  
**Participants:** Roundtable Team (Problems → Solutions → Story ACs + Decision Gates)

---

## From Problems Round to Solutions

### Problems Identified (Epic 3 Review)

1. **18-hour estimate is undersized**  
   Realistic: 24–26 hours (8h friction from testing + fixtures)

2. **Test friction not budgeted**  
   - Accuracy detection tests (3–4h)
   - Parametrized test setup
   - Fixtures, immutability validation all missing

3. **Design decisions block implementation**  
   - Insult detection (hardcoded? fuzzy?)
   - Error taxonomy (binary? graduated?)
   - Multiplier values not locked

4. **Fixtures not pre-built**  
   S4 depends on event fixtures; if mocked during dev, adds 1–2h per feature

5. **Immutability validation forgotten**  
   Constraint 1 requires purity tests; 1h validation work not in 18h

---

## Solutions Round Outputs

### Revised Estimates (Locked)

| Story | Original | Revised | Delta | Reason |
|-------|----------|---------|-------|--------|
| **S3: Claims UI** | 6h | 6h | 0h | Straightforward, no surprises |
| **S4: Credibility** | 10h | 22h | +12h | 16h test friction (core game mechanic) |
| **Epic 3 Total** | **16h** | **28h** | **+12h** | Realistic test cost |

---

## Solution 1: Honest Hour Estimation (S4: 22h, not 10h)

### Core Logic Breakdown (6h)

| Component | Hours | Notes |
|-----------|-------|-------|
| Accuracy Evaluation | 2h | Compare claim keyword to event truthValue; hardcoded, no fuzzy |
| Insult Detection | 2h | Per-faction keyword lists; hardcoded regex, not NLP |
| Penalty Calculation | 1h | −20% major error, −5–10% insult per faction, clamp [0, 100] |
| Influence Calculation | 1h | `influence = credibility × faction.multiplier` |
| **Subtotal** | **6h** | Straightforward logic |

### Test Friction Breakdown (16h)

| Test Layer | Hours | Test Cases | Coverage |
|-----------|-------|-----------|----------|
| **Accuracy Detection** | 4h | 30–40 parametrized | Exact match, keyword match, partial, no match, determinism |
| **Penalty Calculation** | 3h | 25–30 parametrized | Single error, multiple, insult stacking, clamping, averages |
| **Insult Detection** | 3h | 20–25 per faction | Contains insult, no insult, false positives |
| **Influence Calculation** | 2h | 10–15 parametrized | Credibility × multiplier per faction |
| **Immutability & Purity** | 2h | Deep copy + 100× determinism | Inputs unchanged, output deterministic |
| **Integration Test** | 2h | End-to-end flow | Claim → Credibility → Influence → GameState hash |
| **Subtotal** | **16h** | **120–130 test cases** | **99%+ coverage** |

**Total S4: 6 + 16 = 22 hours**

---

## Solution 2: Lock Design Decisions NOW (Before S3 Code Starts)

| Decision | Assumption | Cost if Deferred |
|----------|-----------|------------------|
| **Insult Detection** | Hardcoded per-faction keyword lists | +3–4h if fuzzy matching / NLP |
| **Error Taxonomy** | Binary (accurate OR inaccurate; no partial credit MVP1) | +4–5h if graduated partial credit |
| **Faction Multiplier** | Fixed per faction (hardcoded constant) | +2–3h if dynamic / config-driven |
| **Claims Aggregation** | Average credibility across 1–3 claims | +1h if per-claim display / weighted |
| **Unobserved Evaluation** | Same formula as observed (UI surfaces risk) | +0h (assumption only) |
| **Event Fixtures** | 15 seeded templates pre-built in S0/S1 | +8–10h if mocked on-the-fly during S4 |

**Total Risk if All Deferred:** +10–14 hours (35–36h total, off-track)

---

## Solution 3: Pre-Build Test Infrastructure in S0 (3–4h, saves 8–10h in S4)

### Deliverables Required in S0

**In `/src/game/__tests__/fixtures/events.ts` (2–3h):**
- 15 seeded event templates (rebellion, plague, trade_disruption, ... 12+ more)
- Each with deterministic EventId, type, description, observedByPlayer, truthValue

**In `/src/game/__tests__/fixtures/claims.ts` (30 min):**
- `createClaim(eventId, claimText, isAboutObservedEvent, turnNumber): Claim`

**In `/src/game/__tests__/utils/testHelpers.ts` (30 min):**
- `accuracyTestCases`, `penaltyTestCases`, `insultTestCases`, `influenceTestCases` arrays

**In `/src/game/credibilitySystem.ts` (1h constants):**
- `EVENT_TYPE_KEYWORDS` map (event type → keyword list)
- `INSULTING_PHRASES` map (per-faction insult keywords)
- `FACTION_MULTIPLIERS` map (per-faction credibility multiplier)

**Total S0 Investment:** 6–7 hours (already budgeted in S0)  
**Unlocks in S4:** 8–10 hours of fixture setup / on-the-fly mocking

---

## Solution 4: Use Parametrized Tests (Compress 120+ Cases into ~10 Functions)

### Example Accuracy Test

```typescript
test.each(accuracyTestCases)(
  'should evaluate $claimType vs $truthType accuracy correctly',
  ({ claimText, eventType, expected }) => {
    const event = eventFixtures[eventType];
    const result = evaluateClaimAccuracy(
      { claimText, eventId: event.id, ... } as Claim,
      event
    );
    expect(result.correct).toBe(expected);
  }
);
```

**Benefits:**
- 30–40 test cases in 1 test function (not 30–40 separate tests)
- Easy to add cases (append to `accuracyTestCases` array)
- Maintains full coverage, easier to debug

---

## Solution 5: Enforce Immutability & Purity (Write Tests FIRST)

### Before Core Logic

```typescript
test('calculateCredibility should not mutate inputs', () => {
  const claimsBefore = JSON.stringify(claims);
  const eventsBefore = JSON.stringify(events);
  
  const result = calculateCredibility(claims, events, state);
  
  expect(JSON.stringify(claims)).toBe(claimsBefore);
  expect(JSON.stringify(events)).toBe(eventsBefore);
});

test('calculateCredibility is deterministic (100× identical inputs)', () => {
  const results = Array.from({ length: 100 }, () =>
    calculateCredibility(claims, events, state)
  );
  const firstHash = JSON.stringify(results[0]);
  expect(results.every(r => JSON.stringify(r) === firstHash)).toBe(true);
});
```

**Why?** Constraint 1–2 violations are caught late in integration; immutability tests catch them day 1.

---

## Story ACs (From Solutions Synthesis)

### S3: Claims & Observation UI (6 hours)

**AC1:** Component renders event list with observation indicators (eye ✓ vs ? icon)  
**AC2:** Form validates 1–3 claims, ≤500 chars, no empty claims  
**AC3:** Component automatically captures `isAboutObservedEvent` from event state  
**AC4:** Form submission dispatches action: `{ type: 'writeClaim', claims: Claim[] }`  
**AC5:** Accessibility (WCAG AA contrast, 200% zoom scaling, no seizure triggers)  
**AC6:** No hard-coded sample data; graceful fallback if no events

**Test:** Manual only (presentational component)

### S4: Credibility System (22 hours)

**AC1: Accuracy Evaluation**  
- 30–40 parametrized test cases
- Coverage: exact match, keyword match, partial, no match, determinism
- Function: `evaluateClaimAccuracy(claim, event): { correct: boolean }`

**AC2: Insult Detection**  
- 20–25 cases per faction
- Function: `detectInsult(claimText, factionName): boolean`
- Per-faction hardcoded keyword lists

**AC3: Penalty Calculation**  
- 25–30 scenarios
- Function: `calculateCredibility(claims, events, state): CredibilityResult`
- Base: 100%, −20% major error, −5–10% insult per faction
- Aggregate: average credibility across 1–3 claims, clamp [0, 100]

**AC4: Influence Calculation**  
- 10–15 parametrized scenarios
- `influence = credibility × faction.multiplier` per faction

**AC5: Purity & Immutability**  
- Deep copy inputs, call function, verify originals unchanged
- Call 100× with identical inputs, verify identical outputs

**AC6: Integration Test**  
- End-to-end: Claim → Credibility → Influence → GameState
- Same seed + same claims = identical state hash (Constraint 9)

---

## Decision Gates (Must Be Locked NOW)

### Before S3 Code Starts (After S0 Complete)

- [ ] **Insult Detection:** Hardcoded keyword lists (decision made)
- [ ] **Error Taxonomy:** Binary (accurate yes/no; decision made)
- [ ] **Faction Multipliers:** Hardcoded per faction (decision made)
- [ ] **Claims Aggregation:** Average credibility across 1–3 claims (decision made)
- [ ] **Unobserved Evaluation:** Same formula as observed (decision made)
- [ ] **Event Fixtures:** 15 seeded templates in S0/S1 (decision made)

**If Any Decision Deferred:** +10–14 hours (off-track)

---

## Realistic Timeline (Solo Dev)

### Optimistic Path (All Decisions Locked)

| Phase | Hours | Blocker? |
|-------|-------|----------|
| S0: Types, fixtures, constants | 8h | Pre-req |
| S1: GameManager + game init | 4h | Pre-req |
| S2: Event generation + observation | 6h | Pre-req |
| **S3: Claims UI** | **6h** | Unblock S4 |
| **S4: Credibility System** | **22h** | Depends on S3 + S0 |
| **Epic 3 Total** | **28h** | ✓ On-track |

### Worst Case (Design Deferred)

If insult fuzzy, partial credit, dynamic multipliers all deferred:
- **S4 becomes:** 32–36h (adds 10–14h from rework)
- **Epic 3 becomes:** 38–42h (off-track; pivot required)

---

## Sign-Off Checklist (Before S3 Code Starts)

- [ ] All 6 design decisions locked
- [ ] Event fixtures (15 templates) drafted in S0
- [ ] Event type keywords finalized in S0
- [ ] Insult phrase map finalized in S0
- [ ] Faction multiplier map finalized in S0
- [ ] Parametrized test utilities written in S0
- [ ] All S0–S2 types finalized (no Date objects, fully JSON serializable)
- [ ] S2 output validated deterministic
- [ ] Team alignment on 28h Epic 3 estimate
- [ ] Architecture review: Constraints 1–2, 5, 9 validated
- [ ] PR review scheduled

---

## Key Takeaways

1. **Test Friction Is Real:** 16 hours (2/3 of S4) validates core game mechanic; not overhead.
2. **Fixtures Unblock Testing:** 3–4h in S0 saves 8–10h in S4 (strong ROI).
3. **Lock Decisions or Pay Later:** Each deferred decision costs 1–5h; total risk +10–14h.
4. **Parametrized Tests Compress Complexity:** 120+ test cases fit into ~10 functions; easier to maintain.
5. **Immutability Catches Bugs Early:** Write purity tests first (day 1, not integration day).
6. **Determinism Validates Intent:** S4 integration test proves same seed = identical outcome (Constraint 9).

---

## Deliverables Generated

This synthesis has produced **5 story/planning documents:**

1. **epic-3-solutions-summary.md** – Executive summary (hour breakdown, decision gates, pre-build checklist)
2. **story-s3-claims-observation-ui.md** – S3 full story spec (6h, 6 ACs, manual testing)
3. **story-s4-credibility-system.md** – S4 full story spec (22h, 6 ACs, 120+ test cases, design decisions)
4. **INDEX.md** – Master index (quick links, timeline, test strategy, constraints)
5. **ROUNDTABLE-SYNTHESIS.md** – This document (problems → solutions → story ACs)

**All files in:** `/c/Users/hullg/Documents/Github/Historian/_bmad-output/planning-artifacts/`

---

## Ready to Proceed?

✅ **Estimates locked:** S3 (6h) + S4 (22h) = 28h  
✅ **Story ACs finalized:** 6 per story, all parametrized test coverage  
✅ **Decision gates identified:** 6 decisions that must be locked NOW  
✅ **Pre-build checklist:** S0 fixtures, constants, test utilities (6–7h, saves 8–10h in S4)  
✅ **Test strategy documented:** Parametrized tests, immutability first, determinism validation  

**Next Step:** Schedule decision gate review after S0 complete. Proceed with S3–S4 implementation at 22h S4 estimate.

