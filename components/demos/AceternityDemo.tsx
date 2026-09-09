"use client";

import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { DemoCursor } from "@/components/DemoCursor";
import { SpotlightRig } from "@/components/demos/SpotlightRig";
import { Grain } from "@/components/demos/ui/Grain";
import { Sparkline } from "@/components/demos/ui/Sparkline";
import { StatusDot } from "@/components/demos/ui/StatusDot";
import { useTake } from "@/lib/take/take-context";
import type { CursorKeyframe } from "@/lib/take/types";

/** Card box in stage coordinates. The tilt is measured against this rect. */
const CARD = { left: 560, top: 212, width: 780, height: 476 };
const CARD_CX = CARD.left + CARD.width / 2;
const CARD_CY = CARD.top + CARD.height / 2;

/**
 * p95 latency across the last fourteen deploys. The series ends on the
 * headline figure and its seventh sample is what the delta is measured
 * against, so the chart is the metric rather than decoration.
 */
const P95_14 = [
  201, 199, 203, 196, 198, 194, 196, 192, 190, 193, 188, 186, 187, 184,
];

/**
 * Route 04 choreography.
 *
 * The path is a loop, not a there-and-back: it swings out low across the card
 * and returns high, so the arc reads as deliberate rather than retraced. The
 * extreme is at t=1900 rather than 2000 because the library card carries a
 * 200ms ease-linear transition, so peak *visible* tilt lands ~2.1s.
 *
 * Tilt is `offset from card centre / 25` degrees, so the extreme keyframe sits
 * near the card's top-right corner: ~13deg rotateY, ~5deg rotateX.
 */
const cursorPath: CursorKeyframe[] = [
  { x: 236, y: 806, t: 0 },
  { x: 470, y: 782, t: 380 },
  { x: 726, y: 706, t: 820 },
  { x: 962, y: 606, t: 1220 },
  { x: 1180, y: 448, t: 1620 },
  { x: 1288, y: 328, t: 1900 },
  { x: 1178, y: 366, t: 2320 },
  { x: 962, y: 452, t: 2700 },
  { x: 736, y: 560, t: 3060 },
  { x: 486, y: 700, t: 3420 },
  { x: 252, y: 792, t: 3800 },
];

export function AceternityDemo() {
  const { started, ready, reduced } = useTake();
  const on = ready && started;

  return (
    <>
      <SpotlightRig
        restX={CARD_CX - 300}
        restY={CARD_CY + 160}
        width={1000}
        height={840}
        offsetX={-10}
        offsetY={-60}
      />
      <Grain opacity={0.045} />

      <span className="absolute top-20 left-20 font-mono text-caption tracking-[0.08em] text-text">
        NLOGN
      </span>

      <div
        className="absolute"
        style={{
          left: CARD.left,
          top: CARD.top,
          width: CARD.width,
          height: CARD.height,
        }}
      >
        <CardContainer
          containerClassName="h-full w-full py-0"
          className="h-full w-full"
        >
          <CardBody className="relative h-full w-full">
            {/* A second plate parked behind the card. It only shows itself
                when the card tilts, which is exactly when depth should read. */}
            <CardItem
              translateX={30}
              translateY={26}
              translateZ={-80}
              className="absolute inset-0 !w-full rounded-[8px] border border-hairline"
            >
              {null}
            </CardItem>

            <CardItem
              translateZ={0}
              className="absolute inset-0 !w-full overflow-hidden rounded-[8px] border border-hairline bg-surface"
              style={{
                backgroundImage:
                  "linear-gradient(156deg," +
                  " color-mix(in srgb, var(--color-text) 6%, transparent) 0%," +
                  " color-mix(in srgb, var(--color-text) 0%, transparent) 42%)",
              }}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-text) 40%, transparent) 50%, transparent)",
                }}
              />
            </CardItem>

            <CardItem
              translateZ={34}
              className="absolute top-11 left-12 font-mono text-caption tracking-[0.1em] text-muted"
            >
              RIDGELINE
            </CardItem>

            <CardItem
              translateZ={34}
              className="absolute top-11 right-12 flex items-center gap-2.5 font-mono text-caption text-muted"
            >
              <StatusDot size={5} />
              stable
            </CardItem>

            <CardItem
              as="p"
              translateZ={95}
              className="absolute top-[112px] left-12 !w-[452px] text-heading text-text"
            >
              Correlates every deploy with the metrics it moved.
            </CardItem>

            <CardItem
              translateZ={26}
              className="absolute top-[244px] right-12 left-12 !w-auto h-px bg-hairline"
            >
              {null}
            </CardItem>

            {/* Headline metric and the series behind it. */}
            <CardItem
              translateZ={62}
              className="absolute top-[274px] left-12 !w-auto"
            >
              <p className="font-mono text-caption text-muted">p95 latency</p>
              <p className="mt-2 text-display-l text-text tabular-nums">
                184 ms
              </p>
            </CardItem>

            <CardItem
              translateZ={48}
              className="absolute top-[298px] right-12 !w-auto"
            >
              <Sparkline
                points={P95_14}
                width={266}
                height={84}
                drawn={on}
                delay={reduced ? 0 : 120}
                duration={860}
                strokeWidth={2.5}
              />
            </CardItem>

            <CardItem
              translateZ={40}
              className="absolute right-12 bottom-12 left-12 !w-auto flex items-baseline justify-between font-mono text-caption"
            >
              <span className="text-accent tabular-nums">
                ▼ 12 ms since 4.31
              </span>
              <span className="text-muted tabular-nums">
                error rate 0.04%
              </span>
              <span className="text-muted tabular-nums">
                18 deploys today
              </span>
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>

      <DemoCursor path={cursorPath} />
    </>
  );
}
