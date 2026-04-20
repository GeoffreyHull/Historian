# Epic 3 – Quick Reference Card

**Status:** Solutions Locked | Ready for Implementation  
**Date:** 2026-04-20 (Amelia – Developer Agent)

---

## At a Glance

| Metric | Value |
|--------|-------|
| **Epic 3 Total Hours** | 28h (was 18h) |
| **S3: Claims UI** | 6h – Straightforward |
| **S4: Credibility** | 22h – 16h test friction |
| **Test-Covered ACs** | 12 (6 per story) |
| **Parametrized Test Cases** | 120–130 (99%+ coverage) |
| **Design Decisions to Lock** | 6 (all critical) |
| **Pre-Build Investment (S0)** | 6–7h (saves 8–10h in S4) |

---

## File Locations

All files in: `/c/Users/hullg/Documents/Github/Historian/_bmad-output/planning-artifacts/`

| File | Purpose | Size |
|------|---------|------|
| **epic-3-solutions-summary.md** | Executive summary (hours, decisions, checklist) | 14KB |
| **story-s3-claims-observation-ui.md** | S3 spec (6h, 6 ACs, manual testing) | 8KB |
| **story-s4-credibility-system.md** | S4 spec (22h, 6 ACs, 120+ test cases) | 21KB |
| **INDEX.md** | Master index (links, timeline, constraints) | 11KB |
| **ROUNDTABLE-SYNTHESIS.md** | Roundtable synthesis (problems → solutions) | 12KB |
| **QUICK-REFERENCE.md** | This card | – |

---

## S3 Summary (6 hours)

**Deliverables:**
- `/src/components/BookWriter.tsx`
- `/src/components/BookWriter.module.css`

**Hour Breakdown:**
- Component skeleton + state: 1h
- Event display + observation indicators: 1.5h
- Submit handler + validation: 1h
- CSS + layout: 1h
- Manual testing: 1.5h

**Key ACs:**
- AC1: Event list with eye (observed) vs ? (unobserved) indicators
- AC2: Form validates 1–3 claims, ≤500 chars, no empty
- AC3: Auto-capture `isAboutObservedEvent` from event state
- AC4: Submit dispatches `{ type: 'writeClaim', claims: Claim[] }`
- AC5: WCAG AA accessibility (contrast, 200% zoom, no seizures)
- AC6: No hard-coded data; graceful fallback

**Test:** Manual only (presentational component)

---

## S4 Summary (22 hours)

**Deliverables:**
- `/src/game/credibilitySystem.ts`
- `/src/game/__tests__/credibilitySystem.test.ts` (8–10h of test code)
- Test fixtures & utilities (from S0)

**Hour Breakdown:**
- Core logic: 6h (accuracy, insults, penalties, influence)
- Tests: 16h (parametrized, immutability, determinism)

**Key ACs (Test Coverage):**
- AC1: Accuracy Evaluation (30–40 parametrized cases)
- AC2: Insult Detection (20–25 per faction)
- AC3: Penalty Calculation (25–30 scenarios)
- AC4: Influence Calculation (10–15 scenarios)
- AC5: Immutability & Purity (deep copy + 100× determinism)
- AC6: Integration Test (end-to-end, state hash, Constraint 9)

**Test:** 120–130 parametrized test cases (99%+ coverage)

---

## Design Decisions (Lock NOW or +10–14h)

| Decision | Choice | Cost if Deferred |
|----------|--------|------------------|
| **Insult Detection** | Hardcoded keywords | +3–4h |
| **Error Taxonomy** | Binary (yes/no) | +4–5h |
| **Faction Multiplier** | Fixed per faction | +2–3h |
| **Claims Aggregation** | Average credibility | +1h |
| **Unobserved Evaluation** | Same formula | +0h |
| **Event Fixtures** | Pre-built (S0) | +8–10h |

---

## S0 Pre-Build Checklist (6–7h, saves 8–10h in S4)

**Must Complete in S0:**

- [ ] 15 seeded event templates → `/src/game/__tests__/fixtures/events.ts`
- [ ] Claim test helpers → `/src/game/__tests__/fixtures/claims.ts`
- [ ] Parametrized test data → `/src/game/__tests__/utils/testHelpers.ts`
- [ ] `EVENT_TYPE_KEYWORDS` constant (event → keyword map)
- [ ] `INSULTING_PHRASES` constant (per-faction keywords)
- [ ] `FACTION_MULTIPLIERS` constant (per-faction multiplier)

**ROI:** 6–7h investment → saves 8–10h in S4 (net +1–3h overall)

---

## Test Strategy

### Parametrized Approach
Instead of 120+ individual tests, compress into ~10 parametrized test functions:

```typescript
test.each(accuracyTestCases)(
  'accuracy: $claimType vs $truthType',
  ({ claimText, eventType, expected }) => {
    const result = evaluateClaimAccuracy(claim, event);
    expect(result.correct).toBe(expected);
  }
);
```

### Immutability First
Write purity tests BEFORE core logic:
- Deep copy inputs, call function, verify no mutations
- Call 100× with identical inputs, verify identical outputs

### Determinism Validation
Integration test proves: **Same seed + same claims = identical state hash**

---

## Timeline

### Optimistic (All Decisions Locked NOW)
```
S0: Types + fixtures + constants      8h  ← Pre-req
S1: GameManager + game init           4h  ← Pre-req
S2: Event generation + observation    6h  ← Pre-req
─────────────────────────────────────────
S3: Claims UI                         6h  ← Unblock S4
S4: Credibility System               22h  ← Depends on S3 + S0
─────────────────────────────────────────
Epic 3 Total                         28h  ✓ ON-TRACK
```

### Worst Case (Design Deferred)
- S4: 32–36h (adds 10–14h from rework)
- Epic 3: 38–42h (OFF-TRACK; pivot required)

---

## Constraints Validated

| Constraint | S3 | S4 | How |
|-----------|----|----|-----|
| **1: Purity** | N/A | ✓ | All functions pure, no mutations |
| **2: Immutability** | N/A | ✓ | All state updates new objects |
| **5: JSON Serializable** | N/A | ✓ | CredibilityResult round-trips JSON |
| **9: Determinism** | N/A | ✓ | Same seed = identical state hash |

---

## Key Takeaways

1. **Test friction is real** (16h = 2/3 of S4) – validates core mechanic
2. **Fixtures unblock testing** (3–4h → saves 8–10h) – strong ROI
3. **Lock decisions NOW or pay later** (each costs 1–5h; risk +10–14h)
4. **Parametrized tests compress complexity** (120+ → ~10 functions)
5. **Immutability catches bugs early** (day 1, not integration day)
6. **Determinism validates intent** (same seed = identical outcome)

---

## Sign-Off (Before S3 Code Starts)

- [ ] All 6 design decisions locked
- [ ] S0 fixtures, constants, test utilities complete
- [ ] All S0–S2 types finalized (no Date objects, JSON serializable)
- [ ] S2 output validated deterministic
- [ ] Constraints 1–2, 5, 9 reviewed
- [ ] Team alignment on 28h estimate
- [ ] PR review scheduled

---

## Go/No-Go

**✓ READY TO PROCEED**

- Estimates locked
- Story ACs finalized
- Decision gates identified
- Pre-build checklist clear
- Test strategy documented
- Timeline realistic (if decisions locked NOW)

**Next:** Decision gate review after S0 complete.
