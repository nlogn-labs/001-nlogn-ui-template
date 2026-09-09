"use client";

import { useEffect, useRef, useState } from "react";
import { TakeProvider, useTake } from "@/lib/take/take-context";
import { SAFE, STAGE_H, STAGE_W } from "@/lib/take/types";

export type DemoShellProps = {
  takeMode: boolean;
  loopMode: boolean;
  /** ?fit=1 — scale the stage down to fit small viewports. Inspection only. */
  fit: boolean;
  children: React.ReactNode;
};

/**
 * The recording stage.
 *
 * Creates a fixed 1600x900 surface, centres it, letterboxes the remaining
 * viewport in `bg`, locks scrolling in both axes, and hosts the take-mode
 * state machine. At scale 1 the stage is never resized, so what is recorded is
 * exactly what was authored.
 */
export function DemoShell(props: DemoShellProps) {
  return (
    <TakeProvider takeMode={props.takeMode} loopMode={props.loopMode}>
      <Stage fit={props.fit}>{props.children}</Stage>
    </TakeProvider>
  );
}

function Stage({ fit, children }: { fit: boolean; children: React.ReactNode }) {
  const { takeMode, replay, reduced } = useTake();
  const [scale, setScale] = useState(1);
  const [tooSmall, setTooSmall] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // A single keydown listener for the whole page, cleaned up on unmount so
  // Fast Refresh cannot leave a duplicate behind.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable
      ) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        replay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [replay]);

  // Fit handling. Default is no scaling at all: an undersized viewport simply
  // crops, and a hint appears outside take mode. ?fit=1 opts into a uniform
  // scale for inspection on smaller panels; DemoCursor divides by the same
  // factor so visual position and clientX/clientY stay in agreement.
  useEffect(() => {
    const measure = () => {
      const small = window.innerWidth < STAGE_W || window.innerHeight < STAGE_H;
      setTooSmall(small);
      setScale(
        fit
          ? Math.min(1, window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
          : 1,
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fit]);

  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-bg">
      <div
        ref={stageRef}
        data-stage=""
        data-scale={scale}
        className="relative overflow-hidden bg-bg"
        style={{
          // Published so CSS and routes can read the same numbers the take
          // system uses; lib/take/types.ts stays the single source of truth.
          ["--stage-w" as string]: `${STAGE_W}px`,
          ["--stage-h" as string]: `${STAGE_H}px`,
          ["--safe" as string]: `${SAFE}px`,
          width: STAGE_W,
          height: STAGE_H,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "center center",
          cursor: takeMode && !reduced ? "none" : "auto",
        }}
      >
        {children}
      </div>

      {tooSmall && !fit && !takeMode ? (
        <p className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 font-mono text-caption text-muted">
          viewport below {STAGE_W}&times;{STAGE_H} — the stage is cropped. add ?fit=1
          to scale it for inspection.
        </p>
      ) : null}
    </div>
  );
}
