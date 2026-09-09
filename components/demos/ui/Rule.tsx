"use client";

/**
 * A hairline rule that can draw itself on.
 *
 * Scales along one axis from a chosen origin, so the reveal is a single
 * compositor-friendly transform rather than an animated width.
 */
export function Rule({
  active = true,
  vertical = false,
  origin = "left",
  delay = 0,
  duration = 720,
  color = "var(--color-hairline)",
  className,
  style,
}: {
  active?: boolean;
  vertical?: boolean;
  origin?: "left" | "right" | "top" | "bottom";
  delay?: number;
  duration?: number;
  /** Any token-derived colour. Kept a prop so callers never fight a base class. */
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const axis = vertical ? "scaleY" : "scaleX";
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundColor: color,
        transform: `${axis}(${active ? 1 : 0})`,
        transformOrigin: origin,
        transition: `transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: "transform",
        ...style,
      }}
    />
  );
}
