"use client";

import BlurText from "@/components/BlurText";
import { DemoCursor } from "@/components/DemoCursor";
import { DelayedMount, Reveal } from "@/components/demos/Reveal";
import { ThreadsField } from "@/components/demos/ThreadsField";
import { Grain } from "@/components/demos/ui/Grain";
import { Rule } from "@/components/demos/ui/Rule";
import { StatusDot } from "@/components/demos/ui/StatusDot";
import { useTake } from "@/lib/take/take-context";
import type { CursorKeyframe } from "@/lib/take/types";

const NAME = "Mara Okonkwo";
const POSITIONING = "Frontend engineer for collaborative, offline-first editors.";

const RAIL = [
  { label: "Focus", value: "Sync and conflict resolution" },
  { label: "Stack", value: "TypeScript, Rust, WebRTC" },
  { label: "Available", value: "March 2027", live: true },
];

/** Three shipped things, newest first. */
const WORK = [
  { year: "2026", name: "Kestrel", note: "Realtime document engine" },
  { year: "2025", name: "Tideline", note: "Offline sync SDK" },
  { year: "2023", name: "Marrow", note: "CRDT inspector" },
];

/**
 * Route 03 choreography. The cursor works the vertical Threads column on the
 * right and never enters the text column (which ends at x 1000), so the copy
 * stays clean while the field visibly answers the cursor.
 */
const cursorPath: CursorKeyframe[] = [
  { x: 1512, y: 812, t: 0 },
  { x: 1408, y: 648, t: 800 },
  { x: 1296, y: 474, t: 1700 },
  { x: 1208, y: 322, t: 2600 },
  { x: 1272, y: 254, t: 3600 },
];

export function ReactBitsPortfolioDemo() {
  const { started, ready, reduced, runId } = useTake();
  const on = ready && started;
  /* Reduced motion resolves to the finished frame with no transition at all. */
  const settle = (delay: number) => (reduced ? 0 : delay);

  return (
    <>
      {/* Same component as route 01, turned on its side: the band runs as a
          vertical column near x 1250 rather than a horizontal sweep, at a
          tighter opacity and a shorter wave. See ThreadsField for the maths. */}
      <ThreadsField
        centerX={1650}
        centerY={450}
        width={1100}
        height={1111}
        rotate={90}
        renderWidth={520}
        renderHeight={230}
        amplitude={1.2}
        distance={0.9}
        opacity={0.72}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(84deg, var(--color-bg) 30%," +
            " color-mix(in srgb, var(--color-bg) 55%, transparent) 52%," +
            " color-mix(in srgb, var(--color-bg) 0%, transparent) 72%)",
        }}
      />

      <Grain opacity={0.05} />

      <span className="absolute top-20 left-20 font-mono text-caption tracking-[0.08em] text-text">
        NLOGN
      </span>

      {/* Structural rule: the column grid this route is built on. */}
      <Reveal
        active={on}
        delay={settle(260)}
        y={0}
        duration={760}
        className="absolute top-[200px] left-[300px] h-[606px] w-px bg-hairline"
      />

      {/* Left rail — right-aligned into the rule. */}
      <div className="absolute top-[200px] left-[120px] w-[148px] text-right">
        {RAIL.map((item, i) => (
          <Reveal
            key={item.label}
            active={on}
            delay={settle(700 + i * 90)}
            y={12}
            className="mb-9"
          >
            <p className="font-mono text-caption text-muted">{item.label}</p>
            <p className="mt-1.5 flex items-center justify-end gap-2 font-mono text-caption text-text">
              {item.value}
              {item.live ? <StatusDot size={5} /> : null}
            </p>
          </Reveal>
        ))}
      </div>

      {/* Main column. */}
      <div className="absolute top-[196px] left-[340px]">
        <div className="h-[92px]">
          {on && !reduced ? (
            <BlurText
              key={`name-${runId}`}
              text={NAME}
              animateBy="words"
              threshold={0}
              direction="bottom"
              delay={70}
              stepDuration={0.2}
              easing={[0.22, 1, 0.36, 1]}
              className="text-display-l text-text"
            />
          ) : (
            <p
              className="text-display-l text-text"
              style={{ opacity: reduced ? 1 : 0 }}
            >
              {NAME}
            </p>
          )}
        </div>

        <div className="mt-[44px] h-[156px] w-[660px]">
          {reduced ? (
            <p className="text-heading text-text">{POSITIONING}</p>
          ) : (
            <DelayedMount delay={340}>
              <BlurText
                key={`pos-${runId}`}
                text={POSITIONING}
                animateBy="words"
              threshold={0}
                direction="bottom"
                delay={38}
                stepDuration={0.18}
                easing={[0.22, 1, 0.36, 1]}
                className="text-heading text-text"
              />
            </DelayedMount>
          )}
        </div>

        <Rule active={on} delay={settle(820)} className="mt-[54px] h-px w-[620px]" />

        <Reveal active={on} delay={settle(900)} className="mt-7">
          <p className="font-mono text-caption text-muted">Selected work</p>
        </Reveal>

        <div className="mt-4 w-[620px]">
          {WORK.map((w, i) => (
            <Reveal
              key={w.name}
              active={on}
              delay={settle(980 + i * 90)}
              y={10}
              duration={560}
            >
              <div className="grid grid-cols-[62px_136px_1fr] items-baseline border-b border-hairline py-2.5 font-mono text-caption">
                <span className="text-muted tabular-nums">{w.year}</span>
                <span className="text-text">{w.name}</span>
                <span className="text-muted">{w.note}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal active={on} delay={settle(1320)} className="mt-9">
          <span className="inline-block border-b border-accent pb-1.5 text-ui text-text">
            Read the case studies
          </span>
        </Reveal>
      </div>

      <DemoCursor path={cursorPath} />
    </>
  );
}
