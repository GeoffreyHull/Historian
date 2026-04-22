/**
 * MainMenu: Welcome screen with game setup options.
 * UX Spec: Game Setup Screen
 *
 * AC1: Display game title and tagline
 * AC2: Show faction selection (1 option for MVP)
 * AC3: Display initial faction trust levels (read-only preview)
 * AC4: Start button disabled until ready
 * AC5: Accessibility: semantic structure, ARIA labels
 */

import React from "react";
import { Faction } from "../game/types";
import styles from "./MainMenu.module.css";

interface MainMenuProps {
  onStartGame: (faction: Faction) => void;
  onContinueGame?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onContinueGame }) => {
  const [selectedFaction, setSelectedFaction] = React.useState<Faction>("historian");

  const factions: Array<{ name: Faction; emoji: string; description: string }> = [
    {
      name: "historian",
      emoji: "📖",
      description: "Seek truth through documents and records. Prefer established facts.",
    },
  ];

  const factionTrust: Record<Faction, number> = {
    historian: 50,
    scholar: 50,
    witness: 50,
    scribe: 50,
  };

  return (
    <div className={styles.mainMenu}>
      <header className={styles.header}>
        <h1 className={styles.title}>Historian</h1>
        <p className={styles.tagline}>A game of narrative and consequence</p>
        <p className={styles.subtitle}>
          Your claims reshape the world. What will you tell them?
        </p>
      </header>

      <main className={styles.content}>
        <section className={styles.section} role="region" aria-label="Faction selection">
          <h2 className={styles.sectionTitle}>Choose Your Voice</h2>
          <p className={styles.sectionDescription}>
            For this game, you speak as the Historian—one voice, one perspective.
          </p>

          {factions.map((faction) => (
            <div
              key={faction.name}
              className={`${styles.factionCard} ${selectedFaction === faction.name ? styles.selected : ""}`}
              onClick={() => setSelectedFaction(faction.name)}
              role="radio"
              aria-checked={selectedFaction === faction.name}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedFaction(faction.name);
                }
              }}
            >
              <div className={styles.factionHeader}>
                <span className={styles.factionEmoji}>{faction.emoji}</span>
                <h3 className={styles.factionName}>{faction.name}</h3>
              </div>
              <p className={styles.factionDescription}>{faction.description}</p>
            </div>
          ))}
        </section>

        <section className={styles.section} role="region" aria-label="Initial faction trust">
          <h2 className={styles.sectionTitle}>Faction Disposition</h2>
          <p className={styles.sectionDescription}>
            Each faction begins at neutral. What you claim will shift their trust.
          </p>

          <div className={styles.trustGrid}>
            {(["historian", "scholar", "witness", "scribe"] as const).map((faction) => (
              <div key={faction} className={styles.trustCard}>
                <div className={styles.trustEmoji}>
                  {{
                    historian: "📖",
                    scholar: "🔬",
                    witness: "👁️",
                    scribe: "✍️",
                  }[faction]}
                </div>
                <div className={styles.trustName}>{faction}</div>
                <div className={styles.trustValue}>{factionTrust[faction]}%</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.rulesSection}>
          <h2 className={styles.sectionTitle}>How to Play</h2>
          <ul className={styles.rulesList}>
            <li>
              Each turn, you observe events and can write 1–3 claims about what happened.
            </li>
            <li>
              Factions evaluate your claims based on accuracy. Claims that match reality earn
              trust; lies lose it.
            </li>
            <li>
              After 10 turns, see how your testimony shaped the world and what factions believe
              about history.
            </li>
          </ul>
        </section>

        <div className={styles.actionButtons}>
          {onContinueGame && (
            <button
              className={styles.continueButton}
              onClick={onContinueGame}
              aria-label="Continue saved game"
            >
              ▶ Continue Saved Game
            </button>
          )}
          <button
            className={styles.startButton}
            onClick={() => onStartGame(selectedFaction)}
            aria-label={`Start game as ${selectedFaction}`}
          >
            Begin Your Account
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Your credibility is everything.</p>
      </footer>
    </div>
  );
};

export default MainMenu;
