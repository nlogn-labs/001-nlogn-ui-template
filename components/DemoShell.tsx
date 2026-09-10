"use client";

import { useEffect, useRef, useState } from "react";
import { TakeProvider, useTake } from "@/lib/take/take-context";
import { SAFE, STAGE_H, STAGE_W } from "@/lib/take/types";

export type DemoShellProps = {
  takeMode: boolean;
  loopMode: boolean;
  /** Scale the stage to fit the viewport. Default on while browsing, off in
   *  take mode; `?fit=1` / `?fit=0` override. See lib/take/params.ts. */
  fit: boolean;
  children: React.ReactNode;
};

/**
 * The recording stage.
 *
 * Creates a fixed 1600x900 surface, centres it, letterboxes the remaining
 * viewport in `bg`, locks scrolling in both axes, and hosts the take-mode
 * state machine. At scale 1 the stage is never resized, so what is recorded is
 * exactly what was authored — take mode always records at scale 1.
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

  // Fit handling. `fit` scales the stage down uniformly so the whole
  // composition stays visible; DemoCursor reads the same factor off
  // data-scale, so visual position and clientX/clientY stay in agreement.
  // With fit off an undersized viewport simply crops — symmetrically, from
  // the centre out — and a hint appears outside take mode.
  useEffect(() => {
    const measure = () => {
      setTooSmall(window.innerWidth < STAGE_W || window.innerHeight < STAGE_H);
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
    // The stage is centred by transform, not by grid/flex alignment: a grid
    // item larger than its area resolves centring to `start` (CSS box
    // alignment's overflow rule), which pinned an oversized stage to the top
    // left and cropped it entirely off the bottom and right.
    <div className="fixed inset-0 overflow-hidden bg-bg">
      <div
        ref={stageRef}
        data-stage=""
        data-scale={scale}
        className="absolute left-1/2 top-1/2 overflow-hidden bg-bg"
        style={{
          // Published so CSS and routes can read the same numbers the take
          // system uses; lib/take/types.ts stays the single source of truth.
          ["--stage-w" as string]: `${STAGE_W}px`,
          ["--stage-h" as string]: `${STAGE_H}px`,
          ["--safe" as string]: `${SAFE}px`,
          width: STAGE_W,
          height: STAGE_H,
          // translate first, then scale about the (already centred) origin, so
          // the stage centre sits on the viewport centre at any scale.
          transform: `translate(-50%, -50%)${scale === 1 ? "" : ` scale(${scale})`}`,
          transformOrigin: "center center",
          cursor: takeMode && !reduced ? "none" : "auto",
        }}
      >
        {children}
      </div>

      {tooSmall && !fit && !takeMode ? (
        <p className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 font-mono text-caption text-muted">
          viewport below {STAGE_W}&times;{STAGE_H} — ?fit=0 pins the stage at 1:1,
          so it is cropped. drop the param to scale it to fit.
        </p>
      ) : null}
    </div>
  );
}
