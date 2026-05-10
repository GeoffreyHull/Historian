# OVERNIGHT MARATHON — Historian Phase 2

## Mission

Ship **every Phase 2 (Growth) feature** from the PRD. You will work autonomously through 6 phases below. After each phase, run the full pipeline (`type-check → build → test → test:golden`). Fix any failures before moving to the next phase. If stuck on a blocking issue for 15+ minutes, document the problem in a file called `BLOCKERS.md` and skip to the next phase — the priority is making progress across the full surface area.

**End goal:** Historian transformed from MVP into a polished, content-rich game with retcon, cascading world state variables, 30+ event types, 7 factions, full accessibility, and comprehensive E2E coverage.

---

## Rules (NON-NEGOTIABLE)

1. **Never mutate state** — Constraint 2. All updates return new objects.
2. **Never use Math.random()** — Constraint 3. Always `SeededRNG` or the project's seeded RNG utilities.
3. **All game state must be 100% JSON-serializable** — Constraint 5. No classes, functions, circular refs, `Map`, `Set`, `Date` in `GameState` or `WorldState`.
4. **Run `npm run type-check && npm run build && npm test && npm run test:golden` after every phase.** If any step fails, fix it before continuing.
5. **Follow existing code conventions** — Pure functions in `src/game/`, React hooks in components, CSS Modules for styling, `readonly` on all interfaces.
6. **All new features need unit tests** in `src/game/__tests__/` plus golden tests for core constraints.
7. **Write tests FIRST** (test-driven) for new game logic modules.
8. **Document any design decisions** in `_bmad-output/` as you go.

---

## Project Context (READ CAREFULLY)

### Tech Stack
- Vite 4+ / React 18+ / TypeScript 5+ (strict mode)
- CSS Modules (`*.module.css`) for all component styling
- Vitest for tests, Playwright for E2E
- `seedrandom` for deterministic RNG (Constraint 3)
- LocalStorage for persistence (Constraint 5 — JSON round-trip)
- GitHub Pages for deployment (static build to `dist/`)

### Pipeline Commands
```bash
npm run type-check    # tsc --noEmit
npm run build          # vite build
npm test              # vitest run
npm run test:golden   # vitest run (same as test for now — fix this in Phase 0)
npm run e2e           # playwright test
npm run dev           # vite dev server at localhost:3000
```

### Current MVP State (what's already DONE — do NOT break these)

All 8 epics are implemented and passing:

| Epic | What It Does |
|------|-------------|
| **Epic 1** | Game init, faction selection, initial state |
| **Epic 2** | Event generation, observation system |
| **Epic 3** | Claim writing, credibility, faction trust, influence |
| **Epic 4** | World state persistence across runs, belief tracking |
| **Epic 5** | Recap generation, HistoryBook |
| **Epic 6** | Turn flow (10-turn runs), save/load with atomic validation |
| **Epic 7** | TracingSystem, logical clock, causal chains |
| **Epic 8** | CI/CD, GitHub Pages deployment |

### Already-Shipped Phase 2 Features (already done — do NOT redo)
- ✅ **Buy Intel** — `src/game/influenceActions.ts:21-45`, `src/components/EventCard.tsx:68-78`
- ✅ **Force Events** — `src/game/influenceActions.ts:52-73`, `src/App.tsx:388-423`
- ✅ E2E tests for Buy Intel exist (`e2e/buy-intel.spec.ts`)

### Key Source Files (read these to learn patterns)

| File | Purpose |
|------|---------|
| `src/game/types.ts` | All type definitions — `GameState`, `WorldState`, `Action`, etc. |
| `src/game/constants.ts` | Event types, insult phrases, faction multipliers |
| `src/game/influenceActions.ts` | Buy intel + force event — EXAMPLE of pure function pattern |
| `src/game/eventGenerator.ts` | Event generation with seeded RNG |
| `src/game/credibilitySystem.ts` | Credibility calculation |
| `src/game/factionTrustSystem.ts` | Faction trust mechanics |
| `src/game/worldStateManager.ts` | Cross-run world state management |
| `src/game/turnExecutor.ts` | Turn orchestration — all phases |
| `src/game/gameManager.ts` | State container + reducer |
| `src/game/tracingSystem.ts` | Determinism tracing |
| `src/game/sessionPersistence.ts` | Save/load with validation |
| `src/game/recapGenerator.ts` | End-of-run narrative |
| `src/game/historyBookUtils.ts` | History book data |
| `src/game/influenceCalculator.ts` | Influence from credibility |
| `src/game/rng.ts` | Seeded RNG |
| `src/App.tsx` | Main UI — 453 lines |
| `src/components/*.tsx` | UI components |
| `src/App.module.css` | Main styles |
| `src/game/__tests__/` | All unit tests |

### Current Team Size Factions (DO NOT MODIFY NAMES — only ADD)
```typescript
export type Faction = "historian" | "scholar" | "witness" | "scribe";
```

### Current Event Types (DO NOT MODIFY TYPES — only ADD)
```typescript
weather, location, character, conversation, action, discovery
```
These map to `src/game/constants.ts:10-17` in `EVENT_TYPE_KEYWORDS`.

### Current WorldState Interface
```typescript
interface WorldState {
  readonly initialSeed: number;
  readonly runNumber: number;
  readonly factionBeliefs: Readonly<Record<Faction, readonly FactionBelief[]>>;
  readonly consequences: readonly ConsequenceRecord[];
  readonly lastUpdateTurn: TurnNumber;
  readonly history: readonly RunRecap[];
}
```

### Architecture Constraints (from `_bmad-output/planning-artifacts/architecture.md`)
- **Constraint 1**: All game logic in `src/game/` is deterministic — no I/O, no async, seeded RNG only
- **Constraint 2**: All state updates return new objects, never mutate inputs
- **Constraint 3**: All randomness through SeededRNG — never Math.random()
- **Constraint 4**: Event types are strings in registry, not hardcoded enums
- **Constraint 5**: GameState is 100% JSON-Serializable — round-trip through JSON.stringify/parse without custom serializers (LINCHPIN)
- **Constraint 6**: All state mutations via action-handler pattern; logged for replay/retcon
- **Constraint 7**: React components are presentational (derive display from props, no direct mutations)
- **Constraint 8**: All influence costs in centralized registry
- **Constraint 9**: Turn-phase determinism: [Resolve claims] → [Apply state changes] → [Trigger consequences] → [Serialize]

### Golden Test Rules (from `CLAUDE.md`)
- Tests with `[G]` prefix wrapped in `golden()` are PROTECTED — never delete or modify them unless the underlying acceptance criterion or constraint has explicitly changed. If you must modify one, document `GOLDEN REMOVAL: [reason]` in the commit message.
- Golden tests validate: Constraint 1 (pure functions), Constraint 2 (immutability), Constraint 5 (JSON serialization), Constraint 9 (determinism), AC5 (imputability & purity), AC6 (integration & determinism).

---

## PHASE 0: Pipeline Audit & Quick Fixes

### Task 0.1: Fix `npm run test:golden`
Currently `"test:golden": "vitest run"` — it runs ALL tests, not just golden tests. Fix the package.json script to run only golden tests. The test files with golden tests are:
- `src/game/__tests__/credibilitySystem.test.ts`
- `src/game/__tests__/gameManager.test.ts`
- `src/game/__tests__/eventGenerator.test.ts`

Use Vitest's `--testNamePattern="^\[G\]"` or similar to filter only tests wrapped in `golden()`.

### Task 0.2: Read all existing tests
Read every file in `src/game/__tests__/` and `e2e/`. Understand what's tested and how tests are structured. This is critical — you need this knowledge for all subsequent phases.

### Task 0.3: Run full pipeline
```bash
npm run type-check && npm run build && npm test && npm run test:golden
```
Everything must pass. If anything fails, fix it NOW.

---

## PHASE 1: Content Expansion

### Task 1.1: Add 24+ new event types (bring total from 6 to 30+)

**File: `src/game/constants.ts`**

Add to `EVENT_TYPE_KEYWORDS`:
```typescript
embargo: ["blockade", "sanctions", "tariff", "embargo", "boycott"],
rebellion: ["uprising", "revolt", "insurrection", "mutiny", "coup"],
plague: ["disease", "sickness", "pestilence", "outbreak", "epidemic"],
trade: ["merchant", "commerce", "barter", "market", "exchange"],
diplomacy: ["treaty", "alliance", "pact", "negotiation", "envoy"],
military: ["army", "siege", "battle", "campaign", "garrison"],
religion: ["temple", "ritual", "heresy", "schism", "pilgrimage"],
culture: ["festival", "tradition", "art", "music", "theatre"],
economy: ["coin", "tax", "treasury", "debt", "inflation"],
infrastructure: ["road", "bridge", "harbor", "wall", "aqueduct"],
intrigue: ["conspiracy", "betrayal", "espionage", "assassination", "blackmail"],
migration: ["exodus", "refugee", "settlement", "nomad", "resettlement"],
magic: ["omen", "curse", "prophecy", "enchantment", "ritual"],
disaster: ["earthquake", "famine", "flood", "wildfire", "drought"],
innovation: ["invention", "discovery", "breakthrough", "craft", "engineering"],
exploration: ["expedition", "voyage", "frontier", "cartography", "survey"],
justice: ["trial", "verdict", "decree", "law", "sentence"],
education: ["academy", "manuscript", "library", "scholar", "curriculum"],
romance: ["courtship", "marriage", "scandal", "alliance", "affair"],
succession: ["heir", "throne", "dynasty", "coronation", "regent"],
naval: ["fleet", "ship", "piracy", "navy", "coast"],
agriculture: ["harvest", "famine", "crop", "livestock", "irrigation"],
mining: ["mine", "quarry", "ore", "smelter", "excavation"],
hunting: ["game", "poach", "wilds", "tracking", "expedition"],
```

You must also add 5 unique description strings for each new event type to the event generator. Descriptions should be evocative, lore-friendly, and varied. Pattern: `src/game/eventGenerator.ts:16-59` has 5 per existing type. Apply the same pattern.

**Update `EVENT_TYPE_KEYWORDS` import** anywhere it's consumed to ensure the new types propagate:
- `src/game/eventGenerator.ts` — needs descriptions for each new type
- `src/game/credibilitySystem.ts` — may need updates if it keys off event types
- `src/game/worldStateManager.ts` — `getFactionBeliefInfluence` iterates over `Object.keys(EVENT_TYPE_KEYWORDS)`, should auto-pick up new types
- `src/App.tsx` — force event buttons iterate over `Object.keys(EVENT_TYPE_KEYWORDS)`, should auto-pick up new types

**Tests required:**
- Verify new event types can be generated in `eventGenerator.test.ts`
- Verify force event works with new types
- Verify belief influence works with new types
- Add golden tests for determinism with expanded event pool

### Task 1.2: Add 3 new factions (bring total from 4 to 7)

**File: `src/game/types.ts`**

Extend the `Faction` type:
```typescript
export type Faction = "historian" | "scholar" | "witness" | "scribe" | "diplomat" | "rebel" | "merchant";
```

**File: `src/game/constants.ts`**

Add insult phrases and multipliers for new factions:
```typescript
INSULTING_PHRASES: {
  // ... existing ...
  diplomat: ["deceitful", "cowardly", "spineless", "treacherous"],
  rebel: ["oppressive", "tyrannical", "authoritarian", "complacent"],
  merchant: ["greedy", "exploitative", "corrupt", "unscrupulous"],
}

FACTION_MULTIPLIERS: {
  // ... existing ...
  diplomat: 1.1,
  rebel: 0.7,
  merchant: 1.3,
}
```

**Files that must be updated for 7 factions (grep every hardcoded faction reference):**
- `src/game/worldStateManager.ts:29-33` — `createInitialWorldState` factionBeliefs initialization
- `src/game/worldStateManager.ts:59-63` — `evolveToNextRun` decayedBeliefs
- `src/game/worldStateManager.ts:227` — `updateFactionBeliefs` faction loop
- `src/game/turnExecutor.ts:135` — faction trust reset object
- `src/App.tsx:379-384` — CredibilityResult faction scores
- `src/App.tsx:442-448` — FactionTrust faction list
- All test files that construct hardcoded faction objects

**Tests required:**
- Verify all 7 factions can be selected in game init
- Verify insult detection works for new factions
- Verify faction multipliers apply correctly
- Verify faction trust updates for all 7
- Verify belief system works for all 7
- Golden tests: determinism with expanded factions

**Run full pipeline. Fix everything before Phase 2.**

---

## PHASE 2: World State Variables (Morale, Infrastructure, Economy)

This is a large new system. The PRD calls for tracked world dimensions that interact with events. Currently `WorldState` only tracks beliefs and consequences — no numeric variables.

### Task 2.1: Add WorldStateVariables interface

**File: `src/game/types.ts`**

Add:
```typescript
export interface WorldStateVariables {
  readonly morale: number;       // [0, 100] — public sentiment, affected by claims about suffering/success
  readonly infrastructure: number; // [0, 100] — roads, walls, harbors, affected by claims about decay/build
  readonly economy: number;      // [0, 100] — trade, coin, affected by claims about commerce/plague
}
```

Add to `WorldState`:
```typescript
export interface WorldState {
  // ... existing fields ...
  readonly variables: WorldStateVariables;
}
```

Update `createInitialWorldState` to initialize variables at 50 (neutral).

Update `evolveToNextRun` to carry variables forward with decay (mean-revert toward 50 at ~10% per run).

### Task 2.2: Create world state variable system

**New file: `src/game/worldStateVariables.ts`**

```typescript
// Pure functions for updating and querying WorldStateVariables.
// Pattern: matches worldStateManager.ts style.

export interface VariableDelta {
  readonly morale: number;    // [-100, +100] change per event
  readonly infrastructure: number;
  readonly economy: number;
}

// Calculate deltas from a set of claims and credibility results
export function calculateVariableDeltas(
  claims: readonly Claim[],
  credibilityResults: readonly CredibilityResult[],
  events: readonly Event[],
  currentFaction: Faction
): VariableDelta;

// Apply deltas to current variables, clamping to [0, 100]
export function applyVariableDeltas(
  variables: WorldStateVariables,
  deltas: VariableDelta
): WorldStateVariables;

// Get event probability modifiers based on world state
// e.g., economy < 30 → rebellion events more likely
export function getEventProbabilityModifiers(
  variables: WorldStateVariables
): Readonly<Record<string, number>>;

// Generate narrative text describing current world state
export function describeWorldState(
  variables: WorldStateVariables
): string;

// Mean-revert variables toward 50 (recovery over time)
export function decayVariables(
  variables: WorldStateVariables,
  rate: number
): WorldStateVariables;
```

### Task 2.3: Integrate into turn flow

**File: `src/game/turnExecutor.ts`**

Add to `executeTurn()`:
- After Phase 4 (influence calculation), calculate and apply variable deltas based on credibility results and claim content
- Pass `worldState.variables` into `eventGenerator.generateEvents()` via a new parameter

**File: `src/game/eventGenerator.ts`**

Modify `generateEvents()` to accept optional `WorldStateVariables` and use `getEventProbabilityModifiers()` to skew event type probabilities:
- `economy < 30` → embargo, trade events get +2.0 weight
- `morale < 30` → rebellion, disaster events get +2.0 weight
- `infrastructure < 30` → infrastructure, disaster events get +2.0 weight
- `economy > 70` → culture, innovation events get +1.5 weight
- `morale > 70` → culture, romance events get +1.5 weight
- `infrastructure > 70` → trade, education events get +1.5 weight

### Task 2.4: Export variables in GameState

Add `worldStateVariables` to `GameState` interface and all construction sites. The UI should display them.

### Task 2.5: UI for world state variables

**File: `src/components/WorldStatePanel.tsx`** (new component)
- Shows morale, infrastructure, economy as bars with labels
- Color coding: green (>60), yellow (30-60), red (<30)
- Text label describing the state (from `describeWorldState()`)
- aria labels for accessibility

**File: `src/App.tsx`**
- Import `WorldStatePanel` and render it in the sidebar (below FactionTrust)

**File: `src/components/WorldStatePanel.module.css`** (new styles)

### Task 2.6: Tests

Write `src/game/__tests__/worldStateVariables.test.ts`:
- Test `calculateVariableDeltas` with various claim/credibility combinations
- Test `applyVariableDeltas` clamping
- Test `getEventProbabilityModifiers` at all state ranges
- Test `decayVariables` mean reversion
- Golden `[G]` tests: immutability, determinism, JSON serialization round-trip

**Run full pipeline. Fix everything before Phase 3.**

---

## PHASE 3: Cascading Faction Reaction Chains

Currently consequences are single-level: `Claim → ConsequenceRecord → Future event text reference`. Phase 3 makes them multi-level.

### Task 3.1: Extend consequence types

**File: `src/game/types.ts`**

Add:
```typescript
export interface CascadingConsequence extends ConsequenceRecord {
  readonly depth: number;              // How many levels deep (0 = root claim, 1 = first cascade, etc.)
  readonly triggeredEventType: string; // The event type this consequence manifests as
  readonly affectedVariable: keyof WorldStateVariables | null; // Which world variable this affects
  readonly variableDelta: number;       // [-50, +50] change to affected variable
}
```

Update `WorldState.consequences` type from `ConsequenceRecord[]` to `CascadingConsequence[]`. Keep the original `ConsequenceRecord` interface for backward compat — you can extend it or create an intersection.

### Task 3.2: Implement cascade logic

**File: `src/game/worldStateManager.ts`**

Add/modify:
- `recordConsequences()` → generate consequences that have a chance to cascade. Each consequence can trigger 1-3 child consequences with the same event type or related types.
- Cascade depth limit: max 3 levels deep (prevents infinite chains).
- Each cascade level has reduced intensity (50% of parent).
- Consequences should reference world state variables — e.g., a plague claim → economy drops → embargo event more likely → embargo causes morale drop → rebellion more likely.

Add new function:
```typescript
export function cascadeConsequences(
  currentConsequences: readonly CascadingConsequence[],
  eventGenerator: EventGenerator,
  currentTurn: TurnNumber
): { newConsequences: CascadingConsequence[]; triggeredEvents: Event[] };
```

### Task 3.3: Integrate cascades into turn flow

**File: `src/game/turnExecutor.ts`**

After Phase 5 (world state update), call `cascadeConsequences()` to generate secondary effects. Each cascade cycle:
1. Check each existing consequence for cascade probability (intensity / 100 * depthFactor)
2. Generate 0-2 new cascading consequences per parent
3. Apply variable deltas from cascades to world state variables
4. Add cascade-triggered events to the current turn's events (with special description referencing the cascade)

Cascade probability formula: `baseChance = parent.intensity / 100`, modified by `depth: depth 0 = 1.0x, depth 1 = 0.5x, depth 2 = 0.25x, depth 3+ = 0`

### Task 3.4: Display cascade info

**File: `src/components/CascadeView.tsx`** (new component)
- Shows active cascading consequences in the sidebar
- Each with depth indicator, event type, intensity bar
- Click to see detail tooltip showing the causal chain

**File: `src/App.tsx`** — render CascadeView in sidebar

### Task 3.5: Update recap to mention cascades

**File: `src/game/recapGenerator.ts`**
- Include cascade chains in the end-of-run recap narrative
- E.g., "Your claim of plague caused trade routes to falter, which led to economic hardship, which sparked rebellion in the outer provinces."

### Task 3.6: Tests

Write `src/game/__tests__/cascadingConsequences.test.ts`:
- Test single cascade generation
- Test multi-level cascade (3 levels)
- Test cascade termination (depth limit, intensity threshold)
- Test variable effects from cascades
- Test determinism — same claims + same seed = same cascade chain
- Golden `[G]` tests: immutability, JSON serialization of cascading consequences, determinism across runs

**Run full pipeline. Fix everything before Phase 4.**

---

## PHASE 4: Retcon System

Retcon allows the player to rewind to a previous turn, change a claim, and replay from that point. The architecture already supports this (pure functions, deterministic RNG, immutable state, action logging) but no implementation exists.

### Task 4.1: Add snapshot storage

**File: `src/game/types.ts`**

Add to `GameState`:
```typescript
export interface GameState {
  // ... existing fields ...
  readonly snapshots: readonly TurnSnapshot[]; // Turn-by-turn snapshots for retcon
  readonly retconMode: boolean;                 // Is player currently in retcon mode?
  readonly retconTargetTurn: TurnNumber | null; // Which turn they rewound to
}
```

Add:
```typescript
export interface TurnSnapshot {
  readonly turnNumber: TurnNumber;
  readonly state: GameState;                      // Full state at start of this turn
  readonly claimsMade: readonly Claim[];          // Claims made during this turn
  readonly credibilityResults: readonly CredibilityResult[];
  readonly generatedEvents: readonly Event[];
}
```

### Task 4.2: Create retcon system

**New file: `src/game/retconSystem.ts`**

```typescript
// Take a snapshot of current state at the start of each turn
export function takeSnapshot(
  gameState: GameState,
  claimsMade: readonly Claim[],
  credibilityResults: readonly CredibilityResult[],
  generatedEvents: readonly Event[]
): TurnSnapshot;

// Snapshot is stored in gameState.snapshots[turnNumber - 1]

// Enter retcon mode: rewind to a previous turn
export function enterRetcon(
  gameState: GameState,
  targetTurnNumber: TurnNumber
): GameState;
  // 1. Find the snapshot for targetTurnNumber
  // 2. Set retconMode = true, retconTargetTurn = targetTurnNumber
  // 3. Restore state from snapshot
  // 4. Keep all snapshots (don't discard future ones yet)

// Exit retcon mode (discard future snapshots, keep changes)
export function commitRetcon(
  gameState: GameState
): GameState;
  // 1. Set retconMode = false, retconTargetTurn = null
  // 2. Discard all snapshots after the retcon point
  // 3. Take new snapshot for current turn
  
// Cancel retcon (restore original state, discard changes)
export function cancelRetcon(
  gameState: GameState,
  originalSnapshotsBackup: readonly TurnSnapshot[]
): GameState;
  // Restore state from backup of snapshots before retcon was entered

// Get available retcon targets (turns with snapshots, not current turn)
export function getRetconTargets(
  gameState: GameState
): TurnNumber[];

// Check if retcon is affordable (cost in influence)
export const RETCON_COST = 5;
export function canRetcon(
  gameState: GameState,
  targetTurnNumber: TurnNumber
): boolean;
```

### Task 4.3: Integrate retcon into turn flow

**File: `src/game/turnExecutor.ts`**

At the START of each turn execution, call `takeSnapshot()` to store the pre-turn state BEFORE any phase runs. This ensures snapshots capture clean state boundaries.

Update `executeTurn()` to handle retcon mode:
- If `retconMode`, allow claims to be re-submitted for the retconned turn
- After turn resolves in retcon mode, stay in retcon mode until player commits or cancels

### Task 4.4: Retcon UI

**File: `src/components/RetconPanel.tsx`** (new component)
- Button to enter retcon mode: "Rewrite History (5 influence)"
- Shows available turns to rewind to (numbered list with brief summary: "Turn 3 — made claims about plague, weather")
- "Commit Changes" and "Cancel" buttons when in retcon mode
- Visual indicator that player is in retcon mode (distinct border/color)
- Disabled tooltip if can't afford retcon: "Need 5 influence (have X)"

**File: `src/App.tsx`** — integrate RetconPanel
- Show "Rewrite History" button in sidebar
- When in retcon mode, swap the normal playing UI for retcon UI
- On commit/cancel, return to normal playing mode

**File: `src/components/RetconPanel.module.css`**

### Task 4.5: Tests

Write `src/game/__tests__/retconSystem.test.ts`:
- Test `takeSnapshot` captures correct state
- Test `enterRetcon` restores state correctly
- Test `commitRetcon` discards future snapshots
- Test `cancelRetcon` restores original state
- Test determinism: rewind → make same claims → get same results
- Test determinism: rewind → make different claims → get different (but deterministic) results
- Golden `[G]` tests: immutability (snapshot doesn't share references), JSON serialization round-trip of snapshots

### Task 4.6: Retcon E2E test

**New file: `e2e/retcon.spec.ts`**
- Start game, play through 3 turns
- Use retcon to rewind to turn 2
- Change a claim
- Verify the timeline branched

**Run full pipeline. Fix everything before Phase 5.**

---

## PHASE 5: Polish & Production Readiness

### Task 5.1: Rewrite README.md

Replace the current README (which is still the very first project scaffold with wrong file lists and setup instructions) with a proper README:

- Game description (elevator pitch)
- Screenshots/screens section (just placeholder for now)
- How to run: `npm install` → `npm run dev`
- How to build: `npm run build`
- How to test: `npm test` / `npm run test:golden` / `npm run e2e`
- Tech stack overview
- Project structure tree (current state)
- Architecture overview (pure functions, deterministic RNG, JSON serialization)
- Factions and mechanics summary
- Phase 2 features summary
- Link to PRD and architecture docs in `_bmad-output/`
- Development workflow with BMad

### Task 5.2: Add missing E2E tests

**`e2e/game-over.spec.ts`** — Tests FR17-FR18 auto-loss scenario:
1. Select a faction
2. Make consistently insulting/bad claims to tank all faction trust below -100
3. Verify the "All factions have lost faith" game over screen appears
4. Verify "Return to Main Menu" button works

**`e2e/full-run-completion.spec.ts`** — Tests full 10-turn run with recap:
1. Start a new game
2. Make claims each turn for all 10 turns
3. Verify recap screen shows after turn 10
4. Verify "Begin Run N+1" button works
5. Verify next run starts with accumulated world state

**`e2e/history-book-persistence.spec.ts`** — Tests cross-run history:
1. Complete a full run (10 turns)
2. Start a second run
3. Access the history book during run 2
4. Verify run 1 recap is visible in history book

### Task 5.3: Accessibility audit

Implement each of these NFR7-NFR10 requirements:

**NFR7 (No seizure triggers):**
- Audit all CSS for animations/transitions — if any CSS transitions exist, ensure they're < 3 flashes per second. Remove any `@keyframes` with flashing.
- Add `prefers-reduced-motion` media query to disable all animations.

**NFR8 (Color-blind safe):**
- Replace all color-only indicators (red/green trust bars) with patterns + text labels + icons
- Add `aria-label` to all faction displays
- Update `FactionTrust.tsx` to show text labels like "Trust: 45 (Strained)" alongside any color

**NFR9 (Text scaling to 200%):**
- Audit all CSS for fixed dimensions. Replace `px` heights/widths on text containers with `em`/`rem`.
- Ensure no `white-space: nowrap` on text elements that could truncate.
- Test by temporarily setting `html { font-size: 200%; }` — fix any overlapping/truncated elements.

**NFR10 (Contrast AA):**
- Calculate current contrast ratios. Body text must be 4.5:1 minimum. UI components must be 3:1 minimum.
- If current color scheme doesn't meet AA, adjust colors (darken text or lighten backgrounds).
- Document the color palette with contrast ratios.

### Task 5.4: Add `e2e/accessibility.spec.ts`
- Basic keyboard navigation test (Tab through all interactive elements)
- Verify no focus traps
- Verify all buttons have accessible names

### Task 5.5: Fix any remaining tech debt

- Remove `console.warn` calls from production code (replace with tracing system where needed)
- Ensure `npm run type-check` has zero errors (strict mode)
- Check for any `any` type usage in TypeScript and replace with proper types

### Task 5.6: Run full pipeline one final time
```bash
npm run type-check && npm run build && npm test && npm run test:golden && npm run e2e
```
Everything must pass. No warnings, no errors.

---

## PHASE 6: Validation & Summary

### Task 6.1: Run the FULL pipeline
```bash
npm run type-check && npm run build && npm test && npm run test:golden
```
Also verify `npm run e2e` passes.

### Task 6.2: Generate summary document

Create `_bmad-output/phase-2-completion-report.md` with:
- What was implemented in each phase
- Current event type count and faction count
- New files created (path + line count)
- Files modified (path + summary of changes)
- Test counts (unit, golden, E2E) before and after
- Pipeline status (all green)
- Any remaining known issues or TODOs
- What's left for future work

### Task 6.3: Start the dev server
Run `npm run dev` and verify the app loads at localhost:3000. Do a quick manual check:
- Main menu renders
- Can start a game
- Events display
- Can make claims
- New factions appear
- World state variables show
- Force event works
- Retcon works
- End turn works
- Save/load works
- History book accessible

---

## When Everything Is Done

Write a final summary message listing ALL changes made, organized by phase. Include:
- Total new code (files + lines)
- Total tests (unit + golden + E2E)
- Pipeline status
- Any known issues

Then the marathon is complete. 🏁
