import { easeInOutCubic } from "./easing";
import type { CursorKeyframe } from "./types";

/**
 * Centripetal Catmull-Rom sampling across the keyframe list.
 *
 * Straight linear interpolation between keyframes produces a robotic polyline;
 * sampling a spline makes the path genuinely curve through its control points,
 * which is what routes 01 and 04 need ("arc across the card, not a straight
 * diagonal"). Segment progress is additionally shaped by easeInOutCubic so the
 * cursor accelerates and settles instead of moving at constant speed.
 */
function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export type CursorSample = { x: number; y: number };

/** Position of the cursor at `elapsed` ms after TAKE_START. Deterministic. */
export function sampleCursorPath(
  path: CursorKeyframe[],
  elapsed: number,
): CursorSample {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return { x: path[0].x, y: path[0].y };

  const first = path[0];
  const last = path[path.length - 1];
  if (elapsed <= first.t) return { x: first.x, y: first.y };
  if (elapsed >= last.t) return { x: last.x, y: last.y };

  let i = 0;
  while (i < path.length - 2 && elapsed > path[i + 1].t) i += 1;

  const a = path[i];
  const b = path[i + 1];
  const span = b.t - a.t;
  const raw = span <= 0 ? 1 : (elapsed - a.t) / span;
  const t = easeInOutCubic(raw);

  // Duplicate the endpoints so the spline passes through the first and last
  // keyframes exactly rather than overshooting them.
  const p0 = path[i - 1] ?? a;
  const p3 = path[i + 2] ?? b;

  return {
    x: catmullRom(p0.x, a.x, b.x, p3.x, t),
    y: catmullRom(p0.y, a.y, b.y, p3.y, t),
  };
}

/** Total choreography length in ms. */
export function pathDuration(path: CursorKeyframe[]): number {
  return path.length ? path[path.length - 1].t : 0;
}
