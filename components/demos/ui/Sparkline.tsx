"use client";

import { useId } from "react";
import { brand, withAlpha } from "@/lib/brand";

export type SparklineProps = {
  /** The series to plot. Must be real data the surrounding copy refers to. */
  points: number[];
  width: number;
  height: number;
  /** Draws the stroke on when true. Leave undefined for a static chart. */
  drawn?: boolean;
  /** Milliseconds for the draw-on. */
  duration?: number;
  delay?: number;
  strokeWidth?: number;
  className?: string;
};

/**
 * A small line chart.
 *
 * Deliberately minimal: one accent stroke, one soft area fill, a marked last
 * value, no axes or gridlines. The draw-on uses stroke-dashoffset, which is a
 * compositor-friendly single property rather than per-frame path maths.
 */
export function Sparkline({
  points,
  width,
  height,
  drawn,
  duration = 900,
  delay = 0,
  strokeWidth = 2,
  className,
}: SparklineProps) {
  const id = useId();
  const pad = strokeWidth + 1;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const xy = points.map((v, i) => {
    const x = (i / (points.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  // Catmull-Rom through the samples, converted to cubic beziers: a polyline
  // reads as a chart, a smooth curve reads as a designed one.
  let d = `M ${xy[0][0]},${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] ?? xy[i];
    const p1 = xy[i];
    const p2 = xy[i + 1];
    const p3 = xy[i + 2] ?? p2;
    d +=
      ` C ${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6}` +
      ` ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6}` +
      ` ${p2[0]},${p2[1]}`;
  }
  const area = `${d} L ${xy[xy.length - 1][0]},${height} L ${xy[0][0]},${height} Z`;
  const last = xy[xy.length - 1];
  const animated = drawn !== undefined;

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={withAlpha(brand.accent, 0.26)} />
          <stop offset="100%" stopColor={withAlpha(brand.accent, 0)} />
        </linearGradient>
      </defs>

      <path
        d={area}
        fill={`url(#${id}-fill)`}
        style={{
          opacity: animated ? (drawn ? 1 : 0) : 1,
          transition: animated
            ? `opacity ${duration}ms ease ${delay + duration * 0.4}ms`
            : undefined,
        }}
      />
      <path
        d={d}
        stroke={brand.accent}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={
          animated
            ? {
                strokeDasharray: 1,
                strokeDashoffset: drawn ? 0 : 1,
                transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
              }
            : undefined
        }
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={strokeWidth + 1.4}
        fill={brand.accent}
        style={{
          opacity: animated ? (drawn ? 1 : 0) : 1,
          transition: animated
            ? `opacity 300ms ease ${delay + duration * 0.86}ms`
            : undefined,
        }}
      />
    </svg>
  );
}
