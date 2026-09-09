"use client";

import { useRef } from "react";
import { Globe, Users, Mail, ChartColumn } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { DemoCursor } from "@/components/DemoCursor";
import { Grain } from "@/components/demos/ui/Grain";
import { GridField } from "@/components/demos/ui/GridField";
import { StatusDot } from "@/components/demos/ui/StatusDot";
import { Reveal } from "@/components/demos/Reveal";
import topology from "@/lib/demos/magic-topology.json";
import { brand, withAlpha } from "@/lib/brand";
import { useTake } from "@/lib/take/take-context";
import type { CursorKeyframe } from "@/lib/take/types";

type NodeKey = "website" | "crm" | "email" | "analytics";

const ICONS = { website: Globe, crm: Users, email: Mail, analytics: ChartColumn };

/**
 * Diagram geometry and beam timing live in lib/demos/magic-topology.json so
 * that scripts/check-beams.mjs verifies the exact numbers this route renders
 * rather than a copy of them.
 *
 * The throughput figures reconcile: the site emits 1.2k events a minute, the
 * CRM keeps the 840 that carry a contact, of which 310 trigger a message, and
 * analytics receives the full stream.
 *
 * The beam durations look far too long for a 4s take, and are deliberate.
 * AnimatedBeam hardcodes `ease: [0.16, 1, 0.3, 1]` (easeOutExpo), so a comet
 * covers most of its path early then crawls off the end; with eight instances
 * remounting together motion starts them with a few hundred ms of jitter; and
 * a beam needs ~0.9s of travel before its comet clears the tile it left. Long
 * identical durations make the window where all four are mid-path wide enough
 * to survive that, and `delay` carries the cascade.
 */
const NODES = topology.nodes as Record<
  NodeKey,
  { x: number; y: number; label: string; rate: string; lit: number }
>;
const BEAMS = topology.beams as {
  from: NodeKey;
  to: NodeKey;
  curvature: number;
  delay: number;
  duration: number;
}[];
const TILE = topology.tile;

/** Subtle reinforcement only — the cursor never sits on a tile or a label. */
const cursorPath: CursorKeyframe[] = [
  { x: 300, y: 700, t: 0 },
  { x: 520, y: 566, t: 800 },
  { x: 820, y: 470, t: 1600 },
  { x: 1080, y: 502, t: 2400 },
  { x: 700, y: 620, t: 3200 },
  { x: 320, y: 706, t: 3800 },
];

/**
 * One tightly-bounding container per beam, drawn twice.
 *
 * AnimatedBeam animates its gradient across the *container's* width, so a
 * single stage-sized container would sweep each comet far away from its own
 * short path and the beams would read as dead grey lines. Boxing each beam
 * individually makes `delay` and `duration` mean exactly "this comet travels
 * this beam".
 *
 * The pass rendered behind is the same component with a heavy stroke and a CSS
 * blur, which gives the trace a real bloom instead of a flat 2px line — the
 * difference between a wireframe and something that looks lit.
 */
function Beam({
  from,
  to,
  curvature,
  delay,
  duration,
  reduced,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  curvature: number;
  delay: number;
  duration: number;
  reduced: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Horizontally the box hugs the endpoints: the gradient sweeps 10%->110% of
  // the *box* width, so any slack here is time the comet spends past the end
  // of its own path, invisible. Vertical padding only has to clear the arc.
  const padX = 8;
  const padY = 64;
  const left = Math.min(from.x, to.x) - padX;
  const top = Math.min(from.y, to.y) - Math.max(0, curvature) - padY;
  const right = Math.max(from.x, to.x) + padX;
  const bottom = Math.max(from.y, to.y) + Math.max(0, -curvature) + padY;

  const shared = {
    containerRef: boxRef,
    fromRef,
    toRef,
    curvature,
    delay: reduced ? 0 : delay,
    duration: reduced ? 0.001 : duration,
    gradientStartColor: brand.accent,
    gradientStopColor: brand.accent,
  };

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left, top, width: right - left, height: bottom - top }}
    >
      {/* Zero-size anchors: AnimatedBeam reads endpoint centres from rects. */}
      <div
        ref={fromRef}
        className="absolute size-0"
        style={{ left: from.x - left, top: from.y - top }}
      />
      <div
        ref={toRef}
        className="absolute size-0"
        style={{ left: to.x - left, top: to.y - top }}
      />

      {/* Halo pass: a wide, low-opacity draw of the same beam. A CSS blur
          would look marginally softer but has to re-filter a live-animating
          SVG every frame, which halved the frame rate; the gradient's own
          falloff does the softening for free. */}
      <div className="absolute inset-0" style={{ filter: "blur(5px)", opacity: 0.75 }}>
        <AnimatedBeam
          {...shared}
          pathWidth={9}
          pathOpacity={0}
          pathColor="transparent"
        />
      </div>
      <AnimatedBeam
        {...shared}
        // Heavier and more opaque than desktop taste: thin, low-opacity lines
        // disappear through H.264 and Instagram's re-encode.
        pathWidth={3}
        pathOpacity={0.46}
        pathColor={withAlpha(brand.muted, 0.9)}
      />
    </div>
  );
}

function Node({
  node,
  Icon,
  active,
  reduced,
  nodeRef,
  source,
}: {
  node: (typeof NODES)[NodeKey];
  Icon: (typeof ICONS)[NodeKey];
  active: boolean;
  reduced: boolean;
  nodeRef: React.RefObject<HTMLDivElement | null>;
  source?: boolean;
}) {
  const delay = reduced ? 0 : node.lit;
  const ease = `560ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`;
  const transition = `color ${ease}, border-color ${ease}, box-shadow ${ease}, background-color ${ease}`;

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: node.x - TILE / 2, top: node.y - TILE / 2 }}
    >
      <div
        ref={nodeRef}
        className="relative flex items-center justify-center rounded-[6px] border bg-surface"
        style={{
          width: TILE,
          height: TILE,
          borderColor: active ? withAlpha(brand.accent, 0.55) : brand.hairline,
          color: active ? brand.text : brand.muted,
          boxShadow: active
            ? `0 0 0 1px ${withAlpha(brand.accent, 0.1)}, 0 18px 44px -22px ${withAlpha(brand.accent, 0.85)}`
            : `0 0 0 1px ${withAlpha(brand.accent, 0)}, 0 18px 44px -22px ${withAlpha(brand.accent, 0)}`,
          transition,
        }}
      >
        {/* Key-light catch, so the tile reads as a surface not a swatch. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-text) 34%, transparent), transparent)",
          }}
        />
        <Icon size={26} strokeWidth={1.6} />
        {source ? (
          <span className="absolute top-2.5 right-2.5">
            <StatusDot size={5} />
          </span>
        ) : null}
      </div>

      <span
        className="mt-3.5 font-mono text-caption"
        style={{ color: active ? brand.text : brand.muted, transition }}
      >
        {node.label}
      </span>
      <span
        className="mt-1 font-mono text-caption tabular-nums"
        style={{
          color: active ? brand.accent : brand.muted,
          opacity: active ? 1 : 0.45,
          transition,
        }}
      >
        {node.rate}
      </span>
    </div>
  );
}

export function MagicDemo() {
  const { started, ready, reduced } = useTake();
  const on = ready && started;

  const website = useRef<HTMLDivElement>(null);
  const crm = useRef<HTMLDivElement>(null);
  const email = useRef<HTMLDivElement>(null);
  const analytics = useRef<HTMLDivElement>(null);
  const refs = { website, crm, email, analytics };

  return (
    <div className="absolute inset-0">
      <GridField cell={64} strength={34} fade />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(46% 54% at 30% 30%, color-mix(in srgb, var(--color-accent) 13%, transparent) 0%, color-mix(in srgb, var(--color-accent) 0%, transparent) 70%)," +
            "radial-gradient(40% 48% at 76% 74%, color-mix(in srgb, var(--color-accent) 10%, transparent) 0%, color-mix(in srgb, var(--color-accent) 0%, transparent) 68%)",
        }}
      />
      <Grain opacity={0.05} />

      <span className="absolute top-20 left-20 font-mono text-caption tracking-[0.08em] text-text">
        NLOGN
      </span>

      {BEAMS.map((beam) => (
        <Beam
          // Remounted at TAKE_START so the staggered gradient delays are
          // measured from the take rather than from page mount, where the
          // pre-roll would silently consume them. The beams stay rendered
          // either side of that swap, so the diagram's lines never disappear.
          key={`${beam.from}-${beam.to}-${on}`}
          from={NODES[beam.from]}
          to={NODES[beam.to]}
          curvature={beam.curvature}
          delay={beam.delay}
          duration={beam.duration}
          reduced={reduced}
        />
      ))}

      {(Object.keys(NODES) as NodeKey[]).map((key) => (
        <Node
          key={key}
          node={NODES[key]}
          Icon={ICONS[key]}
          nodeRef={refs[key]}
          active={on}
          reduced={reduced}
          source={key === "website"}
        />
      ))}

      <div className="absolute bottom-20 left-20 w-[460px]">
        <Reveal active={on} delay={reduced ? 0 : 120} y={12} duration={620}>
          <p className="text-body text-text">
            A single form submission, routed to four systems.
          </p>
          <p className="mt-3 font-mono text-caption text-muted">
            Median end-to-end delivery 240 ms
          </p>
        </Reveal>
      </div>

      <DemoCursor path={cursorPath} />
    </div>
  );
}
