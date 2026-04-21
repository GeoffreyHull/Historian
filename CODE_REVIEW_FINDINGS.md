# Code Review Findings: Epics 4-8 Implementation

**Review Date:** 2026-04-21  
**Scope:** Epics 4-8 diff (1900 lines across 9 files)  
**Review Layers:** Blind Hunter + Edge Case Hunter + Acceptance Auditor  
**Status:** 22 findings consolidated; 8 critical/high-risk items requiring action

---

## Executive Summary

The Epics 4-8 implementation is **functionally complete** for core game logic (turn execution, session persistence, determinism tracing, world state evolution, deployment). However, **8 critical and high-risk findings** require remediation before merge:

1. **RNG Determinism Gap** (Critical) — EventGenerator seeded with turn number, not initial world seed; breaks resumption determinism guarantee (FR46-FR47, Constraint 9)
2. **Non-Atomic Saves** (Critical) — Backup write can succeed while primary fails; leaves stale backup as recovery vector (NFR4 violation)
3. **Input Validation Gap** (High) — playerClaims array unchecked; claims exceeding FR8 limit (1-3) processed without truncation
4. **Incomplete Feature: Influence Calculation** (High) — Code commented out; required by FR19, untested
5. **Incomplete Feature: Recap Generation** (High) — recapGenerator imported but not in diff; FR35-FR40 completion unclear
6. **JSON Parse Vulnerability** (High) — GameState fields never validated after JSON.parse; corrupted saves silently accepted
7. **Timestamp Collision** (Medium) — Multiple logs within 1ms get identical timestamps; breaks causal ordering in tracing (FR29 violation)
8. **Integer Overflow in Hash** (Medium) — Hash function on long claim text can overflow; determinism at risk

**Remaining 14 findings** are lower-risk: code quality, error messaging, edge case handling.

---

## Findings by Risk Tier

### 🔴 CRITICAL (Fix before merge)

#### 1. RNG Determinism Broken (FR46-FR47, Constraint 9)

**Location:** `turnExecutor.ts:1792`  
**Finding:**
```typescript
const eventGenerator = new EventGenerator(currentTurn);
```

EventGenerator is seeded with the current turn number, not the world's initial seed. This breaks the determinism guarantee: resuming from a saved checkpoint at turn 5 will regenerate the same events only if you're on the SAME turn 5, not if you play through again from turn 1 with the same initial seed.

**Why it matters:**  
- FR46-FR47 explicitly require "deterministic resumption (same seed = same events)"
- Constraint 9 demands turn-phase ordering reproducibility
- A player saving at turn 5 and reloading should see identical events; currently will not

**Acceptance Criteria Violated:**  
- FR46: "Player can resume a paused game from the exact same state" ✓ (state loads)
- FR47: "Game can resume from saved state with identical determinism (same seed = same events)" ✗ (determinism lost)

**Fix:**  
Replace `currentTurn` with the world's initial seed stored in `gameState.worldState.initialSeed` or derive a stable seed from run + turn offset.

**Effort:** 1-2 hours (locate initial seed storage, update EventGenerator initialization, add tests)

**Priority Score:** 9/10 (blocks core mechanic verification)

---

#### 2. Non-Atomic Save Pattern (NFR4 violation)

**Location:** `sessionPersistence.ts:1443-1445`

```typescript
// Atomic save pattern: write backup, then primary
localStorage.setItem(BACKUP_KEY, serialized);
localStorage.setItem(STORAGE_KEY, serialized);
```

localStorage has no transaction support. If the backup write succeeds and the primary fails (or quota exceeded on primary), the backup is stale and silent recovery becomes a liability: a player resumes from an older checkpoint unknowingly.

**Why it matters:**  
- NFR4: "Atomic save operations (save state must be atomic; no partial writes)"
- Current implementation: write backup, write primary. On failure of primary: backup exists but is stale.
- Worse case: player loses 1-2 turns of progress with no warning.

**Acceptance Criteria Violated:**  
- NFR4: "Atomic save operations" ✗ (not atomic; fallback recovery is lossy)

**Fix Options:**
1. **Write primary first, then backup (pessimistic):** If primary fails, backup is non-existent; user knows save failed.
2. **Validate serialization before writing:** Try JSON.stringify, verify size, then commit both writes.
3. **Add explicit save confirmation:** Return success boolean and let UI display "save failed" if primary fails.

**Recommended:** Option 1 (write primary first) + validate before commit. Simpler, safer.

**Effort:** 1-2 hours (reorder writes, add validation, test failure scenarios)

**Priority Score:** 9/10 (data integrity risk)

---

#### 3. JSON Parse Without Validation (Constraint 5 violation)

**Location:** `sessionPersistence.ts:1462-1464`

```typescript
const primary = localStorage.getItem(STORAGE_KEY);
if (primary) {
  return JSON.parse(primary) as GameState;
}
```

`JSON.parse()` returns an unknown object. The `as GameState` type assertion provides zero runtime validation. A corrupted save with missing fields (e.g., `worldState` truncated) will be accepted and cause runtime errors downstream.

**Why it matters:**  
- Constraint 5: "GameState is 100% JSON-Serializable; round-trip through JSON.stringify/parse without **data loss**"
- Current code silently accepts incomplete GameState
- Player loads corrupted save → game crashes during turn execution with cryptic error

**Example Corruption:**
```json
{
  "turnNumber": 5,
  "claims": [],
  // worldState is missing
}
```
Player loads this → `gameState.worldState` is undefined → crash on line 1795 `gameState.worldState, gameState.currentFaction`

**Fix:**  
Add a validation function:
```typescript
function validateGameState(obj: unknown): GameState | null {
  if (!obj || typeof obj !== 'object') return null;
  const state = obj as any;
  if (typeof state.turnNumber !== 'number') return null;
  if (!state.worldState || typeof state.worldState !== 'object') return null;
  if (!Array.isArray(state.events)) return null;
  if (!Array.isArray(state.claims)) return null;
  return obj as GameState;
}
```

Then use it: `const validated = validateGameState(JSON.parse(primary));`

**Effort:** 2-3 hours (write validator, test with malformed saves, integrate into load path)

**Priority Score:** 8/10 (corrupted saves are rare but unrecoverable)

---

#### 4. Incomplete Feature: Influence Calculation Commented Out (FR19 violation)

**Location:** `turnExecutor.ts:1811-1812`

```typescript
// Phase 4: Calculate influence (for future use; not strictly required in this phase)
// const influences = credibilityResults.map(result => calculateInfluence(result, gameState.currentFaction));
```

Influence calculation is imported but commented out. FR19 requires: "System calculates influence earned = credibility % × faction multiplier". This is **incomplete**.

**Why it matters:**  
- FR19 is a functional requirement; if incomplete, the acceptance criterion fails
- influenceCalculator.ts is implemented but never called
- Player claims earn credibility but influence is never calculated or accumulated
- Faction beliefs and world state evolution depend on influence; incomplete influence → incomplete world evolution

**Acceptance Criteria Violated:**  
- FR19: "System calculates influence earned = credibility % × faction multiplier" ✗ (code present but skipped)

**Fix:**  
Uncomment and integrate:
```typescript
const influences = credibilityResults.map(result => calculateInfluence(result, gameState.currentFaction));
// Accumulate influence in game state (add influence total to GameState if not present)
manager.dispatch({ type: 'addInfluence', amount: influences.reduce((sum, inf) => sum + inf.influence, 0) });
```

Then verify in tests that credibilityResults → influences are calculated and stored.

**Effort:** 2-3 hours (uncomment, integrate into dispatch, add tests, verify GameState has influence field)

**Priority Score:** 8/10 (blocks world state evolution; breaks FR19 acceptance)

---

### 🟠 HIGH (Fix before merge or document as deferred)

#### 5. Incomplete Feature: Recap Generation (FR35-FR40 unclear)

**Location:** `turnExecutor.ts:1822-1828` (imports recapGenerator, uses generateRunRecap)

The diff imports `generateRunRecap` from `./recapGenerator` but the recapGenerator.ts file is **not in the diff**. FR35-FR40 require:
- FR35: "At end of each run, system generates a recap showing major impacts"
- FR36: "Recap describes consequences in lore language (not mechanics language)"
- FR37: "Recap references previous run consequences (if applicable)"
- FR38-FR40: History book and recap rendering

**Why it matters:**  
- Recap generation is core to the "discover consequences" narrative loop (Epic 5)
- If recapGenerator is incomplete or missing, history book is empty → FR38-FR40 not testable
- Player cannot see accumulated narrative impact across runs

**Acceptance Criteria Unclear:**  
- FR35-FR40: Implementation completeness unknown (file not in diff)

**Fix:**  
Either:
1. Include recapGenerator.ts in this PR (if complete)
2. Split into separate PR and document as Epic 5 follow-up
3. Verify recapGenerator.ts is complete in the repo and document the dependency

**Effort:** 0 hours (if file exists) to 8+ hours (if needs full implementation)

**Priority Score:** 7/10 (blocks history book feature; depends on file discovery)

---

#### 6. Input Validation: playerClaims Array Unchecked (FR8 violation)

**Location:** `turnExecutor.ts:1806-1807`

```typescript
if (playerClaims.length > 0) {
  credibilityResults = evaluateClaimsBatch(playerClaims, events, gameState.currentFaction);
}
```

playerClaims array is never validated. FR8 specifies: "Player can write **1-3** narrative claims per turn". The code accepts 0-unlimited claims.

**Why it matters:**  
- FR8 is a functional requirement; violating it changes game balance
- No truncation means a buggy UI could submit 100 claims; system would evaluate all
- Edge case: player could exploit by submitting unlimited claims to game state

**Example Violation:**
```typescript
executeTurn(gameState, [claim1, claim2, claim3, claim4, claim5]); // 5 claims, violates FR8
```

**Fix:**  
Add validation:
```typescript
const validatedClaims = playerClaims.slice(0, 3); // Enforce 1-3 limit
if (playerClaims.length > 3) {
  console.warn(`Truncated ${playerClaims.length} claims to 3-claim limit (FR8)`);
}
if (validatedClaims.length > 0) {
  credibilityResults = evaluateClaimsBatch(validatedClaims, events, gameState.currentFaction);
}
```

**Effort:** 1 hour (add validation, test with >3 claims)

**Priority Score:** 7/10 (spec violation; moderate impact on game balance)

---

#### 7. Turn-Phase Ordering Incomplete (Constraint 9 unclear)

**Location:** `turnExecutor.ts:1787-1878`

The architecture specifies Constraint 9: "Turn-phase determinism with explicit ordering: [Phase 1: Resolve claims] → [Phase 2: Apply state changes] → [Phase 3: Trigger consequences] → [Phase 4: Serialize]"

Current implementation:
1. Phase 1: Generate events ✓
2. Phase 2: Evaluate claims ✓
3. Phase 3: Update world state ✓
4. Phase 4: Serialize (implicit in return) ✓

But the phases are not explicitly named or documented in the code. Additionally, **consequence triggering** (Phase 3 in spec) is not clear: are consequences triggered immediately, or deferred? This affects determinism tracing (FR29).

**Why it matters:**  
- Constraint 9 is load-bearing for replay/retcon
- Without explicit phase separation, future refactors may break turn ordering
- FR29 requires causal chain verification; unclear if consequences are explicitly tracked per phase

**Fix:**  
Document phases explicitly in code:
```typescript
// CONSTRAINT 9: Turn-Phase Ordering (Deterministic Replay Contract)
// Phase 1: Event Generation (seeded RNG)
// Phase 2: Claim Evaluation (credibility + faction updates)
// Phase 3: World State Evolution (beliefs, consequences, decay)
// Phase 4: Serialize (GameState → localStorage)
// Any replay with identical seed + action sequence must produce identical Phase 4 state
```

Then verify each phase is deterministic.

**Effort:** 2-3 hours (document phases, verify determinism per phase, add phase-level tests)

**Priority Score:** 6/10 (architectural clarity; no functional bug but risk for future regressions)

---

#### 8. Timestamp Collision in Tracing (FR29 violation)

**Location:** `tracingSystem.ts:1588` (multiple calls to `Date.now()`)

```typescript
logClaim(claim, turnNumber) {
  const log: ClaimLog = {
    timestamp: Date.now(),  // 1ms resolution
    ...
  };
  this.logs.push(log);
}

logConsequence(...) {
  const log: ConsequenceLog = {
    timestamp: Date.now(),  // Can be identical if called within 1ms
    ...
  };
  this.logs.push(log);
}
```

If multiple actions occur within the same millisecond, they all get the same timestamp. This breaks causal ordering in `traceCausalChain()` and makes it impossible to determine action sequence within a turn.

**Why it matters:**  
- FR29: "Developer can verify causal chains between claims and events"
- Without precise ordering, "causal chain" becomes ambiguous
- Tests may pass locally but fail on faster hardware where actions complete in <1ms

**Example Failure:**
```
Turn 1:
  logClaim(claim1) → timestamp: 1000
  logConsequence(evt1) → timestamp: 1000 (same!)
  logConsequence(evt2) → timestamp: 1000 (same!)
→ traceCausalChain() cannot determine order of evt1 vs evt2
```

**Fix:**  
Use an incrementing logical clock:
```typescript
private logSequence = 0;

logClaim(claim, turnNumber) {
  const log: ClaimLog = {
    timestamp: Date.now(),
    sequence: this.logSequence++,  // Explicit ordering
    ...
  };
  this.logs.push(log);
}
```

Then sort by `sequence` before analyzing causal chains.

**Effort:** 1-2 hours (add sequence field, update log types, update tests)

**Priority Score:** 6/10 (affects developer debugging; not player-facing but blocks determinism verification)

---

#### 9. Hash Function Integer Overflow (Determinism risk)

**Location:** `tracingSystem.ts:1705-1708`

```typescript
private hashClaim(claim: Claim): string {
  return `claim-${claim.claimText}-${claim.eventId}`.split("").reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0).toString();
}
```

JavaScript number type has 53-bit precision. Long claim text (>10 chars) will overflow and produce unpredictable hash values. Additionally, `reduce` initializes with 0, then `(0 << 5) - 0 = 0`, so the first character is always added to 0 — this is fine, but overflow on long strings is not.

**Why it matters:**  
- Hash is used for determinism verification (stateHash, actionHash)
- Overflow → different hashes for same claim on overflow boundary
- Different hashes → false "non-deterministic" results in `verifyDeterminism()`

**Example Overflow:**
```
claimText = "The sky was blue and the weather was stormy"  // 42 chars
hash(claim) on run 1 → integer overflow → hash = 12345
hash(claim) on run 2 → integer overflow at different point → hash = 54321
verifyDeterminism() reports: non-deterministic (but it's not; hash is buggy)
```

**Fix:**  
Use a proper hash function or serialize + encode:
```typescript
private hashClaim(claim: Claim): string {
  const str = `claim-${claim.claimText}-${claim.eventId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;  // Bitwise OR coerces to 32-bit int
  }
  return hash.toString();
}
```

Or simpler: use crypto.subtle.digest() for deterministic hashing (if available in browser).

**Effort:** 1 hour (replace hash function, test with long claim text)

**Priority Score:** 6/10 (affects determinism verification accuracy)

---

### 🟡 MEDIUM (Fix in this PR or document as known issue)

#### 10. Race Condition in loadGameState (Multi-tab sync)

**Location:** `sessionPersistence.ts:1498-1501`

```typescript
export function hasSavedGame(): boolean {
  const primary = localStorage.getItem(STORAGE_KEY);     // getItem #1
  const backup = localStorage.getItem(BACKUP_KEY);       // getItem #2
  return primary !== null || backup !== null;
}
```

If another tab modifies localStorage between getItem #1 and #2, this function could return a false positive. Additionally, no multi-tab synchronization: if player saves in tab A and resumes in tab B, tab B loads stale data.

**Why it matters:**  
- NFR6 requires offline-playability; multi-tab is not strictly required
- But data corruption risk if two tabs write simultaneously
- Player confusion if save in tab A is not visible in tab B

**Acceptance Criteria:**  
- NFR6: "Offline-playability (core gameplay mechanics work without network)" ✓ (no multi-tab requirement)
- Risk: Data corruption if concurrent saves in two tabs

**Fix:**  
1. **Document as known limitation:** "Single-tab gameplay only; multi-tab save conflicts not handled"
2. **Optional (post-MVP):** Add localStorage change listener to detect external changes and reload

**Effort:** 0 hours (document) to 4 hours (implement sync)

**Priority Score:** 4/10 (rare scenario; edge case for multi-tab players)

---

#### 11. Off-by-One: turnsRemaining Can Be Negative

**Location:** `turnExecutor.ts:1892`

```typescript
export function getRunSummary(gameState: GameState): RunSummary {
  const turnsRemaining = Math.max(0, 10 - gameState.turnNumber);
  return {
    currentTurn: gameState.turnNumber,
    turnsRemaining,
    ...
  };
}
```

This is correctly guarded with `Math.max(0, ...)`, so turnsRemaining won't be negative. However, the logic assumes turn numbers are 1-10. If `gameState.turnNumber` somehow exceeds 10 (e.g., bug in turn advancement), this will silently report 0 remaining turns instead of detecting the error.

**Why it matters:**  
- Defensive programming: should assert turn ≤ 10 rather than silently clamp
- If turn > 10, it indicates a bug in turn advancement that should be caught

**Fix:**  
Add assertion:
```typescript
if (gameState.turnNumber > 10) {
  console.error(`Invalid turn number: ${gameState.turnNumber} (expected 1-10)`);
}
const turnsRemaining = Math.max(0, 10 - gameState.turnNumber);
```

**Effort:** 0.5 hour (add assertion, test)

**Priority Score:** 3/10 (defensive; low likelihood of turn > 10)

---

#### 12. Silent Failure on Backup Corruption

**Location:** `sessionPersistence.ts:1468-1472`

```typescript
// Fall back to backup if primary is missing/corrupted
const backup = localStorage.getItem(BACKUP_KEY);
if (backup) {
  console.warn("Loading from backup due to primary corruption");  // Only console.warn
  return JSON.parse(backup) as GameState;
}
```

If backup loading fails (e.g., backup is also corrupted), the error is swallowed and function returns null. Player loses game state with only a console.warn.

**Why it matters:**  
- Error handling: if both primary and backup are corrupted, player deserves to know
- Current code: `console.warn()` in production browser → message lost
- Worse: no return value indicates failure; loadGameState() returns null silently

**Fix:**  
Log more aggressively:
```typescript
try {
  return JSON.parse(backup) as GameState;
} catch (backupError) {
  console.error("Backup corrupted; cannot recover. Player data lost.", backupError);
  // Could dispatch event to UI: "Your save is corrupted. Start new game?"
  return null;
}
```

**Effort:** 1 hour (improve error handling, consider UI integration)

**Priority Score:** 5/10 (rare but critical for affected player)

---

#### 13. Influence Calculation Incomplete Type

**Location:** `influenceCalculator.ts` (entire file)

The influenceCalculator is implemented, but:
1. It's never called (commented out in turnExecutor)
2. `InfluenceCalculation` type may not exist in types.ts
3. No tests verify it integrates with GameState

**Why it matters:**  
- Orphaned code; part of incomplete feature
- If included in MVP, integration must be tested

**Fix:**  
Either:
1. Delete influenceCalculator.ts (post-MVP feature)
2. Uncomment usage in turnExecutor and integrate with GameState.influence

**Effort:** 0.5-2 hours (depends on deletion vs. integration choice)

**Priority Score:** 5/10 (code organization; lower risk)

---

### 🟢 LOW (Monitor, document, or defer)

#### 14. EventGenerator Seed Non-Determinism (FR47 impact)

**Location:** `turnExecutor.ts:1792`

```typescript
const eventGenerator = new EventGenerator(currentTurn);
```

Already flagged as CRITICAL #1 above. Repeated here for traceability.

---

#### 15. Array Length Assumption in getLastSaveTime

**Location:** `sessionPersistence.ts:1512`

```typescript
const lastRecap = state.worldState.history[state.worldState.history.length - 1];
```

If `history` array is empty, this accesses index -1 (undefined). The check `state.worldState.history.length > 0` guards this, so it's safe. No issue.

---

#### 16. Missing Error Context in saveGameState

**Location:** `sessionPersistence.ts:1448-1450`

```typescript
catch (error) {
  console.error("Failed to save game state:", error);
  return false;
}
```

Error message is generic. Doesn't distinguish between QuotaExceededError, JSON serialization failure, or other issues. For debugging, more specificity would help.

**Fix (optional):**
```typescript
catch (error) {
  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError') {
      console.error("Storage quota exceeded; save failed");
    } else {
      console.error("Failed to save game state:", error.message);
    }
  }
  return false;
}
```

**Priority Score:** 2/10 (low impact on gameplay; nice-to-have for debugging)

---

#### 17. Test Coverage: Turn 11+ Not Explicitly Tested

**Location:** `turnExecutor.test.ts`

Tests verify turn 10 ends run, but do not test what happens if a turn > 10 is encountered. While the code resets to turn 1, explicit tests would catch edge cases.

**Fix (optional):** Add test:
```typescript
it("should handle malformed turn number > 10 gracefully", () => {
  let state = createInitialGameState();
  state = { ...state, turnNumber: 11 };
  const summary = getRunSummary(state);
  expect(summary.turnsRemaining).toBe(0);
  expect(summary.isRunComplete).toBe(true);
});
```

**Priority Score:** 2/10 (defensive; unlikely scenario)

---

#### 18. Documentation: Atomic Save Pattern Limitations

**Location:** `sessionPersistence.ts` (missing comment)

Code implements a backup pattern but does not document its limitations (not truly atomic, race conditions possible).

**Fix (optional):** Add comment:
```typescript
/**
 * SaveGameState: Save game state with backup fallback.
 * NOTE: Not truly atomic. If backup succeeds but primary fails,
 * backup is stale. For true atomicity, use IndexedDB or server-side persistence.
 * NFR4 (atomic saves) is approximated here for MVP localStorage.
 */
```

**Priority Score:** 1/10 (documentation only)

---

## Summary Table

| # | Finding | Risk | Effort | Priority | Status |
|---|---------|------|--------|----------|--------|
| 1 | RNG Determinism (EventGenerator seed) | 🔴 Critical | 2h | 9/10 | **Blocks merge** |
| 2 | Non-Atomic Saves (backup pattern) | 🔴 Critical | 2h | 9/10 | **Blocks merge** |
| 3 | JSON Parse No Validation | 🔴 Critical | 3h | 8/10 | **Blocks merge** |
| 4 | Incomplete: Influence Calc Commented | 🟠 High | 3h | 8/10 | **Blocks merge** |
| 5 | Incomplete: Recap Generation (missing file) | 🟠 High | 0-8h | 7/10 | Depends on file status |
| 6 | Input Validation: playerClaims (FR8) | 🟠 High | 1h | 7/10 | **Blocks merge** |
| 7 | Constraint 9 Clarity (phase ordering) | 🟠 High | 3h | 6/10 | **Blocks merge** or document |
| 8 | Timestamp Collision (tracing causal) | 🟠 High | 2h | 6/10 | **Blocks merge** |
| 9 | Hash Overflow (determinism risk) | 🟠 High | 1h | 6/10 | **Blocks merge** |
| 10 | Race Condition (multi-tab) | 🟡 Medium | 0-4h | 4/10 | Document limitation |
| 11 | Off-by-One Assert (turn > 10) | 🟡 Medium | 0.5h | 3/10 | Nice-to-have |
| 12 | Silent Failure on Backup Error | 🟡 Medium | 1h | 5/10 | Improve error handling |
| 13 | Orphaned Code (influenceCalculator) | 🟡 Medium | 0.5-2h | 5/10 | Integrate or delete |
| 14-18 | Documentation, test coverage | 🟢 Low | <1h | 1-2/10 | Post-merge |

---

## Merge Recommendation

**Status:** ❌ **DO NOT MERGE** without addressing critical items 1-4, 6-9.

**Required Before Merge:**
1. ✅ Fix RNG determinism (EventGenerator seed)
2. ✅ Redesign atomic save pattern (write primary first + validate)
3. ✅ Add GameState validation on JSON.parse
4. ✅ Uncomment and test influence calculation
5. ✅ Verify/include recapGenerator.ts
6. ✅ Add playerClaims validation (1-3 limit)
7. ✅ Document Constraint 9 phases or add phase assertions
8. ✅ Add logical clock to tracing (timestamp collision)
9. ✅ Fix hash function (integer overflow protection)

**Estimated Effort to Fix:** 16-20 hours (conservative)

**Timeline:** If working 6 hours/day, completed by end of day 2026-04-23.

---

## Next Steps

1. **Triage & Plan:** User reviews this document and selects which items to fix pre-merge vs. defer
2. **Implement Fixes:** Create GitHub issues for each critical item; begin fixes on new branch
3. **Re-Test:** After fixes, run full pipeline (`npm run type-check && npm run build && npm test && npm run test:golden`)
4. **Re-Review:** Edge Case Hunter + Acceptance Auditor on fixed code (abbreviated pass)
5. **Merge:** Once all critical items resolved and pipeline passes

---

## Questions for User

1. **recapGenerator.ts status?** Is it complete and in the repo, or does Epic 5 (history book) need to be deferred?
2. **Influence calculation:** Should we uncomment and integrate in this PR, or defer to post-MVP?
3. **Priority:** Would you prefer to fix all critical items now, or merge critical 1-3 first and address 4-9 in a follow-up?

