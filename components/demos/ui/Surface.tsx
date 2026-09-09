"use client";

/**
 * The studio's panel treatment.
 *
 * Three things separate a premium dark surface from a grey box: a hairline
 * border, a light catch along the top edge where a real material would pick up
 * the key light, and a shadow that sits under the panel rather than glowing
 * around it. All three are token-derived.
 */
export function Surface({
  radius = 6,
  glow = true,
  className,
  style,
  children,
}: {
  radius?: number;
  /** Soft accent bloom under the panel. */
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ borderRadius: radius, ...style }}
    >
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 62%, color-mix(in srgb, var(--color-accent) 13%, transparent) 0%, color-mix(in srgb, var(--color-accent) 0%, transparent) 72%)",
          }}
        />
      ) : null}

      <div
        className="relative h-full w-full overflow-hidden border border-hairline bg-surface"
        style={{ borderRadius: radius }}
      >
        {/* Key-light catch along the top edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-text) 26%, transparent) 22%, color-mix(in srgb, var(--color-text) 38%, transparent) 50%, color-mix(in srgb, var(--color-text) 26%, transparent) 78%, transparent 100%)",
          }}
        />
        {/* Interior falloff, so the panel is not a flat fill. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(158deg, color-mix(in srgb, var(--color-text) 5%, transparent) 0%, color-mix(in srgb, var(--color-text) 0%, transparent) 44%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}
