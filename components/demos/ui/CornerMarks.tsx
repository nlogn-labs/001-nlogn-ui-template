"use client";

import { SAFE, STAGE_H, STAGE_W } from "@/lib/take/types";

/**
 * Crop marks on the safe area.
 *
 * Four hairline corners that frame the composition as a deliberate artboard
 * rather than a page that happens to end. Cheap, static, and it reads as
 * drafting rather than decoration.
 */
export function CornerMarks({
  inset = SAFE,
  length = 26,
  className,
}: {
  inset?: number;
  length?: number;
  className?: string;
}) {
  const corners = [
    { x: inset, y: inset, sx: 1, sy: 1 },
    { x: STAGE_W - inset, y: inset, sx: -1, sy: 1 },
    { x: inset, y: STAGE_H - inset, sx: 1, sy: -1 },
    { x: STAGE_W - inset, y: STAGE_H - inset, sx: -1, sy: -1 },
  ];

  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      width={STAGE_W}
      height={STAGE_H}
      fill="none"
    >
      {corners.map((c, i) => (
        <g key={i} stroke="var(--color-hairline)" strokeWidth={1}>
          <line x1={c.x} y1={c.y} x2={c.x + c.sx * length} y2={c.y} />
          <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.sy * length} />
        </g>
      ))}
    </svg>
  );
}
