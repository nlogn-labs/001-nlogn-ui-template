"use client";

/**
 * Hairline measuring grid.
 *
 * Gives the frame an underlying structure to sit on, and gives any glass or
 * displacement effect in front of it something to actually bend.
 */
export function GridField({
  cell = 52,
  strength = 42,
  className = "absolute inset-0",
  fade,
}: {
  cell?: number;
  /** Percentage of the hairline token to use. */
  strength?: number;
  className?: string;
  /** Optional radial mask so the grid dissolves toward the edges. */
  fade?: boolean;
}) {
  const line = `color-mix(in srgb, var(--color-hairline) ${strength}%, transparent)`;
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        backgroundImage:
          `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px ${cell}px),` +
          `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px ${cell}px)`,
        maskImage: fade
          ? "radial-gradient(72% 72% at 50% 46%, var(--color-text) 30%, transparent 100%)"
          : undefined,
        WebkitMaskImage: fade
          ? "radial-gradient(72% 72% at 50% 46%, var(--color-text) 30%, transparent 100%)"
          : undefined,
      }}
    />
  );
}
