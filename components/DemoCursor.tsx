"use client";

import { useEffect, useRef } from "react";
import { brand } from "@/lib/brand";
import { useTake } from "@/lib/take/take-context";
import { sampleCursorPath } from "@/lib/take/spline";
import { readStageMetrics } from "@/lib/take/stage";
import type { CursorKeyframe } from "@/lib/take/types";
import {
  createPointerState,
  dispatchClick,
  dispatchCursorMove,
  dispatchHoverOut,
  dispatchPress,
  dispatchRelease,
} from "@/lib/take/syntheticPointer";

export type DemoCursorProps = {
  path: CursorKeyframe[];
};

/**
 * The fake cursor.
 *
 * Position is written straight to the element's transform from the shared rAF
 * loop — no React state per frame, so no route ever re-renders because the
 * cursor moved. Every frame also converts the stage-space position into browser
 * coordinates and dispatches the synthetic move, so the arrow the camera sees
 * and the clientX/clientY the libraries receive are the same point.
 */
export function DemoCursor({ path }: DemoCursorProps) {
  const { subscribeFrame, takeMode, reduced, runId } = useTake();
  const elRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!takeMode || reduced || path.length === 0) return;
    const el = elRef.current;
    if (!el) return;

    const state = createPointerState();

    // getBoundingClientRect is read on resize only, never inside the frame
    // loop, so the choreography cannot thrash layout.
    let { rect, scale } = readStageMetrics(el);
    const measure = () => {
      ({ rect, scale } = readStageMetrics(el));
    };
    window.addEventListener("resize", measure);
    measure();

    let nextAction = 0;
    const actions = path.filter((k) => k.action);

    const frame = (elapsed: number) => {
      const { x, y } = sampleCursorPath(path, elapsed);

      // Visual position, in stage space.
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // Browser position. The stage is centred, so its origin is not 0,0;
      // when ?fit=1 scales the stage, the same factor applies here.
      const clientX = (rect?.left ?? 0) + x * scale;
      const clientY = (rect?.top ?? 0) + y * scale;

      dispatchCursorMove(clientX, clientY, state);

      while (nextAction < actions.length && elapsed >= actions[nextAction].t) {
        const kf = actions[nextAction];
        const ax = (rect?.left ?? 0) + kf.x * scale;
        const ay = (rect?.top ?? 0) + kf.y * scale;
        switch (kf.action) {
          case "click":
            dispatchClick(ax, ay, state);
            break;
          case "press":
            dispatchPress(ax, ay, state);
            break;
          case "release":
            dispatchRelease(ax, ay, state, true);
            break;
          case "hover-out":
            dispatchHoverOut(ax, ay, state);
            break;
        }
        nextAction += 1;
      }

      // Pressed state reads on camera as a small contraction of the shadow.
      if (pressRef.current) {
        pressRef.current.style.opacity = state.buttons ? "1" : "0";
      }
    };

    // Land on the first keyframe before the first tick so the cursor never
    // flashes at the origin.
    frame(0);
    const unsubscribe = subscribeFrame(frame);
    return () => {
      unsubscribe();
      window.removeEventListener("resize", measure);
      if (state.buttons) dispatchRelease(0, 0, state, false);
    };
  }, [subscribeFrame, takeMode, reduced, path, runId]);

  if (!takeMode || reduced || path.length === 0) return null;

  return (
    <div
      ref={elRef}
      aria-hidden
      data-fake-cursor=""
      className="pointer-events-none absolute top-0 left-0 z-50"
      style={{
        transform: `translate3d(${path[0].x}px, ${path[0].y}px, 0)`,
        willChange: "transform",
      }}
    >
      <svg
        width="26"
        height="34"
        viewBox="0 0 26 34"
        fill="none"
        style={{
          filter: `drop-shadow(0 3px 10px ${brand.accent}59) drop-shadow(0 0 2px ${brand.accent}80)`,
        }}
      >
        <circle
          ref={pressRef}
          cx="3.5"
          cy="3.5"
          r="13"
          fill={brand.accent}
          opacity="0"
          style={{ transition: "opacity 90ms linear" }}
        />
        <path
          d="M2 1.6 L2 26.4 L8.3 20.4 L12.2 29.6 L16.6 27.7 L12.8 18.8 L21.4 18.4 Z"
          fill={brand.text}
        />
      </svg>
    </div>
  );
}
