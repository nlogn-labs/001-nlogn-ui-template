"use client";

import { useEffect, useRef } from "react";
import { Spotlight } from "@/components/ui/spotlight";
import { brand } from "@/lib/brand";
import { readStageMetrics, toStagePoint } from "@/lib/take/stage";
import { useTake } from "@/lib/take/take-context";

export type SpotlightRigProps = {
  /** Where the light rests before the cursor arrives, in stage coordinates. */
  restX: number;
  restY: number;
  width: number;
  height: number;
  /**
   * Aligns the glow with the cursor. The library's entrance keyframe leaves
   * the SVG at `translate(-50%, -40%)` and its ellipse sits off-centre inside
   * the viewBox, so the bright region needs correcting by hand rather than by
   * a formula.
   */
  offsetX?: number;
  offsetY?: number;
  /** 0-1. Lower trails the cursor more heavily. */
  smoothing?: number;
};

/**
 * Makes Aceternity's Spotlight follow the cursor.
 *
 * The library component is a static blurred SVG with a one-shot entrance
 * keyframe — it has no pointer logic of its own and exposes only `className`
 * and `fill`. Rather than rewrite it, this rig listens for the same
 * `mousemove` the choreography dispatches on `document` and moves a wrapper
 * underneath it, so the light tracks the synthetic cursor (and a real mouse in
 * normal mode) with the copied source untouched.
 */
export function SpotlightRig({
  restX,
  restY,
  width,
  height,
  offsetX = 0,
  offsetY = 0,
  smoothing = 0.12,
}: SpotlightRigProps) {
  const { subscribeFrame, takeMode, reduced, runId } = useTake();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let metrics = readStageMetrics(host);
    const measure = () => {
      metrics = readStageMetrics(host);
    };
    window.addEventListener("resize", measure);

    const target = { x: restX, y: restY };
    const current = { x: restX, y: restY };

    const write = () => {
      host.style.transform = `translate3d(${current.x + offsetX}px, ${
        current.y + offsetY
      }px, 0)`;
    };
    write();

    const onMove = (e: MouseEvent) => {
      const p = toStagePoint(e.clientX, e.clientY, metrics);
      target.x = p.x;
      target.y = p.y;
      // Outside a take there is no shared frame loop to smooth against, so the
      // light simply follows the real pointer.
      if (!takeMode || reduced) {
        current.x = p.x;
        current.y = p.y;
        write();
      }
    };
    document.addEventListener("mousemove", onMove);

    const unsubscribe =
      takeMode && !reduced
        ? subscribeFrame(() => {
            current.x += (target.x - current.x) * smoothing;
            current.y += (target.y - current.y) * smoothing;
            write();
          })
        : undefined;

    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("mousemove", onMove);
      unsubscribe?.();
    };
  }, [
    subscribeFrame,
    takeMode,
    reduced,
    runId,
    restX,
    restY,
    width,
    height,
    offsetX,
    offsetY,
    smoothing,
  ]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0"
      style={{ width, height, willChange: "transform" }}
    >
      <Spotlight
        key={runId}
        fill={brand.accent}
        className="top-0 left-0 h-full w-full lg:w-full"
      />
    </div>
  );
}
