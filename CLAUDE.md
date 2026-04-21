# CLAUDE.md: Behavioral Guidelines for AI Agents

## Golden Tests ([G] prefix)

Tests marked with the `golden()` wrapper validate **core architectural constraints** or **story acceptance criteria**. They are protected by GitHub Actions CI/CD — any PR that removes or fails golden tests will be blocked from merging.

### What is a golden test?

- **Prefixed with `[G]`** in test name (e.g., "[G] should not mutate claim input")
- **Wrapped with `golden()`** function call instead of `it()`
- **Validates core constraints** (Constraint 1: pure functions, Constraint 2: immutability, Constraint 5: JSON serialization, Constraint 9: determinism) or **acceptance criteria** (AC5, AC6, etc.)
- **Immutable by design** — removal requires justification and approval

### When to modify or remove golden tests

Golden tests can ONLY be removed or modified when:

1. **The underlying AC or constraint has been explicitly changed**
   - Check story/architecture document for the change
   - Get explicit approval from project owner before modification
   
2. **The test itself has a confirmed bug** (wrong assertion, typo, or implementation error)
   - Verify the bug in isolation
   - Fix it and explain the bug in the commit message

3. **The implementation changed in a way that breaks the test legitimately**
   - Verify the new implementation still meets the AC/constraint
   - Update the test to match the new valid behavior

### When NOT to modify golden tests

- ❌ To "make the test pass" without implementing the feature
- ❌ To work around a constraint you disagree with
- ❌ Because the test is "inconvenient"
- ❌ To refactor without constraint/AC change
- ❌ To rename, relocate, or split the test (this is test evasion)

### Enforcement

- **GitHub Actions:** `npm run test:golden` runs before any PR merge — if it fails, the PR is blocked
- **Pre-commit:** CI will reject merges if golden tests are removed without valid justification
- **Soft protection:** This document serves as the behavioral rule — agents should follow it to avoid PR rejection

### How to bypass (if truly justified)

If a golden test removal is absolutely necessary:

1. Verify the change is legitimate (AC/constraint change, confirmed bug)
2. Include in commit message: `GOLDEN REMOVAL: [reason]`
3. Example: `GOLDEN REMOVAL: Constraint 2 updated to allow controlled mutations in turn phase`

The GitHub Actions CI will still run and must pass — your commit message documents why the removal is correct.

---

## Test Files and Golden Tests

### `src/game/__tests__/credibilitySystem.test.ts`

Golden tests in this file:
- **AC5 (Immutability & Purity)**: 4 tests
  - Validates that credibility system functions never mutate inputs
  - Validates that credibility calculations are deterministic
- **AC6 (Integration & Determinism)**: 3 tests
  - Validates batch claim evaluation
  - Validates 100× identical results with same seed
  - Validates JSON serialization round-trip

### `src/game/__tests__/gameManager.test.ts`

Golden tests in this file:
- **Constraint 2 (Immutability)**: 2 tests
  - Validates that GameManager never mutates state when dispatching
  - Validates that credibility maps are immutable
- **Constraint 5 (JSON Serialization)**: 2 tests
  - Validates GameState round-trips through JSON.stringify/parse
  - Validates no non-serializable properties exist

### `src/game/__tests__/eventGenerator.test.ts`

Golden tests in this file:
- **Constraint 9 (Determinism)**: 2 tests
  - Validates that same seed produces identical events
  - Validates that event descriptions are deterministic

---

## Running Tests

```bash
# Run all tests (including golden)
npm test

# Run only golden tests (validates core constraints)
npm run test:golden

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI
npm run test:ui
```

---

## Pipeline Requirements

Every acceptance criterion and code change MUST pass the full CI/CD pipeline before being considered complete:

```bash
npm run type-check    # TypeScript strict mode validation
npm run build         # TypeScript compilation to JavaScript
npm test              # All unit, integration, and e2e tests
npm run test:golden   # Golden test suite (protected constraints)
```

**All four commands must succeed with no errors or warnings.** The pipeline enforces:
- ✅ TypeScript strict type checking (no `any` allowances)
- ✅ Clean compilation to JavaScript
- ✅ All tests passing (100% pass rate required)
- ✅ All golden tests passing (regression protection)

## Summary for Agents

When working in this codebase:

1. **Look for `[G]` prefix** — these are protected tests
2. **Don't delete or modify them** unless the underlying AC/constraint changed
3. **Before committing:**
   - Run `npm run type-check` to verify no TypeScript errors
   - Run `npm run build` to verify compilation succeeds
   - Run `npm test` to verify all tests pass
   - Run `npm run test:golden` to verify golden tests pass
4. **Document justification** if you must remove a golden test: `GOLDEN REMOVAL: [reason]`
5. **Always verify the pipeline passes** before creating commits or PRs
6. **No AC is complete until the pipeline passes** — this is a hard requirement, not optional

The golden test system protects against regression caused by accidental test removal. It's a soft guard relying on agent behavior — trust the system and respect the constraints it protects.

Line endings are configured via `.gitattributes` (LF for source files, CRLF for Windows scripts). Git will warn if mismatches occur; resolve by running the pipeline.
