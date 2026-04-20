---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments: ['prd.md', 'architecture.md']
---

# Historian - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Historian, decomposing the requirements from the PRD and Architecture into implementable stories aligned with the 98-hour MVP scope and S0-S9 story sequence.

## Requirements Inventory

### Functional Requirements

**FR1:** Player can select number of factions to play (3, 5, or 7 options)
**FR2:** Player can start a new game with a random seed
**FR3:** Player can view faction initial trust levels before game starts
**FR4:** System generates 2-6 random events each turn based on seeded RNG
**FR5:** Player can observe a random subset (0 to all) of generated events
**FR6:** Player knows which events they observed vs. didn't observe
**FR7:** System tracks ground truth for each event
**FR8:** Player can write 1-3 narrative claims per turn about generated events
**FR9:** Player can claim about observed events
**FR10:** Player can claim about unobserved events (guesses)
**FR11:** System calculates credibility (0-100%) based on claim accuracy vs. ground truth
**FR12:** System applies credibility penalties for factual errors (−20% per major error)
**FR13:** System applies credibility penalties for insulting factions (−5% to −10%)
**FR14:** Player can see their credibility score after each turn
**FR15:** Each faction has a trust value (−200 to +100 range)
**FR16:** Faction trust changes based on credibility and claim content
**FR17:** Factions below −100 trust refuse to buy the next book (loss condition)
**FR18:** All factions refusing results in influence multiplier of 0 (auto-loss)
**FR19:** System calculates influence earned = credibility % × faction multiplier
**FR20:** Player claims influence which events appear in future runs
**FR21:** System tracks faction beliefs based on player claims
**FR22:** Faction beliefs probabilistically shape future event generation
**FR23:** Event descriptions subtly reference previous run consequences
**FR24:** World state persists across runs (faction trust, beliefs, consequences)
**FR25:** World state recovers over time (consequences fade but don't disappear immediately)
**FR26:** System logs every player claim with event ID
**FR27:** System logs which events were triggered by each claim (with confidence score)
**FR28:** Tracing logs are available for debugging and validation
**FR29:** Developer can verify causal chains between claims and events
**FR30:** Game progresses in 10-turn runs
**FR31:** Each turn includes: events occur → observation → claim writing → credibility calculation → influence earning
**FR32:** Player can save and pause between turns
**FR33:** Player can resume a paused game from the exact same state
**FR34:** Run ends after turn 10
**FR35:** At end of each run, system generates a recap showing major impacts
**FR36:** Recap describes consequences in lore language (not mechanics language)
**FR37:** Recap references previous run consequences (if applicable)
**FR38:** Player can access history book anytime (during or between runs)
**FR39:** History book accumulates recaps from all previous runs
**FR40:** History book is readable but not editable by player
**FR41:** Game can be purchased as a one-time purchase
**FR42:** Game runs on desktop browser via GitHub Pages
**FR43:** All game features are available after purchase (no locked content)
**FR44:** Game state can be serialized to JSON
**FR45:** Game state can be deserialized from JSON without data loss
**FR46:** Player can manually save progress between runs
**FR47:** Game can resume from saved state with identical determinism (same seed = same events)

### NonFunctional Requirements

**Performance:**
- NFR1: Turn calculation latency ≤ 500ms (probabilistic cascade calculations + event weighting must complete within budget)
- NFR2: State serialization/deserialization ≤ 100ms (save and load operations must not block interaction)
- NFR3: History book rendering ≤ 200ms (recap display and anytime book access feels responsive)

**Reliability:**
- NFR4: Atomic save operations (save state must be atomic; no partial writes or corruption if process crashes mid-save)
- NFR5: Deterministic resumption (resuming from any saved checkpoint must result in identical game state; seeded RNG guarantees this)
- NFR6: Offline-playability (core gameplay mechanics work without network; no required check-ins, no online validation)

**Accessibility:**
- NFR7: No seizure triggers (no flashing, strobe effects, or rapid animations)
- NFR8: Color-blind safe (faction status cannot rely solely on red/green differentiation; use icons, patterns, text labels)
- NFR9: Text scaling (UI must remain functional when scaled to 200%; no truncation, no overlaps)
- NFR10: Contrast (minimum contrast ratio AA: 4.5:1 for body text, 3:1 for UI components per WCAG 2.1)

### Additional Requirements (from Architecture)

**Architectural Constraints (Non-Negotiable MVP):**
- Constraint 1: All game logic in src/game/ is deterministic; no I/O, no async, seeded RNG only
- Constraint 2: All state updates return new objects, never mutate inputs
- Constraint 3: All randomness through SeededRNG; never Math.random()
- Constraint 4: Event types are strings in registry, not hardcoded enums (extensible events)
- Constraint 5: GameState is 100% JSON-Serializable; round-trip through JSON.stringify/parse without custom serializers (LINCHPIN)
- Constraint 6: All state mutations via action-handler pattern; logged for replay/retcon
- Constraint 9: Turn-phase determinism with explicit ordering: [Phase 1: Resolve claims] → [Phase 2: Apply state changes] → [Phase 3: Trigger consequences] → [Phase 4: Serialize]

**Deferrable Post-MVP:**
- Constraint 7: React components are presentational (derive display from props, no direct mutations)
- Constraint 8: All influence costs in centralized registry (hardcode MVP1, extract post-MVP)

**Technology Stack:**
- Vite 4+, React 18+, TypeScript 5.0+ (strict mode), Node 18+
- CSS Modules for scoped styling (zero bundle bloat, no style conflicts)
- seedrandom for deterministic seeded RNG
- Vitest for game logic tests
- localStorage for persistence (MVP)
- GitHub Pages for deployment (desktop-only, no animations)

**Error Handling:**
- Result Types pattern: `{ ok: true; data: T } | { ok: false; error: { code: string; message: string } }`
- Never throw in pure functions; return Results instead
- Errors are serializable state, not exceptions

**Performance Monitoring:**
- Custom perf logger for critical functions (eventGenerator, calculateCredibility, executeTurn)
- Logs to console in dev, localStorage for post-game analysis

**Asset Strategy:**
- MVP: ASCII/Emoji placeholders (⚔️, 📚, 🏪 for factions; text-only board representation)
- Post-MVP: Real assets require no code refactoring, just emoji→image replacement

**Testing Strategy:**
- Game logic tests only (Vitest): reducer, RNG, event generation, credibility, turn flow
- Skip component unit tests MVP (presentational components tested manually during dev)
- Determinism validation tests: same seed + same actions = identical state hashes

**Determinism & Tracing:**
- Action→consequence tracing system with minimal structure: `{tick, actionHash, stateHash}`
- Determinism validation: identical seed + action sequence = identical outcome
- Post-MVP: causality layer (DAG, field diffs, dependency graphs) defers without rearchitecting

**Player Discovery Specification (Non-Negotiable):**
- Every event triggered by a claim MUST name the claim in event text (not paraphrase)
- Measurable magnitude ≥ 40% effect threshold to be perceptible
- Consistent outcomes ±15% variance band (same claim → same event type, similar frequency)
- Never lock player into unrecoverable state (effects resolve or fade by run 3)
- Proof by absence: missing claims → events revert to baseline
- Recap MUST show all claims + measurable impact (event frequency shift with before/after values)

**Kill Triggers (When to Pivot):**
- Week 4: If Constraint 5 (JSON serialization) fails, stop and refactor (40 hours, still on track)
- Week 6: If determinism >5% non-deterministic outcomes, pivot to deterministic outcome tables (2 weeks, still on track)
- Solo dev <5 hrs/week: Recalibrate learning goals; shipping is secondary

**MVP Scope (98 Hours, Stories S0-S9):**
- 1 faction (expandable to 2-3 post-MVP)
- 5-7 core event types (12-15 post-MVP)
- 6 presentational React components
- No influence mechanics (retcon/force/intel post-MVP)
- No animations, UI polish, or accessibility audit
- No advanced faction reactions or cascading consequences

### UX Design Requirements

(None provided; user confirmed no UX specs exist)

### FR Coverage Map

| FR | Epic |
|---|---|
| FR1-FR3 | Epic 1: Initialize Game & Setup |
| FR4-FR7 | Epic 2: Experience the World |
| FR8-FR19 | Epic 3: Author History Through Claims |
| FR20-FR25 | Epic 4: Discover Cross-Run Consequences |
| FR26-FR29 | Epic 7: Debug Game Determinism (Developer) |
| FR30-FR34 | Epic 6: Complete & Persist Game Sessions |
| FR35-FR40 | Epic 5: Reflect on Your Authored History |
| FR41-FR43 | Epic 8: Deploy to Web |
| FR44-FR47 | Epic 1 (init) + Epic 6 (persist) |

## Epic List

### Epic 1: Initialize Game & Setup
Players can start a new game, select factions, and understand the initial world state.
**FRs covered:** FR1, FR2, FR3, FR44, FR45
**Stories:** S0 (state shape validation), S1 (faction selection & game init)
**User Value:** "I can start a fresh game and choose who I'm playing with"

### Epic 2: Experience the World
Players observe random world events and understand what they witnessed vs. what remained hidden.
**FRs covered:** FR4, FR5, FR6, FR7
**Stories:** S2 (event generation & observation)
**User Value:** "I can see the world's chaos and know what I missed"

### Epic 3: Author History Through Claims
Players write narrative claims about observed/unobserved events, see how accurate they are, and watch factions respond to their credibility.
**FRs covered:** FR8–FR19 (claims, credibility, faction trust, influence)
**Stories:** S3 (claims & observation UI), S4 (credibility calculation)
**User Value:** "My claims matter to factions, and I can see how much they believe me"

### Epic 4: Discover Cross-Run Consequences
Players discover that their narrative claims from run 1 actually reshaped which events occur in run 2—the core differentiator.
**FRs covered:** FR20–FR25 (world state persistence, probabilistic reshaping, recovery)
**Stories:** S5 (world state evolution)
**User Value:** "Wait… did I do that? My story from last run echoed forward"

### Epic 5: Reflect on Your Authored History
Players review their narrative impact through history books and end-of-run recaps showing measurable consequences.
**FRs covered:** FR35–FR40 (recap generation, history book, consequence tracking)
**Stories:** S7 (history book & recap)
**User Value:** "I can see exactly how my claims reshaped history"

### Epic 6: Complete & Persist Game Sessions
Players can play a complete 10-turn game, save progress anytime, and resume later with deterministic resumption.
**FRs covered:** FR30–FR34 (turn flow, 10-turn structure), FR46–FR47 (save/load, determinism)
**Stories:** S8 (turn flow & session persistence)
**User Value:** "I can play a full game at my own pace and come back anytime"

### Epic 7: Debug Game Determinism (Developer-Facing)
Developers can trace causal chains between claims and triggered events, validating that determinism works and consequences are real.
**FRs covered:** FR26–FR29 (action logging, causal tracing, verification)
**Stories:** S6 (determinism tracing system)
**User Value (Dev):** "I can prove why each event happened and debug confidence"

### Epic 8: Deploy to Web
Game is deployed on GitHub Pages with one-time purchase monetization and no locked content.
**FRs covered:** FR41–FR43 (purchase, GitHub Pages deployment, no paywalls)
**Stories:** S9 (GitHub Pages static build & CI/CD)
**User Value:** "The game is playable online for my friends"
