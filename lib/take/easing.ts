/** Shared easing curves. Cursor interpolation is never linear. */

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeOutExpo = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Normalised progress of `now` across a [start, start+duration] window. */
export const progress = (now: number, start: number, duration: number): number =>
  duration <= 0 ? (now >= start ? 1 : 0) : clamp01((now - start) / duration);

/** CSS timing function used for every project-level entrance. */
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
