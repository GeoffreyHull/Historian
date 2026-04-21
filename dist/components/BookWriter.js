"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookWriter = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
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
const react_1 = require("react");
const types_1 = require("../game/types");
const BookWriter_module_css_1 = __importDefault(require("./BookWriter.module.css"));
const BookWriter = ({ events, turnNumber, onSubmitClaims, }) => {
    const [claims, setClaims] = (0, react_1.useState)([{ eventId: "", claimText: "" }]);
    const [selectedEventIndex, setSelectedEventIndex] = (0, react_1.useState)(null);
    const [validationError, setValidationError] = (0, react_1.useState)(null);
    const validateClaims = (drafts) => {
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
    const handleRemoveClaim = (index) => {
        setClaims(claims.filter((_, i) => i !== index));
    };
    const handleClaimChange = (index, claimText) => {
        const newClaims = [...claims];
        newClaims[index].claimText = claimText;
        setClaims(newClaims);
        setValidationError(null);
    };
    const handleEventSelect = (index, eventId) => {
        const newClaims = [...claims];
        newClaims[index].eventId = eventId;
        setClaims(newClaims);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate
        const error = validateClaims(claims);
        if (error) {
            setValidationError(error);
            return;
        }
        // Build Claim objects with observation flag auto-captured
        const claimObjects = claims
            .filter((c) => c.claimText.trim() && c.eventId)
            .map((draft) => {
            const event = events.find((e) => e.eventId === draft.eventId);
            return {
                claimText: draft.claimText,
                eventId: (0, types_1.createEventId)(draft.eventId),
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: BookWriter_module_css_1.default.bookWriter, children: [(0, jsx_runtime_1.jsx)("h2", { children: "Write Your Claims" }), (0, jsx_runtime_1.jsxs)("div", { className: BookWriter_module_css_1.default.eventsSection, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Events This Turn" }), events.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: BookWriter_module_css_1.default.noEvents, children: "No events this turn" })) : ((0, jsx_runtime_1.jsx)("ul", { className: BookWriter_module_css_1.default.eventsList, children: events.map((event) => ((0, jsx_runtime_1.jsxs)("li", { className: BookWriter_module_css_1.default.eventItem, children: [(0, jsx_runtime_1.jsx)("span", { className: BookWriter_module_css_1.default.observationIndicator, children: event.observedByPlayer ? ((0, jsx_runtime_1.jsx)("span", { className: BookWriter_module_css_1.default.observedIcon, title: "Observed", children: "\uD83D\uDC41\uFE0F" })) : ((0, jsx_runtime_1.jsx)("span", { className: BookWriter_module_css_1.default.unobservedIcon, title: "Unobserved", children: "?" })) }), (0, jsx_runtime_1.jsx)("span", { className: BookWriter_module_css_1.default.eventDescription, children: event.description })] }, event.eventId))) }))] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: BookWriter_module_css_1.default.form, children: [(0, jsx_runtime_1.jsxs)("div", { className: BookWriter_module_css_1.default.claimsSection, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Your Claims" }), claims.map((claim, index) => ((0, jsx_runtime_1.jsxs)("div", { className: BookWriter_module_css_1.default.claimInput, children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: `event-select-${index}`, children: "Event" }), (0, jsx_runtime_1.jsxs)("select", { id: `event-select-${index}`, value: claim.eventId, onChange: (e) => handleEventSelect(index, e.target.value), className: BookWriter_module_css_1.default.select, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select an event..." }), events.map((event) => ((0, jsx_runtime_1.jsx)("option", { value: event.eventId, children: event.description }, event.eventId)))] }), (0, jsx_runtime_1.jsxs)("label", { htmlFor: `claim-text-${index}`, children: ["Claim (", claim.claimText.length, "/500)"] }), (0, jsx_runtime_1.jsx)("textarea", { id: `claim-text-${index}`, value: claim.claimText, onChange: (e) => handleClaimChange(index, e.target.value), placeholder: "Write your claim about this event...", maxLength: 500, className: BookWriter_module_css_1.default.textarea }), index > 0 && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleRemoveClaim(index), className: BookWriter_module_css_1.default.removeButton, children: "Remove Claim" }))] }, index))), claims.length < 3 && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleAddClaim, className: BookWriter_module_css_1.default.addButton, children: "+ Add Claim" }))] }), validationError && ((0, jsx_runtime_1.jsx)("div", { className: BookWriter_module_css_1.default.errorMessage, role: "alert", children: validationError.message })), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: BookWriter_module_css_1.default.submitButton, children: "Submit Claims" })] })] }));
};
exports.BookWriter = BookWriter;
exports.default = exports.BookWriter;
//# sourceMappingURL=BookWriter.js.map