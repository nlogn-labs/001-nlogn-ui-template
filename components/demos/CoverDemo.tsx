"use client";

import BlurText from "@/components/BlurText";
import { DemoCursor } from "@/components/DemoCursor";
import { ThreadsField } from "@/components/demos/ThreadsField";
import { CornerMarks } from "@/components/demos/ui/CornerMarks";
import { Grain } from "@/components/demos/ui/Grain";
import { Rule } from "@/components/demos/ui/Rule";
import { useTake } from "@/lib/take/take-context";
import type { CursorKeyframe } from "@/lib/take/types";

const HEADLINE = "Built to be remembered.";

/**
 * Route 01 choreography. No clicks — the cursor enters low-right, crosses the
 * live (wave-bearing) half of the Threads field, and settles in the quiet
 * upper band. It never crosses the headline block (x 136-1010, y 497-745).
 */
const cursorPath: CursorKeyframe[] = [
  { x: 1476, y: 806, t: 0 },
  { x: 1258, y: 748, t: 700 },
  { x: 1036, y: 692, t: 1400 },
  { x: 1246, y: 628, t: 2300 },
  { x: 1404, y: 456, t: 3100 },
  { x: 1450, y: 322, t: 3700 },
];

export function CoverDemo() {
  const { started, ready, reduced, runId } = useTake();
  const on = ready && started;
  const settle = (ms: number) => (reduced ? 0 : ms);

  return (
    <>
      {/* Rendered at 520x220 and upscaled: the visible band lands across
          y 388-653, behind the headline. See ThreadsField for the maths. */}
      <ThreadsField
        centerX={800}
        centerY={108}
        width={1600}
        height={1120}
        renderWidth={520}
        renderHeight={220}
        amplitude={1.55}
        distance={0.92}
        opacity={0.85}
      />


      {/* Holds full headline contrast without dimming the field as a whole. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(54% 42% at 50% 49%," +
            " color-mix(in srgb, var(--color-bg) 82%, transparent) 0%," +
            " color-mix(in srgb, var(--color-bg) 58%, transparent) 46%," +
            " color-mix(in srgb, var(--color-bg) 0%, transparent) 78%)",
        }}
      />

      <Grain opacity={0.055} />
      <CornerMarks />

      <span className="absolute top-20 left-20 font-mono text-caption tracking-[0.08em] text-text">
        NLOGN
      </span>

      {/* Drawn after the headline has resolved, then still. It anchors the
          type to the same left margin as the studio mark. */}
      <Rule
        active={on}
        delay={settle(900)}
        duration={820}
        color="var(--color-accent)"
        className="absolute top-[672px] left-1/2 h-px w-[260px] -translate-x-1/2"
      />

      <div className="absolute inset-0 grid place-items-center">
        <div className="w-[1040px]">
          {reduced || !started || !ready ? (
            <p
              className="text-display-xl text-center text-text"
              style={{ opacity: reduced ? 1 : 0 }}
            >
              {HEADLINE}
            </p>
          ) : (
            <BlurText
              key={runId}
              text={HEADLINE}
              animateBy="words"
              threshold={0}
              direction="bottom"
              delay={90}
              stepDuration={0.22}
              easing={[0.22, 1, 0.36, 1]}
              // BlurText lays its words out in a flex row, so centring the
              // line needs justify-content as well as text-align.
              className="text-display-xl justify-center text-center text-text"
            />
          )}
        </div>
      </div>

      <DemoCursor path={cursorPath} />
    </>
  );
}
