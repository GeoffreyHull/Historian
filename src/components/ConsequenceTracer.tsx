/**
 * ConsequenceTracer: Display 4-step causal chain from claim to consequence.
 * UX Spec: ConsequenceTracer Component
 *
 * AC1: Show 4-step flow: Claim → Belief → Trigger → Event
 * AC2: Each step has title, icon, and description text
 * AC3: Vertical timeline with connecting lines (visual flow)
 * AC4: Color-coded steps (claim=blue, belief=yellow, trigger=red, event=green)
 * AC5: Accessibility: aria-label on each step, semantic HTML flow
 */

import React from "react";
import styles from "./ConsequenceTracer.module.css";

interface ConsequenceStep {
  title: string;
  description: string;
  icon: string;
}

interface ConsequenceTracerProps {
  claimStep: ConsequenceStep;
  beliefStep: ConsequenceStep;
  triggerStep: ConsequenceStep;
  eventStep: ConsequenceStep;
  claimId: string;
}

export const ConsequenceTracer: React.FC<ConsequenceTracerProps> = ({
  claimStep,
  beliefStep,
  triggerStep,
  eventStep,
  claimId,
}) => {
  const stepColors: Record<
    string,
    "step-blue" | "step-yellow" | "step-red" | "step-green"
  > = {
    claim: "step-blue",
    belief: "step-yellow",
    trigger: "step-red",
    event: "step-green",
  };

  const steps = [
    { ...claimStep, type: "claim" as const },
    { ...beliefStep, type: "belief" as const },
    { ...triggerStep, type: "trigger" as const },
    { ...eventStep, type: "event" as const },
  ];

  return (
    <article
      className={styles.consequenceTracer}
      role="article"
      aria-label={`Consequence trace for claim ${claimId}`}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Consequence Tracer</h2>
        <p className={styles.subtitle}>How your claim shaped history</p>
      </div>

      <div className={styles.timeline}>
        {steps.map((step, index) => (
          <div key={step.type} className={styles.timelineGroup}>
            <div
              className={`${styles.step} ${styles[stepColors[step.type]]}`}
              aria-label={`Step ${index + 1}: ${step.title}`}
            >
              <div className={styles.stepIcon}>{step.icon}</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className={styles.connector} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </article>
  );
};

export default ConsequenceTracer;
