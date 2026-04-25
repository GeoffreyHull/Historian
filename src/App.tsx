import React, { useState, useEffect } from "react";
import { createInitialGameState } from "./game/gameManager";
import { EventGenerator } from "./game/eventGenerator";
import { evaluateClaimsBatch } from "./game/credibilitySystem";
import { executeTurn } from "./game/turnExecutor";
import { Claim, Faction, GameState, RunRecap as RunRecapData } from "./game/types";
import { saveGameState, loadGameState, hasSavedGame as checkHasSavedGame } from "./game/sessionPersistence";
import { buildHistoryBookData } from "./game/historyBookUtils";
import { buyIntel, canBuyIntel, BUY_INTEL_COST, forceEvent, canForceEvent, FORCE_EVENT_COST } from "./game/influenceActions";
import { EVENT_TYPE_KEYWORDS } from "./game/constants";
import { MainMenu } from "./components/MainMenu";
import { EventCard } from "./components/EventCard";
import { ClaimInput } from "./components/ClaimInput";
import { CredibilityResult } from "./components/CredibilityResult";
import { ClaimLedger } from "./components/ClaimLedger";
import { FactionTrust } from "./components/FactionTrust";
import { RunRecap } from "./components/RunRecap";
import { HistoryBook } from "./components/HistoryBook";
import styles from "./App.module.css";

type Screen = "menu" | "playing" | "recap" | "history" | "game_over";

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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState<boolean>(() => checkHasSavedGame());
  const [previousScreen, setPreviousScreen] = useState<Screen>("playing");

  // Clear save message after 3 seconds
  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [saveMessage]);

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

  const handleContinueGame = () => {
    const saved = loadGameState();
    if (!saved) return;
    const events = generateEventsForState(saved);
    setGameState({ ...saved, events });
    setCurrentClaims([]);
    setCredibilityResults([]);
    setRecap(null);
    setNextRunState(null);
    setScreen("playing");
  };

  const handleSaveGame = () => {
    const success = saveGameState(gameState);
    if (success) {
      setSaveMessage("Game saved!");
      setHasSaved(true);
    } else {
      setSaveMessage("Save failed — storage may be full");
    }
  };

  const handleViewHistory = (fromScreen: Screen = "playing") => {
    setPreviousScreen(fromScreen);
    setScreen("history");
  };

  const handleBackFromHistory = () => {
    setScreen(previousScreen);
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

  const handleBuyIntel = (eventId: string) => {
    const updated = buyIntel(gameState, eventId as any);
    setGameState(updated);
  };

  const handleForceEvent = (eventType: string) => {
    const updated = forceEvent(gameState, eventType);
    setGameState(updated);
  };

  const handleEndTurn = () => {
    const result = executeTurn(gameState, currentClaims);

    if (result.updatedState.isGameOver && !result.runEnded) {
      // FR18 auto-loss: all factions refused mid-run — show game over screen
      setGameState(result.updatedState);
      setScreen("game_over");
    } else if (result.runEnded && result.recap) {
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

  const handleGameOverRestart = () => {
    setGameState(createInitialGameState());
    setCurrentClaims([]);
    setCredibilityResults([]);
    setRecap(null);
    setNextRunState(null);
    setScreen("menu");
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
    return (
      <MainMenu
        onStartGame={handleStartGame}
        onContinueGame={hasSaved ? handleContinueGame : undefined}
      />
    );
  }

  if (screen === "game_over") {
    const refusingFactions = Object.entries(gameState.factionTrust)
      .filter(([, trust]) => trust <= -100)
      .map(([name]) => name);
    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1>Historian</h1>
              <p className={styles.subtitle}>A game of narrative and consequence</p>
            </div>
          </div>
        </header>
        <div className={styles.gameOverContainer}>
          <h2 className={styles.gameOverTitle}>The Chronicle Ends</h2>
          <p className={styles.gameOverMessage}>
            All factions have lost faith in your chronicle. No one will buy your next book.
          </p>
          {refusingFactions.length > 0 && (
            <p className={styles.gameOverFactions}>
              Factions who refused:{" "}
              <strong>{refusingFactions.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(", ")}</strong>
            </p>
          )}
          <p className={styles.gameOverTurn}>
            Survived {gameState.turnNumber - 1} turn{gameState.turnNumber - 1 !== 1 ? "s" : ""} of Run {gameState.worldState.runNumber}
          </p>
          <button
            className={styles.endTurnButton}
            onClick={handleGameOverRestart}
            data-testid="game-over-restart"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    );
  }

  if (screen === "history") {
    const historyData = buildHistoryBookData(gameState.worldState.history);
    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1>Historian</h1>
              <p className={styles.subtitle}>A game of narrative and consequence</p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.actionButton}
                onClick={handleBackFromHistory}
                aria-label="Back to game"
              >
                ← Back to Game
              </button>
            </div>
          </div>
        </header>
        <div className={styles.historyScreen}>
          <HistoryBook
            pastRuns={historyData.pastRuns}
            beliefTrends={historyData.beliefTrends}
            claimFrequencies={historyData.claimFrequencies}
          />
        </div>
      </div>
    );
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
          <div className={styles.headerContent}>
            <div>
              <h1>Historian</h1>
              <p className={styles.subtitle}>A game of narrative and consequence</p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.actionButton}
                onClick={() => handleViewHistory("recap")}
                aria-label="View history book"
              >
                📚 History Book
              </button>
            </div>
          </div>
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
        <div className={styles.headerContent}>
          <div>
            <h1>Historian</h1>
            <p className={styles.subtitle}>A game of narrative and consequence</p>
          </div>
          <div className={styles.headerActions}>
            {saveMessage && (
              <span className={styles.saveMessage} role="status" aria-live="polite">
                {saveMessage}
              </span>
            )}
            <button
              className={styles.actionButton}
              onClick={handleSaveGame}
              aria-label="Save game"
            >
              💾 Save Game
            </button>
            <button
              className={styles.actionButton}
              onClick={() => handleViewHistory("playing")}
              aria-label="View history book"
            >
              📚 History Book
            </button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Turn {gameState.turnNumber} / 10 — Events{" "}
              <span
                className={styles.influenceDisplay}
                title={`${gameState.influence.toFixed(1)} influence — spend ${BUY_INTEL_COST} to reveal hidden events`}
                aria-label={`Current influence: ${gameState.influence.toFixed(1)}`}
                data-testid="influence-display"
              >
                ✨ {gameState.influence.toFixed(1)} influence
              </span>
            </h2>
            <div className={styles.eventList}>
              {gameState.events.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  onBuyIntel={!event.observedByPlayer ? handleBuyIntel : undefined}
                  canAffordIntel={canBuyIntel(gameState, event.eventId)}
                />
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

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Shape Next Turn{" "}
              <span
                className={styles.influenceDisplay}
                title={`Costs ${FORCE_EVENT_COST} influence to guarantee an event type next turn`}
                aria-label={`Force event costs ${FORCE_EVENT_COST} influence`}
              >
                ✨ {FORCE_EVENT_COST} influence each
              </span>
            </h2>
            {gameState.pendingForcedEventType ? (
              <p className={styles.forcedEventStatus} role="status" aria-live="polite">
                ✅ Forcing <strong>{gameState.pendingForcedEventType}</strong> event next turn
              </p>
            ) : (
              <div className={styles.forceEventButtons} role="group" aria-label="Force event type for next turn">
                {Object.keys(EVENT_TYPE_KEYWORDS).map((eventType) => (
                  <button
                    key={eventType}
                    className={styles.forceEventButton}
                    onClick={() => handleForceEvent(eventType)}
                    disabled={!canForceEvent(gameState, eventType)}
                    aria-label={`Force ${eventType} event next turn (costs ${FORCE_EVENT_COST} influence)`}
                    title={
                      gameState.influence < FORCE_EVENT_COST
                        ? `Need ${FORCE_EVENT_COST} influence (have ${gameState.influence.toFixed(1)})`
                        : `Guarantee a ${eventType} event next turn`
                    }
                  >
                    {eventType}
                  </button>
                ))}
              </div>
            )}
          </section>

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
              { name: "historian", emoji: "📖", trust: gameState.factionTrust.historian },
              { name: "scholar", emoji: "🔬", trust: gameState.factionTrust.scholar },
              { name: "witness", emoji: "👁️", trust: gameState.factionTrust.witness },
              { name: "scribe", emoji: "✍️", trust: gameState.factionTrust.scribe },
            ]}
          />
          <ClaimLedger claims={claimLedgerItems} />
        </aside>
      </div>
    </div>
  );
};
