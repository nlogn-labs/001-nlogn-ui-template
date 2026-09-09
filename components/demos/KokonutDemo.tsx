"use client";

import HoldButton from "@/components/kokonutui/hold-button";
import { LiquidGlassCard } from "@/components/kokonutui/liquid-glass-card";
import { DemoCursor } from "@/components/DemoCursor";
import { Grain } from "@/components/demos/ui/Grain";
import { GridField } from "@/components/demos/ui/GridField";
import { Rule } from "@/components/demos/ui/Rule";
import { Sparkline } from "@/components/demos/ui/Sparkline";
import { StatusDot } from "@/components/demos/ui/StatusDot";
import { Reveal } from "@/components/demos/Reveal";
import { useTake } from "@/lib/take/take-context";
import type { CursorKeyframe } from "@/lib/take/types";

const CARD = { left: 410, top: 208, width: 780, height: 484 };

/** How long the component holds before the fill completes. */
const HOLD_MS = 1500;

/**
 * Deploy success for the last fourteen days. The series ends on the headline
 * figure and its seventh sample is the one the delta is measured against, so
 * the chart is the metric rather than decoration.
 */
const SUCCESS_14D = [
  96.2, 96.8, 96.1, 97.0, 97.2, 96.9, 97.4, 97.8, 97.5, 98.0, 98.3, 98.1, 98.4,
  98.6,
];

const SECONDARY = [
  { label: "Median build", value: "4m 12s" },
  { label: "Error-free sessions", value: "99.71%" },
  { label: "Releases this week", value: "34" },
];

/**
 * Route 07 choreography.
 *
 * The cursor must not leave the button between `press` and `release` —
 * HoldButton aborts on mouseleave — so the hold window sits still on the
 * button's centre rather than drifting.
 */
const cursorPath: CursorKeyframe[] = [
  { x: 1362, y: 786, t: 0 },
  { x: 1140, y: 742, t: 520 },
  { x: 900, y: 700, t: 1020 },
  { x: 1026, y: 628, t: 1180 },
  { x: 1026, y: 628, t: 1200, action: "press" },
  { x: 1026, y: 628, t: 3100, action: "release" },
  { x: 1104, y: 686, t: 3300 },
  { x: 1268, y: 754, t: 3580 },
  { x: 1356, y: 782, t: 3800 },
];

export function KokonutDemo() {
  const { started, ready, reduced } = useTake();
  const on = ready && started;
  const at = (ms: number) => (reduced ? 0 : ms);

  return (
    <>
      <GridField cell={54} strength={58} fade />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(48% 58% at 20% 16%, color-mix(in srgb, var(--color-accent) 17%, transparent) 0%, color-mix(in srgb, var(--color-accent) 0%, transparent) 70%)," +
            "radial-gradient(44% 52% at 86% 92%, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, color-mix(in srgb, var(--color-accent) 0%, transparent) 66%)",
        }}
      />
      <Grain opacity={0.05} />

      <span className="absolute top-20 left-20 font-mono text-caption tracking-[0.08em] text-text">
        NLOGN
      </span>

      {/* Bloom under the panel, so the glass sits above the field rather than
          being pasted onto it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: CARD.left - 90,
          top: CARD.top - 40,
          width: CARD.width + 180,
          height: CARD.height + 140,
          background:
            "radial-gradient(52% 52% at 50% 58%, color-mix(in srgb, var(--color-accent) 15%, transparent) 0%, color-mix(in srgb, var(--color-accent) 0%, transparent) 72%)",
        }}
      />

      <div
        className="absolute"
        style={{
          left: CARD.left,
          top: CARD.top,
          width: CARD.width,
          height: CARD.height,
        }}
      >
        <LiquidGlassCard
          glassSize="lg"
          className="h-full w-full rounded-[8px] border-hairline p-10"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-surface) 70%, transparent)",
          }}
        >
          {/* The library wraps children in an auto-height div, so h-full has
              nothing to resolve against; the height is stated explicitly. */}
          <div
            className="flex flex-col"
            style={{ height: CARD.height - 80 }}
          >
            <div className="flex items-baseline justify-between font-mono text-caption">
              <span className="tracking-[0.1em] text-muted">RELEASE OPS</span>
              <span className="flex items-center gap-2.5 text-muted">
                <StatusDot />
                4.31 rolling out
              </span>
            </div>

            {/* Hero metric, with the series it is drawn from beside it. */}
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="font-mono text-caption text-muted">
                  Deploy success
                </p>
                <p className="mt-2 text-display-l text-text tabular-nums">
                  98.6%
                </p>
                <p className="mt-3 font-mono text-caption text-accent tabular-nums">
                  ▲ 1.2 pts vs last week
                </p>
              </div>
              <Sparkline
                points={SUCCESS_14D}
                width={308}
                height={96}
                drawn={on}
                delay={at(80)}
                duration={840}
                strokeWidth={2.5}
                className="mb-1.5"
              />
            </div>

            <Rule active={on} delay={at(220)} className="mt-7 h-px w-full" />

            <div className="mt-6 flex justify-between">
              {SECONDARY.map((m, i) => (
                <Reveal
                  key={m.label}
                  active={on}
                  delay={at(360 + i * 90)}
                  y={10}
                  duration={560}
                >
                  <p className="font-mono text-caption text-muted">{m.label}</p>
                  <p className="mt-2.5 text-heading text-text tabular-nums">
                    {m.value}
                  </p>
                </Reveal>
              ))}
            </div>

            <div className="mt-auto flex items-end justify-between">
              <div>
                <p className="font-mono text-caption text-muted">
                  Rollout paused at 38% of fleet
                </p>
                <p className="mt-2 font-mono text-caption text-text">
                  Halt rollout 4.31
                </p>
              </div>
              {/* Palette neutralised through className only — cn() runs
                  tailwind-merge over the variant's own classes, so these win.
                  The dark: variants have to be restated because tailwind-merge
                  treats a different modifier as a different key. */}
              <HoldButton
                variant="grey"
                holdDuration={HOLD_MS}
                className="nlogn-hold h-12 min-w-[248px] rounded-[4px] border-hairline bg-surface text-ui text-text hover:bg-surface dark:border-hairline dark:bg-surface dark:text-text dark:hover:bg-surface"
              />
            </div>
          </div>
        </LiquidGlassCard>
      </div>

      <DemoCursor path={cursorPath} />
    </>
  );
}
