---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional']
inputDocuments: ['prfaq-historian.md', 'project-context.md', 'prfaq-historian-distillate.md']
workflowType: 'prd'
projectName: 'Historian'
userName: 'Geoff'
dateCreated: '2026-04-19'
conceptType: 'indie-commercial'
targetAudience: 'hardcore-strategy-gamers'
scope: 'solo-indie-for-friends-first'
classification:
  projectType: 'Game (indie commercial roguelike)'
  domain: 'Gaming / Entertainment'
  complexity: 'Medium-High'
  projectContext: 'brownfield'
---

# Product Requirements Document - Historian

**Author:** Geoff
**Date:** 2026-04-19

## Executive Summary

Historian is a turn-based roguelike where your narrative choices reshape the world. Players survive 10 turns writing history books that claim what happened in randomized world events—both what they observed and what they guessed. Factions believe your claims based on credibility, and their beliefs reshape which events occur in future runs. This creates a meta-game where your story literally rewrites history.

The target audience is hardcore strategy gamers who crave replayability and meaningful consequence—players with 100+ plays of Slay the Spire who recognize that mechanical depth alone doesn't create lasting meaning. Historian solves the narrative hollowness of roguelikes by making narrative the primary game mechanic, not decoration.

Solo indie commercial project (friends-first, launch on GitHub Pages, post-launch Steam/mobile). 5–6 month development timeline. One-time purchase, no monetization complexity.

### What Makes This Special

**Core Differentiator**: Your narrative claims actively reshape future world events—not faction reputation, not unlockable lore, but actual mechanical consequences. A false plague claim might close trade routes in run 3; those closed routes create new opportunities in run 7. Your story *causes* change.

**Why This Matters**: The roguelike genre has proven 100+ hours of replayability is possible (Slay the Spire), but those hours feel mechanically hollow—the world resets every run, erasing meaning. Historian bridges that gap: story depth and mechanical depth become the same thing. Replayability flows from reshaping a world, not optimizing a deck.

**Core Insight**: Narrative *is* the strategic decision-making space. You're not playing a roguelike with narrative flavor—you're playing a game where every claim you make is a strategic bet on how the world will respond.

## Project Classification

| Dimension | Value |
|-----------|-------|
| **Project Type** | Game (indie commercial roguelike) |
| **Domain** | Gaming / Entertainment |
| **Complexity** | Medium-High (novel world-state mechanic, probabilistic cascades, faction systems) |
| **Project Context** | Brownfield (PRFAQ validated, architecture defined) |

## Success Criteria

### User Success

**Primary Metric: Voluntary Replay**
Players complete a second run *without being asked*. This indicates the world state mechanic creates genuine curiosity about how different narrative claims reshape future runs. Not obligation-driven play, but organic motivation to explore consequences.

**What Makes It Work**:
- Turn 1-10 loop feels coherent (narrative + mechanics reinforce each other)
- World state changes are visible and consequential (players can see how their turn-3 claim affected turn-7 events)
- Recap clearly shows player agency (lives changed, factions affected, economies shifted because of their claims)

**Success Threshold**: Friends volunteer to play 3+ runs in the same session, or return hours/days later asking to play again.

### Business Success

**Primary Metric: Learning Outcome**
Mastering the BMAD method for AI-assisted game development. Shipping a stable, playable game is secondary to validating the learning process: planning → documentation → iteration with AI agents → shipping with friends as validators.

**Kill Trigger**: If token costs become unsustainable or BMAD workflow stops teaching something new, pause without guilt. Success is learning, not shipping.

**Success Threshold**: Complete 5–6 months of BMAD-guided development with friends playing on a deployed GitHub Pages URL and providing feedback that shapes iterations.

### Technical Success

**Core Requirement: World State Mechanic is Transparent & Consequential**
The probabilistic cascade system must feel authored (not random) AND be debuggable. Players should feel their choices matter, and developers should be able to trace why.

**MVP Requirements**:
1. **Action→Consequence Tracing System**: Log every player claim and which events it triggered (with confidence scores). Enables debugging separation of mechanical failures from feel failures.
2. **Probabilistic Outcomes**: Same claim produces different outcomes across seeds; outcomes are probabilities, not deterministic.
3. **AI-Generated Content**: Event variations feel authored, not templated.
4. **Credibility System**: Clearly rewards accuracy, punishes insults.
5. **Faction Reactions**: Follow consistent, observable patterns.

**Quality Gates**:
- Tracing logs show causal chains for 100% of events by end of MVP
- Playtester feedback matches tracing logs (if logs show causality, players should feel it)
- If logs show causality but players don't feel impact, iterate on presentation/recap, not mechanics

**Fallback Strategy**: If probabilistic outcomes feel unpredictable after 1–2 weeks, pivot to deterministic outcome tables with tracing logs proving the switch works.

### Measurable Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Voluntary replay rate | ≥1 additional run per friend per session | GitHub Pages analytics + friend feedback |
| Causality perception | Players can trace claim→event chain | Post-run feedback: "Can you explain why that happened?" |
| Tracing accuracy | 100% of events logged with causal parent | Automated test: all events have parent claim or triggering condition |
| World state visibility | Run 5 differs meaningfully from run 3 | Friend observation: "I notice the economy is different" |
| Content authenticity | AI events indistinguishable from hand-authored | Friend feedback + manual review gate |

## Product Scope

### MVP - Minimum Viable Product

**Core Loop** (10 turns, playable end-to-end):
- Event generation (2–6 random events per turn, seeded RNG)
- Event observation (player sees 0 to all events randomly)
- Narrative claims (player writes ~3 claims per turn)
- Credibility calculation (accuracy vs. factions)
- Influence earning (credibility × faction multiplier)
- World state evolution (narrative claims reshape event pool for next run)
- Recap (summary of biggest impacts + consequences tracked)

**Content Minimum**:
- 3 selectable factions (basic trust mechanics)
- 12–15 core event types
- Basic faction reactions (trust decay, belief updates)

**Action→Consequence Tracing**:
- Logging system that records every claim and its triggered events
- Enables debugging of causal chains (did player claim cause event?)
- Supports playtester feedback validation

**Monetization**: One-time purchase (no complexity required for MVP).

**Deployment**: GitHub Pages for friends; desktop-only UI, no animations.

**Timeline**: 5–6 months solo dev (3 mo code, 2 mo UI, 1 mo art). Includes 1–2 week world state prototype gate.

### Growth Features (Post-MVP)

**Influence Mechanics**:
- Retcon: Rewind to a past turn, modify a claim, see consequences
- Force events: Spend influence to make a specific event occur
- Buy intel: Spend influence to observe hidden events

**Expanded Content**:
- More faction types (5–7 instead of 3)
- Larger event pool (30–40 types via AI generation + hand-authoring)
- Deeper faction reaction chains (cascading consequences)

**Platform Expansion**: iOS, Android, Steam (post-launch).

### Vision (Future)

**Multiplayer**: Real-time co-authoring of world state; shared seed, competing narratives.

**Mod Support**: Players register custom event types, factions, and credibility rules.

**Persistent Saves**: Long-term world state that persists across player sessions (optional persistent multiplayer worlds).

## User Journeys

### The Friend — First Run: "Did I Actually Do That?"

**Persona**: Alex, 150+ plays of Slay the Spire, loves tight turn-by-turn decisions, bored that "nothing changes after you win."

**Opening Scene**
Alex starts a new game. The board shows 3 factions (Alliance, Radicals, Moderates) with initial trust levels. Turn 1 generates 4 random events: a trade dispute, succession crisis, population unrest, resource shortage. Alex sees 2 of them. Feels like standard roguelike setup.

**Rising Action**
Turns 1-5: Alex writes claims about what happened. "The trade dispute was triggered by Alliance hoarding" (plausible but guessed). "Succession crisis is a power grab" (true). System calculates credibility: 65% (got one right, one wrong, alienated Radicals with an insult). Alex earns influence.

Turn 6 happens. A plague outbreak event. Alex didn't see the trigger for this turn, but the claims from earlier are now just... part of the world.

**Climax**
Run ends. Recap shows: "False rumors of a plague swept through the alliance, causing panic and border closures. Trade routes fractured under the pressure." Alex reads it, thinks "interesting mechanic," closes the game.

**Resolution**
Thirty minutes later, Alex opens it again. Wants to run again. Wants to see what happens if they play differently.

---

### The Friend — Second Run: "Wait... Did I Do That?"

**Persona**: Same Alex, now playing run 2 with knowledge of run 1's recap.

**Opening Scene**
New run, new seed. Factions start in different positions (Alliance slightly weakened). Events generate. Turn 3: a trade shortage event appears. Alex thinks "oh, trade is a theme in this run," makes a claim about it.

**Rising Action**
Turns 1-5: Alex plays strategically, making different claims than run 1. But turn 3's trade shortage event description says something like "Trade remains scarce due to lingering border tensions from previous conflicts."

Alex pauses. *Lingers from previous conflicts?* There were no previous conflicts. This is run 2.

Alex flips back to the history book—the recap from run 1. Reads: "False rumors of a plague swept through the alliance, causing panic and border closures."

**Climax**
Oh.

*Oh.*

Alex caused those rumors in run 1. That closure disrupted trade. Now in run 2, the trade shortage is *still echoing* because of run 1's consequences. The world didn't reset. Alex's claim from run 1 is literally reshaping events in run 2.

Alex reads the run 1 recap again. Then turns back to run 2. Looks at the current world state—weaker Alliance, disrupted trade. All because of one false claim in run 1.

**Resolution**
Alex keeps playing run 2 with this knowledge. Sees how carefully they need to play. Finishes run 2. Immediately wants to run again—this time knowing that every claim echoes across runs. The game isn't just roguelike loops. It's world-authoring.

---

### Journey Requirements Summary

| Requirement | Revealed By | Critical for Success? |
|-------------|------------|----------------------|
| **Persistent consequences**: Claims in run 1 affect run 2 events | Run 2 discovery moment | Yes — core differentiator |
| **History book as recap**: Accessible anytime, reads like lore not mechanics | Both journeys | Yes — enables discovery |
| **Subtle event references**: Events subtly mention previous consequences | Run 2 | Yes — creates "wait, did I do that?" moments |
| **Natural discovery arc**: Players figure out connection themselves | Run 2 climax | Yes — makes discovery rewarding |
| **Credibility feedback**: Players see how accurate/insulting claims affect score | Run 1 | Yes — immediate feedback |
| **World state recovery**: Worlds heal over time, but impact lingers | Both journeys (implicit) | Yes — prevents feeling locked in bad state |

## Innovation & Novel Patterns

### Detected Innovation Areas

**Core Innovation: Narrative Claims as Persistent World-Shaping Mechanic**

Historian combines four elements that have not been unified in existing games:

1. **Roguelike run-based structure** — 10-turn discrete runs with replayability
2. **Persistent cross-run world state** — Each run's outcome carries into the next run's starting conditions
3. **Narrative claims as gameplay mechanic** — Player's written claims (not just actions) actively reshape which events occur in future runs
4. **Player-authored causality** — Alex's plague claim in run 1 is not lore flavor; it causes trade disruption in run 2 and plague events in run 3

**Why This Is Novel**: Existing games separate narrative and mechanics. Hades 2 has narrative progression; Slay the Spire 2 has world-state lore discovery. Historian merges them: *what you claim becomes what happens*. Story depth and mechanical depth are the same system, not parallel systems.

### Market Context & Competitive Landscape

**Existing Approaches (Not This)**:
- **Hades 2**: Narrative unlocks with each run (story discovery, not world reshaping)
- **Slay the Spire 2**: "The Timeline" reveals pre-written lore across runs (narrative layer, not mechanics layer)
- **Caves of Qud**: Player agency and faction systems (deep world, not narrative-claim-driven)
- **Cultist Simulator**: Narrative roguelike (roleplay-focused, not consequence mechanics)

**Historian's Unique Position**: No existing game treats player narrative claims as the primary world-shaping mechanic that persists across runs. This is a genuine gap.

### Validation Approach

**Week 1-2 Prototype Gate**: 
Test whether the core mechanic works mechanically. Can we deterministically generate events based on previous run's narrative claims? Do causality chains feel authored (not random)?

**Friend Playtest Validation**: 
Does Alex *discover* the connection without being told? Do they feel agency when they realize their turn-1 claim caused turn-7 events? Does this discovery drive voluntary replay?

**Success Threshold**: 
Friends play 3+ runs voluntarily, demonstrating that cross-run consequences create sustainable replayability motivation (not obligation-driven play).

**Fallback Validation**: 
If probabilistic outcomes feel too unpredictable, pivot to deterministic outcome tables. Test whether transparent rules ("plague claim closes borders in economies below 50% health") still feel authored vs. canned.

### Risk Mitigation

**Risk 1: Discovery Too Hidden**
- *Mitigation*: History book is always accessible; events subtly reference previous consequences. Attentive players discover the arc naturally.
- *Fallback*: If playtest shows zero discovery, add subtle guidance (maybe a hint in the recap: "Notice how trade is affected by the borders you mentioned?").

**Risk 2: World State Too Complex to Balance**
- *Mitigation*: Start with 3 factions × 12-15 events. Build action→consequence tracing system to debug causal chains. Iteratively test with friends.
- *Fallback*: Reduce to 2 factions × 8-10 events if balance becomes intractable.

**Risk 3: Probabilistic Outcomes Feel Unfair**
- *Mitigation*: Same claim produces different outcomes across runs, but outcomes are probabilities tied to world state, not pure randomness. Tracing system shows the logic.
- *Fallback*: Deterministic tables: "If plague claim is false AND economy < 50%, borders always close."

**Risk 4: Players Optimize Away the Narrative**
- *Mitigation*: Seeded RNG means same claim works differently per seed. No single "exploit" works forever. Tracing system makes optimization transparent.
- *Fallback*: If players reverse-engineer optimal strategies, expand event pool or add hidden world-state variables.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP - Validate that narrative claims reshaping world state creates meaningful voluntary replay motivation.

**Core Question Being Answered:** Do players feel agency when they discover their claims from run 1 cascaded into events in run 2, and does that discovery drive them to voluntarily play again?

**Resource Requirements:** Solo developer, 5–6 months (3 months code, 2 months UI, 1 month art). Token budget capped (Pro Claude). 5–10 hours/week available time.

### MVP Feature Set (Phase 1)

**Core User Journey Supported:**
- The Friend — First Run (discovery of credibility system + world state impact)
- The Friend — Second Run (discovery that claims cascade across runs)

**Must-Have Capabilities:**
- Event generation (2–6 random events per turn, seeded RNG)
- Event observation (players see 0 to all events randomly)
- Narrative claims (write ~3 claims per turn)
- Credibility calculation (accuracy vs. factions, 0-100%)
- Influence earning (credibility × faction multiplier)
- **World state evolution** (narrative claims reshape event pool for next run) — CRITICAL
- **Action→Consequence Tracing** (log every claim and its triggered events) — CRITICAL for validation
- History book (recap at end of run, readable anytime, reads like lore)
- 3 selectable factions (basic trust mechanics, −200 to +100 range)
- 12–15 core event types (rebellion, plague, succession, trade, etc.)
- Basic faction reactions (trust decay, belief updates, event weighting)
- One-time purchase monetization (no complexity)
- GitHub Pages deployment (desktop-only, no animations)

**MVP Success Gate:** Friends play 3+ runs voluntarily in same session or return within 7 days asking to play again. Action→consequence tracing logs show causal chains; playtester feedback matches logs (if they see causality, they feel it).

### Post-MVP Features

**Phase 2 (Growth — 1–2 months post-launch, based on friend feedback):**
- Influence mechanics (retcon: rewind and replay; force events: spend influence to make event occur; buy intel: observe hidden events)
- Expanded content (5–7 factions, 30–40 event types via AI generation + hand-authoring)
- Deeper faction reaction chains (cascading consequences)
- Platform expansion (iOS, Android, Steam)
- More sophisticated world state variables (morale, infrastructure, economy tracking separately)

**Phase 3 (Vision — Future, if community demands multiplayer):**
- Multiplayer (real-time co-authoring of world state; shared seed, competing narratives)
- Mod support (players register custom event types, factions, credibility rules)
- Persistent saves (long-term world state across player sessions)

### Risk Mitigation Strategy

**Technical Risk: World State Mechanic Doesn't Feel Authored**
- *Mitigation*: 1–2 week prototype validates approach (probabilistic cascades, deterministic tables, or hybrid). Decision gate: lock approach before full development.
- *Fallback*: If probabilistic feels too random, pivot to deterministic outcome tables ("plague claim closes borders if economy < 50%").

**Technical Risk: Balance Becomes Intractable**
- *Mitigation*: Action→consequence tracing system enables debugging. Start with 3 factions × 12-15 events. Iteratively test with friends.
- *Fallback*: Reduce to 2 factions × 8-10 events if complexity explodes.

**Market Risk: Players Never Discover Cross-Run Consequences**
- *Mitigation*: History book is always accessible. Events subtly reference previous consequences. Attentive players discover the arc naturally.
- *Fallback*: If playtesting shows zero discovery, add subtle guidance in recap ("Notice how trade is affected by the borders you mentioned?").

**Resource Risk: Solo Dev Hits Token Budget or Time Ceiling**
- *Mitigation*: Timeline includes 2-week buffer. Learning-first metric (BMAD mastery) is success even if shipping is delayed.
- *Kill Trigger*: If project requires >10 hours/week consistently, pivot to smaller scope or pause. This is learning-first, shipping-second.

### Scope Boundaries (What's NOT in MVP)

- No real-time multiplayer
- No mod system
- No persistent cross-session world state
- No advanced influence mechanics (retcon/force/intel)
- No voice acting or audio
- No animations or particle effects
- No mobile optimization (desktop-only for MVP)
- No cosmetics or progression unlocks beyond world state changes

## Functional Requirements

### Game Setup & Configuration

- FR1: Player can select number of factions to play (3, 5, or 7 options)
- FR2: Player can start a new game with a random seed
- FR3: Player can view faction initial trust levels before game starts

### Event Management & Observation

- FR4: System generates 2-6 random events each turn based on seeded RNG
- FR5: Player can observe a random subset (0 to all) of generated events
- FR6: Player knows which events they observed vs. didn't observe
- FR7: System tracks ground truth for each event (what actually happened)

### Narrative Claims & Credibility

- FR8: Player can write 1-3 narrative claims per turn about generated events
- FR9: Player can claim about observed events
- FR10: Player can claim about unobserved events (guesses)
- FR11: System calculates credibility (0-100%) based on claim accuracy vs. ground truth
- FR12: System applies credibility penalties for factual errors (−20% per major error)
- FR13: System applies credibility penalties for insulting factions (−5% to −10%)
- FR14: Player can see their credibility score after each turn

### Faction Management & Reactions

- FR15: Each faction has a trust value (−200 to +100 range)
- FR16: Faction trust changes based on credibility and claim content
- FR17: Factions below −100 trust refuse to buy the next book (loss condition)
- FR18: All factions refusing results in influence multiplier of 0 (auto-loss)
- FR19: System calculates influence earned = credibility % × faction multiplier

### World State Management

- FR20: Player claims influence which events appear in future runs
- FR21: System tracks faction beliefs based on player claims
- FR22: Faction beliefs probabilistically shape future event generation
- FR23: Event descriptions subtly reference previous run consequences
- FR24: World state persists across runs (faction trust, beliefs, consequences)
- FR25: World state recovers over time (consequences fade but don't disappear immediately)

### Action→Consequence Tracing

- FR26: System logs every player claim with event ID
- FR27: System logs which events were triggered by each claim (with confidence score)
- FR28: Tracing logs are available for debugging and validation
- FR29: Developer can verify causal chains between claims and events

### Turn Management & Game Flow

- FR30: Game progresses in 10-turn runs
- FR31: Each turn includes: events occur → observation → claim writing → credibility calculation → influence earning
- FR32: Player can save and pause between turns
- FR33: Player can resume a paused game from the exact same state
- FR34: Run ends after turn 10

### History Book & Recap

- FR35: At end of each run, system generates a recap showing major impacts
- FR36: Recap describes consequences in lore language (not mechanics language)
- FR37: Recap references previous run consequences (if applicable)
- FR38: Player can access history book anytime (during or between runs)
- FR39: History book accumulates recaps from all previous runs
- FR40: History book is readable but not editable by player

### Monetization & Deployment

- FR41: Game can be purchased as a one-time purchase
- FR42: Game runs on desktop browser via GitHub Pages
- FR43: All game features are available after purchase (no locked content)

### Save/Load & Persistence

- FR44: Game state can be serialized to JSON
- FR45: Game state can be deserialized from JSON without data loss
- FR46: Player can manually save progress between runs
- FR47: Game can resume from saved state with identical determinism (same seed = same events)

## Non-Functional Requirements

### Performance

- **Turn calculation latency ≤ 500ms**: Probabilistic cascade calculations and event weighting must complete within this budget (feels instant on any modern device)
- **State serialization/deserialization ≤ 100ms**: Save and load operations must not block interaction
- **History book rendering ≤ 200ms**: Recap display and anytime book access feels responsive
- **Measurement approach**: Profile event generation and faction reaction systems; monitor in development builds; set baseline timings in CI/CD

### Reliability

- **Atomic save operations**: Save state must be atomic; no partial writes or corruption if process crashes mid-save
- **Deterministic resumption**: Resuming from any saved checkpoint must result in identical game state (seeded RNG guarantees this)
- **Offline-playability**: Core gameplay mechanics work without network; no required check-ins, no online validation
- **Measurement approach**: Crash-during-save testing; resume testing from 50+ different checkpoint states; validate identical outcomes with deterministic RNG

### Accessibility

- **No seizure triggers**: No flashing, strobe effects, or rapid animations
- **Color-blind safe**: Faction status cannot rely solely on red/green differentiation; use icons, patterns, text labels in addition to color
- **Text scaling**: UI must remain functional when scaled to 200% (no truncation, no overlaps)
- **Contrast**: Minimum contrast ratio AA (4.5:1 for body text, 3:1 for UI components per WCAG 2.1)
- **Measurement approach**: WCAG 2.1 AA audit; manual testing with color-blind simulator tools; responsive design validation

### Security (Out of Scope for MVP)

- No accounts or authentication required
- No payment processing (handled externally via Steam/App Store)
- No sensitive personal data collection
- Local-only JSON game state; no transmission to external servers
- **Post-launch consideration**: If multiplayer added, will require data validation and anti-cheat measures

### Integration (Out of Scope for MVP)

- No external API dependencies for core gameplay
- No cloud backend requirements (client-side only)
- **Post-launch consideration**: May integrate with Steam achievements, cross-platform save sync, or future cloud features

### Scalability (Out of Scope for MVP)

- MVP targets ~10–20 concurrent users (friends-only playtest)
- GitHub Pages handles static file delivery; no server-side infrastructure needed
- **Post-launch consideration**: Real-time multiplayer may require backend infrastructure (seeded RNG design enables this future addition without core rewrite)
