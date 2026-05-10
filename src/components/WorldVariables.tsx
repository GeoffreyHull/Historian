/**
 * WorldVariables: Display aggregate world state (morale, infrastructure, economy).
 * Phase 2: Shows how the world is doing beyond just faction trust.
 * Color-coded: green (65+), yellow (35-64), red (<35)
 */

import React from "react";
import styles from "./WorldVariables.module.css";
import type { WorldVariables as WorldVariablesData } from "../game/types";

interface WorldVariablesProps {
  variables: WorldVariablesData;
}

const getVarColor = (value: number): "high" | "medium" | "low" => {
  if (value >= 65) return "high";
  if (value >= 35) return "medium";
  return "low";
};

const VARIABLE_CONFIG: Record<string, { label: string; icon: string }> = {
  morale: { label: "Morale", icon: "💪" },
  infrastructure: { label: "Infrastructure", icon: "🏛️" },
  economy: { label: "Economy", icon: "💰" },
};

export const WorldVariables: React.FC<WorldVariablesProps> = ({ variables }) => {
  return (
    <div className={styles.container} role="region" aria-label="World state variables">
      <h4 className={styles.header}>WORLD STATE</h4>

      <div className={styles.list}>
        {Object.entries(VARIABLE_CONFIG).map(([key, config]) => {
          const value = variables[key as keyof WorldVariablesData];
          const level = getVarColor(value);
          return (
            <div
              key={key}
              className={`${styles.row} ${styles[`var-${level}`]}`}
              aria-label={`${config.label}: ${value}%`}
            >
              <span className={styles.icon}>{config.icon}</span>
              <span className={styles.label}>{config.label}</span>
              <div className={styles.barOuter}>
                <div
                  className={`${styles.barInner} ${styles[`bar-${level}`]}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className={styles.value}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorldVariables;
