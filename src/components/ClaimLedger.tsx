/**
 * ClaimLedger: Sidebar showing all claims made with status indicators.
 * UX Spec: ClaimLedger Component
 *
 * AC1: Display claims in chronological order (C1, C2, C3...)
 * AC2: Show status symbol: ✓ (confirmed), ⊘ (disputed), ? (unconfirmed)
 * AC3: Display claim text truncated with full text on hover
 * AC4: Clickable claim IDs to open Consequence Tracer (post-MVP)
 * AC5: Accessibility: ARIA labels, semantic structure
 */

import React from "react";
import { Claim } from "../game/types";
import styles from "./ClaimLedger.module.css";

interface ClaimLedgerItem {
  claimId: string;
  claim: Claim;
  status: "confirmed" | "disputed" | "unconfirmed";
}

interface ClaimLedgerProps {
  claims: ClaimLedgerItem[];
  onClaimClick?: (claimId: string) => void;
}

const getStatusIcon = (
  status: "confirmed" | "disputed" | "unconfirmed"
): string => {
  switch (status) {
    case "confirmed":
      return "✓";
    case "disputed":
      return "⊘";
    case "unconfirmed":
      return "?";
  }
};

export const ClaimLedger: React.FC<ClaimLedgerProps> = ({
  claims,
  onClaimClick,
}) => {
  if (claims.length === 0) {
    return (
      <div className={styles.claimLedger}>
        <h4 className={styles.header}>CLAIM LEDGER</h4>
        <p className={styles.empty}>No claims yet this turn</p>
      </div>
    );
  }

  return (
    <div className={styles.claimLedger} role="region" aria-label="Claim ledger">
      <h4 className={styles.header}>CLAIM LEDGER</h4>

      <ul className={styles.list}>
        {claims.map((item) => {
          const statusIcon = getStatusIcon(item.status);

          return (
            <li
              key={item.claimId}
              className={`${styles.item} ${styles[`status-${item.status}`]}`}
              onClick={() => onClaimClick?.(item.claimId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onClaimClick?.(item.claimId);
                }
              }}
              aria-label={`Claim ${item.claimId}: ${item.claim.claimText} (${item.status})`}
            >
              <div className={styles.idRow}>
                <span className={styles.claimId}>{item.claimId}</span>
                <span className={styles.statusSymbol}>{statusIcon}</span>
              </div>
              <div className={styles.textRow} title={item.claim.claimText}>
                {item.claim.claimText}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ClaimLedger;
