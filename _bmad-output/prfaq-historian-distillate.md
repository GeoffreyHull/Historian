---
name: Historian PRFAQ Distillate
type: reference
purpose: token-efficient summary for downstream PRD creation
source: prfaq-historian.md (Stage 5 complete)
date: 2026-04-19
---

# Historian — PRFAQ Distillate

## Core Concept (One Sentence)
Turn-based roguelike where your narrative claims about randomized world events actually reshape what happens in future runs.

## Value Proposition
- **Mechanical**: Roguelike replayability (100+ hours) + turn-based strategy depth (Slay the Spire class)
- **Narrative**: Choices matter *during the run* (credibility, faction trust) AND *across runs* (world state evolution)
- **Emotional**: Author history → see your story reshape the world → authored consequences reinforce replayability

## Differentiator vs. StS2
StS2: "The Timeline" reveals pre-written lore as you unlock it (passive discovery)
Historian: Your narrative claims actively reshape which events occur next (active world-shaping)

## Customer Persona
- **Core**: Hardcore roguelike/strategy gamers (200+ Slay the Spire plays, comfortable with chaos)
- **Pain**: Roguelikes are mechanically brilliant but narratively hollow—replaying the same world resets all meaning
- **Want**: Replayability where each run shapes something persistent; exploration where narrative matters mechanically

## Game Mechanics (Locked)

### Turn Loop (10 turns per run)
1. World generates 2-6 random events
2. Player observes 0 to all events (random)
3. Player writes claims about observed + guessed events
4. Credibility calculated (accuracy vs. factions' beliefs)
5. Influence earned (credibility × faction multiplier)
6. [Future] Influence spent on retcon/force/intel

### Credibility System
- Base: 100%
- Wrong major claim: −20%
- Insult faction: −5% to −10%
- Result: 0–100% affects influence multiplier

### World State Mechanics (Critical, Untested)
- **Problem**: How do claims actually reshape future events without hand-authoring infinite combinations?
- **Approach**: Probabilistic outcomes + irreversible decisions + faction relationships = emergent complexity
- **Example**: "Plague spreading" → commerce routes close → new opportunities emerge (deterministic cascade, probabilistic outcome)
- **Fallback**: Deterministic outcome tables if probabilistic feels too random

### Factions
- 3–5 selected at game start (player choice)
- Trust ranges −200 to +100
- Trust < −100: refuse to buy next book (lose condition)
- All refuse: multiplier = 0 (auto-lose)

### Win Condition
Survive 10 turns; receive Recap showing biggest impacts (lives changed, economies shifted, wars prevented/caused)

## Scope & Timeline

### Solo dev, 5–6 months (focused work)
- **Code/Logic**: 3 months (includes world state prototype: 1–2 weeks)
- **UI**: 2 months (desktop-only, no animations)
- **Art**: 1 month (board, UI, event visuals)
- **Testing/Balance**: Ongoing friend playtest via deployed GitHub Pages URL
- **No audio**

### Content Strategy
- Hand-author 12–15 core event templates (rebellion, plague, succession, etc.)
- AI generates variations using BMAD method + templates
- Human review all AI content before shipping
- Avoids infinite hand-authoring burden

## Constraints & Intent

### Technical Constraints (from project-context.md)
1. **Pure Functions**: All game logic is deterministic; no hidden state
2. **Immutable State**: Never modify objects; create new ones
3. **Seeded RNG**: Same seed = same world/events (enables testing, multiplayer, recording)
4. **Extensible Events**: Events are templates; AI generates variations
5. **JSON Serializable**: All state can be saved/shared/replayed
6. **Action-Based Updates**: State changes via discrete actions, not mutations
7. **Presentational Components**: React components are dumb; logic lives in game manager
8. **Centralized Costs**: All influence costs, credibility rules, faction reactions in one place

### Why This Matters
These constraints exist to enable:
- Retcon system (rewind claims, recalculate consequences)
- Multiplayer (sync state across players)
- Mod support (extend events without touching core)
- Deterministic replay (watch a run again exactly)
- Save state sharing (play friend's world state)

### Platform & Deployment
- **Launch**: Browser-based (GitHub Pages) for friends
- **Post-launch**: iOS, Android, Steam (one-time purchase)
- **No always-online requirement** (offline-playable for persistence)

### Monetization
One-time purchase; no battle pass, cosmetics, pay-to-win. All narratives, world states, mechanics included.

## Rejected Framings & Why

| Framing | Issue | Reason Dropped |
|---------|-------|-----------------|
| "Unlock new cards like StS" | Trivializes narrative reshaping | Content comes from world state, not progression |
| "Solve the world in 5 runs" | Treats design as puzzle to reverse-engineer | Probabilistic outcomes prevent exploitation |
| "Guaranteed narrative impact" | Promises determinism players can't see | Probabilistic cascades let claims *influence* not guarantee |
| "Commercial success critical" | Pressures solo dev on timeline | Learning-first mindset removes deadline stress |
| "Multiplayer at launch" | Adds complexity, delays shipping | Designed for multiplayer (seeded RNG, JSON), shipped after friends validate |

## Open Questions & Prototype Gates

### World State Mechanic (Blocker)
- **Status**: Identified 4 approaches; none prototyped
- **Gate**: 1–2 week prototype (test 2–3 approaches with one event)
- **Pass Criteria**: One approach feels mechanically good to friends
- **Fallback**: Deterministic outcome tables if probabilistic fails

### Narrative Design Depth
- **Status**: Learning journey; author hasn't built faction cascades before
- **Approach**: Start simple (3 factions, 12 events), iterate on friend feedback
- **Risk**: Early versions may feel unpolished
- **Acceptable**: This is the creative learning goal

### AI Content Quality
- **Status**: BMAD + human review strategy; untested
- **Approach**: Generate event variations from templates, review all before shipping
- **Risk**: AI output might feel cheap/canned
- **Non-negotiable**: Narrative authenticity is load-bearing (game collapses if it fails)

### Replayability Depth
- **Status**: Bet on world state mechanic + probabilistic outcomes
- **Concern**: If outcomes feel too random, planning becomes impossible
- **Plan**: Friends playtest to diagnose (run depth, repeat rate metrics)
- **Buffer**: 20% of code time reserved for narrative iteration

## Requirements Signals

| Signal | Implication |
|--------|------------|
| "Factions remember" | State must persist across runs in deterministic way |
| "Your story rewrites reality" | Narrative claims directly cause mechanical effects |
| "World changes as you play" | Meta-game progression happens through world state, not card unlocks |
| "How deeply your story shaped the world" | Recap must track *caused* consequences (not just "visited events") |
| "Probabilistic but explorable" | Same claim works differently per seed; not purely random, not fully predictable |
| "Friends testing on GitHub Pages" | Must deploy early, often, with friend feedback loop |

## Success Metrics

### For Validation
- Friend repeat rate: "Would I play again?" (run depth, motivation to explore)
- World state feeling: "Do my choices feel like they matter next run?"
- Narrative authenticity: "Does it feel authored, not canned?"

### For Launch
- 1 complete playthrough feels coherent (10 turns, meaningful recap)
- 5+ runs show meaningful world state variation
- Friends volunteer to keep playing (not obligation)

### Learning (Primary Goal)
- BMAD method proficiency (planning, documentation, agent-assisted dev)
- Solo dev workflow under token budget + family time constraints
- Narrative design through iteration (not upfront planning)

## Risk Mitigation

| Risk | Mitigation | Owner |
|------|-----------|-------|
| World state mechanic doesn't feel good | 1–2 week prototype before full build | Geoff |
| Narrative design is too complex | Start simple, iterate on feedback | Geoff |
| AI content quality drops | Human review gate on all AI output | Geoff |
| Solo dev hits burnout | Learning-first metric (BMAD matters more than shipping) | Geoff |
| Token budget maxed out | Friend feedback + async iteration (not real-time AI) | Geoff |
| Family time conflict | 5–10 hrs/week max; add 50% to timeline if needed | Geoff |

## Next Steps (Immediate)

1. **Prototype world state** (1–2 weeks): Test 2–3 approaches with 1 core event. Lock approach before full build.
2. **Design 12–15 event templates**: Core events + faction reactions + AI variation structure.
3. **Hand-author 3 factions**: Trust mechanics, reaction patterns, initial beliefs.
4. **Deploy GitHub Pages**: Set up repo for friend testing (early, often, async feedback).
5. **Create PRD**: Use this distillate + verdict to nail scope, architecture, and acceptance criteria.

## Verdict Summary

**Concept is forged and ready to build with critical caveats:**

✅ Core mechanic is novel and locked (world-reshaping narrative)
✅ Timeline is honest and includes buffers
✅ Kill triggers are healthy (learning-first removes binary shipping pressure)
✅ Constraints are smart (seeded RNG, immutable state enable multiplayer/mods)

⚠️ World state mechanic untested (prototype gate required)
⚠️ Narrative design is learning journey (early versions unpolished)
⚠️ AI content untested (review gate required)

🔴 Replayability hinges on world state feeling good (single point of failure)
🔴 Solo dev constraints could force scope cuts (monitor token budget + time)
🔴 Testing plan is informal (recommend tracking metrics: run depth, repeat rate, when players stop)

**Recommendation**: Build this. Prototype world state first. Do it.
