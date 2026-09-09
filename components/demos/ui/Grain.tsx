"use client";

/**
 * Film grain.
 *
 * Flat dark UI reads as cheap because nothing in it has texture. A very low
 * opacity noise plate breaks up the large fields of `bg` and `surface`, and
 * survives H.264 far better than a smooth gradient, which bands.
 *
 * The noise is achromatic (feTurbulence RGBA), rendered once by the browser
 * and tiled, so it costs one rasterised tile rather than a live filter.
 */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Grain({
  opacity = 0.055,
  className = "absolute inset-0",
}: {
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        backgroundImage: NOISE,
        backgroundRepeat: "repeat",
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  );
}
