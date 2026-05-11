# Prediction System Redesign — Full Design Document

> **Purpose:** This document captures every design decision made during the ideation session and provides a complete implementation brief that can seed a new session from scratch. Both the "why" (rationale) and the "what" (implementation steps) are included.

---

## Design Decisions (Q&A Session Record)

The following decisions were made interactively:

| Question | Decision | Rationale |
|----------|----------|-----------|
| What should accuracy measure? | **Semantic truth-alignment** — cosine similarity between claim meaning and event's true description, scored by offline embedding model | Evaluates meaning, not mechanics; rewards coherent prose; copy-paste is naturally handled |
| Should accuracy be binary or spectrum? | **Spectrum (0–100%)** | Partial credit rewards nuance; confident wrong claims can be penalised more; continuous scoring enables more strategy |
| What does the player see immediately after submitting a claim? | **Nothing immediate — full reveal later** (2–3 turns) | Creates genuine epistemic tension; emulates how historians discover they were wrong; wrong claims that are never contradicted become accepted history |
| What form do the evidence fragments take? | **Named witnesses / sources** — e.g. "A merchant told you...", "A guard reported...", "You overheard..." | Frames fragments as second-hand accounts with varying reliability; more immersive than raw sensory details; echoes real historical source criticism |

---

## Problem Being Solved

The current `src/game/credibilitySystem.ts` is broken:
- Uses `EVENT_TYPE_KEYWORDS` with a 60% keyword threshold
- Event description is completely irrelevant to scoring
- Forces unnatural keyword-stuffing gameplay
- Binary "correct" / "incorrect" — no partial skill expression
- Copy-pasting the event description into the claim is an unintended winning strategy

**The fix is not incremental** — the entire accuracy evaluation model changes.

---

## Core Mechanic: The Historian's Lens (Merged Design)

This merges three mechanics from the ideation doc (`prediction-system.md` in the repo root):
- **Mechanic 1** — Offline semantic scoring (embedding model judges meaning, not keywords)
- **Mechanic 2** — Evidence assembly (Obra Dinn model: reason from named witness fragments)
- **Mechanic 4** — Retroactive revelation (score hidden until 2 turns after submission)

### Game Loop

1. **Event occurs** → 3 named witness/source fragments generated (seeded RNG, attached to event)
2. **Player's turn** → Player sees available fragments (those marked `available: true`) → writes free-form claim synthesising what they believe happened
3. **Claim submitted** → stored as `PendingClaim` with `revealTurn = currentTurn + 2`; player sees nothing about accuracy yet
4. **Turn N+1** → No reveal yet; world continues
5. **Turn N+2** → Pending claim resolves: semantic similarity computed between claim text and event description → score (0–100) written to `credibilityMap`; player sees the result in the turn recap
6. **High-credibility claims** → enter accepted history; influence world state

---

## Accuracy: Semantic Similarity (Two-Phase Implementation)

### Phase 1 (this implementation) — Deterministic word-overlap baseline

No external dependencies. Fully synchronous. Satisfies Constraints 1, 2, 5, 9.

Algorithm: **Jaccard similarity on normalised, stop-word-filtered tokens**

```typescript
function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function computeSemanticSimilarity(claimText: string, eventDescription: string): number {
  if (!claimText || !eventDescription) return 0;
  const claimTokens = tokenize(claimText);
  const eventTokens = tokenize(eventDescription);
  if (claimTokens.size === 0 || eventTokens.size === 0) return 0;
  const intersection = [...claimTokens].filter(t => eventTokens.has(t)).length;
  const union = new Set([...claimTokens, ...eventTokens]).size;
  return Math.round((intersection / union) * 100);
}
```

Exposed as `export function computeSemanticSimilarity(...)` so Phase 2 can replace it with the same signature.

### Phase 2 (follow-up story) — Transformers.js offline embeddings

Ship `all-MiniLM-L6-v2` (~23 MB ONNX) with the game via `@xenova/transformers`. No network calls; runs fully in-browser via WebAssembly.

**Interface change**: `computeSemanticSimilarity` becomes `async`. This requires:
- The game loop to become async at the claim-evaluation step
- `nextTurn` reducer cannot call async code directly — so the architecture shifts from "reducer resolves claims inline" to "resolver service dispatches `evaluateClaims` action when claims come due"
- A `EmbeddingService` interface allows the dev-mode Jaccard stub to be injected in tests, and the real Transformers.js model in production

Phase 2 scope:
1. Install `@xenova/transformers`
2. Create `src/game/embeddingService.ts` with async `embed(text): Promise<Float32Array>` and `cosineSimlarity(a, b): number`
3. Replace `computeSemanticSimilarity` body with the async embedding path
4. Update game orchestration layer (outside the pure reducer) to await claims resolution before dispatching `evaluateClaims`
5. Keep the Jaccard stub as the test double (injected via dependency injection)

---

## New Types

Add to `src/game/types.ts`:

```typescript
export type ClaimReliability = "high" | "medium" | "low";

export interface EvidenceFragment {
  readonly witnessName: string;   // e.g. "Brother Aldric"
  readonly role: string;          // e.g. "a monastery scribe"
  readonly account: string;       // e.g. "Brother Aldric reported: \"the harvest was..."
  readonly reliability: ClaimReliability;
  readonly available: boolean;    // true = player can read this fragment
}

export interface PendingClaim {
  readonly claim: Claim;
  readonly evidenceFragments: readonly EvidenceFragment[];
  readonly revealTurn: TurnNumber;
}
```

Modify existing interfaces:

```typescript
// Event: add fragments field
export interface Event {
  // ... existing fields unchanged ...
  readonly evidenceFragments: readonly EvidenceFragment[];
}

// CredibilityResult: accuracy becomes a number
export interface CredibilityResult {
  readonly claim: Claim;
  readonly event: Event;
  readonly accuracy: number;           // was "correct"|"incorrect"; now [0,100] similarity
  readonly hasInsult: boolean;
  readonly baseCredibility: number;    // = accuracy (the similarity score)
  readonly penalty: number;
  readonly finalCredibility: number;
}

// GameState: add pendingClaims
export interface GameState {
  // ... existing fields unchanged ...
  readonly pendingClaims: readonly PendingClaim[];
}
```

---

## New Constants

Add to `src/game/constants.ts` (keep `EVENT_TYPE_KEYWORDS` — still used by `eventGenerator.ts` for type enumeration):

```typescript
export const CLAIM_REVEAL_DELAY = 2;  // turns between submission and score reveal

export const WITNESS_NAMES = [
  "Brother Aldric", "Sister Elena", "Merchant Yusuf", "Guard Petra",
  "Scholar Imre", "Farmer Oswin", "Scribe Catalina", "Innkeeper Rhys",
  "Elder Maren", "Soldier Dax",
];

export const WITNESS_ROLES = [
  "a market herbalist", "a garrison guard", "a traveling merchant",
  "a monastery scribe", "a court attendant", "a harbor watchman",
  "a local farmer", "a temple priest", "a guild apprentice", "an innkeeper",
];

export const STOP_WORDS = new Set([
  "a", "an", "the", "is", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "to", "of", "in", "on", "at",
  "by", "for", "with", "about", "as", "and", "or", "but", "not",
  "it", "this", "that", "they", "them", "their", "from", "into",
]);
```

---

## `credibilitySystem.ts` Changes

Remove `EVENT_TYPE_KEYWORDS` import. Remove keyword-matching logic entirely.

New function signatures:

```typescript
// Core similarity engine (Phase 1: Jaccard; Phase 2: replace with Transformers.js)
export function computeSemanticSimilarity(claimText: string, eventDescription: string): number

// evaluateClaimAccuracy: returns number 0–100 (was "correct"|"incorrect")
export function evaluateClaimAccuracy(claim: Claim, event: Event): number {
  return computeSemanticSimilarity(claim.claimText, event.description);
}

// calculatePenalty: first param is now similarity number, not string
// (insult penalty only — similarity already encodes accuracy)
export function calculatePenalty(similarity: number, hasInsult: boolean): number {
  return hasInsult ? 10 : 0;
}

// calculateCredibility: similarity is the base
export function calculateCredibility(similarity: number, penalty: number): number {
  return Math.min(100, Math.max(0, similarity - penalty));
}

// evaluateClaim: unchanged signature; internals updated
export function evaluateClaim(claim: Claim, event: Event, faction: Faction): CredibilityResult {
  const accuracy = evaluateClaimAccuracy(claim, event);
  const hasInsult = detectInsult(claim, faction);
  const penalty = calculatePenalty(accuracy, hasInsult);
  const finalCredibility = calculateCredibility(accuracy, penalty);
  return { claim, event, accuracy, hasInsult, baseCredibility: accuracy, penalty, finalCredibility };
}

// evaluateClaimsBatch: update the fallback accuracy from "incorrect" to 0 (number)
```

`detectInsult` and `calculateInfluence` are **unchanged**.

---

## `eventGenerator.ts` Changes

Import `WITNESS_NAMES`, `WITNESS_ROLES` from `./constants`. Remove `EVENT_TYPE_KEYWORDS` import (derive event types from `EVENT_DESCRIPTIONS_BY_TYPE` keys instead):

```typescript
const EVENT_TYPES = Object.keys(EVENT_DESCRIPTIONS_BY_TYPE);
```

Add private `generateFragments` to `EventGenerator`:

```typescript
private generateFragments(description: string, observedByPlayer: boolean): EvidenceFragment[] {
  return Array.from({ length: 3 }, () => {
    const witnessName = this.rng.pick(WITNESS_NAMES);
    const role = this.rng.pick(WITNESS_ROLES);
    const reliability = this.rng.pick(["high", "medium", "low"] as const);
    const available = observedByPlayer ? this.rng.nextBool(0.8) : this.rng.nextBool(0.2);
    const excerpt = description.split(" ").slice(0, 6).join(" ");
    const account = `${witnessName} reported: "${excerpt}...")`;
    return { witnessName, role, account, reliability, available };
  });
}
```

In `generateEvents`, attach fragments after constructing each event's base fields:

```typescript
const evidenceFragments = this.generateFragments(description, observedByPlayer);
events.push({ eventId, eventType, description, truthValue, turnNumber, observedByPlayer, evidenceFragments });
```

---

## `gameManager.ts` Changes

Add imports:
```typescript
import { evaluateClaimAccuracy } from "./credibilitySystem";
import { CLAIM_REVEAL_DELAY } from "./constants";
import { PendingClaim } from "./types";
```

In `createInitialGameState`, add `pendingClaims: []`.

Update `writeClaim` case in reducer:
```typescript
case "writeClaim":
  const newPending: PendingClaim[] = action.claims.map(claim => ({
    claim,
    evidenceFragments:
      state.events.find(e => e.eventId === claim.eventId)?.evidenceFragments ?? [],
    revealTurn: (state.turnNumber + CLAIM_REVEAL_DELAY) as TurnNumber,
  }));
  return {
    ...state,
    claims: [...state.claims, ...action.claims],
    pendingClaims: [...state.pendingClaims, ...newPending],
  };
```

Update `nextTurn` case to resolve due claims:
```typescript
case "nextTurn":
  const nextTurn = (state.turnNumber + 1) as TurnNumber;
  const due = state.pendingClaims.filter(p => p.revealTurn <= nextTurn);
  const stillPending = state.pendingClaims.filter(p => p.revealTurn > nextTurn);
  const updatedCredMap = { ...state.credibilityMap };
  for (const p of due) {
    const event = state.events.find(e => e.eventId === p.claim.eventId);
    if (event) {
      updatedCredMap[p.claim.eventId] = evaluateClaimAccuracy(p.claim, event);
    }
  }
  return {
    ...state,
    turnNumber: nextTurn,
    claims: [],
    pendingClaims: stillPending,
    credibilityMap: updatedCredMap,
  };
```

---

## Test Changes

### `src/game/__tests__/fixtures/events.ts`

Add `evidenceFragments: []` to all 15 entries in `SEEDED_EVENTS`. This is a mechanical change — `EvidenceFragment[]` is now required on `Event`.

### `src/game/__tests__/utils/testHelpers.ts`

- `AccuracyTestCase.expectedAccuracy`: change type from `"correct" | "incorrect"` to `number`
- `generateAccuracyTestCases()`: update expected values to numbers (exact overlap → higher score; unrelated claim → 0)
- `generatePenaltyTestCases()`: first param changes from `baseCredibility: number` (representing "correct=100/incorrect=0") to `similarity: number`

### `src/game/__tests__/credibilitySystem.test.ts`

**Non-golden tests that need updating:**
- **AC1** tests: change `.toBe("incorrect")` assertions to `.toBeTypeOf("number")` + range checks (>= 0, <= 100)
- **AC3** tests: update `calculatePenalty("correct", false)` calls → `calculatePenalty(80, false)` etc.
- **AC4** tests: change `accuracy: "correct" as const` in mock `CredibilityResult` objects → `accuracy: 80` (any number)

**Golden tests (AC5 + AC6) — NO CHANGES NEEDED:**
These check immutability (inputs not mutated), determinism (JSON.stringify equality), and JSON round-trip. None explicitly check the string value of `accuracy`. They will pass unchanged.

### `src/game/__tests__/gameManager.test.ts`

**Non-golden tests that need updating:**
- All initial state shape assertions: add `pendingClaims: []`
- Add test: `writeClaim` creates `PendingClaim` entries with `revealTurn = turnNumber + 2`
- Add test: two `nextTurn` dispatches resolve due pending claims and populate `credibilityMap`
- Add test: claims with `revealTurn` in the future remain in `pendingClaims`

**Golden tests (Constraint 2 + Constraint 5) — NO CHANGES NEEDED:**
- Immutability tests: dispatch remains immutable with new `pendingClaims` field ✓
- JSON serialization: `PendingClaim` contains only strings/numbers — serializable ✓

### `src/game/__tests__/eventGenerator.test.ts`

Add tests:
- Each generated event has `evidenceFragments` array of length 3
- Each fragment has all required fields: `witnessName`, `role`, `account`, `reliability`, `available`
- Same seed → same fragments (determinism / Constraint 9)

---

## Golden Test Safety Analysis

No golden tests need removal or modification. Full analysis:

| Golden Test | File | Impact |
|-------------|------|--------|
| `[G] should not mutate claim input` | credibilitySystem | Still passes — `evaluateClaim` signature unchanged |
| `[G] should not mutate event input` | credibilitySystem | Still passes |
| `[G] should return new objects` | credibilitySystem | Still passes — same deterministic similarity output |
| `[G] should be deterministic: same inputs → identical results` | credibilitySystem | Still passes — Jaccard is deterministic |
| `[G] should be deterministic: same seed → identical state hash` | credibilitySystem | Still passes |
| `[G] should be deterministic: 100× identical results` | credibilitySystem | Still passes |
| `[G] should produce JSON-serializable results` | credibilitySystem | Still passes — `number` serializes |
| `[G] should not mutate state on writeClaim` | gameManager | Still passes — new `pendingClaims` field updated immutably |
| `[G] should not mutate credibility map on evaluateClaims` | gameManager | Still passes |
| `[G] should round-trip state through JSON` | gameManager | Still passes — `PendingClaim` is JSON-serializable |
| `[G] should have no non-serializable properties` | gameManager | Still passes |
| `[G] same seed → identical events` | eventGenerator | Still passes — fragments use SeededRNG |
| `[G] event descriptions are deterministic` | eventGenerator | Still passes |

---

## Verification Pipeline

```bash
npm run type-check   # Must pass: no TypeScript strict errors
npm run build        # Must pass: clean compilation
npm test             # Must pass: all tests including updated AC1/AC3/AC4
npm run test:golden  # Must pass: all [G] tests unchanged
```

**Manual sanity check:** Call `computeSemanticSimilarity("rain fell on the castle", "A light rain fell on the castle grounds throughout the morning.")` — should return a score noticeably higher than `computeSemanticSimilarity("the army marched at dawn", "A light rain fell on the castle grounds throughout the morning.")`.

---

## Files NOT Changing

- `src/game/rng.ts` — SeededRNG is used as-is
- `src/game/worldStateManager.ts` — no changes
- `src/game/factionTrustSystem.ts` — no changes
- `src/components/` — UI changes are out of scope for this story
- `src/game/constants.ts` `EVENT_TYPE_KEYWORDS` — kept (still used by `eventGenerator.ts` for event type weights via `worldStateManager`)

---

## Branch

Develop on: `claude/prediction-system-solutions-BnjVT`
Push to: `origin/claude/prediction-system-solutions-BnjVT`
