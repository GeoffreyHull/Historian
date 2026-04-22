import React, { useState } from "react";
import { createInitialGameState } from "./game/gameManager";
import { EventGenerator } from "./game/eventGenerator";
import { evaluateClaimsBatch } from "./game/credibilitySystem";
import { executeTurn } from "./game/turnExecutor";
import { Claim, Faction, GameState, RunRecap as RunRecapData } from "./game/types";
import { MainMenu } from "./components/MainMenu";
import { EventCard } from "./components/EventCard";
import { ClaimInput } from "./components/ClaimInput";
import { CredibilityResult } from "./components/CredibilityResult";
import { ClaimLedger } from "./components/ClaimLedger";
import { FactionTrust } from "./components/FactionTrust";
import { RunRecap } from "./components/RunRecap";
import styles from "./App.module.css";

type Screen = "menu" | "playing" | "recap";

function generateEventsForState(state: GameState) {
  const seed = state.worldState.initialSeed + state.turnNumber;
  const gen = new EventGenerator(seed);
  gen.setWorldState(state.worldState, state.currentFaction);
  return gen.generateEvents(state.turnNumber, 3);
}

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [currentClaims, setCurrentClaims] = useState<Claim[]>([]);
  const [credibilityResults, setCredibilityResults] = useState<
    Array<{ eventId: string; finalCredibility: number }>
  >([]);
  const [recap, setRecap] = useState<RunRecapData | null>(null);
  const [nextRunState, setNextRunState] = useState<GameState | null>(null);

  const handleStartGame = (faction: Faction) => {
    const initial = createInitialGameState(faction);
    const events = generateEventsForState(initial);
    setGameState({ ...initial, events });
    setCurrentClaims([]);
    setCredibilityResults([]);
    setRecap(null);
    setNextRunState(null);
    setScreen("playing");
  };

  const handleClaimSubmit = (claimText: string) => {
    const eventIndex = currentClaims.length % gameState.events.length;
    const selectedEvent = gameState.events[eventIndex];
    const newClaim: Claim = {
      claimText,
      eventId: selectedEvent?.eventId ?? ("unknown" as any),
      isAboutObservedEvent: selectedEvent?.observedByPlayer ?? false,
      turnNumber: gameState.turnNumber,
    };

    const updatedClaims = [...currentClaims, newClaim];
    setCurrentClaims(updatedClaims);

    const results = evaluateClaimsBatch(updatedClaims, gameState.events, gameState.currentFaction);
    setCredibilityResults(
      results.map((r) => ({ eventId: r.event.eventId, finalCredibility: r.finalCredibility }))
    );
  };

  const handleEndTurn = () => {
    const result = executeTurn(gameState, currentClaims);

    if (result.runEnded && result.recap) {
      setRecap(result.recap);
      setNextRunState(result.updatedState);
      setScreen("recap");
    } else {
      const events = generateEventsForState(result.updatedState);
      setGameState({ ...result.updatedState, events });
      setCurrentClaims([]);
      setCredibilityResults([]);
    }
  };

  const handleContinueAfterRecap = () => {
    if (nextRunState) {
      const events = generateEventsForState(nextRunState);
      setGameState({ ...nextRunState, events });
    }
    setCurrentClaims([]);
    setCredibilityResults([]);
    setRecap(null);
    setNextRunState(null);
    setScreen("playing");
  };

  if (screen === "menu") {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  if (screen === "recap" && recap) {
    const claimAnchors = recap.majorClaims.map((text, i) => ({
      claimId: `C${i + 1}`,
      claimText: text,
      turnNumber: 10,
    }));

    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <h1>Historian</h1>
          <p className={styles.subtitle}>A game of narrative and consequence</p>
        </header>
        <div className={styles.recapContainer}>
          <RunRecap
            runTitle={`Run ${recap.runNumber} Complete`}
            narrative={recap.narrative}
            claimAnchors={claimAnchors}
            turnsCompleted={10}
            totalClaimsMade={recap.majorClaims.length}
            finalFactionOutcomes={{ historian: 75, scholar: 60, witness: 80, scribe: 55 }}
          />
          <div className={styles.endTurnSection}>
            <button className={styles.endTurnButton} onClick={handleContinueAfterRecap}>
              Begin Run {recap.runNumber + 1} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const claimLedgerItems = currentClaims.map((claim, index) => {
    const cred = credibilityResults[index]?.finalCredibility ?? 0;
    let status: "confirmed" | "disputed" | "unconfirmed";
    if (cred >= 64) status = "confirmed";
    else if (cred >= 40) status = "unconfirmed";
    else status = "disputed";
    return { claimId: `C${index + 1}`, claim, status };
  });

  const averageCredibility =
    credibilityResults.length > 0
      ? Math.round(
          credibilityResults.reduce((sum, r) => sum + r.finalCredibility, 0) /
            credibilityResults.length
        )
      : 0;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Historian</h1>
        <p className={styles.subtitle}>A game of narrative and consequence</p>
      </header>

      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Turn {gameState.turnNumber} / 10 — Events
            </h2>
            <div className={styles.eventList}>
              {gameState.events.map((event) => (
                <EventCard key={event.eventId} event={event} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Make Your Claims</h2>
            <ClaimInput
              eventDescription={
                gameState.events[currentClaims.length % Math.max(gameState.events.length, 1)]
                  ?.description ?? "a mysterious occurrence"
              }
              onSubmit={handleClaimSubmit}
              disabled={currentClaims.length >= 3}
            />
          </section>

          {credibilityResults.length > 0 && (
            <section className={styles.section}>
              <CredibilityResult
                factionScores={[
                  { name: "historian", emoji: "📖", score: averageCredibility },
                  { name: "scholar", emoji: "🔬", score: Math.max(0, averageCredibility - 10) },
                  { name: "witness", emoji: "👁️", score: Math.max(0, averageCredibility - 5) },
                  { name: "scribe", emoji: "✍️", score: Math.max(0, averageCredibility - 8) },
                ]}
                finalCredibility={averageCredibility}
              />
            </section>
          )}

          <div className={styles.endTurnSection}>
            <button
              className={styles.endTurnButton}
              onClick={handleEndTurn}
              disabled={currentClaims.length === 0}
            >
              End Turn {gameState.turnNumber} →
            </button>
            {currentClaims.length === 0 && (
              <p className={styles.endTurnHint}>Write at least one claim to end the turn</p>
            )}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <FactionTrust
            factions={[
              { name: "historian", emoji: "📖", trust: 75 },
              { name: "scholar", emoji: "🔬", trust: 60 },
              { name: "witness", emoji: "👁️", trust: 80 },
              { name: "scribe", emoji: "✍️", trust: 55 },
            ]}
          />
          <ClaimLedger claims={claimLedgerItems} />
        </aside>
      </div>
    </div>
  );
};
