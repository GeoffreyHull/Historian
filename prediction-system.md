# Prediction / Credibility System — Problem Statement

## The Core Question

How do you mechanically determine whether a player's freeform narrative claim is "true" or "false" without:

- **Keywords**: Degenerating into keyword-stuffing (cramming "uprising revolt insurrection mutiny coup" into one sentence)
- **Substring match**: Trivialized by copy-pasting the event description
- **Stance toggle**: Reducing the game to a 50/50 coin-flip per event
- **NLP/LLM**: Depending on external services, breaking determinism and offline play

## Current System (Broken)

`src/game/credibilitySystem.ts` uses `EVENT_TYPE_KEYWORDS` — predefined keyword lists per event type (e.g. `rebellion → ["uprising", "revolt", "insurrection", "mutiny", "coup"]`). If ≥60% of keywords appear in the claim text, the claim is treated as "affirming" the event. Accuracy is then `affirming === (truthValue === "true")`.

**Problems:**
1. The event description is irrelevant to scoring — only the event type matters
2. Requires 3+ of 5 keywords to match — forces unnatural writing
3. Different event types have different keyword counts, making some types harder to affirm
4. No feedback to the player about what makes a good claim

## Constraints

- Must be **deterministic** (same input → same output, no external services)
- Must be **purely functional** (no I/O, no async)
- Must be **impossible or extremely awkward to game** (no copy-paste wins)
- Must preserve the **skill element** — the player should feel their writing choices matter
- Claim text is still saved for **run recaps**, **history book**, and **world-state consequences** regardless of scoring mechanism

## Design Goals

1. **Transparent** — Player understands why they got the score they did
2. **Skill-based** — Better observation and reasoning = higher scores
3. **Un-game-able** — No mechanical exploit for guaranteed max score
4. **Lore-preserving** — Narrative text remains the player's creative output
5. **Offline-first** — No API calls, no LLM dependency

## Open Questions

- Should accuracy be binary (correct/incorrect) or a spectrum?
- Should "I don't know" be a valid stance (partial credit)?
- Should the event description's content influence scoring at all, or should the mechanic be purely about stance-taking?
- Should credibility start at 50 (neutral) or should the baseline depend on something else?
- Should predictions be completely freeform, partially freeform (or some variant), or multiple choice?
