/**
 * BookWriter: Claims submission component for S3.
 * Presentational component (no business logic per Constraint 7).
 * Dispatches writeClaim action to GameManager when form is submitted.
 *
 * AC1: Renders event list with observation indicators (eye vs ?)
 * AC2: Form validates 1-3 claims, ≤500 chars, no empty
 * AC3: Auto-captures isAboutObservedEvent from event state
 * AC4: Dispatches { type: 'writeClaim', claims: Claim[] }
 * AC5: WCAG AA accessibility (4.5:1 contrast, 200% zoom, no seizures)
 * AC6: No hard-coded data; graceful fallback
 */

import React, { useState } from "react";
import { Event, Claim, createEventId } from "../game/types";
import styles from "./BookWriter.module.css";

interface BookWriterProps {
  events: readonly Event[];
  turnNumber: number;
  onSubmitClaims: (claims: Claim[]) => void;
}

interface ClaimDraft {
  eventId: string;
  claimText: string;
}

interface ValidationError {
  type: "empty" | "too-long" | "too-many";
  message: string;
}

export const BookWriter: React.FC<BookWriterProps> = ({
  events,
  turnNumber,
  onSubmitClaims,
}) => {
  const [claims, setClaims] = useState<ClaimDraft[]>([{ eventId: "", claimText: "" }]);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);

  const validateClaims = (drafts: ClaimDraft[]): ValidationError | null => {
    // Check for empty claims
    if (drafts.some((c) => !c.claimText.trim())) {
      return {
        type: "empty",
        message: "Claim cannot be empty",
      };
    }

    // Check for >500 chars
    if (drafts.some((c) => c.claimText.length > 500)) {
      return {
        type: "too-long",
        message: "Claim too long (max 500 chars)",
      };
    }

    // Check for >3 claims
    if (drafts.filter((c) => c.claimText.trim()).length > 3) {
      return {
        type: "too-many",
        message: "Max 3 claims per turn",
      };
    }

    return null;
  };

  const handleAddClaim = () => {
    if (claims.length < 3) {
      setClaims([...claims, { eventId: "", claimText: "" }]);
    }
  };

  const handleRemoveClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index));
  };

  const handleClaimChange = (index: number, claimText: string) => {
    const newClaims = [...claims];
    newClaims[index].claimText = claimText;
    setClaims(newClaims);
    setValidationError(null);
  };

  const handleEventSelect = (index: number, eventId: string) => {
    const newClaims = [...claims];
    newClaims[index].eventId = eventId;
    setClaims(newClaims);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const error = validateClaims(claims);
    if (error) {
      setValidationError(error);
      return;
    }

    // Build Claim objects with observation flag auto-captured
    const claimObjects: Claim[] = claims
      .filter((c) => c.claimText.trim() && c.eventId)
      .map((draft) => {
        const event = events.find((e) => e.eventId === draft.eventId);
        return {
          claimText: draft.claimText,
          eventId: createEventId(draft.eventId),
          isAboutObservedEvent: event?.observedByPlayer ?? false, // Auto-capture from event
          turnNumber,
        };
      });

    if (claimObjects.length === 0) {
      setValidationError({
        type: "empty",
        message: "Please select an event and write a claim",
      });
      return;
    }

    // Dispatch action
    onSubmitClaims(claimObjects);

    // Clear form
    setClaims([{ eventId: "", claimText: "" }]);
    setValidationError(null);
  };

  return (
    <div className={styles.bookWriter}>
      <h2>Write Your Claims</h2>

      {/* Events list with observation indicators */}
      <div className={styles.eventsSection}>
        <h3>Events This Turn</h3>
        {events.length === 0 ? (
          <p className={styles.noEvents}>No events this turn</p>
        ) : (
          <ul className={styles.eventsList}>
            {events.map((event) => (
              <li key={event.eventId} className={styles.eventItem}>
                <span className={styles.observationIndicator}>
                  {event.observedByPlayer ? (
                    <span className={styles.observedIcon} title="Observed">
                      👁️
                    </span>
                  ) : (
                    <span className={styles.unobservedIcon} title="Unobserved">
                      ?
                    </span>
                  )}
                </span>
                <span className={styles.eventDescription}>{event.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Claims form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.claimsSection}>
          <h3>Your Claims</h3>

          {claims.map((claim, index) => (
            <div key={index} className={styles.claimInput}>
              <label htmlFor={`event-select-${index}`}>Event</label>
              <select
                id={`event-select-${index}`}
                value={claim.eventId}
                onChange={(e) => handleEventSelect(index, e.target.value)}
                className={styles.select}
              >
                <option value="">Select an event...</option>
                {events.map((event) => (
                  <option key={event.eventId} value={event.eventId}>
                    {event.description}
                  </option>
                ))}
              </select>

              <label htmlFor={`claim-text-${index}`}>
                Claim ({claim.claimText.length}/500)
              </label>
              <textarea
                id={`claim-text-${index}`}
                value={claim.claimText}
                onChange={(e) => handleClaimChange(index, e.target.value)}
                placeholder="Write your claim about this event..."
                maxLength={500}
                className={styles.textarea}
              />

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveClaim(index)}
                  className={styles.removeButton}
                >
                  Remove Claim
                </button>
              )}
            </div>
          ))}

          {claims.length < 3 && (
            <button
              type="button"
              onClick={handleAddClaim}
              className={styles.addButton}
            >
              + Add Claim
            </button>
          )}
        </div>

        {/* Validation error */}
        {validationError && (
          <div className={styles.errorMessage} role="alert">
            {validationError.message}
          </div>
        )}

        {/* Submit button */}
        <button type="submit" className={styles.submitButton}>
          Submit Claims
        </button>
      </form>
    </div>
  );
};

export default BookWriter;
