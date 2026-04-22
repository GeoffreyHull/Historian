/**
 * EventCard: Display a single historical event in lore language.
 * UX Spec: EventCard Component
 *
 * AC1: Display event emoji, title, and description
 * AC2: Show observation indicator (👁️ for observed, ? for unobserved)
 * AC3: Optional consequence reference link (echoed from C#)
 * AC4: Accessibility: proper contrast, ARIA labels
 */

import React from "react";
import { Event, EventId } from "../game/types";
import { BUY_INTEL_COST } from "../game/influenceActions";
import styles from "./EventCard.module.css";

interface EventCardProps {
  event: Event;
  onConsequenceClick?: (claimId: string) => void;
  onBuyIntel?: (eventId: EventId) => void;
  canAffordIntel?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onConsequenceClick,
  onBuyIntel,
  canAffordIntel = false,
}) => {
  const getEmoji = (eventType: string): string => {
    const emojiMap: Record<string, string> = {
      weather: "🌧️",
      location: "🏰",
      character: "📜",
      trade: "🛍️",
      conflict: "⚔️",
      blessing: "✨",
    };
    return emojiMap[eventType] || "📖";
  };

  const emoji = getEmoji(event.eventType);

  return (
    <div
      className={styles.eventCard}
      role="article"
      aria-label={`Event: ${event.description}`}
    >
      <div className={styles.header}>
        <span className={styles.emoji}>{emoji}</span>
        <span className={styles.observationIndicator}>
          {event.observedByPlayer ? (
            <span className={styles.observed} title="Observed">
              👁️
            </span>
          ) : (
            <span className={styles.unobserved} title="Unobserved">
              ?
            </span>
          )}
        </span>
      </div>

      <p className={styles.description}>
        {event.observedByPlayer ? event.description : "???"}
      </p>

      {!event.observedByPlayer && onBuyIntel && (
        <button
          className={`${styles.buyIntelButton} ${!canAffordIntel ? styles.buyIntelDisabled : ""}`}
          onClick={() => onBuyIntel(event.eventId)}
          disabled={!canAffordIntel}
          aria-label={`Buy intel to reveal this event for ${BUY_INTEL_COST} influence`}
          data-testid="buy-intel-button"
        >
          🔍 Reveal ({BUY_INTEL_COST} influence)
        </button>
      )}

      {/* Placeholder for future consequence reference */}
      {/* Will show: "📎 Echoed from C3" with clickable link */}
    </div>
  );
};

export default EventCard;
