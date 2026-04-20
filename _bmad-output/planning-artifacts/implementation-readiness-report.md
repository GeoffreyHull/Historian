---
stepsCompleted: ['step-01-document-discovery']
documentsIncluded: ['prd.md', 'architecture.md', 'epics.md']
date: 2026-04-19
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-19
**Project:** Historian

## Document Inventory

### Documents Analyzed
- ✅ `prd.md` (Functional + Non-Functional Requirements)
- ✅ `architecture.md` (Constraints, Technical Decisions)
- ✅ `epics.md` (8 Epics, S0–S9 Stories, Hour Allocations)

### Critical Issues
- ✅ No duplicates
- ✅ No missing documents
- ✅ Ready for coverage validation

---

## PRD Analysis

### Functional Requirements Extracted

**Total FRs: 47**

#### Game Setup & Configuration (FR1–FR3)
- FR1: Player can select number of factions to play (3, 5, or 7 options)
- FR2: Player can start a new game with a random seed
- FR3: Player can view faction initial trust levels before game starts

#### Event Management & Observation (FR4–FR7)
- FR4: System generates 2–6 random events each turn based on seeded RNG
- FR5: Player can observe a random subset (0 to all) of generated events
- FR6: Player knows which events they observed vs. didn't observe
- FR7: System tracks ground truth for each event (what actually happened)

#### Narrative Claims & Credibility (FR8–FR14)
- FR8: Player can write 1–3 narrative claims per turn about generated events
- FR9: Player can claim about observed events
- FR10: Player can claim about unobserved events (guesses)
- FR11: System calculates credibility (0–100%) based on claim accuracy vs. ground truth
- FR12: System applies credibility penalties for factual errors (−20% per major error)
- FR13: System applies credibility penalties for insulting factions (−5% to −10%)
- FR14: Player can see their credibility score after each turn

#### Faction Management & Reactions (FR15–FR19)
- FR15: Each faction has a trust value (−200 to +100 range)
- FR16: Faction trust changes based on credibility and claim content
- FR17: Factions below −100 trust refuse to buy the next book (loss condition)
- FR18: All factions refusing results in influence multiplier of 0 (auto-loss)
- FR19: System calculates influence earned = credibility % × faction multiplier

#### World State Management (FR20–FR25)
- FR20: Player claims influence which events appear in future runs
- FR21: System tracks faction beliefs based on player claims
- FR22: Faction beliefs probabilistically shape future event generation
- FR23: Event descriptions subtly reference previous run consequences
- FR24: World state persists across runs (faction trust, beliefs, consequences)
- FR25: World state recovers over time (consequences fade but don't disappear immediately)

#### Action→Consequence Tracing (FR26–FR29)
- FR26: System logs every player claim with event ID
- FR27: System logs which events were triggered by each claim (with confidence score)
- FR28: Tracing logs are available for debugging and validation
- FR29: Developer can verify causal chains between claims and events

#### Turn Management & Game Flow (FR30–FR34)
- FR30: Game progresses in 10–turn runs
- FR31: Each turn includes: events occur → observation → claims → credibility → influence
- FR32: Player can save and pause between turns
- FR33: Player can resume a paused game from the exact same state
- FR34: Run ends after turn 10

#### History Book & Recap (FR35–FR40)
- FR35: At end of each run, system generates a recap showing major impacts
- FR36: Recap describes consequences in lore language (not mechanics language)
- FR37: Recap references previous run consequences (if applicable)
- FR38: Player can access history book anytime (during or between runs)
- FR39: History book accumulates recaps from all previous runs
- FR40: History book is readable but not editable by player

#### Monetization & Deployment (FR41–FR43)
- FR41: Game can be purchased as a one-time purchase
- FR42: Game runs on desktop browser via GitHub Pages
- FR43: All game features are available after purchase (no locked content)

#### Save/Load & Persistence (FR44–FR47)
- FR44: Game state can be serialized to JSON
- FR45: Game state can be deserialized from JSON without data loss
- FR46: Player can manually save progress between runs
- FR47: Game can resume from saved state with identical determinism (same seed = same events)

### Non-Functional Requirements Extracted

**Total NFRs: 10**

#### Performance (3 NFRs)
- NFR1: Turn calculation latency ≤ 500ms (probabilistic cascade + event weighting)
- NFR2: State serialization/deserialization ≤ 100ms (save/load non-blocking)
- NFR3: History book rendering ≤ 200ms (responsive anytime access)

#### Reliability (3 NFRs)
- NFR4: Atomic save operations (no partial writes; crash-safe)
- NFR5: Deterministic resumption (same seed + actions = identical state)
- NFR6: Offline-playability (no network calls; no required check-ins)

#### Accessibility (4 NFRs)
- NFR7: No seizure triggers (no flashing/strobe)
- NFR8: Color-blind safe (icons + patterns + text; not color-only)
- NFR9: Text scaling (functional at 200%; no truncation/overlap)
- NFR10: Contrast (AA: 4.5:1 body, 3:1 UI per WCAG 2.1)

### Additional Requirements & Constraints

**Architectural Constraints (from Architecture doc):**
- 9 mandatory constraints (pure functions, immutable state, seeded RNG, extensible events, JSON-serializable, action-based, deterministic phases, presentational components, centralized costs)

**Out-of-Scope (MVP):**
- Real-time multiplayer, mod system, persistent cross-session worlds, voice acting, animations, mobile optimization, cosmetics

---

