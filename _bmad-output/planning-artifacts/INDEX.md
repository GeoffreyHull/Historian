# Historian Project – Planning Artifacts Index

**Generated:** 2026-04-20  
**Status:** Epic 3 Solutions Roundtable – Estimates Locked & ACs Finalized  
**Total MVP Scope:** 98 hours (Stories S0–S9)  
**Epic 3 Hours:** 28 hours (revised from 18h estimate)

---

## Quick Links

### Foundation Documents
- **[prd.md](prd.md)** – Product Requirements Document (40KB)
  - User stories, functional requirements (FR1–FR47)
  - Non-functional requirements (performance, reliability, accessibility)
  - MVP scope definition and constraints
  
- **[architecture.md](architecture.md)** – System Architecture Design (40KB)
  - Technology stack (Vite, React, TypeScript, Vitest)
  - Game engine architecture (SeededRNG, action-reducer pattern)
  - Type definitions, determinism validation, error handling
  - Constraints 1–9 (purity, immutability, JSON serialization, determinism)

- **[epics.md](epics.md)** – Epic Breakdown (12KB)
  - 8 epics (S0–S9 stories)
  - FR coverage map
  - Epic descriptions and user value propositions

---

### Epic 3 Documents (Author History Through Claims)

#### Solutions Synthesis
- **[epic-3-solutions-summary.md](epic-3-solutions-summary.md)** – Executive Summary (14KB)
  - Revised estimate: 28 hours (was 18h)
  - Decision gates (insult detection, error taxonomy, faction multipliers)
  - Pre-build checklist (S0 fixtures, constants, test utilities)
  - Test friction breakdown: S4 is 22h (6h core logic + 16h testing)
  - Sign-off checklist before code starts

#### Story Specifications
- **[story-s3-claims-observation-ui.md](story-s3-claims-observation-ui.md)** – S3 Story File (8KB)
  - **Hours:** 6h (unchanged)
  - **Deliverables:** BookWriter.tsx, BookWriter.module.css
  - **6 Acceptance Criteria:** Event rendering, validation, observation flags, form submission, accessibility, no hard-coded data
  - **Manual testing strategy**
  - **Dependencies:** S0 (types), S1 (GameManager), S2 (events + observation mask)

- **[story-s4-credibility-system.md](story-s4-credibility-system.md)** – S4 Story File (21KB)
  - **Hours:** 22h (was 10h; 16h test friction)
  - **Deliverables:** credibilitySystem.ts + comprehensive test suite
  - **6 Acceptance Criteria:**
    - AC1: Accuracy Evaluation (30–40 parametrized test cases)
    - AC2: Insult Detection (20–25 cases per faction)
    - AC3: Penalty Calculation (25–30 scenarios)
    - AC4: Influence Calculation (10–15 scenarios)
    - AC5: Purity & Immutability (deep copy + 100× determinism)
    - AC6: Integration Test (Claim → Credibility → Influence → GameState)
  - **Test Infrastructure:** Event fixtures, claim helpers, parametrized utilities (pre-built in S0)
  - **Critical Design Decisions (Lock NOW):**
    - Insult: hardcoded keywords (not fuzzy) – cost if deferred: +3–4h
    - Error: binary yes/no (not partial credit) – cost if deferred: +4–5h
    - Multiplier: fixed per faction (not dynamic) – cost if deferred: +2–3h
    - Aggregation: average credibility – cost if deferred: +1h
    - Fixtures: pre-built 15 templates in S0 – cost if deferred: +8–10h

---

## Epic 3 Timeline

### Optimistic Path (All Decisions Locked Now)

| Phase | Hours | Story | Blocker? |
|-------|-------|-------|----------|
| Foundation | 8h | S0: Types, fixtures, constants | Pre-req for S3–S4 |
| Event Generation | 6h | S2: Event generation + observation mask | Pre-req for S3–S4 |
| **UI Implementation** | **6h** | **S3: Claims & Observation UI** | Unblock S4 |
| **Core Mechanic** | **22h** | **S4: Credibility System** | Depends on S3 + S0 |
| **Epic 3 Total** | **28h** | **Realistic, on-track estimate** | |

### Worst Case (Design Decisions Deferred)

If insult fuzzy matching, partial credit, and dynamic multipliers all deferred:
- **S4 becomes:** 32–36h (adds 10–14h from rework)
- **Epic 3 becomes:** 38–42h (off-track, pivot required)

---

## Key Decisions Required (Before S3 Code Starts)

| Decision | Locked? | Impact | Link |
|----------|---------|--------|------|
| **Insult Detection:** Hardcoded keywords vs. Fuzzy | 🔒 LOCKED | 0h vs. +3–4h | story-s4-credibility-system.md AC2 |
| **Error Taxonomy:** Binary vs. Partial Credit | 🔒 LOCKED | 0h vs. +4–5h | story-s4-credibility-system.md AC3 |
| **Faction Multiplier:** Fixed vs. Dynamic | 🔒 LOCKED | 0h vs. +2–3h | story-s4-credibility-system.md AC4 |
| **Claims Aggregation:** Average vs. Per-Claim Display | 🔒 LOCKED | 0h vs. +1h | story-s4-credibility-system.md AC3 |
| **Event Fixtures:** Pre-Built vs. Mocked On-The-Fly | 🔒 LOCKED | 0h vs. +8–10h | epic-3-solutions-summary.md Pre-Build Checklist |

---

## S0–S1 Pre-Build Requirements (Unblock S3–S4)

These MUST be completed in S0 before S3–S4 code starts:

### In `/src/game/__tests__/fixtures/events.ts` (3–4h)
- [ ] 15 seeded event templates (rebellion, plague, trade_disruption, ... 12+ more)
- [ ] Each with deterministic EventId, type, description, observedByPlayer, truthValue
- Example:
  ```typescript
  export const eventFixtures = {
    rebellion: {
      id: createEventId(1, 'rebellion_hash') as EventId,
      type: 'rebellion',
      description: 'A militia leader declares independence in the North',
      observedByPlayer: true,
      truthValue: { actualOutcome: 'rebellion_declared', severity: 'high' },
    },
    // ... 14 more
  };
  ```

### In `/src/game/__tests__/fixtures/claims.ts` (30 min)
- [ ] Claim test helpers: `createClaim(eventId, claimText, isAboutObservedEvent, turnNumber)`

### In `/src/game/__tests__/utils/testHelpers.ts` (30 min)
- [ ] Parametrized test data: `accuracyTestCases`, `penaltyTestCases`, `insultTestCases`, `influenceTestCases`

### In `/src/game/credibilitySystem.ts` (3h)
- [ ] `EVENT_TYPE_KEYWORDS` constant (map event type to keyword list)
  ```typescript
  const EVENT_TYPE_KEYWORDS = {
    rebellion: ['revolt', 'independence', 'militia', 'uprising'],
    plague: ['illness', 'spreading', 'disease', 'outbreak'],
    // ... more
  };
  ```
- [ ] `INSULTING_PHRASES` constant (per-faction insult keywords)
  ```typescript
  const INSULTING_PHRASES: Record<string, string[]> = {
    militarists: ['coward', 'weak', 'foolish', 'cowardly'],
    merchants: ['greedy', 'dishonest', 'lazy', 'mercenary'],
    // ... more
  };
  ```
- [ ] `FACTION_MULTIPLIERS` constant (per-faction credibility multiplier)
  ```typescript
  const FACTION_MULTIPLIERS: Record<string, number> = {
    militarists: 1.2,
    scholars: 1.0,
    merchants: 0.8,
    // ... more
  };
  ```

**Total S0 Investment:** 6–7 hours (already budgeted in S0)  
**Saves in S4:** 8–10 hours (net +1–3h overall, strong ROI)

---

## Test Strategy Summary

### S3: Claims UI (6 hours)
- **Manual testing only** (presentational component per architecture.md)
- Happy path: write claims → submit → verify action dispatched
- Edge cases: empty claim, 501-char claim, 4th claim (rejected), special characters
- Integration via S4: S3 claims → S4 credibility → GameState

### S4: Credibility System (22 hours)
- **Parametrized testing approach** (120+ test cases in ~10 test functions)
- **Accuracy Detection (4h):** 30–40 cases (exact match, keyword match, partial, no match, determinism)
- **Penalty Calculation (3h):** 25–30 scenarios (single error, double, insult stacking, clamping, averages)
- **Insult Detection (3h):** 20–25 cases per faction (contains, no insult, false positives)
- **Influence Calculation (2h):** 10–15 scenarios (credibility × multiplier per faction)
- **Immutability & Purity (2h):** Deep copy inputs, call function, verify no mutations; 100× determinism
- **Integration Test (2h):** End-to-end flow, seeded RNG replay, state hash validation (Constraint 9)

---

## Constraint Validation

| Constraint | S3 | S4 | How Validated |
|-----------|----|----|---------------|
| **Constraint 1: Purity** | N/A | ✓ AC5 | All game functions pure; no mutations of inputs |
| **Constraint 2: Immutability** | N/A | ✓ AC5 | All state updates return new objects |
| **Constraint 5: JSON Serializable** | N/A | ✓ AC5 test | CredibilityResult + InfluenceState round-trip through JSON |
| **Constraint 9: Determinism** | N/A | ✓ AC6 | Same seed + same claims = identical state hash |

---

## File Locations

```
/c/Users/hullg/Documents/Github/Historian/_bmad-output/planning-artifacts/
├── INDEX.md                             (this file)
├── prd.md                               (product requirements)
├── architecture.md                      (system design)
├── epics.md                             (epic breakdown)
├── epic-3-solutions-summary.md          (solutions synthesis)
├── story-s3-claims-observation-ui.md    (S3 story spec)
└── story-s4-credibility-system.md       (S4 story spec)
```

---

## Sign-Off Checklist (Before S3 Code Starts)

- [ ] All 6 design decisions locked (insult, error, multiplier, aggregation, unobserved, fixtures)
- [ ] Event fixtures (15 templates) drafted in S0
- [ ] Event type keywords (accuracySystem map) finalized in S0
- [ ] Insult phrase map (per faction) finalized in S0
- [ ] Faction multiplier map (per faction) finalized in S0
- [ ] Parametrized test utilities written in S0
- [ ] All S0–S2 types finalized (no Date objects, fully JSON serializable)
- [ ] S2 output (events + observedByPlayer flags) validated deterministic
- [ ] Team alignment on 28h Epic 3 estimate (vs. original 18h)
- [ ] Architecture review: Constraints 1–2, 5, 9 validated
- [ ] PR review scheduled before S3 code submission

---

## Lessons from Roundtable Synthesis

1. **Test friction is real:** 16h of testing (2/3 of S4 time) is not overhead; it's core validation.
2. **Fixtures unblock testing:** 3–4h investment in S0 to pre-build fixtures saves 8–10h in S4 (strong ROI).
3. **Parametrized tests compress complexity:** 120+ test cases fit into ~10 test functions; easier to maintain.
4. **Lock decisions NOW or pay later:** Each deferred decision costs 1–5h rework; total risk +10–14h.
5. **Immutability is forgotten:** 2h dedicated to immutability tests (often caught late in integration); build early.
6. **Determinism matters:** S4 integration test validates Constraint 9 (same seed = identical outcome); critical for player trust.

---

## Next Steps

1. **Decision Gate Review** (after S0 complete):
   - Verify all 6 design decisions locked
   - Confirm event fixtures, keywords, multipliers finalized
   - Align on 22h S4 estimate and test strategy

2. **S3 Implementation** (6h):
   - Implement BookWriter.tsx and CSS modules
   - Manual testing + edge cases
   - Integrate with S2 events and S4 credibility

3. **S4 Implementation** (22h):
   - Core logic (6h): accuracy, insults, penalties, influence
   - Tests (16h): parametrized test suite with pre-built fixtures
   - Integration test: Claim → Credibility → Influence → GameState

4. **Epic 3 Completion** (28h total):
   - PR review and merge
   - Determinism validation (Constraint 9)
   - Prepare for Epic 4 (cross-run consequences)

---

**Ready to proceed with S3–S4 implementation at 28 hours.**

