---
stepsCompleted: ["step-01-init", "step-02-context", "step-03-starter", "step-04-decisions", "step-05-patterns", "step-06-structure", "step-07-validation", "step-08-complete"]
inputDocuments: ["prd.md", "project-context.md"]
workflowType: 'architecture'
project_name: 'Historian'
user_name: 'Geoff'
date: '2026-04-19'
status: 'complete'
completedAt: '2026-04-19'
lastStep: 8
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
47 FRs organized into 9 capability areas: setup, event management, claims/credibility, faction management, world state, action→consequence tracing, turn flow, history book, save/load. Core mechanic: narrative claims reshape future events via persistent world state.

**Non-Functional Requirements:**
- Performance: Turn calculation ≤500ms, serialization ≤100ms, history rendering ≤200ms
- Reliability: Atomic saves, deterministic resumption, offline-playable core
- Accessibility: WCAG 2.1 AA compliance (4.5:1 contrast, color-blind safe, 200% text scaling)

**Scale & Complexity:**
- Primary domain: Full-stack game logic + React UI
- Complexity level: Medium-High (novel mechanic, probabilistic cascades, faction systems, deterministic requirements)
- Cross-cutting concerns: World state persistence, credibility calculation, action→consequence tracing, faction belief propagation

### Technical Constraints & Dependencies

From project-context.md, 8 core architectural constraints designed to enable retcon, multiplayer, and mods without rewrite:

1. **Pure Functions** — All game logic in src/game/ is deterministic, no I/O, no async, seeded RNG only
2. **Immutable GameState** — All state updates return new objects, never mutate inputs
3. **Seeded Deterministic RNG** — All randomness through SeededRNG, never Math.random()
4. **Events are Extensible** — Event types are strings in a registry, not hardcoded enums
5. **GameState is 100% JSON-Serializable** — Round-trip through JSON.stringify/parse without custom serializers
6. **All Mutations Through Actions** — State updates via action-handler pattern, logged for replay
7. **Components are Presentational** — React components derive display from props, no direct state mutations
8. **Influence Costs are Centralized** — All influence costs in INFLUENCE_COSTS registry, pluggable

**CRITICAL ADDITION (Constraint 9):**
9. **Turn-Phase Determinism & Ordering** — Explicit turn-phase contract defining order of operations. Each turn flows: [Phase 1: Resolve claims] → [Phase 2: Apply state changes] → [Phase 3: Trigger consequences] → [Phase 4: Serialize]. This ensures retcon replays and multiplayer sync produce identical results regardless of action execution order.

### Implementation Order (Sequence from Architectural Review)

**Phase 1 (Foundation — weeks 1-2):**
1. Constraints 1 + 2 (Pure Functions + Immutable GameState) — co-requisite, unblock everything
2. Constraint 3 (Seeded Deterministic RNG)

**Phase 2 (Serialization — week 3):**
5. Constraint 5 (100% JSON-Serializable) — acts as circuit-breaker for coupling bugs

**Phase 3 (Action Flow — weeks 4-5):**
6. Constraint 6 (All Mutations Through Actions)
4. Constraint 4 (Events are Extensible)
9. Constraint 9 (Turn-Phase Determinism) — formalize turn contract once action-handler is solid

**Phase 4 (Runtime — weeks 6+):**
7. Constraint 7 (Presentational Components)
8. Constraint 8 (Influence Costs Centralized)

### Critical Insight: Constraint 5 is the Linchpin

JSON-Serializable GameState is the architectural node that:
- Forces immutability (constraint 2) — no class instances, no circular refs
- Prevents side effects (constraint 1) — can't serialize I/O or async
- Catches RNG violations early (constraint 3) — Date.now() or Math.random() fail serialization

**Implementation implication:** Test JSON serialization round-trips from week 3. Late discovery (week 8+) is expensive.

### MVP Constraint Set (What Ships, What Defers)

**LOAD-BEARING FOR MVP (non-deferrable):**
- ✅ Constraints 1, 2, 3, 5, 6 — core to testability, replay, and saves
- ✅ Constraint 4 — extensible events (modding hook, cheap day 1, expensive to retrofit)
- ✅ Constraint 9 — turn-phase contract (required for action→consequence tracing accuracy)

**DEFERRABLE TO POST-MVP (with discipline):**
- ⚠️ Constraint 7 (Presentational Components) — can ship with mixed logic in components MVP1, refactor post-MVP (costs 2 weeks if deferred, < 1 week if done day 1)
- ⚠️ Constraint 8 (Centralized Influence Costs) — hardcode costs MVP1, extract to registry post-MVP (3-5 days either way)

**Recommendation:** Ship constraints 1-6 + 9 as MVP foundation. Add 7-8 post-MVP without guilt but plan for them.

### Hidden Tensions to Watch

**Tension 1 (Constraint 4 vs. 5):**
- Event handlers must store ONLY JSON-serializable payloads. If handlers store function closures or connections, retcon breaks.
- **Explicit rule:** All event handlers must be pure functions returning only serializable data.

**Tension 2 (Constraint 7 vs. 1):**
- React components are NOT pure functions mathematically (implicit dependencies on context, state).
- Works only if components receive ALL state as props and call action-dispatch functions.
- **Enforcement:** No useEffect mutations; components are stateless display only.

### Risk Ranking (If Constraint Violated Mid-Project)

| Constraint | If Violated in Month 2 | Delay if Found Late | Priority |
|---|---|---|---|
| 1-3, 5-6, 9 | Logic bugs, unpredictable behavior, broken testing/replay | 3-4 weeks refactoring | 🔴 CRITICAL |
| 4 | New events require file edits everywhere | 1 week per event type (post-MVP) | 🟡 HIGH |
| 7 | Components tied to game logic, refactoring nightmare | 2 weeks post-MVP | 🟡 MEDIUM |
| 8 | Hardcoding fine MVP1 | 3-5 days if refactored early | 🟢 LOW |

### Test Strategy (Per Constraint)

**Constraints 1-2 (Immutability):**
```typescript
// Compile-time: @ts-expect-error prevents mutations
state.turn = state.turn + 1; // TypeScript fails

// Runtime: Original unchanged when spread
const state1 = { turn: 1 };
const state2 = { ...state1, turn: 2 };
expect(state1.turn).toBe(1);
expect(state1).not.toBe(state2);
```

**Constraint 3 (Seeded RNG):**
```typescript
const rng1 = createSeededRng(42);
const seq1 = [rng1(), rng1()];
const rng2 = createSeededRng(42);
const seq2 = [rng2(), rng2()];
expect(seq1).toEqual(seq2); // Identical
```

**Constraint 5 (Serialization):**
```typescript
const state = { /* GameState */ };
const json = JSON.stringify(state);
const restored = JSON.parse(json) as GameState;
expect(restored).toEqual(state); // Round-trip succeeds
```

**Constraint 6 (Actions):**
```typescript
const state1 = { turn: 1, influence: 50 };
const state2 = reducer(state1, { type: 'SPEND_INFLUENCE', amount: 20 });
expect(state1.influence).toBe(50); // original unchanged
expect(state2.influence).toBe(30); // new state mutated
```

**Constraint 9 (Turn-Phase Ordering):**
```typescript
// Two replays with same seed, different action order, should converge
const state_a = executePhases(state, actions1, seed);
const state_b = executePhases(state, actions1, seed); // Same seed, same result
expect(state_a).toEqual(state_b);
```

### File Structure Ready for Implementation

```
/src/game/
  ├── types.ts              (GameState readonly, Action, Event, Faction)
  ├── rng.ts                (seeded RNG wrapper, seedrandom)
  ├── reducer.ts            (pure (state, action) => newState)
  ├── events.ts             (extensible event registry)
  ├── gameManager.ts        (turn flow, phase execution)
  ├── influenceCosts.ts     (deferrable, hardcode MVP1)
  └── __tests__/
      ├── types.test.ts
      ├── rng.test.ts
      ├── reducer.test.ts
      ├── events.test.ts
      └── gameManager.test.ts
/src/components/
  ├── GameBoard.tsx         (presentational, dumb)
  ├── BookWriter.tsx
  └── __tests__/
      ├── GameBoard.test.tsx
```

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web game with React frontend + Node/TypeScript game logic backend (same codebase).

### Starter Option Selected: Vite + React + TypeScript (Hybrid Approach)

**Rationale for Selection:**

The Historian architecture has tech stack already locked from project-context.md (Node 18+, TypeScript 5.0+, React 18+, Vite 4+, CSS Modules, seedrandom). Rather than hand-rolling configuration from scratch or adopting a heavyweight starter with unnecessary conventions, the optimal approach is **hybrid**: use `create-vite` for fast scaffolding, immediately delete boilerplate, and enforce constraint-driven architecture from day 1.

**Why not off-the-shelf starter alone:** Standard starters bring HelloWorld components and assumed patterns (components-first thinking) that would require immediate deletion. Better to bootstrap with the minimal viable config.

**Why not custom from scratch:** Vite config, tsconfig.json, and package.json scripts are standard boilerplate with zero custom decisions. Hand-rolling these is error-prone and wastes 1 hour that could be spent on `/src/game/` architecture.

**Initialization Command:**

```bash
npm create vite@latest historian -- --template react-ts
cd historian
npm install seedrandom @types/seedrandom
npm run dev
```

**Post-Init Steps:**

1. Delete `src/components/HelloWorld.tsx` and `src/assets/`
2. Create `/src/game/` directory (empty initially, filled by implementation sequence)
3. Create `/src/components/` directory with explicit "presentational only" discipline
4. Add CSS Modules configuration to `vite.config.ts`:
   ```typescript
   export default defineConfig({
     plugins: [react()],
     css: {
       modules: {
         localsConvention: 'camelCase',
       },
     },
   });
   ```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript 5.0+ with strict mode enforced (tsconfig.json: `strict: true`)
- ES2020 target (modern JavaScript features, clean output)
- Node 18+ runtime support

**Styling Solution:**
- CSS Modules (zero bundle bloat, no style conflicts)
- Manual configuration required (2 lines in vite.config.ts)
- No Tailwind, Styled Components, or implicit scoping assumptions

**Build Tooling:**
- Vite 4+ with HMR (hot module reloading for dev)
- Optimized production build (code splitting, tree-shaking)
- Plugin API stable for future extensions

**Testing Framework:**
- Vitest ready (already in devDependencies if using recommended Vite template)
- No testing framework pre-configured—added per constraint test strategy from step 2

**Code Organization:**
```
src/
  ├── game/           (pure functions, game logic, seeded RNG, types)
  ├── components/     (presentational React components only)
  ├── App.tsx         (top-level app component)
  ├── main.tsx        (entry point)
  └── index.css       (global styles)
public/
  └── index.html      (Single Page App entry)
```

**Development Experience:**
- `npm run dev` — Vite dev server with HMR
- `npm run build` — Optimized production bundle
- `npm run preview` — Preview production build locally
- TypeScript compilation errors in terminal during dev
- Fast rebuild on file changes (Vite + esbuild)

### Important Notes

**Starter choice is architecture-independent:** The implementation sequence (1→2→3→5→6→4→9→7→8) is not constrained by the starter choice. Game logic (`/src/game/`) is built independently of React scaffolding. This starter provides the *entry point*, not the *path*.

**CSS Modules configuration is minimal:** Must be added post-init to vite.config.ts. This is not part of stock React starter but required for constraint #7 (presentational components with scoped styles).

**Project initialization should be the first implementation story:** Once `npm create vite` runs and post-init cleanup is done, the first code task is building `/src/game/types.ts` (Constraint 1).

---

## Core Architectural Decisions

### Decision Summary

**Already Locked (Non-Negotiable):**
- State Management: Action-reducer pattern (Constraint 6)
- Deployment: GitHub Pages (from PRD)
- Testing Framework: Vitest (included with Vite scaffold)
- Save/Persistence: LocalStorage (MVP)

### Remaining Decisions (Made Collaboratively)

#### 1. Error Handling in Pure Functions

**Decision:** Result Types (`{ ok: true, data } | { ok: false, error }`)

**Rationale:**
- **Serializable:** Error objects are data, not thrown exceptions; round-trip through JSON without corruption
- **Deterministic:** Same seed + same invalid input = same error every time (critical for retcon replay)
- **Testable:** Assert on error cases without try-catch boilerplate; errors flow through action-reducer explicitly
- **Fits Architecture:** Constraint 5 (JSON-Serializable GameState) requires errors be part of state, not side effects

**Implementation Pattern:**
```typescript
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

export function eventGenerator(seed: number): Result<Event[], string> {
  if (seed < 0) return { ok: false, error: 'Invalid seed' };
  return { ok: true, data: [...events] };
}

// Reducer unwraps result
const result = eventGenerator(seed);
if (!result.ok) return { ...state, error: result.error };
```

#### 2. Performance Monitoring (Turn Calculation ≤500ms)

**Decision:** Custom Perf Logger

**Rationale:**
- **Essential for constraint enforcement:** 500ms turn calculation is a hard NFR; need data to iterate
- **Minimal overhead:** Three-line wrapper per critical function; negligible performance impact
- **Local-only measurement:** Logs to console in dev, localStorage for post-game analysis; no backend needed
- **Early detection:** Captures function-level timing before hitting wall in week 10

**Implementation Pattern:**
```typescript
const perfLogger = {
  timers: new Map<string, number>(),
  
  start(label: string) {
    this.timers.set(label, performance.now());
  },
  
  end(label: string) {
    const elapsed = performance.now() - (this.timers.get(label) || 0);
    const log = { label, ms: elapsed, timestamp: Date.now() };
    console.log(`[PERF] ${label}: ${elapsed.toFixed(2)}ms`);
    // Store last 50 in localStorage for analysis
  },
};

// Usage in critical functions
export function executeTurn(state: GameState): GameState {
  perfLogger.start('executeTurn');
  // ... turn logic
  perfLogger.end('executeTurn');
  return state;
}
```

**Monitoring Targets:**
- `eventGenerator()` — target: < 100ms
- `calculateCredibility()` — target: < 50ms
- `applyAction()` — target: < 100ms
- `executeTurn()` — target: < 500ms total

#### 3. Component Testing Approach

**Decision:** Game Logic Tests Only (Skip Component Unit Tests MVP)

**Rationale:**
- **Low ROI on dumb components:** Presentational components are props-in, JSX-out; trivial to test by hand
- **High ROI on game logic tests:** Bugs live in credibility calculation, event generation, turn flow—not in component rendering
- **Timeline optimization:** Testing both adds 20% overhead with minimal bug-catching benefit
- **Testing strategy:** Game logic tests + manual component verification during development

**Test Structure:**
```typescript
// ✅ Heavy investment here: Game logic tests
describe('GameLogic', () => {
  describe('eventGenerator', () => {
    it('should produce deterministic events with same seed', () => {
      const rng1 = createSeededRng(42);
      const events1 = eventGenerator(rng1);
      
      const rng2 = createSeededRng(42);
      const events2 = eventGenerator(rng2);
      
      expect(events1).toEqual(events2);
    });
  });
  
  describe('calculateCredibility', () => {
    it('should apply penalties for factual errors', () => {
      const credibility = calculateCredibility(
        [{ claimed: 'rebellion', truthValue: 'peace' }],
        baseCredibility
      );
      expect(credibility).toBe(baseCredibility - 20); // -20% penalty
    });
  });
});

// ✅ Light investment here: Component tests (if needed)
// Components tested manually: "Click button, does expected action dispatch?"
// If component fails, refactor it to be dumber—move logic to reducer
```

#### 4. Asset Pipeline

**Decision:** ASCII/Emoji Placeholders (MVP), Art Post-Launch

**Rationale:**
- **Unblock ship date:** No dependency on artist; game is playable without visual assets
- **Intentional aesthetic:** ASCII and emoji are standard in strategy/roguelike games; players won't perceive as "missing"
- **Fast iteration:** Event types and factions updated in 30 seconds (text) vs. waiting for art files
- **Accessibility win:** Text-first is more accessible than image-only UI
- **Migration path:** Post-MVP art requires no code refactoring, just emoji→image replacement

**MVP Asset Strategy:**
```typescript
// Factions: Use emoji + text names
const factions = [
  { id: 'militarists', icon: '⚔️', name: 'Militarists', trust: 0 },
  { id: 'scholars', icon: '📚', name: 'Scholars', trust: 0 },
  { id: 'merchants', icon: '🏪', name: 'Merchants', trust: 0 },
];

// Board: ASCII representation
const boardView = `
  ⚔️ Militarists      📚 Scholars      🏪 Merchants
  [████████░░] -50   [██░░░░░░░░] +10  [█████░░░░░] 0
`;

// Events: Text descriptions + emoji context
const event = {
  type: 'rebellion',
  context: '🔥 A rebellion breaks out in the eastern territories.',
  description: 'The region is in upheaval. Will you claim this was...',
};
```

**Post-MVP Art Upgrade (Trivial):**
```typescript
// Replace emoji with component; rest of code unchanged
const factions = [
  { 
    id: 'militarists', 
    icon: <FactionIcon faction="militarists" />, // Was: '⚔️'
    name: 'Militarists',
    trust: 0
  },
];
```

### Decision Impact on Implementation Sequence

**No Impact on Core Sequence (1→2→3→5→6→4→9→7→8):**

- **Steps 1-6, 9:** Pure game logic; error handling as Result types; perf logger added to critical functions
- **Step 7 (Components):** Render placeholder emoji/ASCII; no asset imports; no image pipeline needed
- **Testing:** Vitest for game logic (tests from day 1); components tested manually during dev

**Decision Cascades:**
- Result Types → Action handlers must unwrap errors → Reducer must handle error state
- Perf Logger → perfLogger import in gameManager, eventGenerator, credibilitySystem
- Game Logic Tests → Test structure emphasizes reducer + pure function tests
- ASCII/Emoji Assets → No Vite config changes; no import statements for images

### Deferred Decisions (Post-MVP)

| Decision | Deferred Because | Planned for |
|---|---|---|
| Real UI assets (faction icons, event visuals) | Artist availability; mechanics still fluid | Phase 2 (Growth) |
| Asset bundling optimization | Not yet measured; emoji/text have zero overhead | Phase 2 if needed |
| Component testing framework | Low ROI for dumb components; manual testing sufficient | Phase 2 if component complexity grows |
| Snapshot strategy for retcon | Feature is post-MVP | Phase 3 (Vision) |

---

## Project Structure & Boundaries

[Complete project tree structure from Step 6 appended above; see section beginning "Historian/" for full directory organization]

### Key Architectural Decisions from Party Mode Review

**Tracing Strategy (Developer-Facing, Not Player-Facing):**
Causality tracing is internal infrastructure for determinism validation, not a player-visible feature. Players discover cross-run consequences organically through event descriptions ("trade remains scarce due to lingering border tensions") and recap feedback, not through explicit causality UI.

**MVP Trace Design:**
- Minimal structure: `{tick, actionHash, stateHash}` (3 fields only)
- Determinism proof: identical seed + actions → identical state hashes
- Post-MVP: causality layer (DAG, field diffs, dependency graphs) can layer on top without rearchitecting
- Captures: action ordering, RNG determinism, state consistency
- Defers: causality graphs, precondition snapshots, player-visible traces

**Phase Enforcement vs. Runtime Guards:**
- MVP: Phase enforcement only (action types declare required phase; reducer rejects out-of-order actions). ~20 lines of code, ~2 hours implementation.
- Post-MVP: Add runtime guards (determinism tests, precondition checks) if determinism bugs surface during gameplay.
- Rationale: Phase enforcement catches 95% of ordering bugs; guards are defensive layering for edge cases.

**Content Over Infrastructure:**
- 50+ hours saved by deferring full causality architecture
- Freed time invested in event content (12-15 core templates + variations), faction balance, world state mechanics
- Solo-dev pragmatism: prove determinism, defer sophistication

---

## MVP Scope (Party Mode Consensus)

### Realistic 6-Month Timeline

**Total planned hours: 98 hours**
**Available: 26 weeks (6 months) @ 7 hrs/week average = 182 hours**
**Buffer: 12 weeks of iteration, playtesting, balancing, and content**

### What Ships in MVP (Stories 0-9)

| Story | Hours | Content |
|---|---|---|
| S0: State Shape Validation | 3 | types.ts, JSON round-trip test |
| S1: Setup (1 faction, seed) | 6 | Game initialization, faction selection |
| S2: Event Generation (5-7 events) | 12 | SeededRNG, event registry, observable/hidden logic |
| S3: Claims & Observation | 8 | React component, claim input (text only) |
| S4: Credibility System | 10 | Accuracy + insults + errors, JSON-serializable results |
| S5: World State Evolution | 15 | Faction belief updates, event pool reshaping, probabilistic outcomes |
| S6: Determinism Tracing | 20 | `{tick, actionHash, stateHash}` logs, CSV export, replay validation |
| S7: History Book | 6 | Text recap, claim summary, impact list |
| S8: Turn Flow & Save/Load | 14 | 10-turn loop, localStorage persistence, JSON serialization |
| S9: GitHub Pages Deploy | 4 | Static build, CI/CD, index.html |
| **TOTAL** | **98** | - |

**What does NOT ship in MVP:**
- ❌ Multiple factions (post-MVP: 2-3 more in weeks 11-13)
- ❌ 12-15 events (only 5-7 core types; post-MVP: 8-12 variations)
- ❌ Faction reactions beyond trust decay (post-MVP: cascading consequences)
- ❌ Influence mechanics (retcon/force/buy intel—post-MVP feature)
- ❌ Animations, UI polish, accessibility audit
- ❌ Performance monitoring (perf logs post-MVP)
- ❌ Component unit tests (manual verification for 6 dumb components sufficient)

### MVP Constraints Locked

**LOAD-BEARING FOR MVP (Enforced):**
- ✅ Constraint 1 (Pure Functions) — All game logic deterministic
- ✅ Constraint 2 (Immutable GameState) — All updates return new objects
- ✅ Constraint 3 (Seeded RNG) — All randomness through seedrandom
- ✅ Constraint 4 (Events Extensible) — Event registry pattern (enables 2+ factions post-MVP)
- ✅ Constraint 5 (JSON-Serializable) — GameState round-trips; must add post-serialization validation test
- ✅ Constraint 6 (All Mutations Through Actions) — Action-reducer pattern
- ✅ Constraint 9 (Turn-Phase Determinism) — Phase enforcement in reducer

**DEFERRABLE TO POST-MVP (with discipline):**
- ⚠️ Constraint 7 (Presentational Components) — Components may have logic MVP1; refactor post-MVP (2 weeks)
- ⚠️ Constraint 8 (Centralized Costs) — Hardcode costs MVP1; extract to registry post-MVP (3-5 days)

### Kill Triggers (When to Pivot)

1. **Constraint 5 failure (week 4):** If state serialization test fails, stop and refactor (40 hours, still on track)
2. **Determinism failure (week 6):** If S6 tracing shows >5% non-deterministic outcomes, pivot to deterministic outcome tables (2 weeks, still on track)
3. **Solo dev drops below 5 hrs/week:** Recalibrate learning goals; shipping is secondary

---

## Player Discovery Specification (Party Mode Consensus)

### Non-Negotiable Requirements

The architecture must *force* players to discover that their narrative claims reshape the world. This is not optional; it's the game's core value proposition.

**Every event triggered by a claim MUST:**

1. **Name the claim in event text** (not paraphrase or imply)
   - ❌ Bad: "Merchants are wary"
   - ✅ Good: "The false plague rumors you spread have made merchants fearful"

2. **Show measurable magnitude** (>=40% effect threshold to be perceptible)
   - ✅ Example: "Trade fell 40% (was 110 events, now 66)"
   - ✅ Minimum effect size: 40% shift from baseline for any event type

3. **Produce consistent outcomes across runs** (same claim → same event type, ±15% variance band)
   - Run 1: Plague claim → +71% plague events
   - Run 2: Plague claim → +68% plague events
   - Run 3: Plague claim → +63% plague events
   - **Variance band: 63-71% (acceptable); if run 4 shows -20%, learnability breaks**

4. **Never lock player into unrecoverable state** (within a single run; effects resolve or fade by run 3)
   - ✅ Acceptable: "Strong economy" claim lasts 2 runs, then fades
   - ❌ Unacceptable: "King is dead" claim locks out all events forever

5. **Revert to baseline when claim is absent** (proof by absence)
   - If player makes no claims in run 3, event distribution returns to baseline
   - This proves causality was real, not coincidence

### Recap Specification (Discovery Confirmation)

**End-of-run recap MUST show:**

```
RUN N RECAP
═════════════════════
Claims Made:
  • "The plague is spreading"
  • "The merchant guild is hoarding"

Measurable Impact:
  • "Plague is spreading" 
    → Faction: Merchants Anxiety +45%
    → Plague events: +71% (5 → 12)
  
  • "Merchant hoarding"
    → Faction: Merchants Trust -30%
    → Trade events: -40% (110 → 66)
```

**MVP recap must show:**
- [ ] All claims made this run (1-5 claims typical)
- [ ] At least 1 metric per claim (event type frequency shift)
- [ ] Magnitude showing "baseline vs. this run" (so player sees effect size)
- [ ] Causal chain: claim → faction metric → event frequency

### Compliance Checklist (Before MVP Ships)

Developers MUST verify these tests pass:

**Learnability Test:**
- [ ] Run 1: Event text names the claim; recap shows impact
- [ ] Run 2: Same claim produces event with magnitude ±15% of run 1
- [ ] Run 3: Skip the claim; events revert to baseline
- [ ] By run 3: Player can predict outcome if they repeat claim with 70%+ accuracy

**Causality Test:**
- [ ] Every event triggered by a claim mentions the claim in text (not implied)
- [ ] Every claim appears in recap with at least 1 metric
- [ ] Metric shows before/after values (baseline vs. this run)
- [ ] Effect size >= 40% (not 5% noise)

**Consistency Test:**
- [ ] Same claim across runs 1-3 produces same event type (plague claim always → plague events)
- [ ] Magnitude falls within ±15% band (63-71% range, not 70% then -10%)

**Failure Case Test:**
- [ ] No claim creates unrecoverable state by end-of-run
- [ ] If player makes contradictory claims, recap explains the result
- [ ] If player makes no claims, events show baseline metrics

---

### Pattern Conflict Analysis

Seven core implementation patterns identified where consistency is required. Each pattern reviewed against MVP viability and long-term load-bearing status.

### Pattern Categories & MVP Scope

#### Pattern 1: Game Logic Naming (SOFT CONSTRAINT)

**Rule:** Imperative verbs for functions, SCREAMING_SNAKE_CASE for constants, PascalCase for types.

```typescript
// Functions: imperative verbs
function executePhase() { }
function calculateCredibility() { }
function applyInfluence() { }

// Constants: SCREAMING_SNAKE_CASE
const CREDIBILITY_PENALTY = -20;
const MAX_INFLUENCE = 1000;
const FACTION_NAMES = ['Militarists', 'Scholars', 'Merchants'];

// Types: PascalCase
type GameState = { ... };
type Action = { type: string; payload: unknown };
type Faction = { id: string; trust: number };
```

**MVP Scope:** Enforce in new code. Refactor old naming during code review, not blocking.

**Friction Points:**
- Week 1-2: Naming consistency is natural; no pressure yet
- Week 3-4: Sprint pressure begins; naming shortcuts emerge. Enforce at PR review or they calcify.
- Week 5-6: If not locked in early, naming devolves rapidly. Cost to retrofit: medium

**Pragmatist's Take:** Soft constraint—important for readability but not blocking launch. Enforce gently; refactor during code review rather than blocking PRs.

---

#### Pattern 2: Action Structure (LOAD-BEARING) ✅

**Rule:** All state mutations via actions. Actions are `{ type: string; payload: unknown }` with SCREAMING_SNAKE_CASE action type names.

```typescript
// Action definition
type Action = 
  | { type: 'CLAIM_EVENT'; payload: { eventId: string; claimText: string } }
  | { type: 'SPEND_INFLUENCE'; payload: { amount: number } }
  | { type: 'ADVANCE_TURN'; payload: { seed: number } };

// Reducer consumes actions
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'CLAIM_EVENT':
      return { ...state, claims: [...state.claims, action.payload] };
    case 'SPEND_INFLUENCE':
      return { ...state, influence: state.influence - action.payload.amount };
    default:
      return state;
  }
}
```

**Why Load-Bearing:**
- **Deterministic replay** depends on action log; violations break retcon
- **Constraint 6** (All Mutations Through Actions) requires this pattern
- **Constraint 1** (Pure Functions) requires actions carry all input data

**MVP Scope:** Mandatory. All state changes MUST be actions. No shortcuts.

**Friction Points:**
- Week 1-2: Natural to implement; no friction
- Week 3-4: First temptation to bypass: "just mutate state directly." Don't. Costs nothing to use action-reducer; costs weeks if you mix patterns.
- Week 5-6: If mixed patterns exist, replaying/retcon become impossible. Cost to fix: **4 weeks refactoring**

**Pragmatist's Take:** Non-negotiable. Treat violations as bugs, not as "quick fixes." This is the lynchpin.

---

#### Pattern 3: State Shape (PARTIALLY LOAD-BEARING) ⚠️

**Rule:** Arrays for collections (not objects), one-level nesting, explicit field names, history archived separately.

```typescript
// ✅ Good: arrays with IDs
type GameState = {
  turn: number;
  seed: number;
  claims: Array<{ id: string; eventId: string; claimText: string; credibilityDelta: number }>;
  factions: Array<{ id: string; name: string; trust: number }>;
  influenceLog: Array<{ actionType: string; amount: number; turn: number }>;
};

// ❌ Bad: objects with arbitrary keys
type GameState = {
  claims: { [claimId: string]: Claim }; // Breaks JSON ordering; harder to serialize
};

// ❌ Bad: deep nesting
type GameState = {
  world: {
    regions: {
      north: { state: { factions: { [...] } } }
    }
  }
}; // Hard to trace during serialization bugs
```

**Why Partially Load-Bearing:**
- **JSON serialization** (Constraint 5) requires arrays; objects lose ordering
- **History archival** (defer to post-MVP) would require deep cloning; can archive as JSON snapshots post-MVP

**MVP Scope:** Mandatory arrays. One-level nesting enforced. History archival deferred.

**What Gets Deferred:**
```typescript
// Post-MVP: history snapshots
type HistoryEntry = {
  turn: number;
  seed: number;
  stateSnapshot: string; // JSON.stringify(state)
  actionsTaken: Action[];
};
// For MVP, don't track this; handle in Phase 2
```

**Friction Points:**
- Week 1-2: Array structure is natural; no friction
- Week 3-4: Temptation to use object keying (`claims[claimId]`) for O(1) lookup. Arrays are O(n) find. For 10-20 claims, irrelevant; don't optimize prematurely.
- Week 4-5: If deep nesting appears, debugging state mutations becomes slow. Cost to refactor: medium (1-2 days)

**Pragmatist's Take:** Arrays + one-level nesting are load-bearing. History can wait. If you need O(1) lookups, add a companion index map post-MVP; don't violate the shape rule.

---

#### Pattern 4: Result Types (LOAD-BEARING) ✅

**Rule:** Error handling via `{ ok: true; data: T } | { ok: false; error: { code: string; message: string } }`. Never throw in pure functions.

```typescript
type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

// Function returns Result, not throws
function eventGenerator(seed: number): Result<Event[]> {
  if (seed < 0) return { ok: false, error: { code: 'INVALID_SEED', message: 'Seed must be >= 0' } };
  return { ok: true, data: generateEvents(seed) };
}

// Reducer unwraps and stores error state
function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'GENERATE_EVENTS') {
    const result = eventGenerator(action.payload.seed);
    if (!result.ok) {
      return { ...state, error: result.error, events: [] };
    }
    return { ...state, events: result.data, error: null };
  }
  return state;
}
```

**Why Load-Bearing:**
- **Constraint 5** (JSON-Serializable) requires errors as data, not exceptions
- **Constraint 1** (Pure Functions) prohibits throwing; Result types provide deterministic error handling
- **Retcon replay** requires errors to round-trip through JSON; thrown exceptions can't

**MVP Scope:** Mandatory for all game logic. Components can throw (not serialized); game logic must return Results.

**Friction Points:**
- Week 1-2: Learning curve; takes 2-3 days to internalize. Then natural.
- Week 3-4: Edge cases emerge (cascading errors, nested Results). Temptation to throw. Don't; compose Results.
- Week 5-6: If mixed (some functions throw, others return Results), debugging error flow becomes impossible. Cost to fix: **2-3 weeks refactoring**

**Pragmatist's Take:** Non-negotiable. Enforce in code review. If developers resist, show them the retcon use case: "You throw an exception, we can't replay. You return a Result, we can."

---

#### Pattern 5: Logging & Tracing (USEFUL, NOT LOAD-BEARING) ℹ️

**Rule:** Structured perf logs for critical functions, action logs for state changes, error context logged before returning Results.

```typescript
const perfLogger = {
  log: (label: string, ms: number, context: { turn?: number; seed?: number; [key: string]: any }) => {
    console.log(JSON.stringify({ type: 'PERF', label, ms, ...context }));
  },
};

export function executePhase(state: GameState, phase: Phase): GameState {
  const t0 = performance.now();
  
  const result = applyPhaseLogic(state, phase);
  const elapsed = performance.now() - t0;
  
  perfLogger.log('executePhase', elapsed, { turn: state.turn, seed: state.seed });
  return result;
}
```

**Why NOT Load-Bearing:**
- Useful for debugging and performance monitoring
- Can be added/removed without breaking logic
- Logs don't affect game state (informational only)

**MVP Scope:** Recommended but optional. Start with perf logs for `executePhase`, `eventGenerator`, `calculateCredibility`. Expand if needed.

**Friction Points:**
- Week 1-2: No friction; optional
- Week 4-5: localStorage fills with verbose logs if not throttled. Easy fix (cap to last 50 logs).
- Week 5-6: Nice to have for debugging; not blocking

**Pragmatist's Take:** Add perf logging for the 3-4 critical functions. Skip comprehensive tracing MVP1. Add post-MVP if debugging is hard.

---

#### Pattern 6: Component Props (NOT LOAD-BEARING) ❌

**Rule:** Minimal extracted data passed as props; single dispatch function; selectors in parent, not component.

```typescript
// ✅ Simple: minimal props, no selectors in component
function GameBoard(props: {
  factionTrust: number[];
  claims: Claim[];
  onClaimSubmit: (text: string) => void;
}) {
  return <div>...</div>;
}

// Use in parent
function App() {
  const state = gameManager.getState();
  return (
    <GameBoard
      factionTrust={state.factions.map(f => f.trust)}
      claims={state.claims}
      onClaimSubmit={(text) => dispatch({ type: 'CLAIM_EVENT', payload: { claimText: text } })}
    />
  );
}

// ❌ Avoid: component with selectors
function GameBoard(props: { gameState: GameState }) {
  const selectedFactions = useMemo(() => props.gameState.factions.filter(f => f.trust > 0), [props.gameState]);
  // Logic in component; harder to test
}
```

**Why NOT Load-Bearing:**
- Presentational components are dumb by design; selectors add cognitive load
- For MVP (2-3 components), extracting data in parent is trivial
- Becomes valuable at scale (20+ components); premature for launch

**MVP Scope:** Optional. Extract data in parent if natural; don't create selectors utilities for 3 components.

**Friction Points:**
- Week 1-2: No friction; components are simple enough
- Week 3-4: If you over-engineer props early, boilerplate becomes annoying
- Week 5-6: Component count low; no scaling pressure yet

**Pragmatist's Take:** Skip for MVP. Extract data in parent App component. If components proliferate post-MVP, add selectors/memoization then.

---

#### Pattern 7: File Organization (REASONABLE DEFAULT, NOT BLOCKING) 📁

**Rule:** Tests in `__tests__/` subdirectory; types in `types.ts`; constants in `constants.ts`; components in feature folders.

```
/src/game/
  ├── types.ts              (GameState, Action, Event, Faction)
  ├── constants.ts          (CREDIBILITY_PENALTY, MAX_INFLUENCE, etc.)
  ├── rng.ts                (seeded RNG logic)
  ├── reducer.ts            (state mutations)
  ├── eventSystem.ts        (event generation, registry)
  ├── gameManager.ts        (turn flow, phase execution)
  └── __tests__/
      ├── types.test.ts
      ├── reducer.test.ts
      ├── eventSystem.test.ts
      └── gameManager.test.ts

/src/components/
  ├── GameBoard.tsx         (presentational)
  ├── BookWriter.tsx        (presentational)
  └── __tests__/
      ├── GameBoard.test.tsx
      └── BookWriter.test.tsx
```

**Why NOT Load-Bearing:**
- File organization doesn't affect logic correctness
- Can be refactored post-MVP without code changes
- Multiple valid organizations exist

**MVP Scope:** Reasonable default; not blocking. If code stays under 500 lines, organization matters less.

**Friction Points:**
- Week 1-2: Natural organization as code grows
- Week 3-4: If files exceed 300 lines, refactoring becomes natural
- Week 5-6: No pressure; organization has emerged organically

**Pragmatist's Take:** Use this structure as a guide. Don't create empty directories. Let structure emerge from code growth. Refactor post-MVP if cleanup needed.

---

### Enforcement Summary: MVP Load-Bearing Patterns

| Pattern | Load-Bearing | MVP Scope | Enforcement |
|---------|---|---|---|
| 1. Game Logic Naming | SOFT | Enforce in PR review | Gentle; refactor old code naturally |
| 2. Action Structure | ✅ CRITICAL | Mandatory | Zero shortcuts; treat violations as bugs |
| 3. State Shape | ⚠️ PARTIAL | Arrays + 1-level nesting | Mandatory; history can defer |
| 4. Result Types | ✅ CRITICAL | Game logic only | Enforce in game/ code; optional in components/ |
| 5. Logging & Tracing | INFO | Optional | Add perf logs for critical functions if needed |
| 6. Component Props | OPTIONAL | Skip MVP; natural extraction | Add selectors post-MVP at scale |
| 7. File Organization | DEFAULT | Guidelines, not rules | Let code structure drive organization |

**Week-by-Week Friction Prediction:**
- **Week 1-2:** Patterns 1, 2, 4 easy to start. No friction if adopted from day 1.
- **Week 3-4:** Constraint 5 (JSON serialization) catches most violations. Good circuit-breaker.
- **Week 4-5:** If Pattern 2 (actions) or Pattern 4 (Result types) violated, debugging becomes slow.
- **Week 5-6:** If patterns haven't hardened, code diverges. Cost to align: **2-4 weeks**

**Pragmatist's Recommendation:**
Implement patterns 1, 2, 4 rigorously from day 1. Partial scope on 3 (arrays/nesting; defer history). Minimize 5, 6, 7 for MVP. Refactor post-MVP without guilt—these aren't tech debt, they're natural evolution as code matures.

---
