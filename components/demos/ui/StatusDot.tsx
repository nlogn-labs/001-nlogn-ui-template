"use client";

/**
 * Live status indicator: a solid accent dot with a slow expanding halo.
 * The halo is a separate absolutely-positioned span so only its transform and
 * opacity animate.
 */
export function StatusDot({
  size = 6,
  pulse = true,
  className,
}: {
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {pulse ? (
        <span
          className="absolute inset-0 rounded-full bg-accent"
          style={{ animation: "var(--animate-status-halo)" }}
        />
      ) : null}
      <span className="relative inline-block h-full w-full rounded-full bg-accent" />
    </span>
  );
}
