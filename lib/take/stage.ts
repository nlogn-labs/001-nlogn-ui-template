import { STAGE_H, STAGE_W } from "./types";

export type StageMetrics = {
  /** The stage's position in the viewport. */
  rect: DOMRect | null;
  /** 1 unless ?fit=1 scaled the stage down. */
  scale: number;
};

export function readStageMetrics(el: Element | null): StageMetrics {
  const stage = el?.closest("[data-stage]") as HTMLElement | null;
  return {
    rect: stage?.getBoundingClientRect() ?? null,
    scale: Number(stage?.dataset.scale ?? 1) || 1,
  };
}

/**
 * Browser coordinates -> stage coordinates.
 *
 * The inverse of what DemoCursor does on the way out, so anything reacting to
 * the synthetic events lands on the same point the arrow is drawn at.
 */
export function toStagePoint(
  clientX: number,
  clientY: number,
  { rect, scale }: StageMetrics,
): { x: number; y: number } {
  if (!rect) return { x: STAGE_W / 2, y: STAGE_H / 2 };
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}
