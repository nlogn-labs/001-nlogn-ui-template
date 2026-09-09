"use client";

import { useEffect, useRef } from "react";
import Threads from "@/components/Threads";
import { ACCENT_RGB_UNIT } from "@/lib/brand";
import { registerCursorTarget } from "@/lib/take/syntheticPointer";

export type ThreadsFieldProps = {
  /** Centre of the field box, in stage coordinates. */
  centerX: number;
  centerY: number;
  /**
   * Size of the field box in stage px, measured before `rotate` is applied.
   * The visible band of threads runs along the box's width and sits
   * `0.4 * distance * height` below the box centre.
   */
  width: number;
  height: number;
  /** Rotation about the box centre. 90 turns the threads into a column. */
  rotate?: number;
  /**
   * Shader resolution in CSS pixels. The field is rendered at this size and
   * upscaled to the box, which is the documented way to keep a shader-heavy
   * route affordable without touching its motion.
   *
   * These also drive appearance, because the shader's line width is a constant
   * measured against `max(renderWidth, renderHeight)`:
   *   line thickness (stage px) = 7 * height / max(renderWidth, renderHeight)
   *   band thickness (stage px) = 0.2 * distance * height
   * Rendering smaller therefore gives heavier lines, so the cheap direction
   * and the H.264-safe direction are the same one.
   */
  renderWidth: number;
  renderHeight: number;
  /** Wave strength. */
  amplitude?: number;
  /**
   * Separation between threads. Only the first ~20% of the shader's 40 lines
   * survive its own falloff, so this sets both the band's thickness and how
   * far below the box centre it sits. Must stay below 1.0 or the band clips
   * off the edge of the canvas.
   */
  distance?: number;
  /** Field opacity. Kept below the point where text contrast suffers. */
  opacity?: number;
};

/**
 * Project-level wrapper around React Bits' Threads.
 *
 * The copied component is untouched — colour, density, weight, resolution,
 * placement and rotation are all driven through its props and this wrapper's
 * layout. The inner element is registered with the cursor bus because Threads
 * binds `mousemove` on its own container rather than on document; without that
 * it would never see the synthetic cursor, since foreground copy wins the hit
 * test.
 */
export function ThreadsField({
  centerX,
  centerY,
  width,
  height,
  rotate = 0,
  renderWidth,
  renderHeight,
  amplitude = 1,
  distance = 0.9,
  opacity = 0.5,
}: ThreadsFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = hostRef.current?.querySelector("[data-threads]");
    return registerCursorTarget(el ?? null);
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: centerX - width / 2,
        top: centerY - height / 2,
        width,
        height,
        opacity,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          width: renderWidth,
          height: renderHeight,
          transform: `scale(${width / renderWidth}, ${height / renderHeight})`,
          transformOrigin: "top left",
        }}
      >
        <Threads
          data-threads=""
          color={ACCENT_RGB_UNIT}
          amplitude={amplitude}
          distance={distance}
          enableMouseInteraction
        />
      </div>
    </div>
  );
}
