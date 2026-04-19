---
project_name: Historian
user_name: Geoff
date_created: 2026-04-19
status: complete
stage: 5
concept_type: indie-commercial
target_audience: hardcore-strategy-gamers
scope: solo-indie-for-friends-first
---

# PRFAQ: Historian

## Stage 2: The Press Release (COMPLETE)

### HEADLINE

**Historian — The Roguelike Where Your Narrative Choices Reshape History**

### SUBHEADLINE

Roguelike replayability meets evolving world-state. Your narrative choices shape history — across runs.

### OPENING PARAGRAPH

Today, we're announcing Historian, a turn-based roguelike where your narrative choices reshape the world. Built for strategy gamers who crave replayability and meaningful consequence, Historian combines the strategic depth of Slay the Spire with an evolving world-state that remembers your decisions across runs.

### PROBLEM PARAGRAPH

The best roguelikes are mechanically brilliant. Tight turn-based decisions. Randomness that rewards learning. Twenty runs, thirty, a hundred—each one teaches you something. But they're narratively hollow. The world doesn't care how you won. Your playthrough doesn't shape anything beyond your final score. You win. You restart. The world resets.

### SOLUTION PARAGRAPH

In Historian, the world remembers. You write history books claiming what happened in randomized events. Factions believe or distrust you based on your credibility. Your narrative influences what happens next. You write about a war being declared when none occurred—factions believe you, begin military preparation, and the war never happens. You claim a plague is spreading—commerce fractures in response, reshaping future turns. Your story rewrites reality.

### LEADER QUOTE

"Slay the Spire proved roguelikes could have 100+ hours of replayability. But those hours don't *mean* anything narratively. Historian asks: what if your replayability came from reshaping a world, not optimizing a deck? What if story depth and mechanical depth were the same thing?"

— Geoff, Creator

### HOW IT WORKS

Each run, the world generates random events. You didn't see all of them. You write history based on what you observed—and what you guess. Factions read your book. They remember what you claimed. But more: your narrative influences what happens next. You write about a war being declared when none occurred—factions believe you, begin military preparation, and the war never happens. You claim a plague is spreading—commerce fractures in response, reshaping future turns. Your story rewrites reality.

### CUSTOMER QUOTE

"I've played Slay the Spire 200+ times. But after you win, nothing changes. In Historian, I wrote about a trade war that never happened—and the next run, the economy was completely different. I'm not just replaying the same game. I'm seeing how my story shapes history. I can't stop playing."

— A roguelike player

### GETTING STARTED

Historian is available now on iOS, Android, and Steam. Download. Start a new game. 20 turns. Write history. See how the world changes.

---

<!-- coaching-notes-stage-2 -->
**Coaching Notes — Stage 2:**
- **Core insight locked**: Narrative rewrites future events, not just faction reputation. This is the differentiator.
- **Positioning**: Anchored to Slay the Spire (familiar to target audience) but claims a new space (narrative consequence + replayability as one thing).
- **Tone**: Direct, confident, no jargon. Press release reads clean.
- **Out-of-scope details captured**: Solo indie project, building for friends first, eventual mobile/Steam release, browser-based prototype for friends.
- **Mechanics NOT in press release**: Credibility penalties, influence costs, retcon/force/intel systems. Deliberately kept out—focus on the *experience*, not the system.
<!-- /coaching-notes-stage-2 -->

---

## Stage 3: Customer FAQ (COMPLETE)

### Q1: How is this different from Slay the Spire 2?

**A:** StS2 has "The Timeline"—it reveals lore across runs. But that's discovering a pre-written world. In Historian, you're not unlocking content—you're rewriting history. Your narrative choices on turn 5 of run 3 reshape which events happen in run 10. You're not a discoverer; you're a world-shaper.

### Q2: Won't the narrative choices get repetitive after 10 runs?

**A:** The same events manifest differently based on world state. A rebellion in a run where the economy is strong creates different consequences than a rebellion in a run where infrastructure is fragile. Plus, we're building irreversible decisions—your claims lock the world into specific states. Combined with faction relationships (A trusts you, but hates B), the number of unique scenarios explodes. Run 15 faces a completely different political landscape than run 3, not because there are infinite events, but because the *world state* creates different stakes for the same events.

### Q3: How long is a run?

**A:** 20–40 minutes per run across 10 turns. Short enough to play on mobile during a commute, but long enough for your narrative choices to meaningfully reshape the world. 20+ runs across different world states gives 400–800 minutes of gameplay—comparable to Slay the Spire's replayability density.

### Q4: Can I pause mid-run and come back later?

**A:** Yes. You can save and pause at any time—between turns, mid-claim, whenever. Your world state, turn progress, and partial book are preserved. Pick it back up hours later.

### Q5: How does the "world state evolution" actually work mechanically?

**A:** Your claims influence world beliefs. Factions act on those beliefs, reshaping the event pool for future runs. A false plague claim makes factions close borders; trade routes fail; new opportunities emerge. We're shipping a working version and iterating based on how players interact with it.

### Q6: What if I "solve" the world in 5 runs?

**A:** Exploits are fine. The key is that outcomes are probabilistic, not deterministic. You claim a plague? It MIGHT crash commerce in this seed—but not the next. Factions respond probabilistically to beliefs, not guaranteed outcomes. Seeded runs let us debug (same seed = same results), but different seeds mean your 'exploit' works differently each time. This prevents reverse engineering from becoming boring while keeping the game explorable.

### Q7: Is this single-player only, or can I play with friends?

**A:** Single-player for launch. But you can share save states with friends—let them continue your run, reshape the world differently, and see how the history diverges. Multiplayer (real-time co-authoring) is planned for future releases.

### Q8: You're a solo dev. What happens if you abandon this?

**A:** Fair question. I'm building this solo, so no corporate guarantee of forever support. But here's the commitment: I'm launching based on friend feedback, and I'll re-evaluate based on how people play it. If the community loves it, I'll support it. If interest dies, I'll be transparent about it—and I'm committed to making the game offline-playable so it doesn't become unplayable if I stop updating. That's the safety net.

### Q9: How will this be monetized?

**A:** One-time purchase. No battle pass, no cosmetics, no pay-to-win mechanics. Buy the game, play everything. All narratives, all world states, all mechanics included.

### Q10: What's the actual win condition beyond "survive 10 turns"?

**A:** After 10 turns, you get a Recap: how your narrative reshaped history. Biggest impacts. Consequences tracked—lives changed, factions strengthened/weakened, economies shifted, deaths caused by your claims. There's no "beating" Historian. There's seeing how deeply your story shaped the world. Every playthrough is a different history you authored. The recap is your signature.

---

## Stage 4: Internal FAQ (COMPLETE)

### Q1: What's the hardest technical problem you don't know how to solve yet?

**A:** Making world state effects feel authored but not deterministic. How do you create meaningful variation without hand-authoring infinite combinations? We've identified several approaches (probabilistic cascades, faction-specific manifestations, state-based variation, interaction systems). Before committing to the full architecture, we need to prototype 2–3 of these with a test event and see which feels right mechanically. That's a 1–2 week exploration. Decision gate: by end of week 2, we lock an approach and build the full event system around it.

### Q2: Can one person build this, and in what timeline?

**A:** Yes. Timeline: 5–6 months from start to friends playing on a deployed GitHub Pages URL. Code/game logic: 3 months (includes the 1–2 week world state prototype). UI (all screens, desktop-only, no animations): 2 months. Art (board, UI, event assets): 1 month. Somewhat sequential with overlap. No audio. Testing/balance: ongoing with friends on the deployed URL. This assumes focused work (part-time or full-time). If part-time/weekend, add 50%. Biggest risk: iteration cycles based on friend feedback extend the UI/balance phase. Buffer: 2 weeks for unexpected complexity.

### Q3: What happens if the world state mechanic doesn't feel good in practice?

**A:** If friends say they don't like the randomness—that outcomes feel unpredictable and break narrative planning—we pivot to deterministic outcome tables. Transparent rules: 'Plague claim crashes commerce in this economy state' instead of 'might crash.' Sacrifice replayability surprise for narrative clarity. We give it 2 weeks of friend playtesting to diagnose the issue, then commit to pivot. Fallback shipped game: single-run Historian without cross-run mechanics, or simplified world state with deterministic rules.

### Q4: How do you design for replayability when you're a solo dev with limited content bandwidth?

**A:** Leverage AI to generate event variations from hand-authored templates. We hand-author 12–15 core event types (rebellion, plague, succession, etc.) with faction reaction templates. Use AI to generate variations from those templates using BMAD method structure—'Rebellion in the North' vs 'Rebellion in the East,' same template, different parameters. AI generates event descriptions and contextual variations. Quality gate: all AI-generated content reviewed and approved before shipping. If quality drops below standard, reduce generated content set. This extends bandwidth without losing narrative voice.

### Q5: What's your business model beyond "friends buy it"?

**A:** Not a priority. This is a personal project—success is measured by whether my friends love playing it, not by reaching 100 customers or profitable sales. One-time purchase on web/Steam is the monetization. Distribution and marketing are secondary. If it resonates beyond friends, great. If not, that's fine—the goal is to build something fun that my friends want to play.

### Q6: What kills this project?

**A:** Burnout from juggling family + development + token constraints (Pro Claude Code). Loss of interest if the BMAD method learning isn't working, or if the project outpaces available time. Real success metric: learning AI-assisted development through BMAD, building Historian as the vehicle. If Historian doesn't ship, but the BMAD learning sticks, that's still a win. Kill triggers: (1) Project requires >5–10 hours/week consistently, (2) Token costs become unsustainable, (3) BMAD workflow stops teaching me something new. If any hit, we pivot to smaller scope or pause without guilt. This is learning-first, shipping-second.

### Q7: What's your contingency if multiplayer becomes critical to the game's success?

**A:** Multiplayer is post-launch. Single-player ships first. But the architecture is designed with multiplayer in mind (seeded RNG, deterministic state, JSON serialization), so adding async multiplayer later won't require a rewrite. If friends demand it, we add shared world state or co-op modes. Not blocking launch.

### Q8: Can you handle the narrative design depth this requires?

**A:** It's a risk—I haven't authored complex faction systems + cascading consequences before. But I'm committed to learning through iteration. Strategy: start simple (3 factions, 12 events, basic reactions). Get friend feedback. Iterate design based on what feels good. This is part of the learning goal. If unsustainable, scope down (fewer factions, simpler cascades). Narrative design is the creative work I'm most excited about, so the motivation is there.

<!-- coaching-notes-stage-4 -->
**Coaching Notes — Stage 4:**
- **Feasibility risks identified**: World state prototype is critical (1-2 week gate). Narrative design is learning path, not blocker. AI content strategy defined + quality-gated.
- **Resource/timeline realistic**: 5-6 months is honest; includes buffers and acknowledges solo dev constraints (tokens, family time).
- **Unknowns flagged with discovery plans**: World state approach (will prototype), narrative depth (will iterate), content quality (will review). No unexamined unknowns.
- **Strategic positioning clear**: This is learning-first project (BMAD method), friends-first (not startup). Success = learn + friends play. Removes pressure for monetization/distribution.
- **Technical constraints surfaced**: Token budget (Pro Claude), family time (5-10 hrs/week max), browser deployment (GitHub Pages).
<!-- /coaching-notes-stage-4 -->

---

## Stage 5: The Verdict

### Concept Strength: FORGED & NEEDS HEAT (Ready to Build, with Caveats)

**Forged in Steel** ✅

- **Core mechanic is locked and novel**: Narrative claims reshape future world events. StS2 doesn't do this. Differentiator is real.
- **Replayability strategy is sound**: Event modifiers + irreversible decisions + faction relationships = emergent complexity without infinite hand-authoring.
- **Monetization is clean**: One-time purchase, no gatekeeping. Removes player skepticism immediately.
- **End-state is meaningful**: Narrative recap showing consequences reinforces core mechanic.
- **Timeline is honest and defensive**: 5–6 months, acknowledges constraints, includes buffers.
- **Kill triggers are healthy**: Learning-first metric means success isn't binary "ship or die."

**Needs More Heat** ⚠️

- **World state mechanic untested**: 4 approaches identified, but none proven. 1–2 week prototype is planned and critical.
- **Narrative design is learning journey**: You're learning design through iteration. Okay for this project, but means early versions may feel unpolished.
- **AI-generated content untested**: BMAD + human review is smart strategy, but you haven't validated that AI output feels authored.
- **Content scope is thin**: 12–15 events is light. Procedural extension works only if the approach works.

**Cracks in the Foundation** 🔴

- **Replayability is bet-the-company on world state mechanic**: If probabilistic outcomes feel bad, fallback (deterministic) trades exploration for predictability. Either way, there's a ceiling.
- **Solo dev constraints could force scope cuts**: Token budget + family time could hit a wall month 3–4. Plan for this.
- **Testing plan is informal**: "Friends play" is real, but no explicit balance metrics. You need to track: run depth, repeat rate, when players stop.
- **Narrative authenticity is non-negotiable**: If AI events feel cheap or faction reactions feel canned, the whole game collapses. This isn't optional.

### Recommendation

**Build this. Here's why:**

1. Core mechanic is genuinely novel
2. Your constraints are honest, not wishful
3. You've identified risks and have fallbacks
4. Timeline is realistic and includes buffers
5. Learning-first metric actually de-risks the project

**But do this first:**

1. **Week 1–2: Prototype world state** — Test 2–3 approaches with one event. If none feel good, pivot before full development.
2. **Ongoing: Track replayability metrics** — Measure run depth and repeat rate with friends. If players stop at run 10, you know the ceiling early.
3. **Narrative iteration budget** — Design 12 events + 3 factions is harder than it sounds. Plan for 20–30% of code time on narrative iteration.

**This concept survives the gauntlet.** You're ready to move to PRD creation.

---


