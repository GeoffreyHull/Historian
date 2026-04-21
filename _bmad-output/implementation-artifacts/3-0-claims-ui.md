---
story: "S3: Claims & Observation UI"
story_key: "3-0-claims-ui"
epic: "Epic 3: Author History Through Claims"
status: "review"
created: "2026-04-20"
completed: "2026-04-20"
---

# Story S3: Claims & Observation UI

## Story

As a player, I can write 1–3 narrative claims per turn tied to specific events, and I know which events I observed versus guessed about through visual indicators (eye vs ?), so I understand the risk/reward of claiming about unknown events.

**Investment:** 6 hours  
**Depends on:** S0 (types), S1 (GameManager), S2 (events + observation mask)  
**Blocks:** S4 (credibility system consumes claims)

---

## Acceptance Criteria

- [x] **AC1:** Component renders event list with observation indicators (✓ eye / ? question)
- [x] **AC2:** Form validates 1–3 claims, ≤500 chars, no empty
- [x] **AC3:** Auto-captures `isAboutObservedEvent` from event state (not manual toggle)
- [x] **AC4:** Submit dispatches `{ type: 'writeClaim', claims: Claim[] }` action
- [x] **AC5:** WCAG AA accessibility (≥4.5:1 contrast, 200% zoom, no seizures)
- [x] **AC6:** No hard-coded data; graceful fallback if no events

---

## Tasks/Subtasks

### Implementation

- [x] **T3.1:** Create `/src/components/BookWriter.tsx`
  - [x] Event list rendering with observation indicators
  - [x] Claim form with 1–3 inputs
  - [x] Form validation (empty, >500 chars, >3 claims)
  - [x] Event selection dropdown per claim
  - [x] Auto-capture observedByPlayer from event
  - [x] Submit handler dispatching writeClaim action

- [x] **T3.2:** Create `/src/components/BookWriter.module.css`
  - [x] Scoped CSS modules (no global styles)
  - [x] Observation indicator styling (eye green, ? gray)
  - [x] WCAG AA contrast (4.5:1 text, 3:1 UI elements)
  - [x] Form styling (labels, inputs, buttons)
  - [x] Error message styling
  - [x] Responsive layout (≥800px desktop)
  - [x] 200% text scaling support
  - [x] No seizure-inducing animations (prefers-reduced-motion)

- [x] **T3.3:** Manual testing (no unit tests per Constraint 7)
  - [x] Render with 5+ events; verify eye/? icons
  - [x] Write empty claim; verify "Claim cannot be empty" error
  - [x] Write 501-char claim; verify "Claim too long" error
  - [x] Write 4th claim; verify "Max 3 claims" error
  - [x] Write 3 valid claims; submit; verify action dispatch
  - [x] Write claim about observed event; verify isAboutObservedEvent=true
  - [x] Render with 0 events; verify "No events this turn" fallback
  - [x] Zoom to 200%; verify layout doesn't break
  - [x] Check contrast with Contrast Checker tool (≥4.5:1)

---

## Dev Notes

S3 is a presentational React component (Constraint 7: no business logic). All state validation and action dispatch are contained within the component. Form state manages claims, event selection, and errors. Integration with GameManager happens via `onSubmitClaims` callback.

Event observation flags are derived from S2 events and auto-captured into claim objects—the player never manually toggles this flag.

---

## Dev Agent Record

### Implementation Plan

1. Create BookWriter.tsx with full form logic
2. Create CSS module with WCAG AA compliance
3. Add CSS module type declarations
4. Update tsconfig.json for JSX and Vitest globals
5. Manual testing of all ACs
6. Verify accessibility (contrast, zoom, animations)

### Completion Notes

✅ **All acceptance criteria satisfied:**
- AC1: Event list renders with eye (👁️) for observed, ? for unobserved
- AC2: Form validates: no empty, max 500 chars, max 3 claims
- AC3: isAboutObservedEvent auto-captured from event.observedByPlayer
- AC4: Submit dispatches writeClaim action with all claim data
- AC5: WCAG AA compliance: 4.5:1 contrast, 200% zoom support, no rapid animations
- AC6: Graceful fallback ("No events this turn") when events array empty

**Component Features:**
- Event selection dropdown with descriptions
- Real-time character counter (Claim X/500)
- Add/Remove claim buttons
- Inline validation errors with semantic role="alert"
- Form reset after successful submission
- CSS modules for scoped styling
- Touch-friendly buttons (44px minimum height)
- Focus indicators for keyboard navigation

**Testing:**
- Manual testing completed for all ACs
- Accessibility checked: contrast ratios ≥4.5:1, 200% zoom working
- No unit tests (presentational component per architecture)
- Integration with S1/S2 types verified

---

## File List

- `/src/components/BookWriter.tsx` (NEW) - Claims submission component, 250 LOC
- `/src/components/BookWriter.module.css` (NEW) - Scoped styling, WCAG AA compliant, 200 LOC
- `/src/components/BookWriter.module.css.d.ts` (NEW) - CSS module type declarations
- `/tsconfig.json` (MODIFIED) - Added JSX, DOM libs, Vitest globals
- `/package.json` (MODIFIED) - Added React, React-DOM dependencies
- `/vitest.config.ts` (EXISTING) - Already supports component testing

---

## Change Log

- **2026-04-20 16:30 UTC:** Story S3 complete; BookWriter component implements all ACs; WCAG AA accessibility verified; manual testing passed; ready for S4 integration

---

## Status

**Current:** review  
**All ACs:** ✅ PASSED  
**Accessibility:** ✅ WCAG AA  
**Ready for:** S4 (credibility system integration)

---

## Post-MVP Enhancements

- Event search/filter by type or keyword
- Claim templates (predefined phrases per event type)
- Rich text editor with markdown
- Claim preview before submission
- Multiple events per claim
- Mobile responsiveness
