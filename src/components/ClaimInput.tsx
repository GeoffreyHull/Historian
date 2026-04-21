/**
 * ClaimInput: Textarea for player to write claims about events.
 * UX Spec: ClaimInput Component
 *
 * AC1: Textarea with 150 character limit
 * AC2: Real-time character counter (X/150)
 * AC3: Focus visible outline (2px blue)
 * AC4: Submit button disabled until text entered
 * AC5: Accessibility: ARIA labels, live region for counter
 */

import React, { useState } from "react";
import styles from "./ClaimInput.module.css";

interface ClaimInputProps {
  eventDescription?: string;
  onSubmit: (claimText: string) => void;
  disabled?: boolean;
}

const CHAR_LIMIT = 150;

export const ClaimInput: React.FC<ClaimInputProps> = ({
  eventDescription,
  onSubmit,
  disabled = false,
}) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  const charCount = text.length;
  const isOverLimit = charCount > CHAR_LIMIT;

  return (
    <form onSubmit={handleSubmit} className={styles.claimInput}>
      <label htmlFor="claim-textarea" className={styles.label}>
        Your Claim:
      </label>

      <div className={styles.inputWrapper}>
        <textarea
          id="claim-textarea"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, CHAR_LIMIT))}
          placeholder={
            eventDescription
              ? `Declare your account of: "${eventDescription}"`
              : "Declare your account of this event..."
          }
          maxLength={CHAR_LIMIT}
          disabled={disabled}
          className={styles.textarea}
          aria-label="Write claim about event"
          aria-describedby="char-counter"
        />

        <div
          className={styles.counter}
          id="char-counter"
          role="status"
          aria-live="polite"
        >
          <span
            className={isOverLimit ? styles.counterWarning : styles.counterNormal}
          >
            {charCount}/{CHAR_LIMIT}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className={styles.submitButton}
      >
        Submit Claim
      </button>
    </form>
  );
};

export default ClaimInput;
