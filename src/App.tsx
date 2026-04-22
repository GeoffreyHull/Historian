import React, { useState, useMemo } from "react";
import { GameManager, createInitialGameState } from "./game/gameManager";
import { EventGenerator } from "./game/eventGenerator";
import { evaluateClaimsBatch } from "./game/credibilitySystem";
import { Claim } from "./game/types";
import { EventCard } from "./components/EventCard";
import { ClaimInput } from "./components/ClaimInput";
import { CredibilityResult } from "./components/CredibilityResult";
import { ClaimLedger } from "./components/ClaimLedger";
import { FactionTrust } from "./components/FactionTrust";
import styles from "./App.module.css";

export const App: React.FC = () => {
  const gameManager = useMemo(() => {
    const manager = new GameManager();
    const generator = new EventGenerator(42); // Seeded for determinism
    const generatedEvents = generator.generateEvents(3); // 3 events per turn
    manager.dispatch({ type: "updateEvents", events: generatedEvents });
    return manager;
  }, []);

  const gameState = gameManager.getState();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [credibilityResults, setCredibilityResults] = useState<
    Array<{ eventId: string; finalCredibility: number }>
  >([]);

  const handleClaimSubmit = (claimText: string) => {
    const eventIndex = claims.length % gameState.events.length;
    const selectedEvent = gameState.events[eventIndex];
    const newClaim: Claim = {
      claimText,
      eventId: selectedEvent?.eventId ?? "unknown" as any,
      isAboutObservedEvent: selectedEvent?.observedByPlayer ?? false,
      turnNumber: gameState.turnNumber,
    };

    const updatedClaims = [...claims, newClaim];
    setClaims(updatedClaims);

    // Evaluate the claim
    const results = evaluateClaimsBatch(updatedClaims, gameState.events, gameState.currentFaction);
    const resultMap = results.map((r) => ({
      eventId: r.event.eventId,
      finalCredibility: r.finalCredibility,
    }));
    setCredibilityResults(resultMap);

    // Dispatch to game manager
    gameManager.dispatch({
      type: "writeClaim",
      claims: [newClaim],
    });
    gameManager.dispatch({
      type: "evaluateClaims",
      results,
    });
  };

  const claimLedgerItems = claims.map((claim, index) => {
    const cred = credibilityResults[index]?.finalCredibility ?? 0;
    let status: "confirmed" | "disputed" | "unconfirmed";
    if (cred >= 64) {
      status = "confirmed";
    } else if (cred >= 40) {
      status = "unconfirmed";
    } else {
      status = "disputed";
    }
    return {
      claimId: `C${index + 1}`,
      claim,
      status,
    };
  });

  const averageCredibility = credibilityResults.length > 0
    ? Math.round(credibilityResults.reduce((sum, r) => sum + r.finalCredibility, 0) / credibilityResults.length)
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
            <h2 className={styles.sectionTitle}>Turn {gameState.turnNumber} Events</h2>
            <div className={styles.eventList}>
              {gameState.events.map((event) => (
                <EventCard key={event.eventId} event={event} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Make Your Claims</h2>
            <ClaimInput
              eventDescription={gameState.events[0]?.description ?? "a mysterious occurrence"}
              onSubmit={handleClaimSubmit}
              disabled={claims.length >= 3}
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
