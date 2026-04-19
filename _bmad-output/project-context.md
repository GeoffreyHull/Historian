---
project_name: 'Historian'
user_name: 'Geoff'
date: '2026-04-19'
status: 'complete'
sections_completed: ['discovery', 'intent-driven-architecture', 'extension-points', 'checklist', 'critical-anti-patterns']
architecture_paradigm: 'deterministic-replayable-extensible'
future_features_designed_for: ['retcon', 'force_events', 'buy_intel', 'mod_support', 'multiplayer', 'persistent_saves']
critical_rules_count: 8
total_sections: 12
optimized_for_llm: true
last_updated: '2026-04-19'
---

# Project Context for AI Agents: Historian Game

_Critical rules and patterns that AI agents must follow when implementing Historian. This document focuses on **architectural intent**—the reasoning behind constraints, not just the constraints themselves. Future features (retcon, multiplayer, mods) are designed into the architecture NOW._

---

## Architectural Intent

**Historian is designed for deterministic, replayable, horizontally-extensible game logic.**

This means:
- Every game state must be reproducible from the same events + RNG seed (enables testing, replays, multiplayer sync)
- Game logic must be pure functions with no I/O, async, or side effects (enables mods, retcon, deterministic replay)
- State must be serializable to JSON for save/load and network transmission (enables persistent saves, multiplayer)
- Time-travel features (retcon, replay) require immutable state and append-only event logs, not in-place mutations (enables rewinding game state and replaying from checkpoints)

This architecture makes **retcon, multiplayer, and mods not "future features" but inevitable extensions** of the core design. If you follow these constraints, adding these features is an afternoon of work, not a rewrite.

---

## Technology Stack & Versions

### Core Technologies
- **Node.js** 18+ (ES2022 features + native fetch)
- **TypeScript** 5.0+ (const type parameters, strict mode enforced)
- **React** 18+ (concurrent features, automatic batching, strict mode catching mutations early)
- **Vite** 4+ (plugin API stability, HMR reliability)
- **CSS Modules** (zero bundle bloat, no style conflicts)
- **seedrandom** npm package (deterministic PRNG, portable across platforms)

### Version Constraints & Why They Matter

**Node 18+**: ES2022 target produces cleaner output. Native ESM support. Vite expects it.

**TypeScript 5.0+**: `const` type parameters enable type-safe generic patterns in game state. Strict mode catches mutations early (critical for immutability).

**React 18+**: Automatic batching prevents state inconsistency during turn transitions. Strict mode double-rendering exposes side effects. **Do not use older versions—they lack the guarantees needed for turn-based state consistency.**

**Vite 4+**: CSS Module handling is stable. Plugin API is finalized. Asset imports with `?url` and `?raw` work reliably.

**seedrandom 4.4.0+**: Ensures portable, reproducible randomness across platforms. Earlier versions have minor edge cases with seed initialization.

---

## Architectural Constraints

Each constraint below is paired with "Why This Matters" and "What It Enables" so agents understand the reasoning, not just the rule.

---

### 1. Pure Functions in src/game/ — Enables Deterministic Replay

**The Constraint**

Game logic in `src/game/` (eventGenerator, credibilitySystem, gameManager) must export pure functions:
- No React imports
- No API calls or I/O
- No `Math.random()` — all randomness injected as a SeededRNG parameter
- No mutations of input arguments
- Same inputs → same outputs, always

**Why This Matters**

- **Multiplayer Sync**: If `eventGenerator(seed)` is pure, both Player A and Player B with the same seed get identical events. No server needed for event generation, just event log synchronization.
- **Retcon**: To rewind to turn 5 and replay turns 6–20, you call the same pure functions with the same seed. You get the exact same game state as if you'd played differently from the start.
- **Testing**: `generateEvent(seed=42)` always produces the same event. No mocking, no flakiness. Deterministic tests catch bugs reliably.

**What It Enables**

- Automated testing: `assert(eventGenerator(42) === expectedEvent)` — reproducible test fixtures
- Deterministic save/load: Save game at turn 10, load it, continue from exact same state
- Future retcon: Rewind to turn 5, modify a claim, replay turns 6–20 with no divergence
- Future multiplayer: Same seed on both clients → same events → cheap sync (just action log + state hash)
- Future mods: Event mod can wrap the generator: `mods.forEach(mod => events = mod(events))` — still deterministic

**Pattern Example**

```typescript
// ✓ GOOD: Pure, deterministic
export function generateEvents(
  turn: number,
  rng: SeededRNG,
  factionCount: number
): Event[] {
  const eventCount = rng.next(2, 7); // 2–6 events
  return Array.from({ length: eventCount }, (_, i) => ({
    id: `turn${turn}-event${i}`,
    type: eventTypes[rng.next() % eventTypes.length],
    factionId: factions[rng.next() % factionCount],
  }));
}

// ✗ WRONG: Non-deterministic (calls Math.random)
export function generateEvents(turn: number, factionCount: number): Event[] {
  const eventCount = Math.floor(Math.random() * 5) + 2; // Varies each run
  // ...
}

// ✗ WRONG: Side effects (API call)
export async function generateEvents(turn: number): Promise<Event[]> {
  const response = await fetch('/api/events');
  return response.json(); // Different each run
}
```

---

### 2. Immutable GameState — Enables Snapshots and Retcon

**The Constraint**

Never mutate `GameState` in place. All state transitions produce a new immutable object:
- `advanceTurn(state)` returns a new GameState, doesn't mutate the input
- All updates are transformations: `{...state, fieldA: newValue}`
- Events and Claims are append-only records (never delete, only add new versions)

**Why This Matters**

- **Snapshots**: To implement retcon, you save `snapshots[turn] = JSON.parse(JSON.stringify(state))` at each turn. Later, restore that snapshot to rewind.
- **Replay Safety**: If state is immutable, replaying turns doesn't have side effects from old mutations. Same seed, same replay, same result.
- **Testing**: Immutable state makes it easy to compare "state before" and "state after" without hidden mutations.

**What It Enables**

- Snapshots at each turn boundary: `snapshots[5] = {...gameState}` enables retcon
- Action replay: Replay turns 6–20 from a saved snapshot without divergence
- Branch detection: Compare `snapshots[5]` with recomputed state after retcon — if they diverge, catch the bug
- Future multiplayer: Clients can validate sync by comparing immutable state objects

**Pattern Example**

```typescript
// ✓ GOOD: Immutable update
export function advanceTurn(state: GameState): GameState {
  return {
    ...state,
    currentTurn: state.currentTurn + 1,
    factions: state.factions.map(faction => ({
      ...faction,
      trust: Math.max(-200, faction.trust - 5), // Decay trust over time
    })),
  };
}

// ✗ WRONG: Mutates input state
export function advanceTurn(state: GameState): GameState {
  state.currentTurn += 1; // Mutation
  state.factions.forEach(f => (f.trust -= 5)); // Mutation
  return state;
}

// ✓ GOOD: Append-only event log
export function addClaim(state: GameState, claim: Claim): GameState {
  return {
    ...state,
    playerBook: [...state.playerBook, claim],
  };
}

// ✗ WRONG: Mutates the claims array
export function addClaim(state: GameState, claim: Claim): GameState {
  state.playerBook.push(claim); // Mutation
  return state;
}
```

---

### 3. Seeded Deterministic RNG — Enables Reproducibility

**The Constraint**

All randomness must flow through a single SeededRNG instance:
- Initialize: `rng = new SeededRNG(seed)`
- Use: `nextValue = rng.next(min, max)` or `rng.nextFromArray(options)`
- Never call `Math.random()`
- Pass RNG as a parameter to any function that needs randomness

**Why This Matters**

- **Deterministic Testing**: Same seed → same event sequence → same credibility calculation every time
- **Multiplayer**: Both players initialize with `rng = SeededRNG(12345)` → both generate identical events → cheap sync
- **Retcon**: When replaying turns 6–20 after a retcon, use the same seed → identical events to the original playthrough

**What It Enables**

- Reproducible test fixtures: `eventGenerator(seed=42)` always produces the same event
- Multiplayer without server event generation: Just share the seed, both clients generate identical events
- Save/load with verification: `savedGame.seed` + action history → recompute state and verify it matches saved state
- Future mods: Mods get the same seeded RNG, stay deterministic

**Pattern Example**

```typescript
// ✓ GOOD: Seeded RNG
import SeededRNG from 'seedrandom';

export function generateEvents(
  turn: number,
  seed: number,
  factionCount: number
): Event[] {
  const rng = new SeededRNG(seed);
  const eventCount = rng.nextInt(2, 7);
  return Array.from({ length: eventCount }, (_, i) => ({
    type: eventTypes[rng.nextInt(0, eventTypes.length)],
  }));
}

// ✗ WRONG: Uses Math.random()
export function generateEvents(
  turn: number,
  factionCount: number
): Event[] {
  const eventCount = Math.floor(Math.random() * 5) + 2; // Non-deterministic
  return [];
}
```

---

### 4. Events are Extensible by Design — Enables Mods and Custom Logic

**The Constraint**

Events use a flexible schema that mods can extend:
- `type: string` (not a hardcoded enum) — mods can register new types
- `metadata: Record<string, unknown>` — flexible key-value store for event-specific data
- Event handlers are stored in a registry: `Map<eventType, CredibilityHandler>`
- No `if (event.type === 'war') { ... }` chains — lookup in the handler registry

**Why This Matters**

- **Mods**: A mod can register a custom event type `'dragon_invasion'` without touching core game logic
- **Extensibility**: Adding new event types doesn't require editing eventGenerator.ts — just register a handler
- **Decoupling**: Core game logic doesn't know about all possible event types, making it simpler to test

**What It Enables**

- Custom event types (mods): `eventHandlers.set('custom_mod_event', customHandler)`
- Force events feature: `gameManager.forceEvent({ type: 'whatever', metadata: {...} })`
- Future faction reaction rules: Each faction declares `reactions: Reaction[]` that match against event types
- Audit trail: Since events are data (not code), you can serialize them, replay them, inspect them

**Pattern Example**

```typescript
// ✓ GOOD: Extensible event schema
type Event = {
  id: string;
  type: string; // Flexible — mods can add new types
  turnGenerated: number;
  factionId?: string;
  metadata: Record<string, unknown>; // Event-specific data
  truthValue: Record<string, unknown>; // Ground truth for scoring
};

// Register handlers in a map
type CredibilityHandler = (
  event: Event,
  claims: Claim[],
  state: GameState
) => CredibilityResult;

const eventHandlers: Map<string, CredibilityHandler> = new Map([
  ['rebellion', (event, claims) => { /* rebellion logic */ }],
  ['famine', (event, claims) => { /* famine logic */ }],
]);

// Mods register new handlers
function registerMod(modId: string, events: ModEvent[]) {
  events.forEach(e => {
    eventHandlers.set(`${modId}.${e.type}`, e.handler);
  });
}

// ✗ WRONG: Hardcoded event types
type Event = 'rebellion' | 'famine' | 'succession'; // Can't extend
if (event === 'rebellion') { /* handle */ }
else if (event === 'famine') { /* handle */ }
// Adding a new type requires editing this file
```

---

### 5. GameState is 100% JSON-Serializable — Enables Saves and Multiplayer Sync

**The Constraint**

The entire `GameState` object must round-trip through JSON without custom serializers:
- No `Date` objects — use `number` (milliseconds since epoch)
- No `Map`, `Set`, or other non-JSON types — use arrays and objects
- No functions or circular references
- Test: `JSON.stringify(state) → JSON.parse(...) → state` produces identical object

**Why This Matters**

- **Saves**: File format is JSON. Load a saved game by deserializing JSON.
- **Multiplayer**: Send state over the wire as JSON. No custom serializers needed.
- **Retcon**: Store snapshots as JSON for compact storage and easy comparison.
- **Mods**: Mods can extend state with custom data — as long as it's JSON-serializable.

**What It Enables**

- File-based saves: `writeFile('game.json', JSON.stringify(gameState))`
- Network serialization: `socket.emit('state_update', gameState)` — automatically JSON stringified
- State snapshots: `snapshots[5] = JSON.parse(JSON.stringify(state))` for retcon
- State hashing: `hash(JSON.stringify(state))` to verify multiplayer sync

**Pattern Example**

```typescript
// ✓ GOOD: Fully JSON-serializable
type GameState = {
  currentTurn: number;
  lastUpdatedMs: number; // number, not Date
  events: Event[]; // Array, not Map
  factions: Faction[]; // Array with plain objects
};

// ✓ Save and restore
const saved = JSON.stringify(gameState);
const restored = JSON.parse(saved);
// restored is identical to gameState

// ✗ WRONG: Non-serializable types
type GameState = {
  currentTurn: number;
  lastUpdated: Date; // ❌ Can't serialize Date
  eventMap: Map<string, Event>; // ❌ Can't serialize Map
  callback: () => void; // ❌ Can't serialize functions
};

const saved = JSON.stringify(gameState); // Loses data
const restored = JSON.parse(saved); // Missing fields
```

---

### 6. All Mutations Go Through Actions — Enables Replay and Audit Trails

**The Constraint**

State updates happen via an action-handler pattern, not direct mutations:
- Define `GameAction` as a discriminated union (e.g., `{ type: 'publish'; claims: Claim[] }`)
- Create handlers: `handlers: Map<actionType, ActionHandler>`
- Update state only via `applyAction(state, action) → newState`
- Log all actions: `actionHistory: GameAction[]`

**Why This Matters**

- **Retcon**: Action history is the record of what the player did. Replaying actions in the same order produces the same game state.
- **Replay Safety**: Because handlers are pure and deterministic, `replayActions(oldState, [action1, action2, ...])` produces the exact same state as the original playthrough.
- **Undo/Redo**: Store action history to enable rewinding (retcon) or replaying (debugging).

**What It Enables**

- Action replay: `replayActions(startState, actionHistory.slice(0, 10))` to get state at action 10
- Retcon implementation: Restore state at turn 5, modify an action, replay actions 5+
- Audit trails: Log all actions to understand the game history
- Testing: `applyAction(state, action)` with known inputs → verify known outputs

**Pattern Example**

```typescript
// ✓ GOOD: Action-based state updates
type GameAction =
  | { type: 'publish'; claims: Claim[] }
  | { type: 'spendInfluence'; actionType: 'retcon' | 'force' | 'intel'; cost: number }
  | { type: 'advanceTurn' };

type ActionHandler = (state: GameState, action: GameAction) => GameState;

const handlers: Map<string, ActionHandler> = new Map([
  ['publish', (state, action) => {
    const credibility = calculateCredibility(action.claims, state);
    return { ...state, credibility, playerBook: [...state.playerBook, ...action.claims] };
  }],
  ['advanceTurn', (state) => advanceTurn(state)],
]);

export function applyAction(state: GameState, action: GameAction): GameState {
  const handler = handlers.get(action.type);
  if (!handler) throw new Error(`Unknown action type: ${action.type}`);
  return handler(state, action);
}

// ✗ WRONG: Direct mutations
export function publishBook(state: GameState, claims: Claim[]): void {
  state.playerBook.push(...claims); // Mutation, not reproducible
  state.credibility = calculateCredibility(claims); // Mutation
}
```

---

### 7. Components are Presentational — Enables Testability and UI Mods

**The Constraint**

React components (`GameBoard.tsx`, `BookWriter.tsx`) are presentational:
- Derive display state from props (passed game state)
- Call event handlers via callbacks — don't mutate state directly
- No side effects beyond `setState`
- All game logic calls go through gameManager (passed as prop or context)

**Why This Matters**

- **Testability**: Render `<GameBoard gameState={mockState} />` without mocking gameManager
- **Reusability**: Same component works with different game states
- **UI Mods**: Mods can wrap components with custom styling/layout, same logic interface

**What It Enables**

- Isolated component testing: `render(<GameBoard {...mockProps} />)` with no dependencies
- Future UI mods: Custom theme for BookWriter that calls the same `onPublish` callback
- Component snapshot testing: Same state → same component output
- Multiplayer: Multiple clients render the same game state, UI stays consistent

**Pattern Example**

```typescript
// ✓ GOOD: Presentational component
export function GameBoard({
  gameState,
  onPublish,
}: {
  gameState: GameState;
  onPublish: (claims: Claim[]) => void;
}) {
  const [draftClaims, setDraftClaims] = useState<Claim[]>([]);

  return (
    <div>
      <h1>Turn {gameState.currentTurn}</h1>
      <EventList events={gameState.observedEvents} />
      <button onClick={() => onPublish(draftClaims)}>Publish Book</button>
    </div>
  );
}

// ✗ WRONG: Component mutates game state
export function GameBoard({ gameState }: { gameState: GameState }) {
  const handlePublish = (claims: Claim[]) => {
    gameState.playerBook.push(...claims); // ❌ Direct mutation
    gameState.currentTurn += 1; // ❌ Direct mutation
    // No way to replay or test this
  };
}
```

---

### 8. Influence Costs are Centralized and Pluggable — Enables Future Features

**The Constraint**

All influence costs are defined in a single registry:
- `INFLUENCE_COSTS: Record<actionType, { min: number; max: number }>`
- No hardcoded costs scattered across the codebase
- Validation: `canSpendInfluence(actionType, currentInfluence, actualCost)` checks against registry
- Mods can register new action types with costs

**Why This Matters**

- **Scaling**: Retcon (40–60), Force events (30–50), Buy intel (20–40), + future influence-costing features all live in one place
- **Balancing**: Change costs without refactoring code — just update the registry
- **Extensibility**: Mods add new actions with costs without touching core logic

**What It Enables**

- Centralized cost management: Balance all influence actions in one data structure
- Future features: Add new influence-costing actions (e.g., "Bribe Faction" 35–55) without code changes
- Validation: `canSpendInfluence()` enforces cost constraints before applying actions
- Mods: Register custom influence actions with costs

**Pattern Example**

```typescript
// ✓ GOOD: Centralized, extensible costs
const INFLUENCE_COSTS = {
  retcon: { min: 40, max: 60 },
  force_event: { min: 30, max: 50 },
  buy_intel: { min: 20, max: 40 },
} as const;

export function canSpendInfluence(
  actionType: string,
  currentInfluence: number,
  actualCost: number
): boolean {
  const costRange = INFLUENCE_COSTS[actionType as keyof typeof INFLUENCE_COSTS];
  if (!costRange) return false; // Unknown action type
  return actualCost >= costRange.min &&
    actualCost <= costRange.max &&
    currentInfluence >= actualCost;
}

// Mods register new costs
function registerModInfluenceAction(actionType: string, min: number, max: number) {
  INFLUENCE_COSTS[actionType] = { min, max };
}

// ✗ WRONG: Hardcoded costs scattered
export function spendInfluence(state: GameState, actionType: string): GameState {
  if (actionType === 'retcon') {
    state.influence -= 50; // Hardcoded cost
  } else if (actionType === 'force_event') {
    state.influence -= 45; // Different place, different cost
  }
  // Impossible to maintain or extend
}
```

---

## Extension Points: How Future Features Work Within These Constraints

This section shows how the architecture supports retcon, multiplayer, and mods *without requiring core refactors*.

---

### Implementing Retcon (Time-Travel Debugging)

**What Retcon Does**: Player rewinds to turn N, modifies a claim, and replays turns N+1 to 20 to see what would have happened.

**How the Architecture Supports It**

1. **Save snapshots at each turn**:
   ```typescript
   snapshots[turn] = JSON.parse(JSON.stringify(gameState));
   actionHistory[turn] = [actions taken this turn];
   ```

2. **When player clicks retcon to turn 5**:
   ```typescript
   function retconToTurn(targetTurn: number, modifiedAction: GameAction) {
     // Restore the state at the target turn
     const restoredState = JSON.parse(JSON.stringify(snapshots[targetTurn]));
     
     // Apply the modified action
     let state = applyAction(restoredState, modifiedAction);
     
     // Replay all actions from turn targetTurn+1 onward
     for (let turn = targetTurn + 1; turn <= currentTurn; turn++) {
       for (const action of actionHistory[turn]) {
         state = applyAction(state, action);
       }
     }
     
     return state; // New state as if the modification happened from the start
   }
   ```

**Why This Works**

- **Immutable state**: Snapshots are deep copies; replaying doesn't mutate originals
- **Pure action handlers**: Replaying `applyAction()` with the same actions produces the same state
- **Action history**: Stored actions can be re-applied in the same order
- **Deterministic RNG**: Events generated during replay use the same seed, producing identical events

**Not Yet Implemented, But Designed For**

Retcon will land as a ~50-line feature that relies entirely on these constraints. When you implement it, you'll see why immutability and pure functions matter.

---

### Multiplayer Sync (Planned Feature)

**What Multiplayer Does**: Multiple players write books about the same world events, their credibility is calculated, and turns advance in sync.

**How the Architecture Supports It**

1. **Server generates seed**: `seed = randomInt()`

2. **Both clients initialize**:
   ```typescript
   const rng = new SeededRNG(seed);
   const events = generateEvents(turn, rng, factionCount);
   ```

3. **Clients calculate credibility independently**:
   ```typescript
   const credibilityA = calculateCredibility(claimsA, events);
   const credibilityB = calculateCredibility(claimsB, events);
   ```

4. **Clients verify sync**:
   ```typescript
   const stateHashA = hash(JSON.stringify(gameStateA));
   const stateHashB = hash(JSON.stringify(gameStateB));
   assert(stateHashA === stateHashB); // If different, someone cheated
   ```

**Why This Works**

- **Seeded RNG**: Same seed on both clients → identical events (no server RNG needed)
- **Pure game logic**: Both clients run the same code, get the same results
- **JSON serialization**: State can be hashed to verify sync without sending full state
- **Deterministic credibility**: Known inputs (events, claims) → known outputs (credibility)

**Not Yet Implemented, But Designed For**

Multiplayer will add a network layer that syncs actions and verifies state hashes. The game logic stays unchanged.

---

### Mod Support (Custom Factions, Events, Rules)

**What Mods Do**: Players can create custom event types, faction reactions, or credibility rules without touching core code.

**How the Architecture Supports It**

1. **Mods register event types**:
   ```typescript
   function registerMod(mod: Mod) {
     mod.events.forEach(event => {
       eventHandlers.set(event.type, event.handler);
     });
     mod.factions.forEach(faction => {
       gameState.factions.push(faction);
     });
   }
   ```

2. **Game generates events normally**:
   ```typescript
   const events = eventGenerator(turn, rng, factionCount);
   // Events can now include custom types from mods
   ```

3. **Credibility calculation uses handlers**:
   ```typescript
   function calculateCredibility(
     claims: Claim[],
     events: Event[],
     handlers: Map<string, CredibilityHandler>
   ): number {
     return claims.reduce((score, claim) => {
       const event = events.find(e => e.id === claim.aboutEventId);
       const handler = handlers.get(event.type);
       return score + (handler ? handler(claim, event) : 0);
     }, 100);
   }
   ```

**Why This Works**

- **Extensible events**: Event types are strings, not enums; mods add new types
- **Handler registry**: Credibility logic is pluggable, not hardcoded
- **JSON state**: Mods can add custom faction fields (as long as they're JSON-serializable)
- **Namespace isolation**: Mod data lives under `gameState.mods[modId]` to prevent collisions

**Not Yet Implemented, But Designed For**

A mod loader will scan `./mods/` for JSON manifests, register handlers, and load custom data. The core game logic doesn't change.

---

## Implementation Checklist for New Features

When adding retcon, multiplayer, mods, or any new feature, verify these constraints hold:

- [ ] **Pure Functions**: All logic in `src/game/` is pure (no React, no I/O, no side effects)
- [ ] **Deterministic RNG**: All randomness uses seeded PRNG, never `Math.random()`
- [ ] **Immutable State**: State updates return new objects, never mutate inputs
- [ ] **JSON Serialization**: `JSON.stringify(state)` and `JSON.parse()` round-trip perfectly
- [ ] **Action-Based Updates**: State changes go through action handlers, not direct mutations
- [ ] **Extensible Events**: New event types register in a handler map, not hardcoded
- [ ] **Centralized Costs**: All influence costs in `INFLUENCE_COSTS` registry
- [ ] **Presentational Components**: Components derive display from props, no direct state mutations

**If your feature violates any of these, you've found where the architecture breaks.** Don't work around it—refactor to fit the constraints.

---

## Critical Don't-Dos (Why NOT Redux, Why NOT Async)

### Why NOT Redux

You might be tempted to use Redux for "better state management." Here's why it breaks the intent:

**Redux couples action → reducer → selector** in a way that makes it hard to:
- **Retcon**: Replaying actions 1–5 then inserting a modified action requires clearing the store and replaying, which is awkward
- **Mod the system**: Middleware can extend logic, but it's implicit and hard to trace
- **Verify multiplayer sync**: Multiple stores on different clients make it hard to validate that they're synchronized

**Our simple approach is better for this game:**
- Pure functions + immutable state makes replay explicit and testable
- Event handlers are just a `Map<string, handler>` — easy to inspect and extend
- State serialization is trivial — just `JSON.stringify(state)`

If you add Redux later and multiplayer breaks, you'll understand why this design exists.

### Why NOT Async in Game Logic

You might want to make `gameManager` async to support:
- Animated turn transitions (await animation frames)
- AI opponents (await async search)
- Network calls (await NPC dialogue)

**But async breaks determinism.** Here's the problem:

```typescript
// WRONG: Non-deterministic
async function generateEvent() {
  const response = await fetch('/api/event');
  return response.json(); // Different each run
}

// WRONG: Non-deterministic
async function generateEvent() {
  await new Promise(resolve => setTimeout(resolve, 100)); // Latency varies
  return eventTemplate[Math.random() % eventTemplate.length];
}
```

**Future rule**: If you need async features:
- Async code lives in **components** or **orchestration layer**, not in `src/game/`
- Game logic (event generation, credibility) stays **pure and synchronous**
- Components can request async data and re-render when it arrives

**Pattern**: Components handle async, game logic stays pure:

```typescript
// ✓ Component requests data asynchronously
useEffect(() => {
  fetchDialogue(characterId).then(setDialogue);
}, [characterId]);

// ✓ Game logic stays synchronous and pure
const credibility = calculateCredibility(claims, events); // No async
```

---

## Next Steps for Development

### Implementation Order

1. **Lock in immutability first** — Make `advanceTurn(state)` return new state; never mutate
2. **Add seeded RNG** — Replace `Math.random()` with `SeededRNG` in eventGenerator.ts
3. **Build event handler registry** — Move event type logic into `Map<eventType, handler>`
4. **Validate JSON serialization** — Audit `GameState`, test `JSON.stringify/parse` round-trip
5. **Refactor to action pattern** — Make `publishBook()` and `advanceTurn()` into immutable action handlers

These five steps prevent you from painting yourself into a corner when you add retcon, multiplayer, or mods. They're not "future-proofing fluff"—they're the minimal constraints that make those features *buildable* without rewrite.

---

## Questions for Future Agents

When implementing features, ask:

- **Is this function pure?** (No side effects, no I/O, no async)
- **Does this mutate state?** (If yes, refactor to return new state)
- **Is this event type extensible?** (Can mods add new types without editing code?)
- **Is this serializable?** (Can I `JSON.stringify(state)` and get the same object back?)
- **Can this be replayed?** (If I record the actions, can I re-apply them and get the same state?)

If you answer "no" to any of these, you're working against the architecture. Refactor to fit the constraints.

---

**Project Context Ready.** Agents can now implement with understanding of the intent, not just rules.

---

## Usage Guidelines

### For AI Agents

**Before implementing any code:**
1. Read this file completely — especially "Architectural Intent" and the 8 core constraints
2. Understand the reasoning, not just the rules — each constraint enables future features
3. When in doubt, choose the more restrictive option
4. If a feature would violate a constraint, stop and ask: "Does this need to happen differently?"

**While implementing:**
- Reference the specific constraint section relevant to your work
- Use the code examples (✓ good vs ✗ wrong) as patterns
- Check the Implementation Checklist before marking work complete
- If you discover a new pattern or rule, update this document

**Common scenarios:**
- Adding a new influence-costing feature? → See "Influence Costs are Centralized"
- Handling player input? → See "Components are Presentational"
- Calculating credibility? → See "Pure Functions in src/game/"
- Saving game state? → See "GameState is 100% JSON-Serializable"

### For Humans (Maintainers)

**Keep this document lean:**
- Remove rules that become obvious over time
- Add new rules only if they prevent a real mistake
- Combine related rules to reduce redundancy

**Update when:**
- Technology versions change (Node 20, React 19, etc.)
- New patterns emerge from implementation
- Features are added (retcon, multiplayer, mods)

**Review quarterly:**
- Ensure rules still reflect current architecture
- Remove outdated or superseded rules
- Validate that all constraints are being followed

**Never remove:**
- "Architectural Intent" section — this is the "why"
- The 8 core constraints — these enable the future
- Extension points — these guide new feature design

---

## Quick Reference: The 8 Core Rules

For busy agents, here's the TL;DR:

1. **Pure Functions**: Game logic in `src/game/` has zero side effects
2. **Immutable State**: State updates return new objects, never mutate
3. **Seeded RNG**: All randomness through `SeededRNG`, never `Math.random()`
4. **Extensible Events**: Event types are strings in a registry, not hardcoded enums
5. **JSON Serializable**: `JSON.stringify(state)` round-trips perfectly
6. **Action-Based**: State changes through action handlers, logged for replay
7. **Presentational Components**: Components derive display from props, no mutations
8. **Centralized Costs**: All influence costs in `INFLUENCE_COSTS` registry

**Violate any of these and you've broken the architecture.** Refactor to fit the constraints.

---

**Document Status**: Complete and ready for agent integration.  
**Last Generated**: 2026-04-19  
**Maintained by**: Geoff
