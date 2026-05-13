import React, { useState, useEffect, useRef } from "react";
import { createInitialGameState } from "./game/gameManager";
import { EventGenerator } from "./game/eventGenerator";
import { executeTurn } from "./game/turnExecutor";
import { defaultEventWriterService, TransformersEventWriterService, ModelLoadProgress } from "./game/eventWriterService";
import { Claim, CredibilityResult, Event, Faction, GameState, PendingClaim, RunRecap as RunRecapData, TurnNumber, TurnSnapshot } from "./game/types";
import { CLAIM_REVEAL_DELAY } from "./game/constants";
import { saveGameState, loadGameState, hasSavedGame as checkHasSavedGame } from "./game/sessionPersistence";
import { buildHistoryBookData } from "./game/historyBookUtils";
import { buyIntel, canBuyIntel, BUY_INTEL_COST, forceEvent, canForceEvent, FORCE_EVENT_COST } from "./game/influenceActions";
import { EVENT_TYPE_KEYWORDS } from "./game/constants";
import { MainMenu } from "./components/MainMenu";
import { EventCard } from "./components/EventCard";
import { ClaimInput } from "./components/ClaimInput";
import { ClaimLedger } from "./components/ClaimLedger";
import { FactionTrust } from "./components/FactionTrust";
import { WorldVariables } from "./components/WorldVariables";
import { RunRecap } from "./components/RunRecap";
import { HistoryBook } from "./components/HistoryBook";
import { CascadeView } from "./components/CascadeView";
import { RetconPanel } from "./components/RetconPanel";
import { canRetcon, getRetconTargets, enterRetcon, commitRetcon, cancelRetcon, takeSnapshot, RETCON_COST } from "./game/retconSystem";
import styles from "./App.module.css";

type Screen = "menu" | "playing" | "recap" | "history" | "game_over";

function generateBaseEventsForState(state: GameState): Event[] {
  const gen = new EventGenerator();
  gen.setWorldState(state.worldState, state.currentFaction);
  return gen.generateEvents(state.turnNumber, 3);
}

async function generateEventsForState(
  state: GameState,
  writerService: TransformersEventWriterService
): Promise<Event[]> {
  const base = generateBaseEventsForState(state);
  const recentEvents = state.events.filter((e) => e.turnNumber >= Math.max(1, state.turnNumber - 3));
  return writerService.enrichEvents(
    base,
    state.turnNumber,
    state.currentFaction,
    state.worldState,
    recentEvents,
    state.worldState.consequences
  );
}

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [currentClaims, setCurrentClaims] = useState<Claim[]>([]);
  const [resolvedClaimResults, setResolvedClaimResults] = useState<readonly CredibilityResult[]>([]);
  const [recap, setRecap] = useState<RunRecapData | null>(null);
  const [nextRunState, setNextRunState] = useState<GameState | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState<boolean>(() => checkHasSavedGame());
  const [previousScreen, setPreviousScreen] = useState<Screen>("playing");
  const [isInRetcon, setIsInRetcon] = useState<boolean>(false);
  const [retconTargetTurn, setRetconTargetTurn] = useState<TurnNumber | null>(null);
  const [retconOriginalSnapshot, setRetconOriginalSnapshot] = useState<TurnSnapshot | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [modelProgress, setModelProgress] = useState<ModelLoadProgress>({ status: "idle" });
  // Track the events shown this turn so executeTurn evaluates claims against the same text
  const currentEventsRef = useRef<Event[]>([]);

  // Kick off model download immediately so it's ready before the player starts
  useEffect(() => {
    defaultEventWriterService
      .initialize((p) => setModelProgress(p))
      .catch(() => setModelProgress({ status: "error" }));
  }, []);

  // Clear save message after 3 seconds
  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  const handleEnterRetcon = async (targetTurn: TurnNumber) => {
    if (!canRetcon(gameState, targetTurn)) return;
    const snapshot = takeSnapshot(gameState);
    setRetconOriginalSnapshot(snapshot);
    setRetconTargetTurn(targetTurn);
    setIsInRetcon(true);
    const rewound = enterRetcon(gameState, targetTurn);
    setIsLoadingEvents(true);
    const events = await generateEventsForState(rewound, defaultEventWriterService);
    setIsLoadingEvents(false);
    currentEventsRef.current = events;
    setGameState({ ...rewound, events });
    setCurrentClaims([]);
    setResolvedClaimResults([]);
  };

  const handleCommitRetcon = () => {
    if (retconTargetTurn === null) return;
    const committed = commitRetcon(gameState, retconTargetTurn);
    setGameState(committed);
    setIsInRetcon(false);
    setRetconTargetTurn(null);
    setRetconOriginalSnapshot(null);
  };

  const handleCancelRetcon = async () => {
    if (!retconOriginalSnapshot) return;
    const restored = cancelRetcon(gameState, retconOriginalSnapshot);
    setIsLoadingEvents(true);
    const events = await generateEventsForState(restored, defaultEventWriterService);
    setIsLoadingEvents(false);
    currentEventsRef.current = events;
    setGameState({ ...restored, events });
    setCurrentClaims([]);
    setResolvedClaimResults([]);
    setIsInRetcon(false);
    setRetconTargetTurn(null);
    setRetconOriginalSnapshot(null);
  };

  const handleStartGame = async (faction: Faction) => {
    const initial = createInitialGameState(faction);
    setIsLoadingEvents(true);
    const events = await generateEventsForState(initial, defaultEventWriterService);
    setIsLoadingEvents(false);
    currentEventsRef.current = events;
    setGameState({ ...initial, events });
    setCurrentClaims([]);
    setResolvedClaimResults([]);
    setRecap(null);
    setNextRunState(null);
    setIsInRetcon(false);
    setRetconTargetTurn(null);
    setRetconOriginalSnapshot(null);
    setScreen("playing");
  };

  const handleContinueGame = async () => {
    const saved = loadGameState();
    if (!saved) return;
    setIsLoadingEvents(true);
    const events = await generateEventsForState(saved, defaultEventWriterService);
    setIsLoadingEvents(false);
    currentEventsRef.current = events;
    setGameState({ ...saved, events });
    setCurrentClaims([]);
    setResolvedClaimResults([]);
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
    const newPending: PendingClaim = {
      claim: newClaim,
      evidenceFragments: selectedEvent?.evidenceFragments ?? [],
      revealTurn: (gameState.turnNumber + CLAIM_REVEAL_DELAY) as TurnNumber,
    };
    setCurrentClaims((prev) => [...prev, newClaim]);
    setGameState((prev) => ({
      ...prev,
      pendingClaims: [...prev.pendingClaims, newPending],
    }));
  };

  const handleBuyIntel = (eventId: string) => {
    const updated = buyIntel(gameState, eventId as any);
    setGameState(updated);
  };

  const handleForceEvent = (eventType: string) => {
    const updated = forceEvent(gameState, eventType);
    setGameState(updated);
  };

  const handleEndTurn = async () => {
    setIsLoadingEvents(true);
    const result = await executeTurn(
      gameState,
      currentClaims,
      undefined,
      currentEventsRef.current.length > 0 ? currentEventsRef.current : undefined
    );

    if (result.updatedState.isGameOver && !result.runEnded) {
      setIsLoadingEvents(false);
      setGameState(result.updatedState);
      setScreen("game_over");
    } else if (result.runEnded && result.recap) {
      setIsLoadingEvents(false);
      setRecap(result.recap);
      setNextRunState(result.updatedState);
      setScreen("recap");
    } else {
      const events = await generateEventsForState(result.updatedState, defaultEventWriterService);
      setIsLoadingEvents(false);
      currentEventsRef.current = events;
      setGameState({ ...result.updatedState, events });
      setCurrentClaims([]);
      setResolvedClaimResults(result.resolvedPendingResults);
    }
  };

  const handleGameOverRestart = () => {
    setGameState(createInitialGameState());
    setCurrentClaims([]);
    setResolvedClaimResults([]);
    setRecap(null);
    setNextRunState(null);
    setScreen("menu");
  };

  const handleContinueAfterRecap = async () => {
    if (nextRunState) {
      setIsLoadingEvents(true);
      const events = await generateEventsForState(nextRunState, defaultEventWriterService);
      setIsLoadingEvents(false);
      currentEventsRef.current = events;
      setGameState({ ...nextRunState, events });
    }
    setCurrentClaims([]);
    setResolvedClaimResults([]);
    setRecap(null);
    setNextRunState(null);
    setScreen("playing");
  };

  if (screen === "menu") {
    return (
      <MainMenu
        onStartGame={handleStartGame}
        onContinueGame={hasSaved ? handleContinueGame : undefined}
        modelProgress={modelProgress}
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
            finalFactionOutcomes={{ historian: 75, scholar: 60, witness: 80, scribe: 55, diplomat: 70, rebel: 45, merchant: 65 }}
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

  const claimLedgerItems = currentClaims.map((claim, index) => ({
    claimId: `C${index + 1}`,
    claim,
    status: "unconfirmed" as const,
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

          {resolvedClaimResults.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Claim Revelations</h2>
              <div className={styles.resolvedClaims} role="status" aria-live="polite">
                {resolvedClaimResults.map((r, i) => {
                  const score = r.finalCredibility;
                  const level = score >= 64 ? "strong" : score >= 40 ? "moderate" : "weak";
                  const icon = level === "strong" ? "✓" : level === "moderate" ? "◐" : "✗";
                  return (
                    <div key={i} className={`${styles.resolvedClaim} ${styles[`resolvedClaim-${level}`]}`}>
                      <span className={styles.resolvedIcon}>{icon}</span>
                      <span className={styles.resolvedText}>
                        "{r.claim.claimText}" — {score}% credibility
                      </span>
                    </div>
                  );
                })}
              </div>
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
              disabled={currentClaims.length === 0 || isLoadingEvents}
            >
              {isLoadingEvents ? "Writing history..." : `End Turn ${gameState.turnNumber} →`}
            </button>
            {currentClaims.length === 0 && !isLoadingEvents && (
              <p className={styles.endTurnHint}>Write at least one claim to end the turn</p>
            )}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <WorldVariables variables={gameState.worldState.worldVariables} />
          <CascadeView consequences={gameState.worldState.consequences} />
          <RetconPanel
            currentInfluence={gameState.influence}
            retconCost={RETCON_COST}
            availableTurns={getRetconTargets(gameState)}
            isInRetcon={isInRetcon}
            retconTargetTurn={retconTargetTurn}
            onEnterRetcon={handleEnterRetcon}
            onCommitRetcon={handleCommitRetcon}
            onCancelRetcon={handleCancelRetcon}
          />
          <FactionTrust
            factions={[
              { name: "historian", emoji: "📖", trust: gameState.factionTrust.historian },
              { name: "scholar", emoji: "🔬", trust: gameState.factionTrust.scholar },
              { name: "witness", emoji: "👁️", trust: gameState.factionTrust.witness },
              { name: "scribe", emoji: "✍️", trust: gameState.factionTrust.scribe },
              { name: "diplomat", emoji: "🤝", trust: gameState.factionTrust.diplomat },
              { name: "rebel", emoji: "⚡", trust: gameState.factionTrust.rebel },
              { name: "merchant", emoji: "💰", trust: gameState.factionTrust.merchant },
            ]}
          />
          <ClaimLedger claims={claimLedgerItems} />
        </aside>
      </div>
    </div>
  );
};
