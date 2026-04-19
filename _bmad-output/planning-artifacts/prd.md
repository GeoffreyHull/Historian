---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain']
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
