/**
 * Canonical NLOGN brand tokens.
 *
 * This file is the single source of truth for every colour in the lab.
 * `app/globals.css` mirrors these values into a Tailwind v4 `@theme` block;
 * `scripts/check-tokens.mjs` fails the lint run if the two ever diverge.
 */
export const brand = {
  bg: "#0A0A0C",
  surface: "#121216",
  text: "#F5F7FA",
  muted: "#8A94A6",
  accent: "#2563FF",
  hairline: "rgba(255,255,255,0.12)",
} as const;

export type BrandToken = keyof typeof brand;

/** `#2563FF` -> `[0.145, 0.388, 1]`. Shader uniforms want unit floats. */
export function hexToRgbUnit(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

/** `#2563FF` + 0.4 -> `rgba(37,99,255,0.4)`. Keeps alpha ramps on-token. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgbUnit(hex);
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(
    b * 255,
  )},${alpha})`;
}

/** Threads takes unit floats, not a CSS string. */
export const ACCENT_RGB_UNIT = hexToRgbUnit(brand.accent);
