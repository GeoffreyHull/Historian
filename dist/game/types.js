"use strict";
/**
 * Core type definitions for the game.
 * All types are JSON-serializable (no Date, Function, Symbol).
 * All types are immutable (use readonly for objects and arrays).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTurn = exports.createEventId = void 0;
const createEventId = (id) => id;
exports.createEventId = createEventId;
const createTurn = (turn) => turn;
exports.createTurn = createTurn;
//# sourceMappingURL=types.js.map