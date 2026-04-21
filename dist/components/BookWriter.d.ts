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
import React from "react";
import { Event, Claim } from "../game/types";
interface BookWriterProps {
    events: readonly Event[];
    turnNumber: number;
    onSubmitClaims: (claims: Claim[]) => void;
}
export declare const BookWriter: React.FC<BookWriterProps>;
export default BookWriter;
//# sourceMappingURL=BookWriter.d.ts.map