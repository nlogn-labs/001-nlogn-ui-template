"use client";

import { useEffect, useState } from "react";
import { useTake } from "@/lib/take/take-context";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export type RevealProps = {
  /** Flips to true at TAKE_START. */
  active: boolean;
  /** Offset from TAKE_START, in ms. */
  delay?: number;
  /** Travel distance, in px. */
  y?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * Entrance for project-authored content.
 *
 * Purely a CSS transition on transform and opacity, driven by a single state
 * flip rather than per-frame React work, so sequencing a dozen elements costs
 * one render regardless of how long the stagger runs.
 */
export function Reveal({
  active,
  delay = 0,
  y = 18,
  duration = 620,
  className,
  style,
  children,
}: RevealProps) {
  return (
    <div
      className={className}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
        willChange: "transform, opacity",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Mounts children at a fixed offset from TAKE_START.
 *
 * Needed because React Bits' BlurText starts animating the moment it mounts
 * and exposes no global start offset — only a per-word stagger — so
 * sequencing two BlurText blocks means controlling when each one mounts.
 *
 * The offset is measured against the take's own frame clock rather than a
 * setTimeout: timers drift by hundreds of milliseconds under shader load,
 * which desynchronises the mount from the CSS-delayed reveals around it.
 */
export function DelayedMount({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const { subscribeFrame, takeMode, reduced, runId } = useTake();
  const inert = !takeMode || reduced;

  // Which run has already reached the offset. `shown` is derived from this
  // during render rather than reset from an effect, because an effect-driven
  // reset leaves one commit in which the *next* run's children mount before
  // the reset lands. BlurText would observe itself and then be torn down
  // before its IntersectionObserver delivered, and the library's callback
  // throws on the resulting null ref.
  const [readyRun, setReadyRun] = useState<number | null>(null);
  const shown = inert || readyRun === runId;

  useEffect(() => {
    if (inert) return;
    let fired = false;
    return subscribeFrame((elapsed) => {
      if (!fired && elapsed >= delay) {
        fired = true;
        setReadyRun(runId);
      }
    });
  }, [subscribeFrame, inert, delay, runId]);

  return shown ? <>{children}</> : null;
}
