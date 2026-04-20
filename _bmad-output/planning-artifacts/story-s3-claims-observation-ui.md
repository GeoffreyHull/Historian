---
storyId: S3
title: "Claims & Observation UI"
epic: "Epic 3: Author History Through Claims"
estimatedHours: 6
phase: "MVP Core"
depends: ["S0", "S1", "S2"]
priority: "P0 – Blocks S4"
---

# Story S3: Claims & Observation UI

## Overview

Players write 1–3 narrative claims per turn, each tied to a specific event. The UI must visually distinguish which events the player observed (✓) versus guessed about (?), so players understand the risk/reward of claiming about unknown events.

**User Value:** "I can write claims about what I saw, and I know which events I'm guessing about."

---

## Deliverables

```
/src/components/BookWriter.tsx          – Main claims submission component
/src/components/BookWriter.module.css   – Scoped styling
```

---

## Hour Breakdown

| Phase | Hours | Notes |
|-------|-------|-------|
| Component skeleton + form state | 1h | Refs, state hooks, event loop |
| Event display + observation indicators | 1.5h | Eye icon (observed) vs ? icon (unobserved) |
| Submit handler + validation | 1h | Claim object creation, dispatch |
| CSS modules + layout | 1h | Responsive, WCAG contrast, no animations |
| Manual testing + edge cases | 1.5h | Form state, >3 claim rejection, >500 char rejection |
| **TOTAL** | **6h** | **No unit tests** (presentational) |

---

## Assumed Locked (from S0–S1)

Required before coding starts:

- [ ] **Event type** shape: `{ id: EventId, type: string, description: string, observedByPlayer: boolean, truthValue: { actualOutcome: string, severity: string } }`
- [ ] **Claim type** shape: `{ claimText: string, eventId: EventId, isAboutObservedEvent: boolean, turnNumber: number }`
- [ ] **Events available as props** from GameManager (no hardcoded sample data)
- [ ] **Observation mask from S2** deterministic, seeded, matches GameState
- [ ] **No Date objects** in Event or Claim types (JSON serializable)

---

## Dependencies

| Story | Contribution | Required For |
|-------|--------------|--------------|
| **S0** | Event, Claim, EventId types | Component props & claim objects |
| **S1** | GameManager initialized, events array | Fetch events to display |
| **S2** | Events + observedByPlayer flags | Render observation indicators |
| **S4** | Uses claims emitted by S3 | Can't test without S4 consuming |

---

## Acceptance Criteria

### AC1: Event List Rendering with Observation Indicators
- [ ] Component renders a list of events passed as props
- [ ] **Observed events** display ✓ icon (eye, or emoji 👁️) in green or styled distinctly
- [ ] **Unobserved events** display ? icon in gray or styled distinctly
- [ ] Event description visible (truncate if >100 chars, add … ellipsis)
- [ ] No buttons/text rely on color alone for distinction (WCAG 2.1 contrast)

**Test:** Manual – load S2 events, verify eye vs ? icons appear correctly

---

### AC2: Claim Input & Validation
- [ ] Form shows 1–3 input fields (each claim) or single textarea with "Add Claim" button
- [ ] Each claim captures: `{ claimText: string, eventId: EventId }`
- [ ] Form rejects:
  - [ ] Empty claims (show toast/inline error: "Claim cannot be empty")
  - [ ] Claims >500 characters (show error: "Claim too long (max 500 chars)")
  - [ ] >3 claims per turn (show error: "Max 3 claims per turn")
- [ ] Form accepts 1–2 valid claims without error

**Test:** Manual – submit empty claim, 501-char claim, 4 claims, verify rejection messages

---

### AC3: Observation Flag Auto-Capture
- [ ] When player selects an event and writes a claim, component automatically sets:
  - `isAboutObservedEvent = event.observedByPlayer` (boolean from S2)
- [ ] Player does NOT manually toggle this flag; it's derived from event state

**Test:** Manual – write claim for observed event, write claim for unobserved event, inspect claim objects in dev console

---

### AC4: Form Submission Handler
- [ ] Submit button triggers handler: `dispatch({ type: 'writeClaim', claims: Claim[] })`
- [ ] Action includes:
  - [ ] `turnNumber` (current turn from GameState)
  - [ ] Each claim with `claimText`, `eventId`, `isAboutObservedEvent`, `turnNumber`
- [ ] Dispatch doesn't happen if validation fails (AC2)
- [ ] After successful dispatch, form clears (text fields → "", selected event → null)

**Test:** Manual – write valid claims, click submit, verify action dispatched in Redux DevTools / game reducer

---

### AC5: Accessibility & Layout
- [ ] Component renders on desktop (≥800px width); no mobile breakpoints needed (MVP)
- [ ] Text scaling to 200% doesn't cause overlaps or truncation
- [ ] Form labels associate with inputs (`<label htmlFor="...">`), not just placeholders
- [ ] No flashing, no rapid animations (WCAG 2.1 seizure trigger rule)
- [ ] Contrast ratio ≥4.5:1 for body text, ≥3:1 for UI elements (WCAG AA)

**Test:** Manual – browser zoom to 200%, verify layout; use Contrast Checker on colors

---

### AC6: No Hard-Coded Sample Data
- [ ] Component receives all events from props (no import of fixtures or sample event data)
- [ ] If no events passed, render "No events this turn" message (graceful fallback)
- [ ] All event IDs are valid `EventId` types (no string fallback)

**Test:** Manual – render with empty events array, verify fallback message

---

## Design Decisions (Assumed Locked Now)

| Decision | Assumption | Cost if Deferred |
|----------|-----------|------------------|
| **Observation visual** | Eye icon (✓) vs ? icon | +1h if custom SVG needed |
| **Claim selection** | Dropdown or radio per event | +0.5h if click-to-select event + text input |
| **Error display** | Inline validation messages | +0.5h if modal validation |
| **No fuzzy event search** | Simple list, no search box | +1h if user can search events |

---

## Test Strategy

**Unit Tests:** None (presentational component, per architecture.md Constraint 7)

**Integration Testing (Manual):**
1. **Happy Path:** Write 2 valid claims about different events → submit → verify action dispatched
2. **Validation Rejection:** Write empty claim → verify error message
3. **Observation Indicator:** Write claim about observed event → inspect console → verify `isAboutObservedEvent = true`
4. **Form Clear:** Submit claims → verify form resets
5. **Edge Cases:** 501-char claim, 4th claim input, special characters in claim text

**End-to-End Testing (via S4):**
- S4 consumes claims from S3 action → calculates credibility → verify claims round-trip through game state

---

## Known Risks

| Risk | Mitigation | Fallback |
|------|-----------|----------|
| Event prop shape mismatches S0 types | Lock Event type in S0 before coding S3 | Use `Partial<Event>` for dev, add assertion tests |
| observedByPlayer not seeded correctly in S2 | Validate seeded RNG in S2 tests | Hardcode fixture for S3 testing |
| Form state bloat (managing 3 separate inputs) | Use single array state: `const [claims, setClaims] = useState<ClaimDraft[]>([])` | Refactor post-MVP if becomes issue |

---

## Definition of Done

- [ ] Component compiles (TypeScript strict mode)
- [ ] All ACs pass manual testing
- [ ] No console errors or warnings (ESLint clean)
- [ ] Event props match S0 types exactly
- [ ] Observation flag (`isAboutObservedEvent`) correctly derived from event state
- [ ] Form validation prevents invalid submissions
- [ ] Form clears after successful submission
- [ ] CSS is scoped via modules (no global styles)
- [ ] Contrast ratio WCAG AA on all text/icons
- [ ] No hard-coded event data
- [ ] Integrates with S4 without refactoring

---

## Post-MVP Enhancements

- [ ] Event search / filter (by type, description keyword)
- [ ] Claim templates (predefined claim phrases per event type)
- [ ] Rich text editor (formatting, markdown)
- [ ] Claim preview before submission
- [ ] Multiple events per claim (claim affects two events)
- [ ] Mobile responsiveness

